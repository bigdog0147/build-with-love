/**
 * Single source of truth for the GF3X admin console navigation.
 * Every entry resolves to a real route (+ tab) — no placeholders.
 */
export type NavItem = {
  label: string;
  to: string;
  tab?: string;
  keywords?: string;
};

export type NavGroup = {
  label: string;
  icon:
    | "gauge"
    | "users"
    | "shield"
    | "wallet"
    | "factory"
    | "layers"
    | "bell"
    | "chart"
    | "globe"
    | "lock"
    | "plug"
    | "cog";
  items: NavItem[];
};

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Command",
    icon: "gauge",
    items: [{ label: "Dashboard", to: "/admin", keywords: "overview kpi live" }],
  },
  {
    label: "Customers",
    icon: "users",
    items: [
      { label: "Customers", to: "/admin/customers", keywords: "clients accounts list" },
      { label: "KYC Verification", to: "/admin/kyc", keywords: "identity documents review" },
      { label: "Investment Accounts", to: "/admin/investments", tab: "accounts" },
      { label: "Wallets", to: "/admin/finance", tab: "wallets" },
      { label: "Cards", to: "/admin/finance", tab: "cards" },
      { label: "Loans", to: "/admin/finance", tab: "loans" },
    ],
  },
  {
    label: "Finance",
    icon: "wallet",
    items: [
      { label: "Deposits", to: "/admin/finance", tab: "deposits" },
      { label: "Withdrawals", to: "/admin/finance", tab: "withdrawals" },
      { label: "Transactions", to: "/admin/finance", tab: "transactions" },
      { label: "Fees & Limits", to: "/admin/finance", tab: "limits" },
      { label: "Exchange Rates", to: "/admin/finance", tab: "rates" },
    ],
  },
  {
    label: "Investments",
    icon: "factory",
    items: [
      { label: "Portfolio", to: "/admin/investments", tab: "portfolio" },
      { label: "Categories", to: "/admin/investments", tab: "categories" },
      { label: "Gigafactory Investments", to: "/admin/investments", tab: "gigafactory" },
      { label: "Performance", to: "/admin/investments", tab: "performance" },
    ],
  },
  {
    label: "Assets & Projects",
    icon: "layers",
    items: [
      { label: "Assets", to: "/admin/assets", tab: "assets" },
      { label: "Projects", to: "/admin/assets", tab: "projects" },
      { label: "Real Estate", to: "/admin/assets", tab: "real-estate" },
      { label: "Renewable Energy", to: "/admin/assets", tab: "energy" },
      { label: "Mining", to: "/admin/assets", tab: "mining" },
      { label: "Carbon Credits", to: "/admin/assets", tab: "carbon" },
      { label: "Marketplace", to: "/admin/assets", tab: "marketplace" },
    ],
  },
  {
    label: "Operations",
    icon: "bell",
    items: [
      { label: "Notifications", to: "/admin/operations", tab: "notifications" },
      { label: "Support Tickets", to: "/admin/operations", tab: "tickets" },
      { label: "Documents", to: "/admin/operations", tab: "documents" },
      { label: "Reports", to: "/admin/operations", tab: "reports" },
      {
        label: "KYC Email Templates",
        to: "/admin/email-templates",
        keywords: "email preview test send kyc decision template",
      },
    ],
  },
  {
    label: "Growth",
    icon: "chart",
    items: [
      { label: "Analytics", to: "/admin/analytics", tab: "analytics" },
      { label: "Marketing", to: "/admin/analytics", tab: "marketing" },
      { label: "Affiliate Program", to: "/admin/analytics", tab: "affiliate" },
    ],
  },
  {
    label: "Localization",
    icon: "globe",
    items: [
      { label: "Countries", to: "/admin/localization", tab: "countries" },
      { label: "Currencies", to: "/admin/localization", tab: "currencies" },
      { label: "Languages", to: "/admin/localization", tab: "languages" },
    ],
  },
  {
    label: "Security",
    icon: "lock",
    items: [
      { label: "Security", to: "/admin/security", tab: "posture" },
      { label: "Fraud Detection", to: "/admin/security", tab: "fraud" },
      { label: "Audit Logs", to: "/admin/security", tab: "audit" },
      { label: "Roles & Permissions", to: "/admin/security", tab: "roles" },
      { label: "API Keys", to: "/admin/security", tab: "keys" },
    ],
  },
  {
    label: "Integrations",
    icon: "plug",
    items: [
      { label: "Integrations", to: "/admin/integrations", tab: "overview" },
      { label: "Cloudflare", to: "/admin/integrations", tab: "cloudflare" },
      { label: "SMTP", to: "/admin/integrations", tab: "smtp" },
      { label: "Zoho", to: "/admin/integrations", tab: "zoho" },
      { label: "SmartSupp", to: "/admin/integrations", tab: "smartsupp" },
      { label: "Social media", to: "/admin/social" },
      { label: "External data", to: "/admin/external" },
    ],
  },
  {
    label: "System",
    icon: "cog",
    items: [
      { label: "Settings", to: "/admin/settings", tab: "general" },
      { label: "Maintenance", to: "/admin/settings", tab: "maintenance" },
      { label: "Backup & Restore", to: "/admin/settings", tab: "backup" },
      { label: "System Health", to: "/admin/settings", tab: "health" },
    ],
  },
];

export const ALL_NAV_ITEMS: (NavItem & { group: string })[] = ADMIN_NAV.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.label })),
);

export function navHref(item: NavItem) {
  return item.tab ? `${item.to}?tab=${item.tab}` : item.to;
}
