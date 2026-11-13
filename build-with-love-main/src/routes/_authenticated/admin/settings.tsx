import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { Badge, Button, Field, Panel, PanelHead, StatCard, Toggle, inputCx } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";
import { useSettings } from "@/lib/admin-store";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "general" }),
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "System Settings | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Global GF3X platform settings, maintenance mode, backup schedule and live system health monitoring.",
      },
      { property: "og:title", content: "System Settings | Gigafactory 3X Administration" },
      { property: "og:description", content: "Platform settings, maintenance, backup and health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "general", label: "General" },
  { key: "maintenance", label: "Maintenance" },
  { key: "backup", label: "Backup & restore" },
  { key: "health", label: "System health" },
];

function SettingsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const fetchOverview = useServerFn(getAdminOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview({}), retry: false });

  const [values, patch] = useSettings<{
    site_name: string;
    tagline: string;
    support_email: string;
    primary_domain: string;
    default_currency: string;
    registration_open: boolean;
    maintenance_mode: boolean;
    maintenance_note: string;
  }>("admin-general", {
    site_name: "Gigafactory 3X",
    tagline: "Engineering the Future of Intelligent Industry",
    support_email: "support@gf3x.space",
    primary_domain: "gf3x.space",
    default_currency: "USD",
    registration_open: false,
    maintenance_mode: false,
    maintenance_note: "Settlement services are briefly offline for scheduled maintenance.",
  });
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof typeof values>(key: K, v: (typeof values)[K]) => {
    patch({ [key]: v } as never);
    setSaved(false);
  };
  const save = () => setSaved(true);


  return (
    <AdminShell
      eyebrow="System"
      title="System settings"
      sub="Platform identity, availability controls, backup policy and infrastructure health."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Registration" value={values.registration_open ? 1 : 0} tone={values.registration_open ? "success" : "gold"} sub={values.registration_open ? "Open" : "Invitation only"} />
        <StatCard label="Maintenance mode" value={values.maintenance_mode ? 1 : 0} tone={values.maintenance_mode ? "danger" : "success"} sub={values.maintenance_mode ? "Active" : "Inactive"} />
        <StatCard label="Customers" value={q.data?.totals.customers ?? 0} tone="electric" />
        <StatCard label="Ledger entries" value={q.data?.totals.txToday ?? 0} tone="silver" sub="Today" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/settings", search: { tab: key } })} />

      {tab === "general" && (
        <Panel>
          <PanelHead title="Platform identity" sub="Applied across customer-facing surfaces" right={saved ? <Badge tone="success">Saved</Badge> : undefined} />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <Field label="Platform name">
              <input value={values.site_name} onChange={(e) => set("site_name", e.target.value)} className={inputCx} />
            </Field>
            <Field label="Primary domain">
              <input value={values.primary_domain} onChange={(e) => set("primary_domain", e.target.value)} className={inputCx} />
            </Field>
            <Field label="Tagline">
              <input value={values.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCx} />
            </Field>
            <Field label="Support email">
              <input value={values.support_email} onChange={(e) => set("support_email", e.target.value)} className={inputCx} />
            </Field>
            <Field label="Default currency">
              <input value={values.default_currency} onChange={(e) => set("default_currency", e.target.value)} className={inputCx} />
            </Field>
            <div className="flex items-end">
              <Toggle
                label="Customer registration open"
                checked={values.registration_open}
                onChange={(v) => set("registration_open", v)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button variant="gold" onClick={save}>
                Save settings
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {tab === "maintenance" && (
        <Panel>
          <PanelHead title="Maintenance mode" sub="Displays a notice to customers and pauses non-essential jobs" right={saved ? <Badge tone="success">Saved</Badge> : undefined} />
          <div className="space-y-3 p-4 sm:p-5">
            <Toggle label="Enable maintenance mode" checked={values.maintenance_mode} onChange={(v) => set("maintenance_mode", v)} />
            <Field label="Customer-facing notice">
              <textarea
                rows={3}
                value={values.maintenance_note}
                onChange={(e) => set("maintenance_note", e.target.value)}
                className={`${inputCx} resize-y`}
              />
            </Field>
            <Button variant="gold" onClick={save}>
              Save maintenance policy
            </Button>
          </div>
        </Panel>
      )}

      {tab === "backup" && (
        <RegistryModule
          storeKey="sys-backups"
          title="Backup & restore"
          sub="Snapshot policy for the platform database and document storage."
          createLabel="New policy"
          filterKeys={["cadence"]}
          fields={[
            { key: "name", label: "Policy", type: "text" },
            { key: "target", label: "Target", type: "select", options: ["Database", "Document storage", "Configuration"] },
            { key: "cadence", label: "Cadence", type: "select", options: ["Hourly", "Daily", "Weekly"] },
            { key: "retention_days", label: "Retention (days)", type: "number" },
            { key: "encrypted", label: "Encrypted", type: "toggle" },
          ]}
          seed={[
            { id: "bk1", name: "Primary database snapshot", target: "Database", cadence: "Daily", retention_days: 30, encrypted: true },
            { id: "bk2", name: "KYC document vault", target: "Document storage", cadence: "Daily", retention_days: 365, encrypted: true },
            { id: "bk3", name: "Console configuration", target: "Configuration", cadence: "Weekly", retention_days: 90, encrypted: true },
          ]}
        />
      )}

      {tab === "health" && (
        <Panel>
          <PanelHead title="System health" sub="Live probes against platform services" />
          <div className="divide-y divide-white/6 text-sm">
            {[
              ["Database", q.data?.health.database ?? "operational"],
              ["API layer", q.data?.health.api ?? "operational"],
              ["Document storage", q.data?.health.storage ?? "operational"],
              ["Authentication", "operational"],
            ].map(([label, state]) => (
              <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
                <span className="truncate">{label}</span>
                <Badge tone={state === "operational" ? "success" : "danger"}>{state}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </AdminShell>
  );
}
