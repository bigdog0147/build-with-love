import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminIdentity, requirePermission, logAdminAction, serviceClient } from "./admin-guard.server";

export const WEBHOOK_EVENTS = [
  "deposit.approved",
  "deposit.rejected",
  "withdrawal.approved",
  "withdrawal.rejected",
  "kyc.verified",
  "kyc.rejected",
  "risk.blocked",
] as const;

function randomToken(bytes = 32) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Admin: endpoints, recent deliveries and issued API keys. */
export const getIntegrationOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "api_management");
    const db = await serviceClient();

    const [{ data: endpoints }, { data: deliveries }, { data: keys }, { data: backups }] = await Promise.all([
      db
        .from("webhook_endpoints")
        .select("id, label, url, events, is_active, created_at")
        .order("created_at", { ascending: false }),
      db
        .from("webhook_deliveries")
        .select("id, endpoint_id, event, status, response_status, response_body, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("api_keys")
        .select("id, label, prefix, scopes, last_used_at, revoked_at, created_at")
        .order("created_at", { ascending: false }),
      db
        .from("backup_runs")
        .select("id, kind, status, tables, total_rows, checksum, error, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return {
      endpoints: (endpoints ?? []) as any[],
      deliveries: (deliveries ?? []) as any[],
      keys: (keys ?? []) as any[],
      backups: (backups ?? []) as any[],
      events: [...WEBHOOK_EVENTS],
    };
  });

/** Admin: register an outbound webhook endpoint; the signing secret is returned once. */
export const createWebhookEndpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label: string; url: string; events: string[] }) => input)
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "api_management");
    const db = await serviceClient();

    const label = String(data.label ?? "").trim();
    const url = String(data.url ?? "").trim();
    if (!label) throw new Error("Give the endpoint a name.");
    if (!/^https:\/\/[^\s]+$/i.test(url)) throw new Error("The endpoint URL must be an https address.");
    const events = (data.events ?? []).filter((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e));

    const secret = randomToken(24);
    const { error } = await db
      .from("webhook_endpoints")
      .insert({ label, url, events, secret, created_by: identity.userId, is_active: true });
    if (error) throw new Error(error.message);

    await logAdminAction(identity, {
      action: "integration.webhook_created",
      targetType: "webhook_endpoint",
      targetLabel: label,
      after: { url, events },
    });
    return { ok: true as const, secret, message: "Endpoint registered. Copy the signing secret now." };
  });

export const setWebhookEndpointActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; active: boolean }) => input)
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "api_management");
    const db = await serviceClient();
    const { error } = await db
      .from("webhook_endpoints")
      .update({ is_active: Boolean(data.active), updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(identity, {
      action: data.active ? "integration.webhook_enabled" : "integration.webhook_disabled",
      targetType: "webhook_endpoint",
      targetId: data.id,
    });
    return { ok: true as const, message: data.active ? "Endpoint enabled." : "Endpoint disabled." };
  });

/** Admin: issue a read API key. Only the hash is stored — the value is shown once. */
export const issueApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label: string; scopes: string[] }) => input)
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "api_management");
    const db = await serviceClient();

    const label = String(data.label ?? "").trim() || "API key";
    const scopes = (data.scopes ?? []).filter((s) => ["read:wallets", "read:transactions", "read:kyc"].includes(s));
    const raw = `gf3x_${randomToken(24)}`;
    const prefix = raw.slice(0, 12);

    const { error } = await db.from("api_keys").insert({
      user_id: identity.userId,
      label,
      prefix,
      key_hash: await sha256Hex(raw),
      scopes: scopes.length ? scopes : ["read:transactions"],
    });
    if (error) throw new Error(error.message);

    await logAdminAction(identity, {
      action: "integration.api_key_issued",
      targetType: "api_key",
      targetLabel: label,
      after: { prefix, scopes },
    });
    return { ok: true as const, key: raw, message: "Key issued. Copy it now — it is not shown again." };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "api_management");
    const db = await serviceClient();
    const { error } = await db
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(identity, {
      action: "integration.api_key_revoked",
      targetType: "api_key",
      targetId: data.id,
    });
    return { ok: true as const, message: "Key revoked." };
  });
