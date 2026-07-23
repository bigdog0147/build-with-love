import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  redirectTo: z.string().url().optional(),
});

// Public server function: triggers a password-reset email and records an audit
// row. Always returns { ok: true } so callers cannot distinguish existing from
// missing accounts (prevents enumeration). A server-side per-email + per-IP
// rate limiter silently drops the underlying Supabase call when thresholds are
// exceeded — the response shape stays identical either way.
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { recordAuditEvent, hashEmail, getRequestContext } = await import(
      "@/lib/audit.server"
    );
    const { checkAndRecordResetAttempt } = await import(
      "@/lib/reset-rate-limit.server"
    );

    const { ip } = getRequestContext();
    const emailHash = hashEmail(data.email);

    const { limited, reason } = await checkAndRecordResetAttempt({
      emailHash,
      ip,
    });

    if (limited) {
      await recordAuditEvent({
        eventType: "reset_request",
        email: data.email,
        success: false,
        reason: `rate_limited: ${reason ?? "unknown"}`,
        metadata: { rate_limited: true },
      });
    } else {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
        redirectTo: data.redirectTo,
      });
      await recordAuditEvent({
        eventType: "reset_request",
        email: data.email,
        success: !error,
        reason: error?.message ?? null,
      });
    }

    // Neutral response — never signal throttling or delivery status.
    return { ok: true as const };
  });
