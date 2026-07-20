import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  redirectTo: z.string().url().optional(),
});

// Public server function: triggers a password-reset email and records an audit
// row. Always returns { ok: true } so callers cannot distinguish existing from
// missing accounts (prevents enumeration). Client-side and Supabase-side rate
// limits still apply on top of this.
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { recordAuditEvent } = await import("@/lib/audit.server");
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

    return { ok: true as const };
  });
