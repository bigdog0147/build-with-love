import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminAccount } from "./admin-permissions";

async function requestMeta() {
  const { getRequest } = await import("@tanstack/react-start/server");
  try {
    const request = getRequest();
    return {
      ip:
        request?.headers.get("cf-connecting-ip") ??
        request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null,
      user_agent: request?.headers.get("user-agent") ?? null,
    };
  } catch {
    return { ip: null, user_agent: null };
  }
}

/** Idempotent bootstrap of the first Super Administrator. */
export const bootstrapSuperAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureSuperAdminAccount } = await import("./admin-account.server");
  try {
    const result = await ensureSuperAdminAccount();
    return { ok: true, created: result.created };
  } catch (error) {
    console.error("[admin-bootstrap]", error);
    return { ok: false, created: false };
  }
});

/** Pre-sign-in gate: rate limiting + account lockout. */
export const checkAdminLoginGate = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({ email: String(input.email ?? "") }))
  .handler(async ({ data }) => {
    const { checkLoginGate } = await import("./admin-account.server");
    return checkLoginGate(data.email);
  });

/** Records a failed sign-in attempt in the audit log and bumps lockout counters. */
export const reportLoginFailure = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; reason: string }) => ({
    email: String(input.email ?? ""),
    reason: String(input.reason ?? "invalid credentials").slice(0, 300),
  }))
  .handler(async ({ data }) => {
    const { registerLoginFailure } = await import("./admin-account.server");
    return registerLoginFailure(data.email, data.reason, await requestMeta());
  });

/** Records a successful sign-in; returns whether a password change is forced. */
export const completeLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { registerLoginSuccess } = await import("./admin-account.server");
    return registerLoginSuccess(context.userId, await requestMeta());
  });

export const getMyAdminAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAccount | null> => {
    const { data, error } = await context.supabase
      .from("admin_accounts")
      .select(
        "user_id, email, full_name, is_super_admin, permissions, admin_role, two_factor_enabled, two_factor_required, email_verified, is_active, must_change_password, last_login_at, locked_until",
      )
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return (data as AdminAccount | null) ?? null;
  });

/** Called after the administrator successfully rotated the initial password. */
export const markPasswordChanged = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("admin_accounts")
      .update({ must_change_password: false })
      .eq("user_id", context.userId);
    if (error) throw error;

    const { writeAuditLog } = await import("./admin-account.server");
    await writeAuditLog({
      event_type: "admin_password_changed",
      user_id: context.userId,
      success: true,
      ...(await requestMeta()),
    });
    return { ok: true };
  });

/** Enable or disable two-factor authentication for the signed-in administrator. */
export const setTwoFactorEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { enabled: boolean }) => ({ enabled: Boolean(input.enabled) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admin_accounts")
      .update({ two_factor_enabled: data.enabled })
      .eq("user_id", context.userId);
    if (error) throw error;

    const { writeAuditLog } = await import("./admin-account.server");
    await writeAuditLog({
      event_type: data.enabled ? "admin_2fa_enabled" : "admin_2fa_disabled",
      user_id: context.userId,
      success: true,
      ...(await requestMeta()),
    });
    return { ok: true, enabled: data.enabled };
  });

/** True when the current administrator previously marked this device as trusted. */
export const checkAdminDeviceTrust = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { deviceId: string }) => ({
    deviceId: String(input.deviceId ?? "").slice(0, 128),
  }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("admin_accounts")
      .select("trusted_devices")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    const devices = (row?.trusted_devices ?? []) as string[];
    return { trusted: Boolean(data.deviceId) && devices.includes(data.deviceId) };
  });

/** Adds the current device to the administrator's trusted-device list. */
export const rememberAdminDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { deviceId: string }) => ({
    deviceId: String(input.deviceId ?? "").slice(0, 128),
  }))
  .handler(async ({ data, context }) => {
    if (!data.deviceId) return { ok: false };
    const { data: row } = await context.supabase
      .from("admin_accounts")
      .select("trusted_devices")
      .eq("user_id", context.userId)
      .maybeSingle();
    const devices = new Set(((row?.trusted_devices ?? []) as string[]).slice(-9));
    devices.add(data.deviceId);
    const { error } = await context.supabase
      .from("admin_accounts")
      .update({ trusted_devices: Array.from(devices) })
      .eq("user_id", context.userId);
    if (error) throw error;

    const { writeAuditLog } = await import("./admin-account.server");
    await writeAuditLog({
      event_type: "admin_device_trusted",
      user_id: context.userId,
      success: true,
      ...(await requestMeta()),
    });
    return { ok: true };
  });
