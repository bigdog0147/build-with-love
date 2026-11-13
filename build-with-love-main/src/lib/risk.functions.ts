import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminIdentity, requirePermission, logAdminAction, serviceClient } from "./admin-guard.server";

export type RiskEventRow = {
  id: string;
  user_id: string | null;
  kind: string;
  amount: number | null;
  currency: string | null;
  score: number;
  band: string;
  decision: string;
  decision_note: string | null;
  triggered: { key: string; label: string; weight: number; detail: string }[];
  ip: string | null;
  created_at: string;
  customer?: string;
};

/** Admin: risk queue with rules and summary counters. */
export const getRiskOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "security");
    const db = await serviceClient();

    const [{ data: events }, { data: rules }] = await Promise.all([
      db
        .from("risk_events")
        .select(
          "id, user_id, kind, amount, currency, score, band, decision, decision_note, triggered, ip, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("risk_rules").select("key, label, description, weight, threshold, is_enabled").order("key"),
    ]);

    const ids = [...new Set(((events ?? []) as RiskEventRow[]).map((e) => e.user_id).filter(Boolean))];
    const { data: profiles } = ids.length
      ? await db.from("profiles").select("id, display_name").in("id", ids as string[])
      : { data: [] as { id: string; display_name: string }[] };
    const nameById = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));

    const rows = ((events ?? []) as RiskEventRow[]).map((e) => ({
      ...e,
      customer: e.user_id ? (nameById.get(e.user_id) ?? "Customer") : "—",
    }));

    return {
      events: rows,
      rules: (rules ?? []) as {
        key: string;
        label: string;
        description: string;
        weight: number;
        threshold: number;
        is_enabled: boolean;
      }[],
      counts: {
        blocked: rows.filter((r) => r.band === "block").length,
        review: rows.filter((r) => r.band === "review").length,
        pending: rows.filter((r) => r.decision === "pending").length,
      },
    };
  });

/** Admin: clear or confirm a flagged event. */
export const decideRiskEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "cleared" | "blocked"; note?: string }) => input)
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "security");
    const db = await serviceClient();

    const { error } = await db
      .from("risk_events")
      .update({
        decision: data.decision,
        decision_note: data.note?.slice(0, 500) ?? null,
        decided_by: identity.userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await logAdminAction(identity, {
      action: `risk.${data.decision}`,
      targetType: "risk_event",
      targetId: data.id,
      after: { decision: data.decision, note: data.note ?? null },
    });
    return { ok: true as const, message: `Event marked ${data.decision}.` };
  });

/** Admin: retune a scoring rule. */
export const updateRiskRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { key: string; weight?: number; threshold?: number; is_enabled?: boolean }) => input,
  )
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "security");
    const db = await serviceClient();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.weight !== undefined) {
      const weight = Number(data.weight);
      if (!Number.isFinite(weight) || weight < 0 || weight > 100)
        throw new Error("Weight must be between 0 and 100.");
      patch.weight = weight;
    }
    if (data.threshold !== undefined) {
      const threshold = Number(data.threshold);
      if (!Number.isFinite(threshold) || threshold < 0) throw new Error("Threshold must be zero or more.");
      patch.threshold = threshold;
    }
    if (data.is_enabled !== undefined) patch.is_enabled = Boolean(data.is_enabled);

    const { error } = await db.from("risk_rules").update(patch).eq("key", data.key);
    if (error) throw new Error(error.message);

    await logAdminAction(identity, {
      action: "risk.rule_updated",
      targetType: "risk_rule",
      targetId: data.key,
      after: patch,
    });
    return { ok: true as const, message: "Rule updated." };
  });
