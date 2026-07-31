import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { Badge, Panel, PanelHead, StatCard } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";

export const Route = createFileRoute("/_authenticated/admin/integrations")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "overview" }),
  component: IntegrationsPage,
  head: () => ({
    meta: [
      { title: "Integrations | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Configure GF3X third-party integrations: edge delivery, transactional mail, CRM, live chat and external data backends.",
      },
      { property: "og:title", content: "Integrations | Gigafactory 3X Administration" },
      { property: "og:description", content: "Third-party integration configuration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "cloudflare", label: "Cloudflare" },
  { key: "smtp", label: "SMTP" },
  { key: "zoho", label: "Zoho" },
  { key: "smartsupp", label: "SmartSupp" },
];

const PROVIDERS = [
  { name: "Cloudflare", purpose: "DNS, WAF and edge caching for gf3x.space", state: "Connected" },
  { name: "SMTP relay", purpose: "Transactional and notification email", state: "Connected" },
  { name: "Zoho", purpose: "CRM sync for institutional pipeline", state: "Configure" },
  { name: "SmartSupp", purpose: "Live chat on public marketing pages", state: "Configure" },
  { name: "External backend", purpose: "Secondary data source and KYC storage", state: "Connected" },
  { name: "AI gateway", purpose: "Model access for internal tooling", state: "Connected" },
];

function IntegrationsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  function Credentials({ storeKey, title, sub, seed }: { storeKey: string; title: string; sub: string; seed: { id: string; setting: string; value: string; enabled: boolean }[] }) {
    return (
      <RegistryModule
        storeKey={storeKey}
        title={title}
        sub={sub}
        createLabel="New setting"
        fields={[
          { key: "setting", label: "Setting", type: "text" },
          { key: "value", label: "Value", type: "text" },
          { key: "enabled", label: "Enabled", type: "toggle" },
        ]}
        seed={seed}
      />
    );
  }

  return (
    <AdminShell
      eyebrow="Integrations"
      title="Integrations"
      sub="Connected platform services. Secret values live in the encrypted backend vault — only non-sensitive configuration is edited here."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Providers" value={PROVIDERS.length} />
        <StatCard label="Connected" value={PROVIDERS.filter((p) => p.state === "Connected").length} tone="success" />
        <StatCard label="Awaiting config" value={PROVIDERS.filter((p) => p.state !== "Connected").length} tone="gold" />
        <StatCard label="Webhook endpoints" value={3} tone="electric" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/integrations", search: { tab: key } })} />

      {tab === "overview" && (
        <Panel>
          <PanelHead title="Provider status" sub="Platform-wide integration inventory" />
          <ul className="divide-y divide-white/6">
            {PROVIDERS.map((p) => (
              <li key={p.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.purpose}</p>
                </div>
                <Badge tone={p.state === "Connected" ? "success" : "gold"}>{p.state}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === "cloudflare" && (
        <Credentials
          storeKey="int-cloudflare"
          title="Cloudflare"
          sub="Edge delivery and protection for gf3x.space."
          seed={[
            { id: "cf1", setting: "Zone", value: "gf3x.space", enabled: true },
            { id: "cf2", setting: "Proxy status", value: "Proxied", enabled: true },
            { id: "cf3", setting: "WAF ruleset", value: "Managed + custom industrial ruleset", enabled: true },
            { id: "cf4", setting: "Cache level", value: "Standard", enabled: true },
          ]}
        />
      )}

      {tab === "smtp" && (
        <Credentials
          storeKey="int-smtp"
          title="SMTP relay"
          sub="Outbound transactional mail configuration."
          seed={[
            { id: "sm1", setting: "Host", value: "smtp.gf3x.space", enabled: true },
            { id: "sm2", setting: "Port", value: "587", enabled: true },
            { id: "sm3", setting: "From address", value: "no-reply@gf3x.space", enabled: true },
            { id: "sm4", setting: "DKIM", value: "Signed", enabled: true },
          ]}
        />
      )}

      {tab === "zoho" && (
        <Credentials
          storeKey="int-zoho"
          title="Zoho CRM"
          sub="Institutional pipeline synchronisation."
          seed={[
            { id: "zo1", setting: "Region", value: "eu", enabled: true },
            { id: "zo2", setting: "Sync interval", value: "15 minutes", enabled: false },
            { id: "zo3", setting: "Lead owner", value: "Institutional desk", enabled: false },
          ]}
        />
      )}

      {tab === "smartsupp" && (
        <Credentials
          storeKey="int-smartsupp"
          title="SmartSupp live chat"
          sub="Marketing-site chat widget behaviour."
          seed={[
            { id: "ss1", setting: "Widget key", value: "Stored in vault", enabled: false },
            { id: "ss2", setting: "Placement", value: "Public pages only", enabled: false },
            { id: "ss3", setting: "Office hours", value: "08:00–20:00 UTC", enabled: false },
          ]}
        />
      )}
    </AdminShell>
  );
}
