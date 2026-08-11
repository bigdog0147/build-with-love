/**
 * Server-only audit trail for background notification delivery.
 *
 * Every timeline advance (and any other background notice) writes one row here
 * per job — sent, skipped, or failed — so the desk can prove what was dispatched,
 * with which idempotency key, when, and with what outcome.
 */
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
