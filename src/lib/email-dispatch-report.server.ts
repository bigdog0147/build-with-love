/**
 * Server-only failure reporting for background notification delivery.
 *
 * When every retry of a timeline advance (or any other background notice) has
 * been exhausted, the failure is written to the admin audit log so the desk can
 * see and manually resend it instead of the notice disappearing silently.
 */
export type DispatchFailureReport = {
  label: string;
  userId: string;
  category: string;
  template?: string;
  idempotencyKey?: string;
  attempts: number;
  error: string;
  retryable: boolean;
};

export async function reportDispatchFailure(report: DispatchFailureReport): Promise<boolean> {
  try {
    const { serviceClient } = await import("./admin-guard.server");
    const db = await serviceClient();
    const { error } = await db.from("admin_audit_log").insert({
      action: "notification.delivery_failed",
      target_type: "notification",
      target_id: report.idempotencyKey ?? report.userId,
      target_label: report.label,
      after_state: {
        user_id: report.userId,
        category: report.category,
        template: report.template ?? null,
        attempts: report.attempts,
        error: report.error,
        retryable: report.retryable,
        failed_at: new Date().toISOString(),
      },
    });
    if (error) {
      console.error("[dispatch] failure report could not be stored", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[dispatch] failure report crashed", error);
    return false;
  }
}
