import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { AreaChart, Bars, Donut, Panel, PanelHead, StatCard } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "analytics" }),
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Growth & Analytics | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Growth analytics, acquisition channels, campaign performance and the GF3X affiliate programme in one console.",
      },
      { property: "og:title", content: "Growth & Analytics | Gigafactory 3X Administration" },
      { property: "og:description", content: "Growth, marketing and affiliate analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "analytics", label: "Analytics" },
  { key: "marketing", label: "Marketing" },
  { key: "affiliate", label: "Affiliate programme" },
];

function AnalyticsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AdminShell
      eyebrow="Growth"
      title="Growth & analytics"
      sub="Acquisition, retention and channel economics across the GF3X customer base."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="New accounts (30d)" value={214} tone="electric" />
        <StatCard label="Activation rate" value={64.8} format="percent" tone="success" />
        <StatCard label="Blended CAC" value={1840} format="currency" tone="gold" />
        <StatCard label="Retention (12m)" value={92.3} format="percent" tone="silver" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/analytics", search: { tab: key } })} />

      {tab === "analytics" && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Panel glow>
            <PanelHead title="Account growth" sub="Cumulative registered accounts" />
            <div className="p-4 sm:p-5">
              <AreaChart
                data={[120, 148, 186, 214, 268, 312, 366, 402, 468, 524, 598, 664]}
                labels={["12m", "8m", "4m", "Now"]}
                color="var(--electric)"
                height={210}
              />
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Acquisition mix" />
            <div className="p-4 sm:p-5">
              <Donut
                slices={[
                  { label: "Referral", value: 38, color: "var(--gold)" },
                  { label: "Direct", value: 27, color: "var(--electric)" },
                  { label: "Institutional desk", value: 21, color: "var(--silver)" },
                  { label: "Events", value: 14, color: "var(--success)" },
                ]}
              />
            </div>
          </Panel>
          <Panel className="lg:col-span-2">
            <PanelHead title="Engagement by module" sub="Sessions in the last 30 days" />
            <div className="p-4 sm:p-5">
              <Bars
                data={[
                  { label: "Dashboard", value: 8420 },
                  { label: "Portfolio", value: 5140 },
                  { label: "Wallets", value: 4310 },
                  { label: "Transfers", value: 2980 },
                  { label: "Private markets", value: 1860 },
                  { label: "Verification", value: 1240 },
                ]}
              />
            </div>
          </Panel>
        </div>
      )}

      {tab === "marketing" && (
        <RegistryModule
          storeKey="growth-campaigns"
          title="Campaigns"
          sub="Paid, owned and earned programmes with spend and yield."
          createLabel="New campaign"
          filterKeys={["channel", "status"]}
          fields={[
            { key: "name", label: "Campaign", type: "text" },
            { key: "channel", label: "Channel", type: "select", options: ["Search", "Programmatic", "Print", "Events", "Newsletter", "Partnership"] },
            { key: "spend", label: "Spend (USD)", type: "number" },
            { key: "leads", label: "Qualified leads", type: "number" },
            { key: "accounts", label: "Accounts opened", type: "number" },
            { key: "status", label: "Status", type: "select", options: ["Live", "Paused", "Complete"], tone: (v) => (v === "Live" ? "success" : v === "Paused" ? "gold" : "neutral") },
          ]}
          seed={[
            { id: "cm1", name: "Institutional capital 2026", channel: "Partnership", spend: 420000, leads: 186, accounts: 41, status: "Live" },
            { id: "cm2", name: "Industrial summit Rotterdam", channel: "Events", spend: 260000, leads: 122, accounts: 28, status: "Complete" },
            { id: "cm3", name: "Investor newsletter series", channel: "Newsletter", spend: 48000, leads: 94, accounts: 19, status: "Live" },
          ]}
        />
      )}

      {tab === "affiliate" && (
        <RegistryModule
          storeKey="growth-affiliates"
          title="Affiliate partners"
          sub="Introducers and their attributed production."
          createLabel="New partner"
          filterKeys={["tier", "status"]}
          fields={[
            { key: "partner", label: "Partner", type: "text" },
            { key: "tier", label: "Tier", type: "select", options: ["Bronze", "Silver", "Gold", "Platinum"] },
            { key: "referrals", label: "Referrals", type: "number" },
            { key: "aum_introduced", label: "AUM introduced (USD)", type: "number" },
            { key: "commission_pct", label: "Commission", type: "number", suffix: "%" },
            { key: "status", label: "Status", type: "select", options: ["Active", "Suspended", "Pending"], tone: (v) => (v === "Active" ? "success" : v === "Suspended" ? "danger" : "gold") },
          ]}
          seed={[
            { id: "af1", partner: "Northbridge Advisory", tier: "Platinum", referrals: 34, aum_introduced: 124000000, commission_pct: 0.6, status: "Active" },
            { id: "af2", partner: "Kestrel Wealth", tier: "Gold", referrals: 18, aum_introduced: 46000000, commission_pct: 0.45, status: "Active" },
            { id: "af3", partner: "Atlas Introducers", tier: "Silver", referrals: 7, aum_introduced: 12400000, commission_pct: 0.35, status: "Pending" },
          ]}
        />
      )}
    </AdminShell>
  );
}
