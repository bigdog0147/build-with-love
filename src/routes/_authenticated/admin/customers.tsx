import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, UserRound } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { Badge, Button, Column, DataTable, Panel, PanelHead, StatCard, fmt } from "@/components/admin/kit";
import { listCustomers, type CustomerRow } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersPage,
  head: () => ({
    meta: [
      { title: "Customer Management | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "Search, filter and export the GF3X customer book with verification state, treasury value, card issuance and risk scoring.",
      },
      { property: "og:title", content: "Customer Management | Gigafactory 3X Administration" },
      { property: "og:description", content: "The GF3X customer book with verification and risk telemetry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const KYC_TONE: Record<string, "success" | "gold" | "danger" | "neutral" | "electric"> = {
  verified: "success",
  submitted: "gold",
  under_review: "electric",
  rejected: "danger",
  not_started: "neutral",
};

function CustomersPage() {
  const navigate = useNavigate();
  const fetchCustomers = useServerFn(listCustomers);
  const q = useQuery({ queryKey: ["admin-customers"], queryFn: () => fetchCustomers({}), retry: false });
  const rows = q.data?.rows ?? [];

  const columns: Column<CustomerRow>[] = [
    {
      key: "display_name",
      label: "Customer",
      value: (r) => r.display_name,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-medium text-[var(--gold-foreground)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            {r.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm">{r.display_name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{r.username ?? r.organization ?? r.id.slice(0, 8)}</span>
          </span>
        </span>
      ),
    },
    { key: "tier", label: "Tier", value: (r) => r.tier, render: (r) => <Badge tone="gold">{r.tier}</Badge> },
    {
      key: "kyc_status",
      label: "KYC",
      value: (r) => r.kyc_status,
      render: (r) => <Badge tone={KYC_TONE[r.kyc_status] ?? "neutral"}>{r.kyc_status.replace("_", " ")}</Badge>,
    },
    { key: "country", label: "Country", value: (r) => r.country ?? "—" },
    {
      key: "wallet_value",
      label: "Treasury",
      value: (r) => r.wallet_value,
      render: (r) => <span className="tabular-nums">{fmt(r.wallet_value, "currency")}</span>,
    },
    { key: "card_count", label: "Cards", value: (r) => r.card_count },
    { key: "tx_count", label: "Txns", value: (r) => r.tx_count },
    {
      key: "risk_score",
      label: "Risk",
      value: (r) => r.risk_score,
      render: (r) => (
        <Badge tone={r.risk_score > 60 ? "danger" : r.risk_score > 30 ? "gold" : "success"}>{r.risk_score}</Badge>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      value: (r) => r.created_at,
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-US")}</span>,
    },
  ];

  const aum = rows.reduce((s, r) => s + r.wallet_value, 0);

  return (
    <AdminShell
      eyebrow="Customers"
      title="Customer management"
      sub="Full customer book with live verification state, treasury value and risk scoring. Select a row to open the complete profile."
      actions={
        <Button onClick={() => q.refetch()} variant="ghost">
          <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Refresh
        </Button>
      }
    >
      {q.error && <Panel className="p-4 text-sm text-[var(--danger)]">{(q.error as Error).message}</Panel>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Customers" value={rows.length} />
        <StatCard label="Verified" value={rows.filter((r) => r.kyc_status === "verified").length} tone="success" />
        <StatCard label="In review" value={rows.filter((r) => r.kyc_status === "submitted" || r.kyc_status === "under_review").length} tone="electric" />
        <StatCard label="Book value" value={aum} format="currency" tone="gold" />
      </div>

      <Panel>
        <PanelHead
          title="Customer book"
          sub={q.isPending ? "Loading…" : `${rows.length} account(s)`}
          right={<span className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" /> Click a row for the profile</span>}
        />
        <DataTable
          rows={rows}
          columns={columns}
          searchKeys={["display_name", "username", "organization", "country", "tier", "id"]}
          filters={[
            { key: "kyc", label: "KYC", options: ["verified", "submitted", "under_review", "rejected", "not_started"], value: (r) => r.kyc_status },
            { key: "tier", label: "Tier", options: [...new Set(rows.map((r) => r.tier))], value: (r) => r.tier },
          ]}
          exportName="gf3x-customers"
          pageSize={10}
          onRowClick={(r) => navigate({ to: "/admin/customer/$id", params: { id: r.id } })}
          empty={q.isPending ? "Loading customer book…" : "No customers registered yet."}
        />
      </Panel>
    </AdminShell>
  );
}
