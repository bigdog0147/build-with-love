/**
 * Server-only audit trail for background notification delivery.
 *
 * Every timeline advance (and any other background notice) writes one row here
 * per job — sent, skipped, or failed — so the desk can prove what was dispatched,
 * with which idempotency key, when, and with what outcome.
 */
/** One delivery attempt, captured for the admin audit viewer. */
export type DispatchAttempt = {
  attempt: number;
  startedAt: string;
  durationMs: number;
  outcome: "sent" | "skipped" | "retry" | "failed";
  error?: string | null;
  retryable?: boolean;
  /** Backoff waited before the next attempt, when there was one. */
  backoffMs?: number | null;
};

export type DispatchAuditStatus = "sent" | "skipped" | "failed";

export type DispatchAuditRecord = {
  label: string;
  userId: string;
  category: string;
  template?: string;
  idempotencyKey?: string;
  status: DispatchAuditStatus;
  attempts: number;
  detail?: string | null;
  retryable?: boolean;
  /** Per-attempt trail (timings, backoff, failure reasons). */
  trail?: DispatchAttempt[];
  /** Original notice content, stored so an admin resend can replay it exactly. */
  payload?: Record<string, unknown> | null;
  /** Set when this row is itself an admin-triggered resend of an earlier row. */
  resentFrom?: string | null;
  resentBy?: string | null;
};

/** Derives the audit status from a dispatch outcome. */
export function auditStatusFor(input: {
  emailSent: boolean;
  failed: boolean;
  hasTemplate: boolean;
}): DispatchAuditStatus {
  if (input.failed) return "failed";
  if (input.emailSent) return "sent";
  return "skipped";
}

export async function recordDispatchAudit(record: DispatchAuditRecord): Promise<boolean> {
  try {
    const { serviceClient } = await import("./admin-guard.server");
    const db = await serviceClient();
    const { error } = await db.from("notification_dispatch_log").insert({
      user_id: record.userId,
      category: record.category,
      template: record.template ?? null,
      idempotency_key: record.idempotencyKey ?? null,
      label: record.label,
      status: record.status,
      attempts: record.attempts,
      detail: record.detail ?? null,
      retryable: Boolean(record.retryable),
      attempt_trail: record.trail ?? [],
      payload: record.payload ?? null,
      resent_from: record.resentFrom ?? null,
      resent_by: record.resentBy ?? null,
      resent_at: record.resentFrom ? new Date().toISOString() : null,
    });
    if (error) {
      console.error("[dispatch] audit row could not be stored", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[dispatch] audit logging crashed", error);
    return false;
  }
}
