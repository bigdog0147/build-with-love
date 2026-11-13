/**
 * Server-only administrator password reset.
 *
 * Security design:
 *  - Two factors are required to reset: a single-use link token (32 random
 *    bytes) AND a 6-digit code, both delivered only to the administrator's
 *    registered mailbox (email verification / possession proof).
 *  - Only SHA-256 hashes of the token and code are persisted; the plaintext
 *    exists solely inside the outbound email.
 *  - Tokens are single use, expire after 30 minutes, are invalidated when a new
 *    request is made, and are burned after 5 wrong code attempts.
 *  - Requests are rate limited per email and always return the same generic
 *    response so the endpoint cannot enumerate administrator accounts.
 *  - Every request, failure and completion is written to the immutable audit log.
 */
import {
  ADMIN_RESET_MAX_ATTEMPTS,
  ADMIN_RESET_TTL_SECONDS,
  validateAdminPassword,
} from "./admin-password-policy";
import { hashEmail, normalizeEmail, writeAuditLog } from "./admin-account.server";
import { parseResetLimits } from "./reset-limits";

const ALLOWED_HOSTS = ["gf3x.space", "localhost", "127.0.0.1"];

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("");
}

function randomCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + ((bytes[0] ?? 0) % 900000));
}

/** Accepts only same-site origins so reset links can never be redirected off-site. */
function safeOrigin(raw: string | undefined): string {
  const fallback = "https://gf3x.space";
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    const ok =
      ALLOWED_HOSTS.includes(url.hostname) ||
      url.hostname.endsWith(".gf3x.space") ||
      url.hostname.endsWith(".lovable.app");
    return ok ? url.origin : fallback;
  } catch {
    return fallback;
  }
}

export type RequestMeta = { ip?: string | null; user_agent?: string | null };

/**
 * Starts a reset. Always resolves with the same shape regardless of whether the
 * address belongs to an administrator (no account enumeration).
 */
