/** Canonical GF3X administrator permission keys (client-safe). */
export const ADMIN_PERMISSIONS = [
  "dashboard",
  "customer_management",
  "kyc_verification",
  "investments",
  "wallet_management",
  "deposits",
  "withdrawals",
  "cards",
  "loans",
  "transactions",
  "reports",
  "analytics",
  "security",
  "audit_logs",
  "notifications",
  "api_management",
  "roles_permissions",
  "cloudflare_integration",
  "zoho_integration",
  "smartsupp_integration",
  "system_settings",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  dashboard: "Dashboard",
  customer_management: "Customer Management",
  kyc_verification: "KYC Verification",
  investments: "Investments",
  wallet_management: "Wallet Management",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  cards: "Cards",
  loans: "Loans",
  transactions: "Transactions",
  reports: "Reports",
  analytics: "Analytics",
  security: "Security",
  audit_logs: "Audit Logs",
  notifications: "Notifications",
  api_management: "API Management",
  roles_permissions: "Roles & Permissions",
  cloudflare_integration: "Cloudflare Integration",
  zoho_integration: "Zoho Integration",
  smartsupp_integration: "SmartSupp Integration",
  system_settings: "System Settings",
};

export const SUPER_ADMIN_EMAIL = "gigafactory3x@gmail.com";
export const SUPER_ADMIN_NAME = "Gigafactory 3X System Administrator";

/** Failed sign-in attempts before the administrator account is locked. */
export const LOGIN_MAX_ATTEMPTS = 5;
/** Window used for counting failed attempts (seconds). */
export const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;
/** Lockout duration after exceeding the attempt limit (seconds). */
export const LOGIN_LOCKOUT_SECONDS = 15 * 60;

export type AdminAccount = {
  user_id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  permissions: string[];
  two_factor_enabled: boolean;
  two_factor_required: boolean;
  email_verified: boolean;
  is_active: boolean;
  must_change_password: boolean;
  admin_role: string;
  trusted_devices?: string[];
  last_login_at: string | null;
  locked_until: string | null;
};

/** Role-based access control levels for the administration portal. */
export const ADMIN_ROLES = [
  "super_admin",
  "administrator",
  "finance_manager",
  "compliance_officer",
  "support_agent",
  "moderator",
  "viewer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  administrator: "Administrator",
  finance_manager: "Finance Manager",
  compliance_officer: "Compliance Officer",
  support_agent: "Support Agent",
  moderator: "Moderator",
  viewer: "Viewer",
};

/** Default permission grants per role. Super Admin implicitly holds everything. */
export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: ADMIN_PERMISSIONS,
  administrator: ADMIN_PERMISSIONS.filter((p) => p !== "roles_permissions"),
  finance_manager: [
    "dashboard",
    "investments",
    "wallet_management",
    "deposits",
    "withdrawals",
    "cards",
    "loans",
    "transactions",
    "reports",
    "analytics",
  ],
  compliance_officer: ["dashboard", "customer_management", "kyc_verification", "audit_logs", "security", "reports"],
  support_agent: ["dashboard", "customer_management", "notifications", "transactions"],
  moderator: ["dashboard", "customer_management", "notifications"],
  viewer: ["dashboard", "reports", "analytics"],
};

export function roleHasPermission(
  role: string | null | undefined,
  permission: AdminPermission,
  explicit: string[] = [],
): boolean {
  if (role === "super_admin") return true;
  if (explicit.includes(permission)) return true;
  const grants = ROLE_PERMISSIONS[(role ?? "viewer") as AdminRole];
  return Boolean(grants?.includes(permission));
}
