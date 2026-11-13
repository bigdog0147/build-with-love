/**
 * Server-only administrator authorization + audit trail.
 *
 * Every privileged admin server function calls `requireAdminIdentity` (role check
 * against the database, never the browser) and then `logAdminAction` so each
 * mutation lands in the append-only `admin_audit_log` table.
 */
import { roleHasPermission, type AdminPermission } from "./admin-permissions";

export type AdminIdentity = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  isSuperAdmin: boolean;
};

type GuardContext = {
  supabase: {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  userId: string;
};

export async function serviceClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Confirms the caller holds the admin role and returns their staff profile. */
export async function requireAdminIdentity(context: GuardContext): Promise<AdminIdentity> {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden — administrator role required.");

  const db = await serviceClient();
  const { data: account } = await db
    .from("admin_accounts")
    .select("email, full_name, admin_role, permissions, is_super_admin, is_active")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (account && account.is_active === false)
    throw new Error("This administrator account has been deactivated.");

  return {
    userId: context.userId,
    email: account?.email ?? "",
    fullName: account?.full_name ?? "Administrator",
    role: account?.admin_role ?? "administrator",
    permissions: (account?.permissions as string[] | null) ?? [],
    isSuperAdmin: Boolean(account?.is_super_admin),
  };
}

/** Throws unless the administrator's role or explicit grants cover `permission`. */
export function requirePermission(identity: AdminIdentity, permission: AdminPermission) {
  if (identity.isSuperAdmin) return;
  if (!roleHasPermission(identity.role, permission, identity.permissions))
    throw new Error(`Forbidden — the "${permission}" permission is required.`);
}

/** Convenience: authorize in one call. */
export async function requireAdminPermission(
  context: GuardContext,
  permission: AdminPermission,
): Promise<AdminIdentity> {
  const identity = await requireAdminIdentity(context);
  requirePermission(identity, permission);
  return identity;
}

export type AuditEntry = {
  action: string;
  targetType?: string;
  targetId?: string | null;
  targetLabel?: string | null;
  before?: unknown;
  after?: unknown;
};

/** Append-only record of a privileged action. Never throws into the caller. */
export async function logAdminAction(identity: AdminIdentity, entry: AuditEntry) {
  try {
    const db = await serviceClient();
    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const request = getRequest();
      ip =
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null;
      userAgent = request.headers.get("user-agent");
    } catch {
      /* request context unavailable — audit still records the action */
    }
    await db.from("admin_audit_log").insert({
      actor_id: identity.userId,
      actor_email: identity.email || null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      target_label: entry.targetLabel ?? null,
      before_state: entry.before == null ? null : (entry.before as never),
      after_state: entry.after == null ? null : (entry.after as never),
      ip,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("[admin-audit] failed to record action", error);
  }
}
