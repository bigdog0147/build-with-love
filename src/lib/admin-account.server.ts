/**
 * Server-only administrator account logic:
 * bootstrap of the first Super Administrator, login auditing,
 * failed-attempt throttling and account lockout.
 *
 * Passwords are never stored here — Supabase Auth stores only a bcrypt hash
 * and the initial value is read from the ADMIN_INITIAL_PASSWORD environment
 * variable (never hardcoded).
 */
import {
  ADMIN_PERMISSIONS,
  LOGIN_ATTEMPT_WINDOW_SECONDS,
  LOGIN_LOCKOUT_SECONDS,
  LOGIN_MAX_ATTEMPTS,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_NAME,
} from "./admin-permissions";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase().slice(0, 320);
}

export function maskEmail(email: string): string {
  const [user = "", domain = ""] = normalizeEmail(email).split("@");
  const head = user.slice(0, 2);
  return `${head}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

export async function hashEmail(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeEmail(email));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type AuditInput = {
  event_type: string;
  user_id?: string | null;
  email?: string | null;
  success?: boolean;
  reason?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
};

/** Records administrator activity in the immutable audit log. */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  const db = await admin();
  const email = input.email ? normalizeEmail(input.email) : null;
  const { error } = await db.from("auth_audit_log").insert({
    event_type: input.event_type,
    user_id: input.user_id ?? null,
    email_hash: email ? await hashEmail(email) : null,
    email_masked: email ? maskEmail(email) : null,
    ip: input.ip ?? null,
    user_agent: input.user_agent ?? null,
    success: input.success ?? true,
    reason: input.reason ?? null,
    metadata: (input.metadata ?? {}) as never,
  });
  if (error) console.error("[audit] failed to write log", error.message);
}

export type LoginGate = { allowed: boolean; retryAfterSeconds: number; reason?: string };

/** Pre-login gate: rate limit by email + honour an active lockout. */
export async function checkLoginGate(rawEmail: string): Promise<LoginGate> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { allowed: false, retryAfterSeconds: 0, reason: "Email is required." };
  const db = await admin();
  const keyValue = await hashEmail(email);

  const { data: account } = await db
    .from("admin_accounts")
    .select("locked_until, is_active")
    .eq("email", email)
    .maybeSingle();

  if (account && account.is_active === false) {
    return { allowed: false, retryAfterSeconds: 0, reason: "This account has been deactivated." };
  }

  if (account?.locked_until) {
    const ms = new Date(account.locked_until).getTime() - Date.now();
    if (ms > 0) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(ms / 1000),
        reason: "Too many failed attempts. This account is temporarily locked.",
      };
    }
  }

  // Generic rate limit for every sign-in attempt (admin or customer).
  const since = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_SECONDS * 1000).toISOString();
  const { count } = await db
    .from("reset_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key_type", "login")
    .eq("key_value", keyValue)
    .gte("attempted_at", since);

  if ((count ?? 0) >= LOGIN_MAX_ATTEMPTS * 4) {
    return {
      allowed: false,
      retryAfterSeconds: LOGIN_LOCKOUT_SECONDS,
      reason: "Too many sign-in attempts. Please try again later.",
    };
  }

  await db.from("reset_rate_limits").insert({ key_type: "login", key_value: keyValue });
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Records a failed sign-in and locks the admin account once the limit is hit. */
export async function registerLoginFailure(
  rawEmail: string,
  reason: string,
  meta: { ip?: string | null; user_agent?: string | null } = {},
): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const email = normalizeEmail(rawEmail);
  const db = await admin();
  let locked = false;
  let attemptsRemaining = LOGIN_MAX_ATTEMPTS;

  const { data: account } = await db
    .from("admin_accounts")
    .select("user_id, failed_login_attempts")
    .eq("email", email)
    .maybeSingle();

  if (account) {
    const attempts = (account.failed_login_attempts ?? 0) + 1;
    locked = attempts >= LOGIN_MAX_ATTEMPTS;
    attemptsRemaining = Math.max(LOGIN_MAX_ATTEMPTS - attempts, 0);
    await db
      .from("admin_accounts")
      .update({
        failed_login_attempts: locked ? 0 : attempts,
        locked_until: locked
          ? new Date(Date.now() + LOGIN_LOCKOUT_SECONDS * 1000).toISOString()
          : null,
      })
      .eq("user_id", account.user_id);
  }

  await writeAuditLog({
    event_type: locked ? "admin_login_locked" : "login_failed",
    user_id: account?.user_id ?? null,
    email,
    success: false,
    reason,
    ip: meta.ip,
    user_agent: meta.user_agent,
    metadata: { attemptsRemaining },
  });

  return { locked, attemptsRemaining };
}

/** Records a successful sign-in and clears throttling state. */
export async function registerLoginSuccess(
  userId: string,
  meta: { ip?: string | null; user_agent?: string | null } = {},
): Promise<{ isAdmin: boolean; mustChangePassword: boolean }> {
  const db = await admin();
  const { data: account } = await db
    .from("admin_accounts")
    .select("email, must_change_password")
    .eq("user_id", userId)
    .maybeSingle();

  if (account) {
    await db
      .from("admin_accounts")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }

  await writeAuditLog({
    event_type: account ? "admin_login_success" : "login_success",
    user_id: userId,
    email: account?.email ?? null,
    success: true,
    ip: meta.ip,
    user_agent: meta.user_agent,
  });

  return {
    isAdmin: Boolean(account),
    mustChangePassword: Boolean(account?.must_change_password),
  };
}

let bootstrapPromise: Promise<{ created: boolean; reason: string }> | null = null;

/**
 * Creates the first Super Administrator when none exists.
 * Idempotent: safe to call on every startup / request.
 */
export function ensureSuperAdminAccount(): Promise<{ created: boolean; reason: string }> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  return bootstrapPromise;
}

async function runBootstrap(): Promise<{ created: boolean; reason: string }> {
  const db = await admin();

  const { count, error: countError } = await db
    .from("admin_accounts")
    .select("user_id", { count: "exact", head: true });
  if (countError) return { created: false, reason: countError.message };
  if ((count ?? 0) > 0) return { created: false, reason: "administrator-exists" };

  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password || password.length < 8) {
    console.error("[admin-bootstrap] ADMIN_INITIAL_PASSWORD is missing or too short.");
    return { created: false, reason: "missing-ADMIN_INITIAL_PASSWORD" };
  }

  // Email verification is configurable: bypass it during initial setup unless
  // ADMIN_REQUIRE_EMAIL_VERIFICATION is explicitly enabled.
  const requireVerification =
    String(process.env.ADMIN_REQUIRE_EMAIL_VERIFICATION ?? "false").toLowerCase() === "true";

  const email = SUPER_ADMIN_EMAIL;
  let userId: string | null = null;

  // Supabase Auth hashes the password with bcrypt; we never persist it.
  const created = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: !requireVerification,
    user_metadata: {
      full_name: SUPER_ADMIN_NAME,
      first_name: "Gigafactory 3X",
      last_name: "System Administrator",
      role: "Super Administrator",
    },
  });

  if (created.error) {
    // Already present in Auth (e.g. re-bootstrap after a wipe of admin_accounts).
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (!userId) return { created: false, reason: created.error.message };
  } else {
    userId = created.data.user?.id ?? null;
  }

  if (!userId) return { created: false, reason: "no-user-id" };

  const { error: adminError } = await db.from("admin_accounts").upsert(
    {
      user_id: userId,
      email,
      full_name: SUPER_ADMIN_NAME,
      is_super_admin: true,
      permissions: [...ADMIN_PERMISSIONS],
      two_factor_enabled: true,
      two_factor_required: true,
      email_verified: !requireVerification,
      is_active: true,
      must_change_password: true,
    },
    { onConflict: "user_id" },
  );
  if (adminError) return { created: false, reason: adminError.message };

  await db.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  await db
    .from("profiles")
    .update({ display_name: SUPER_ADMIN_NAME, initials: "G3", role: "Super Administrator" })
    .eq("id", userId);

  await writeAuditLog({
    event_type: "admin_bootstrap",
    user_id: userId,
    email,
    success: true,
    reason: "initial super administrator created",
    metadata: { emailVerificationRequired: requireVerification },
  });

  console.log("[admin-bootstrap] Super Administrator provisioned.");
  return { created: true, reason: "created" };
}
