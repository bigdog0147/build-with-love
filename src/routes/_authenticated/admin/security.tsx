import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { Badge, Button, DataTable, Panel, PanelHead, StatCard } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";
import { listAuditLog } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/security")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "posture" }),
  component: SecurityPage,
  head: () => ({
    meta: [
      { title: "Security & Compliance | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Monitor GF3X security posture, fraud signals, authentication audit logs, role assignments and API key inventory.",
      },
      { property: "og:title", content: "Security & Compliance | Gigafactory 3X Administration" },
      { property: "og:description", content: "Security posture, fraud detection and audit trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "posture", label: "Posture" },
  { key: "fraud", label: "Fraud detection" },
  { key: "audit", label: "Audit logs" },
  { key: "roles", label: "Roles & permissions" },
  { key: "keys", label: "API keys" },
];

function SecurityPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const fetchAudit = useServerFn(listAuditLog);
  const q = useQuery({ queryKey: ["admin-audit"], queryFn: () => fetchAudit({}), retry: false });
  const rows = q.data?.rows ?? [];
  const failed = rows.filter((r) => !r.success);

  const auditColumns = [
    { key: "event_type", label: "Event", value: (r: (typeof rows)[number]) => r.event_type, render: (r: (typeof rows)[number]) => <span className="capitalize">{r.event_type.replace(/_/g, " ")}</span> },
    { key: "actor", label: "Actor", value: (r: (typeof rows)[number]) => r.actor },
    { key: "success", label: "Result", value: (r: (typeof rows)[number]) => String(r.success), render: (r: (typeof rows)[number]) => <Badge tone={r.success ? "success" : "danger"}>{r.success ? "success" : "failed"}</Badge> },
    { key: "ip", label: "IP", value: (r: (typeof rows)[number]) => r.ip },
    { key: "reason", label: "Reason", value: (r: (typeof rows)[number]) => r.reason, render: (r: (typeof rows)[number]) => <span className="block max-w-56 truncate text-xs text-muted-foreground">{r.reason}</span> },
    {
      key: "created_at",
      label: "When",
      value: (r: (typeof rows)[number]) => r.created_at,
      render: (r: (typeof rows)[number]) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-US")}</span>,
    },
  ];

  return (
    <AdminShell
      eyebrow="Security"
      title="Security & compliance"
      sub="Authentication telemetry, fraud signals, privileged role assignments and credential inventory."
      actions={
        <Button variant="ghost" onClick={() => q.refetch()}>
          <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Refresh
        </Button>
      }
    >
      {q.error && <Panel className="p-4 text-sm text-[var(--danger)]">{(q.error as Error).message}</Panel>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Audit events" value={rows.length} />
        <StatCard label="Failed attempts" value={failed.length} tone="danger" />
        <StatCard label="Unique actors" value={new Set(rows.map((r) => r.actor)).size} tone="electric" />
        <StatCard label="Unique IPs" value={new Set(rows.map((r) => r.ip)).size} tone="silver" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/security", search: { tab: key } })} />

      {tab === "posture" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHead title="Control posture" sub="Platform-wide protections" />
            <div className="divide-y divide-white/6 text-sm">
              {[
                ["Row-level security", "Enforced on every customer table", "success"],
                ["Service-role isolation", "Privileged keys server-side only", "success"],
                ["Bearer-token server functions", "All admin reads re-validate the caller", "success"],
                ["Registration", "Closed — invitation only", "gold"],
                ["Leaked-password screening", "Enable in auth settings for extra hardening", "gold"],
              ].map(([label, detail, tone]) => (
                <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate">{label}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                  <Badge tone={tone as "success" | "gold"}>{tone === "success" ? "Enforced" : "Review"}</Badge>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Recent failed authentications" sub="Latest 8 rejected attempts" />
            <ul className="divide-y divide-white/6">
              {failed.slice(0, 8).map((r) => (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-2.5 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{r.actor}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.event_type.replace(/_/g, " ")} · {r.ip}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
              {failed.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">No failed attempts recorded.</li>}
            </ul>
          </Panel>
        </div>
      )}

      {tab === "fraud" && (
        <>
          <Panel className="mb-4">
            <PanelHead title="Fraud signals" sub="Derived from authentication telemetry" />
            <DataTable
              rows={failed}
              columns={auditColumns}
              searchKeys={["actor", "event_type", "ip", "reason"]}
              exportName="gf3x-fraud-signals"
              pageSize={10}
              empty="No fraud signals detected."
            />
          </Panel>
          <RegistryModule
            storeKey="sec-fraud-rules"
            title="Detection rules"
            sub="Thresholds applied to live traffic."
            createLabel="New rule"
            filterKeys={["action"]}
            fields={[
              { key: "name", label: "Rule", type: "text" },
              { key: "signal", label: "Signal", type: "select", options: ["Failed logins", "Velocity", "Geo mismatch", "Large transfer", "New device"] },
              { key: "threshold", label: "Threshold", type: "number" },
              { key: "window_min", label: "Window (min)", type: "number" },
              { key: "action", label: "Action", type: "select", options: ["Flag", "Challenge", "Block"], tone: (v) => (v === "Block" ? "danger" : v === "Challenge" ? "gold" : "neutral") },
              { key: "enabled", label: "Enabled", type: "toggle" },
            ]}
            seed={[
              { id: "fr1", name: "Credential stuffing", signal: "Failed logins", threshold: 5, window_min: 10, action: "Block", enabled: true },
              { id: "fr2", name: "Impossible travel", signal: "Geo mismatch", threshold: 2, window_min: 60, action: "Challenge", enabled: true },
              { id: "fr3", name: "Outsized transfer", signal: "Large transfer", threshold: 1000000, window_min: 1440, action: "Flag", enabled: true },
            ]}
          />
        </>
      )}

      {tab === "audit" && (
        <Panel>
          <PanelHead title="Authentication audit log" sub={q.isPending ? "Loading…" : `${rows.length} event(s)`} />
          <DataTable
            rows={rows}
            columns={auditColumns}
            searchKeys={["actor", "event_type", "ip", "reason"]}
            filters={[{ key: "result", label: "Result", options: ["true", "false"], value: (r) => String(r.success) }]}
            exportName="gf3x-audit-log"
            pageSize={12}
            empty={q.isPending ? "Loading audit trail…" : "No audit events recorded."}
          />
        </Panel>
      )}

      {tab === "roles" && (
        <RegistryModule
          storeKey="sec-roles"
          title="Roles & permissions"
          sub="Console role definitions. Grant or revoke a customer's administrator role from their profile."
          createLabel="New role"
          fields={[
            { key: "role", label: "Role", type: "text" },
            { key: "scope", label: "Scope", type: "select", options: ["Global", "Finance", "Compliance", "Support", "Read-only"] },
            { key: "members", label: "Members", type: "number" },
            { key: "can_write", label: "Write access", type: "toggle" },
            { key: "notes", label: "Notes", type: "textarea", hideInTable: true },
          ]}
          seed={[
            { id: "ro1", role: "administrator", scope: "Global", members: 2, can_write: true, notes: "Full control-center access, including role grants." },
            { id: "ro2", role: "moderator", scope: "Compliance", members: 0, can_write: true, notes: "Verification decisions and document review." },
            { id: "ro3", role: "user", scope: "Read-only", members: 0, can_write: false, notes: "Default customer role." },
          ]}
        />
      )}

      {tab === "keys" && (
        <RegistryModule
          storeKey="sec-keys"
          title="API key inventory"
          sub="Metadata only — secret values are stored in the encrypted backend vault and never displayed."
          createLabel="Register key"
          filterKeys={["status"]}
          fields={[
            { key: "name", label: "Key", type: "text" },
            { key: "owner", label: "Owner", type: "text" },
            { key: "scope", label: "Scope", type: "select", options: ["Read", "Write", "Admin"] },
            { key: "status", label: "Status", type: "select", options: ["Active", "Rotating", "Revoked"], tone: (v) => (v === "Active" ? "success" : v === "Revoked" ? "danger" : "gold") },
            { key: "last_rotated", label: "Last rotated", type: "text" },
          ]}
          seed={[
            { id: "k1", name: "External backend secret", owner: "Platform", scope: "Admin", status: "Active", last_rotated: "2026-01-12" },
            { id: "k2", name: "AI gateway key", owner: "Platform", scope: "Write", status: "Active", last_rotated: "2025-11-04" },
          ]}
        />
      )}
    </AdminShell>
  );
}
