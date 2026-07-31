import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { Badge, Button, DataTable, Field, Panel, PanelHead, StatCard, fmt, inputCx } from "@/components/admin/kit";
import { getCustomerDetail, setAdminRole, setKycDecision, updateCustomer } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/customer/$id")({
  component: CustomerProfile,
  head: () => ({
    meta: [
      { title: "Customer Profile | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Complete GF3X customer record: portfolio, wallets, cards, transactions, verification, login history and controls.",
      },
      { property: "og:title", content: "Customer Profile | Gigafactory 3X Administration" },
      { property: "og:description", content: "Complete customer record and administrative controls." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "portfolio", label: "Portfolio" },
  { key: "wallets", label: "Wallets" },
  { key: "cards", label: "Cards" },
  { key: "transactions", label: "Transactions" },
  { key: "verification", label: "Verification" },
  { key: "security", label: "Security" },
  { key: "controls", label: "Controls" },
];

const STATUSES = ["not_started", "submitted", "under_review", "verified", "rejected"];

function CustomerProfile() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState<string | null>(null);

  const fetchDetail = useServerFn(getCustomerDetail);
  const patchCustomer = useServerFn(updateCustomer);
  const decideKyc = useServerFn(setKycDecision);
  const toggleAdmin = useServerFn(setAdminRole);

  const q = useQuery({ queryKey: ["admin-customer", id], queryFn: () => fetchDetail({ data: { id } }), retry: false });
  const d = q.data;
  const c = d?.customer;

  const mutate = useMutation({
    mutationFn: async (run: () => Promise<unknown>) => run(),
    onSuccess: () => {
      setNotice("Change saved.");
      qc.invalidateQueries({ queryKey: ["admin-customer", id] });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (e) => setNotice((e as Error).message),
  });

  const [tier, setTier] = useState("");
  const [role, setRole] = useState("");

  return (
    <AdminShell
      eyebrow="Customer"
      title={c?.display_name ?? "Customer profile"}
      sub={c ? `${c.tier} · ${c.membership} · joined ${new Date(c.created_at).toLocaleDateString("en-US")}` : undefined}
      actions={
        <Link to="/admin/customers" className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs hover:bg-white/5">
          <ArrowLeft className="h-3.5 w-3.5" /> Customer book
        </Link>
      }
    >
      {q.error && <Panel className="p-4 text-sm text-[var(--danger)]">{(q.error as Error).message}</Panel>}
      {notice && <Panel className="px-4 py-2.5 text-xs text-[var(--gold)]">{notice}</Panel>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Treasury value" value={c?.wallet_value ?? 0} format="currency" />
        <StatCard label="Wallets" value={c?.wallet_count ?? 0} tone="electric" />
        <StatCard label="Cards" value={c?.card_count ?? 0} tone="silver" />
        <StatCard label="Risk score" value={c?.risk_score ?? 0} tone={(c?.risk_score ?? 0) > 60 ? "danger" : "success"} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHead title="Identity" />
            <dl className="divide-y divide-white/6 text-sm">
              {[
                ["Customer ID", c?.id ?? "—"],
                ["Username", c?.username ?? "—"],
                ["Organization", c?.organization ?? "—"],
                ["Country", c?.country ?? "—"],
                ["Role label", c?.role ?? "—"],
                ["Membership", c?.membership ?? "—"],
                ["Verification", (c?.kyc_status ?? "—").replace("_", " ")],
                ["Console roles", (d?.roles ?? []).join(", ") || "customer"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-2.5 sm:px-5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel>
            <PanelHead title="Timeline" sub="Most recent ledger and session events" />
            <ul className="divide-y divide-white/6">
              {[...(d?.transactions ?? []).slice(0, 6).map((t) => ({
                at: String(t.occurred_at),
                title: String(t.name),
                meta: `${t.kind} · ${fmt(Math.abs(Number(t.amount)), "currency")}`,
              })), ...(d?.logins ?? []).slice(0, 5).map((l) => ({
                at: String(l.created_at),
                title: String(l.event_type).replace(/_/g, " "),
                meta: `${l.success ? "success" : "failed"} · ${l.ip ?? "unknown ip"}`,
              }))]
                .sort((a, b) => (a.at < b.at ? 1 : -1))
                .slice(0, 10)
                .map((e, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-2.5 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm capitalize">{e.title}</p>
                      <p className="text-[11px] text-muted-foreground">{e.meta}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(e.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      )}

      {tab === "portfolio" && (
        <Panel>
          <PanelHead title="Investment portfolio" sub="Target allocation model" />
          <DataTable
            rows={(d?.allocations ?? []) as never[]}
            columns={[
              { key: "label", label: "Sleeve" },
              { key: "percent", label: "Weight", render: (r) => <span className="tabular-nums">{Number((r as { percent: number }).percent).toFixed(1)}%</span> },
              { key: "sort_order", label: "Priority" },
            ]}
            exportName="customer-portfolio"
            empty="No allocation model configured for this customer."
          />
        </Panel>
      )}

      {tab === "wallets" && (
        <Panel>
          <PanelHead title="Wallet balances" sub="Multi-currency holdings" />
          <DataTable
            rows={(d?.wallets ?? []) as never[]}
            columns={[
              { key: "code", label: "Currency" },
              { key: "label", label: "Wallet" },
              { key: "balance", label: "Balance", render: (r) => <span className="tabular-nums">{Number((r as { balance: number }).balance).toLocaleString("en-US")}</span> },
              { key: "fiat_value", label: "Fiat value", render: (r) => <span className="tabular-nums">{fmt(Number((r as { fiat_value: number }).fiat_value ?? 0), "currency")}</span> },
              { key: "delta_pct", label: "24h", render: (r) => <Badge tone={Number((r as { delta_pct: number }).delta_pct) >= 0 ? "success" : "danger"}>{Number((r as { delta_pct: number }).delta_pct).toFixed(2)}%</Badge> },
            ]}
            exportName="customer-wallets"
            empty="No wallets provisioned."
          />
        </Panel>
      )}

      {tab === "cards" && (
        <Panel>
          <PanelHead title="Issued cards" />
          <DataTable
            rows={(d?.cards ?? []) as never[]}
            columns={[
              { key: "name", label: "Card" },
              { key: "tier", label: "Tier", render: (r) => <Badge tone="gold">{String((r as { tier: string }).tier)}</Badge> },
              { key: "last4", label: "Last 4", render: (r) => <span className="tabular-nums">•••• {String((r as { last4: string }).last4)}</span> },
              { key: "created_at", label: "Issued", render: (r) => new Date(String((r as { created_at: string }).created_at)).toLocaleDateString("en-US") },
            ]}
            exportName="customer-cards"
            empty="No cards issued."
          />
        </Panel>
      )}

      {tab === "transactions" && (
        <Panel>
          <PanelHead title="Transaction history" />
          <DataTable
            rows={(d?.transactions ?? []) as never[]}
            columns={[
              { key: "name", label: "Description" },
              { key: "kind", label: "Type" },
              { key: "amount", label: "Amount", render: (r) => <span className="tabular-nums">{fmt(Number((r as { amount: number }).amount), "currency")}</span> },
              { key: "currency", label: "Currency" },
              { key: "status", label: "Status", render: (r) => <Badge tone={String((r as { status: string }).status) === "Cleared" ? "success" : "gold"}>{String((r as { status: string }).status)}</Badge> },
              { key: "occurred_at", label: "Date", render: (r) => new Date(String((r as { occurred_at: string }).occurred_at)).toLocaleString("en-US") },
            ]}
            searchKeys={["name", "kind", "status", "currency"]}
            exportName="customer-transactions"
            pageSize={10}
            empty="No transactions recorded."
          />
        </Panel>
      )}

      {tab === "verification" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHead title="Verification record" sub={`Step ${c?.kyc_step ?? 1} of 6`} />
            <dl className="divide-y divide-white/6 text-sm">
              {[
                ["Status", String(d?.kyc?.id_status ?? "not_started").replace("_", " ")],
                ["Legal name", String(d?.kyc?.full_legal_name ?? "—")],
                ["Nationality", String(d?.kyc?.nationality ?? "—")],
                ["Residence", String(d?.kyc?.country_of_residence ?? "—")],
                ["Document type", String(d?.kyc?.doc_type ?? "—")],
                ["Email verified", d?.kyc?.email_verified ? "Yes" : "No"],
                ["Phone verified", d?.kyc?.phone_verified ? "Yes" : "No"],
                ["Two-factor", d?.kyc?.two_factor_enabled ? "Enabled" : "Disabled"],
              ].map(([k, v]) => (
                <div key={String(k)} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-2.5 sm:px-5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate text-right capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel>
            <PanelHead title="Decision" sub="Applies immediately to the customer record" />
            <div className="space-y-2 p-4 sm:p-5">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={s === "verified" ? "gold" : s === "rejected" ? "danger" : "ghost"}
                  className="w-full"
                  onClick={() => mutate.mutate(() => decideKyc({ data: { id, status: s } }))}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Set to {s.replace("_", " ")}
                </Button>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "security" && (
        <Panel>
          <PanelHead title="Login & device history" sub="Authentication audit for this account" />
          <DataTable
            rows={(d?.logins ?? []) as never[]}
            columns={[
              { key: "event_type", label: "Event" },
              { key: "success", label: "Result", render: (r) => <Badge tone={(r as { success: boolean }).success ? "success" : "danger"}>{(r as { success: boolean }).success ? "success" : "failed"}</Badge> },
              { key: "ip", label: "IP" },
              { key: "user_agent", label: "Device", render: (r) => <span className="block max-w-64 truncate text-xs text-muted-foreground">{String((r as { user_agent: string }).user_agent ?? "—")}</span> },
              { key: "created_at", label: "When", render: (r) => new Date(String((r as { created_at: string }).created_at)).toLocaleString("en-US") },
            ]}
            exportName="customer-logins"
            empty="No authentication events recorded."
          />
        </Panel>
      )}

      {tab === "controls" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHead title="Account attributes" />
            <div className="space-y-3 p-4 sm:p-5">
              <Field label="Tier">
                <input value={tier} placeholder={c?.tier} onChange={(e) => setTier(e.target.value)} className={inputCx} />
              </Field>
              <Field label="Role label">
                <input value={role} placeholder={c?.role} onChange={(e) => setRole(e.target.value)} className={inputCx} />
              </Field>
              <Button
                variant="gold"
                onClick={() =>
                  mutate.mutate(() =>
                    patchCustomer({ data: { id, tier: tier || undefined, role: role || undefined } }),
                  )
                }
              >
                Save attributes
              </Button>
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Console access" sub="Administrator role grants full control-center access" />
            <div className="space-y-2 p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">
                Current roles: {(d?.roles ?? []).join(", ") || "customer"}
              </p>
              <Button variant="gold" onClick={() => mutate.mutate(() => toggleAdmin({ data: { id, grant: true } }))} className="w-full">
                Grant administrator role
              </Button>
              <Button variant="danger" onClick={() => mutate.mutate(() => toggleAdmin({ data: { id, grant: false } }))} className="w-full">
                Revoke administrator role
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </AdminShell>
  );
}