export async function requestAdminPasswordReset(
  rawEmail: string,
  origin: string | undefined,
  meta: RequestMeta = {},
): Promise<{ ok: true; cooldownSeconds: number }> {
  const limits = parseResetLimits(process.env as Record<string, string | undefined>);
  const email = normalizeEmail(rawEmail);
  const generic = { ok: true as const, cooldownSeconds: 60 };
  if (!email) return generic;

  const db = await admin();
  const keyValue = await hashEmail(email);
  const since = new Date(Date.now() - limits.RESET_LIMIT_WINDOW_SECONDS * 1000).toISOString();

  const { count } = await db
    .from("reset_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key_type", "admin_reset")
    .eq("key_value", keyValue)
    .gte("attempted_at", since);

  if ((count ?? 0) >= limits.RESET_LIMIT_MAX_ATTEMPTS) {
    await writeAuditLog({
      event_type: "admin_password_reset_throttled",
      email,
      success: false,
      reason: "rate limit exceeded",
      ...meta,
    });
    return generic;
  }
  await db.from("reset_rate_limits").insert({ key_type: "admin_reset", key_value: keyValue });

  const { data: account } = await db
    .from("admin_accounts")
    .select("user_id, email, full_name, is_active")
    .eq("email", email)
    .maybeSingle();

  if (!account || account.is_active === false) {
    await writeAuditLog({
      event_type: "admin_password_reset_requested",
      email,
      success: false,
      reason: "no active administrator for this address",
      ...meta,
    });
    return generic;
  }

  // A new request supersedes every outstanding token for this administrator.
  await db
    .from("admin_password_resets")
    .update({ invalidated_at: new Date().toISOString() })
    .eq("user_id", account.user_id)
    .is("used_at", null)
    .is("invalidated_at", null);

  const token = randomToken();
  const code = randomCode();
  const expiresAt = new Date(Date.now() + ADMIN_RESET_TTL_SECONDS * 1000).toISOString();

  const { error: insertError } = await db.from("admin_password_resets").insert({
    user_id: account.user_id,
    email,
    token_hash: await sha256Hex(token),
    code_hash: await sha256Hex(code),
    expires_at: expiresAt,
    requested_ip: meta.ip ?? null,
    requested_user_agent: meta.user_agent ?? null,
  });
  if (insertError) {
    console.error("[admin-reset] could not persist token", insertError.message);
    return generic;
  }

  const resetUrl = `${safeOrigin(origin)}/admin/reset-password?token=${encodeURIComponent(token)}`;

  try {
    const { sendTemplateEmailWithRetry } = await import("./email-retry.server");
    await sendTemplateEmailWithRetry("admin-password-reset", email, {
      templateData: {
        name: account.full_name ?? "Administrator",
        code,
        resetUrl,
        expiresMinutes: Math.round(ADMIN_RESET_TTL_SECONDS / 60),
        ip: meta.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[admin-reset] email send failed", error);
  }

  await writeAuditLog({
    event_type: "admin_password_reset_requested",
    user_id: account.user_id,
    email,
    success: true,
    ...meta,
  });

  return generic;
}

type ResetRow = {
  id: string;
  user_id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  used_at: string | null;
  invalidated_at: string | null;
};

async function loadToken(token: string): Promise<ResetRow | null> {
  if (!token) return null;
  const db = await admin();
  const { data } = await db
    .from("admin_password_resets")
    .select("id, user_id, email, code_hash, attempts, expires_at, used_at, invalidated_at")
    .eq("token_hash", await sha256Hex(token))
    .maybeSingle();
  const row = (data as ResetRow | null) ?? null;
  if (!row) return null;
  if (row.used_at || row.invalidated_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  if (row.attempts >= ADMIN_RESET_MAX_ATTEMPTS) return null;
  return row;
}

/** Cheap link check for the reset page — reveals only a masked email. */
export async function inspectAdminResetToken(
  token: string,
): Promise<{ valid: boolean; emailMasked: string | null; expiresAt: string | null }> {
  const row = await loadToken(token);
  if (!row) return { valid: false, emailMasked: null, expiresAt: null };
  const { maskEmail } = await import("./admin-account.server");
  return { valid: true, emailMasked: maskEmail(row.email), expiresAt: row.expires_at };
}

/** Consumes the one-time token + emailed code and rotates the password. */
export async function completeAdminPasswordReset(
  token: string,
  code: string,
  password: string,
  meta: RequestMeta = {},
): Promise<{ ok: boolean; error?: string }> {
  const db = await admin();
  const row = await loadToken(token);
  if (!row) {
    await writeAuditLog({
      event_type: "admin_password_reset_failed",
      success: false,
      reason: "invalid, expired or already used token",
      ...meta,
    });
    return { ok: false, error: "This reset link is invalid, expired or already used." };
  }

  const policyError = validateAdminPassword(password);
  if (policyError) return { ok: false, error: policyError };

  const codeMatches = (await sha256Hex(code.trim())) === row.code_hash;
  if (!codeMatches) {
    const attempts = row.attempts + 1;
    await db
      .from("admin_password_resets")
      .update({
        attempts,
        invalidated_at:
          attempts >= ADMIN_RESET_MAX_ATTEMPTS ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    await writeAuditLog({
      event_type: "admin_password_reset_failed",
      user_id: row.user_id,
      email: row.email,
      success: false,
      reason: "incorrect verification code",
      metadata: { attempts },
      ...meta,
    });
    return {
      ok: false,
      error:
        attempts >= ADMIN_RESET_MAX_ATTEMPTS
          ? "Too many incorrect codes. Request a new reset link."
          : `Incorrect verification code. ${ADMIN_RESET_MAX_ATTEMPTS - attempts} attempt(s) left.`,
    };
  }

  // Supabase Auth stores only a bcrypt hash of the new password.
  const { error: updateError } = await db.auth.admin.updateUserById(row.user_id, {
    password,
    email_confirm: true,
  });
  if (updateError) {
    await writeAuditLog({
      event_type: "admin_password_reset_failed",
      user_id: row.user_id,
      email: row.email,
      success: false,
      reason: updateError.message,
      ...meta,
    });
    return { ok: false, error: "Could not update the password. Please request a new link." };
  }

  const now = new Date().toISOString();
  await db.from("admin_password_resets").update({ used_at: now }).eq("id", row.id);
  await db
    .from("admin_password_resets")
    .update({ invalidated_at: now })
    .eq("user_id", row.user_id)
    .is("used_at", null)
    .is("invalidated_at", null);

  await db
    .from("admin_accounts")
    .update({
      must_change_password: false,
      failed_login_attempts: 0,
      locked_until: null,
      email_verified: true,
    })
    .eq("user_id", row.user_id);

  await writeAuditLog({
    event_type: "admin_password_reset_completed",
    user_id: row.user_id,
    email: row.email,
    success: true,
    ...meta,
  });

  return { ok: true };
}
