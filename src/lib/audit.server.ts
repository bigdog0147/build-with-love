// Server-only helpers for writing to public.auth_audit_log.
// Never import this from route/component modules directly — load it inside
// server function handlers with `await import(...)`.

import { createHash } from "crypto";
import { getRequest } from "@tanstack/react-start/server";

export type AuditEvent =
  | "reset_request"
  | "password_updated"
  | "recovery_rejected";

export function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export function maskEmailForAudit(email: string): string {
  const [localRaw, domainRaw] = email.trim().split("@");
  if (!localRaw || !domainRaw) return "•••";
  const mask = (part: string) => {
    if (part.length <= 2) return part[0] + "•";
    return part[0] + "•".repeat(Math.min(6, Math.max(1, part.length - 2))) + part[part.length - 1];
  };
  const [name, ...tldParts] = domainRaw.split(".");
  const domainMasked = tldParts.length
    ? `${mask(name)}.${tldParts.join(".")}`
    : mask(name);
  return `${mask(localRaw)}@${domainMasked}`;
}

function firstIp(header: string | null): string | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim();
  return first || null;
}

export function getRequestContext(): { ip: string | null; userAgent: string | null } {
  try {
    const req = getRequest();
    const h = req.headers;
    const ip =
      firstIp(h.get("cf-connecting-ip")) ??
      firstIp(h.get("x-forwarded-for")) ??
      firstIp(h.get("x-real-ip"));
    const userAgent = h.get("user-agent");
    return { ip, userAgent: userAgent ? userAgent.slice(0, 512) : null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export async function recordAuditEvent(params: {
  eventType: AuditEvent;
  email?: string | null;
  userId?: string | null;
  success?: boolean;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip, userAgent } = getRequestContext();
    const email = params.email?.trim() || null;
    await supabaseAdmin.from("auth_audit_log").insert({
      event_type: params.eventType,
      user_id: params.userId ?? null,
      email_hash: email ? hashEmail(email) : null,
      email_masked: email ? maskEmailForAudit(email) : null,
      ip,
      user_agent: userAgent,
      success: params.success ?? true,
      reason: params.reason ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Audit logging must never break the primary flow.
  }
}
