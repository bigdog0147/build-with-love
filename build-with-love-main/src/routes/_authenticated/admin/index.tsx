import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, ArrowUpRight, Database, RefreshCw, Server, ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { AreaChart, Badge, Bars, Button, Donut, Panel, PanelHead, StatCard, WorldMap, fmt } from "@/components/admin/kit";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [
      { title: "Control Center | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "GF3X enterprise administration dashboard: customers, verification, treasury flow, investment performance and platform health in one console.",
      },
      { property: "og:title", content: "Control Center | Gigafactory 3X Administration" },
      { property: "og:description", content: "Live operations console for the Gigafactory 3X platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const MAP_NODES: Record<string, { x: number; y: number }> = {
  "United States": { x: 22, y: 19 },
  Canada: { x: 22, y: 13 },
  "United Kingdom": { x: 47, y: 15 },
  Germany: { x: 51, y: 16 },
  France: { x: 48, y: 18 },
  "United Arab Emirates": { x: 61, y: 25 },
  "Saudi Arabia": { x: 58, y: 24 },
  India: { x: 68, y: 26 },
  Singapore: { x: 76, y: 31 },
  Japan: { x: 84, y: 20 },
  China: { x: 77, y: 21 },
  Australia: { x: 84, y: 39 },
  Brazil: { x: 33, y: 35 },
  "South Africa": { x: 53, y: 40 },
  Nigeria: { x: 49, y: 29 },
};

function AdminDashboard() {
  const fetchOverview = useServerFn(getAdminOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview({}), refetchInterval: 30_000, retry: false });
  const o = q.data;
  const t = o?.totals;

  const nodes = (o?.countries ?? [])
    .filter((c) => MAP_NODES[c.label])
    .map((c) => ({ label: c.label, value: c.value, ...MAP_NODES[c.label] }));

  const palette = ["var(--gold)", "var(--electric)", "var(--silver)", "var(--success)", "oklch(0.7 0.16 300)", "oklch(0.7 0.15 30)"];

  return (
    <AdminShell
      eyebrow="Command"
      title="Control Center"
      sub="Consolidated platform telemetry — customers, verification, treasury flow and infrastructure posture."
      actions={
        <>
          <Button onClick={() => q.refetch()} variant="ghost">
            <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Refresh
          </Button>
          <Link to="/admin/customers" className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs hover:bg-white/5">
            Customer book <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </>
      }
    >
      {q.error && (
        <Panel className="p-4 text-sm text-[var(--danger)]">{(q.error as Error).message}</Panel>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total customers" value={t?.customers ?? 0} series={o?.volumeSeries.map((v) => v.value)} />
        <StatCard label="Verified customers" value={t?.verified ?? 0} tone="success" />
        <StatCard label="Pending KYC" value={t?.pendingKyc ?? 0} tone="electric" sub="Awaiting review" />
        <StatCard label="Assets under management" value={t?.aum ?? 0} format="currency" tone="gold" />
        <StatCard label="Revenue (all time)" value={t?.revenue ?? 0} format="currency" series={o?.revenueSeries.map((v) => v.value)} />
        <StatCard label="Monthly revenue" value={t?.revenueMonth ?? 0} format="currency" tone="electric" />
        <StatCard label="Weekly revenue" value={t?.revenueWeek ?? 0} format="currency" tone="silver" />
        <StatCard label="Investment growth" value={t?.investmentGrowth ?? 0} format="percent" tone="success" />
        <StatCard label="Today's transactions" value={t?.txToday ?? 0} tone="electric" />
        <StatCard label="Deposit requests" value={t?.depositRequests ?? 0} tone="gold" />
        <StatCard label="Withdrawal requests" value={t?.withdrawalRequests ?? 0} tone="gold" />
        <StatCard label="Issued cards" value={t?.cards ?? 0} tone="silver" />
        <StatCard label="Active users (7d)" value={t?.activeUsers ?? 0} tone="electric" />
        <StatCard label="Online now" value={t?.onlineUsers ?? 0} tone="success" sub="Sessions in last 15 min" />
        <StatCard label="Fraud alerts" value={t?.fraudAlerts ?? 0} tone="danger" sub="Failed auth attempts (30d)" />
        <StatCard label="Support queue" value={t?.tickets ?? 0} tone="silver" sub="Flagged for review" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel glow>
          <PanelHead
            title="Revenue & settlement volume"
            sub="Rolling 30 days"
            right={<Badge tone="gold">Fee model 0.75%</Badge>}
          />
          <div className="p-4 sm:p-5">
            <AreaChart
              data={o?.revenueSeries.map((r) => r.value) ?? []}
              labels={["30d", "20d", "10d", "Today"]}
              color="var(--gold)"
              height={190}
            />
            <div className="mt-4 border-t border-white/8 pt-4">
              <AreaChart data={o?.volumeSeries.map((r) => r.value) ?? []} color="var(--electric)" height={120} />
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Live activity feed" sub="Newest ledger events" />
          <ul className="divide-y divide-white/6">
            {(o?.activity ?? []).map((a) => (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.kind} · {new Date(a.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums">
                    {a.amount < 0 ? "−" : "+"}
                    {fmt(Math.abs(a.amount), "currency")}
                  </p>
                  <Badge tone={a.status === "Cleared" ? "success" : a.status === "Rejected" ? "danger" : "gold"}>{a.status}</Badge>
                </div>
              </li>
            ))}
            {!q.isPending && (o?.activity ?? []).length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">No ledger activity recorded yet.</li>
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHead title="Flow by instrument" sub="Share of settled volume" />
          <div className="p-4 sm:p-5">
            <Donut
              slices={(o?.allocation ?? []).slice(0, 6).map((a, i) => ({ label: a.label, value: a.value, color: palette[i % palette.length] }))}
            />
          </div>
        </Panel>
        <Panel>
          <PanelHead title="Treasury by currency" sub="Fiat-equivalent balances" />
          <div className="p-4 sm:p-5">
            <Bars data={(o?.currencies ?? []).slice(0, 7).map((c) => ({ label: c.label, value: c.value }))} />
          </div>
        </Panel>
        <Panel>
          <PanelHead title="Platform health" sub="Continuous probes" />
          <div className="space-y-2 p-4 sm:p-5">
            {[
              { icon: Database, label: "Database", state: o?.health.database ?? "operational" },
              { icon: Server, label: "API layer", state: o?.health.api ?? "operational" },
              { icon: Activity, label: "Storage", state: o?.health.storage ?? "operational" },
              { icon: ShieldAlert, label: "Fraud engine", state: (t?.fraudAlerts ?? 0) > 10 ? "degraded" : "operational" },
            ].map((h) => (
              <div key={h.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <h.icon className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                  <span className="truncate">{h.label}</span>
                </span>
                <Badge tone={h.state === "operational" ? "success" : "danger"}>{h.state}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Global customer distribution" sub="Registered accounts by declared country" />
        <div className="p-4 sm:p-5">
          <WorldMap nodes={nodes} />
        </div>
      </Panel>
    </AdminShell>
  );
}
