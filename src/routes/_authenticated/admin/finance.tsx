import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { Badge, Button, Column, DataTable, Panel, PanelHead, StatCard, fmt } from "@/components/admin/kit";
import { RegistryModule } from "@/components/admin/registry-module";
import { listFinance, setTransactionStatus, type FinanceRow } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/finance")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "deposits" }),
  component: FinancePage,
  head: () => ({
    meta: [
      { title: "Finance & Treasury | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "Approve deposits and withdrawals, audit the settlement ledger, manage wallets, cards, loan books, fee schedules and exchange rates.",
      },
      { property: "og:title", content: "Finance & Treasury | Gigafactory 3X Administration" },
      { property: "og:description", content: "Treasury operations console for the GF3X platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const TABS = [
  { key: "deposits", label: "Deposits" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "transactions", label: "Transactions" },
  { key: "wallets", label: "Wallets" },
  { key: "cards", label: "Cards" },
  { key: "loans", label: "Loans" },
  { key: "limits", label: "Fees & limits" },
  { key: "rates", label: "Exchange rates" },
];

const STATUS_TONE: Record<string, "success" | "gold" | "danger" | "electric"> = {
  Cleared: "success",
  Pending: "gold",
  Review: "electric",
  Rejected: "danger",
};

function FinancePage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFinance = useServerFn(listFinance);
  const patchStatus = useServerFn(setTransactionStatus);

  const q = useQuery({ queryKey: ["admin-finance"], queryFn: () => fetchFinance({}), retry: false });
  const mutate = useMutation({
    mutationFn: (v: { id: string; status: string }) => patchStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-finance"] }),
  });

  const tx = q.data?.transactions ?? [];
  const deposits = tx.filter((t) => t.kind.toLowerCase().includes("deposit") || t.amount > 0);
  const withdrawals = tx.filter((t) => t.kind.toLowerCase().includes("withdraw") || t.amount < 0);

  const ledgerColumns: Column<FinanceRow>[] = [
    { key: "customer", label: "Customer", value: (r) => r.customer },
    { key: "name", label: "Description", value: (r) => r.name, render: (r) => <span className="block max-w-56 truncate">{r.name}</span> },
    { key: "kind", label: "Type", value: (r) => r.kind },
    {
      key: "amount",
      label: "Amount",
      value: (r) => r.amount,
      render: (r) => <span className="tabular-nums">{fmt(r.amount, "currency")}</span>,
    },
    { key: "currency", label: "Ccy", value: (r) => r.currency },
    { key: "status", label: "Status", value: (r) => r.status, render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge> },
    {
      key: "occurred_at",
      label: "Date",
      value: (r) => r.occurred_at,
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.occurred_at).toLocaleString("en-US")}</span>,
    },
    {
      key: "actions",
      label: "Decision",
      sortable: false,
      className: "text-right",
      render: (r) => (
        <span className="flex justify-end gap-1.5">
          <button
            onClick={() => mutate.mutate({ id: r.id, status: "Cleared" })}
            className="rounded-md border border-white/12 px-2 py-1 text-[11px] hover:border-[var(--success)]/60"
          >
            Clear
          </button>
          <button
            onClick={() => mutate.mutate({ id: r.id, status: "Review" })}
            className="rounded-md border border-white/12 px-2 py-1 text-[11px] hover:border-[var(--gold)]/60"
          >
            Review
          </button>
          <button
            onClick={() => mutate.mutate({ id: r.id, status: "Rejected" })}
            className="rounded-md border border-white/12 px-2 py-1 text-[11px] text-[var(--danger)] hover:border-[var(--danger)]/60"
          >
            Reject
          </button>
        </span>
      ),
    },
  ];

  function Ledger({ rows, name }: { rows: FinanceRow[]; name: string }) {
    return (
      <Panel>
        <PanelHead title={name} sub={q.isPending ? "Loading…" : `${rows.length} record(s)`} />
        <DataTable
          rows={rows}
          columns={ledgerColumns}
          searchKeys={["customer", "name", "kind", "status", "currency"]}
          filters={[{ key: "status", label: "Status", options: ["Cleared", "Pending", "Review", "Rejected"], value: (r) => r.status }]}
          exportName={`gf3x-${name.toLowerCase()}`}
          pageSize={10}
          empty={q.isPending ? "Loading ledger…" : "No records in this ledger."}
        />
      </Panel>
    );
  }

  return (
    <AdminShell
      eyebrow="Finance"
      title="Finance & treasury"
      sub="Settlement ledger, deposit and withdrawal approvals, wallet and card inventory, fee schedules and FX rates."
      actions={
        <Button variant="ghost" onClick={() => q.refetch()}>
          <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Refresh
        </Button>
      }
    >
      {q.error && <Panel className="p-4 text-sm text-[var(--danger)]">{(q.error as Error).message}</Panel>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Inbound volume" value={deposits.reduce((s, t) => s + Math.abs(t.amount), 0)} format="currency" />
        <StatCard label="Outbound volume" value={withdrawals.reduce((s, t) => s + Math.abs(t.amount), 0)} format="currency" tone="electric" />
        <StatCard label="Awaiting decision" value={tx.filter((t) => t.status !== "Cleared").length} tone="gold" />
        <StatCard label="Ledger entries" value={tx.length} tone="silver" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: "/admin/finance", search: { tab: key } })} />

      {tab === "deposits" && <Ledger rows={deposits} name="Deposits" />}
      {tab === "withdrawals" && <Ledger rows={withdrawals} name="Withdrawals" />}
      {tab === "transactions" && <Ledger rows={tx} name="Transactions" />}

      {tab === "wallets" && (
        <Panel>
          <PanelHead title="Wallet inventory" sub="All customer wallets" />
          <DataTable
            rows={(q.data?.wallets ?? []) as never[]}
            columns={[
              { key: "customer", label: "Customer" },
              { key: "code", label: "Currency" },
              { key: "label", label: "Wallet" },
              { key: "balance", label: "Balance", render: (r) => <span className="tabular-nums">{Number((r as { balance: number }).balance).toLocaleString("en-US")}</span> },
              { key: "fiat_value", label: "Fiat value", render: (r) => <span className="tabular-nums">{fmt(Number((r as { fiat_value: number }).fiat_value ?? 0), "currency")}</span> },
            ]}
            searchKeys={["customer", "code", "label"]}
            exportName="gf3x-wallets"
            pageSize={10}
            empty="No wallets provisioned."
          />
        </Panel>
      )}

      {tab === "cards" && (
        <Panel>
          <PanelHead title="Card inventory" sub="Issued payment instruments" />
          <DataTable
            rows={(q.data?.cards ?? []) as never[]}
            columns={[
              { key: "customer", label: "Customer" },
              { key: "name", label: "Card" },
              { key: "tier", label: "Tier" },
              { key: "last4", label: "Last 4", render: (r) => <span className="tabular-nums">•••• {String((r as { last4: string }).last4)}</span> },
              { key: "created_at", label: "Issued", render: (r) => new Date(String((r as { created_at: string }).created_at)).toLocaleDateString("en-US") },
            ]}
            searchKeys={["customer", "name", "tier", "last4"]}
            exportName="gf3x-cards"
            pageSize={10}
            empty="No cards issued."
          />
        </Panel>
      )}

      {tab === "loans" && (
        <RegistryModule
          storeKey="finance-loans"
          title="Loan book"
          sub="Secured facilities extended against customer holdings."
          createLabel="New facility"
          filterKeys={["status"]}
          fields={[
            { key: "customer", label: "Customer", type: "text" },
            { key: "principal", label: "Principal (USD)", type: "number" },
            { key: "rate", label: "Rate", type: "number", suffix: "%" },
            { key: "term", label: "Term (months)", type: "number" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Active", "Pending", "Repaid", "Default"],
              tone: (v) => (v === "Active" ? "success" : v === "Default" ? "danger" : "gold"),
            },
            { key: "collateral", label: "Collateral", type: "text" },
          ]}
          seed={[
            { id: "l1", customer: "Helios Industrial Trust", principal: 4200000, rate: 5.4, term: 36, status: "Active", collateral: "Battery gigaline equity" },
            { id: "l2", customer: "Meridian Robotics SPV", principal: 1850000, rate: 6.1, term: 24, status: "Pending", collateral: "Robotics IP portfolio" },
          ]}
        />
      )}

      {tab === "limits" && (
        <RegistryModule
          storeKey="finance-limits"
          title="Fees & limits"
          sub="Fee schedule and per-tier transaction ceilings."
          createLabel="New rule"
          filterKeys={["tier"]}
          fields={[
            { key: "name", label: "Rule", type: "text" },
            { key: "tier", label: "Tier", type: "select", options: ["Standard", "Premier", "Obsidian", "Institutional"] },
            { key: "fee_pct", label: "Fee", type: "number", suffix: "%" },
            { key: "min_amount", label: "Minimum (USD)", type: "number" },
            { key: "max_amount", label: "Maximum (USD)", type: "number" },
            { key: "enabled", label: "Enabled", type: "toggle" },
          ]}
          seed={[
            { id: "f1", name: "Wire transfer", tier: "Standard", fee_pct: 0.75, min_amount: 500, max_amount: 250000, enabled: true },
            { id: "f2", name: "Wire transfer", tier: "Obsidian", fee_pct: 0.25, min_amount: 1000, max_amount: 10000000, enabled: true },
            { id: "f3", name: "Digital asset settlement", tier: "Institutional", fee_pct: 0.1, min_amount: 5000, max_amount: 50000000, enabled: true },
          ]}
        />
      )}

      {tab === "rates" && (
        <RegistryModule
          storeKey="finance-rates"
          title="Exchange rates"
          sub="Reference rates applied to multi-currency settlement."
          createLabel="New pair"
          fields={[
            { key: "pair", label: "Pair", type: "text" },
            { key: "rate", label: "Rate", type: "number" },
            { key: "spread", label: "Spread", type: "number", suffix: "bps" },
            { key: "source", label: "Source", type: "select", options: ["Manual", "Market feed", "Treasury desk"] },
            { key: "enabled", label: "Live", type: "toggle" },
          ]}
          seed={[
            { id: "r1", pair: "EUR/USD", rate: 1.086, spread: 12, source: "Market feed", enabled: true },
            { id: "r2", pair: "GBP/USD", rate: 1.271, spread: 14, source: "Market feed", enabled: true },
            { id: "r3", pair: "BTC/USD", rate: 68450, spread: 35, source: "Treasury desk", enabled: true },
            { id: "r4", pair: "XAU/USD", rate: 2384, spread: 20, source: "Treasury desk", enabled: true },
          ]}
        />
      )}
    </AdminShell>
  );
}
