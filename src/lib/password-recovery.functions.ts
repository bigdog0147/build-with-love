import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Recovery sessions must be young. Supabase's default recovery token TTL is
// ~1 hour; we enforce a stricter 15-minute window from `iat` to shrink the
// window in which a leaked / paused reset link can be redeemed.
const RECOVERY_MAX_AGE_SECONDS = 15 * 60;

// Server-side password rules — must stay in sync with the client checklist.
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol")
  .refine((v) => v === v.trim(), "Password cannot start or end with spaces");

const inputSchema = z.object({ password: passwordSchema });

type AmrEntry = { method?: string; timestamp?: number };

function isRecoveryClaims(claims: Record<string, unknown>): {
  ok: boolean;
  reason?: string;
} {
  const nowSec = Math.floor(Date.now() / 1000);

  const exp = typeof claims.exp === "number" ? claims.exp : 0;
  if (!exp || exp <= nowSec) {
    return { ok: false, reason: "Recovery session has expired" };
  }

  const iat = typeof claims.iat === "number" ? claims.iat : 0;
  if (!iat) {
    return { ok: false, reason: "Recovery session is missing an issue time" };
  }
  // Reject sessions issued in the future (clock skew guard, small tolerance).
  if (iat > nowSec + 60) {
    return { ok: false, reason: "Recovery session issue time is invalid" };
  }
  if (nowSec - iat > RECOVERY_MAX_AGE_SECONDS) {
    return { ok: false, reason: "Recovery link is too old — request a new one" };
  }

  // Recovery links produce an OTP-style amr entry. Require it to prove the
  // caller reached this session via the emailed link, not a stale login.
  const amr = Array.isArray(claims.amr) ? (claims.amr as AmrEntry[]) : [];
  const recoveryEntry = amr.find(
    (e) => e && (e.method === "otp" || e.method === "recovery"),
  );
  if (!recoveryEntry) {
    return { ok: false, reason: "This session was not opened from a recovery link" };
  }

  // Same freshness check against the amr timestamp when present — belt & braces.
  if (
    typeof recoveryEntry.timestamp === "number" &&
    nowSec - recoveryEntry.timestamp > RECOVERY_MAX_AGE_SECONDS
  ) {
    return { ok: false, reason: "Recovery link is too old — request a new one" };
  }

  // Only accept AAL1 recovery sessions (Supabase does not upgrade recovery to aal2).
  if (claims.aal && claims.aal !== "aal1") {
    return { ok: false, reason: "Unexpected assurance level for recovery" };
  }

  return { ok: true };
}

export const updatePasswordFromRecovery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { recordAuditEvent } = await import("@/lib/audit.server");
    const claims = context.claims as unknown as Record<string, unknown>;
    const email = typeof claims.email === "string" ? claims.email : null;

    const verdict = isRecoveryClaims(claims);
    if (!verdict.ok) {
      await recordAuditEvent({
        eventType: "recovery_rejected",
        email,
        userId: context.userId,
        success: false,
        reason: verdict.reason ?? "Invalid recovery session",
      });
      throw new Error(`Unauthorized: ${verdict.reason ?? "Invalid recovery session"}`);
    }

    const { error } = await context.supabase.auth.updateUser({
      password: data.password,
    });
    if (error) {
      await recordAuditEvent({
        eventType: "recovery_rejected",
        email,
        userId: context.userId,
        success: false,
        reason: error.message || "updateUser failed",
      });
      throw new Error(error.message || "Could not update password");
    }

    await recordAuditEvent({
      eventType: "password_updated",
      email,
      userId: context.userId,
      success: true,
    });

    // Invalidate every session for this user, including the recovery one.
    await context.supabase.auth.signOut({ scope: "global" });

    return { ok: true as const };
  });
