import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Filter } from "lucide-react";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import {
  exportTransactionLedger,
  getTransactionLedger,
} from "@/lib/transactions.functions";
import { buildLedgerCsv, ledgerCsvFilename } from "@/lib/transactions-csv";

type Search = {
  kind?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
};

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
  validateSearch: (search: Record<string, unknown>): Search => ({
    kind: typeof search['kind'] === "string" ? search['kind'] : undefined,
    status: typeof search['status'] === "string" ? search['status'] : undefined,
    from: typeof search['from'] === "string" ? search['from'] : undefined,
    to: typeof search['to'] === "string" ? search['to'] : undefined,
    q: typeof search['q'] === "string" ? search['q'] : undefined,
    page: Number(search['page']) > 1 ? Number(search['page']) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Transaction history — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Search, filter and export your full Gigafactory 3X transaction ledger across every wallet.",
      },
      { property: "og:title", content: "Transaction history — Gigafactory 3X" },
      { property: "og:description", content: "Full customer transaction ledger with CSV export." },
    ],
  }),
});

const inputCls =
  "w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60";
const labelCls = "mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground";

const KINDS = [
  "Deposit",
  "Withdrawal",
  "Outgoing transfer",
  "Investment",
  "Request",
];
const STATUSES = ["Cleared", "Pending", "Reversed"];

function TransactionsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchLedger = useServerFn(getTransactionLedger);
  const fetchExport = useServerFn(exportTransactionLedger);
  const [exporting, setExporting] = useState(false);

  const filters = {
    kind: search.kind ?? "",
    status: search.status ?? "",
    from: search.from ?? "",
    to: search.to ?? "",
    q: search.q ?? "",
    page: search.page ?? 1,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["ledger", filters],
    queryFn: () => fetchLedger({ data: filters }),
  });

  function setFilter(patch: Partial<Search>) {
    navigate({
      search: (prev: Search) => ({ ...prev, ...patch, page: patch.page ?? undefined }),
      replace: true,
    });
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetchExport({ data: filters });
      const csv = buildLedgerCsv(res.rows);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = ledgerCsvFilename();
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.rows.length} transaction(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <DashShell>
      <PageHeading
        eyebrow="History"
        title="Transaction ledger"
        sub="Every movement across your wallets, filterable and exportable."
      />

      <div className="mb-5 rounded-2xl border border-border p-5 glass">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-[var(--gold)]" />
          Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className={labelCls} htmlFor="f-q">
              Search
            </label>
            <input
              id="f-q"
              className={inputCls}
              value={filters.q}
              placeholder="Description"
              onChange={(e) => setFilter({ q: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="f-kind">
              Type
            </label>
            <select
              id="f-kind"
              className={inputCls}
              value={filters.kind}
              onChange={(e) => setFilter({ kind: e.target.value || undefined })}
            >
              <option value="">All types</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="f-status">
              Status
            </label>
            <select
              id="f-status"
              className={inputCls}
              value={filters.status}
              onChange={(e) => setFilter({ status: e.target.value || undefined })}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="f-from">
              From
            </label>
            <input
              id="f-from"
              type="date"
              className={inputCls}
              value={filters.from}
              onChange={(e) => setFilter({ from: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="f-to">
              To
            </label>
            <input
              id="f-to"
              type="date"
              className={inputCls}
              value={filters.to}
              onChange={(e) => setFilter({ to: e.target.value || undefined })}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs hover:border-[var(--gold)]/60 disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Preparing…" : "Export CSV"}
          </button>
          <button
            onClick={() =>
              navigate({ search: {} as Search, replace: true })
            }
            className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
          <span className="text-xs text-muted-foreground">{total} matching transaction(s)</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border glass">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="px-5 py-3 font-normal">Date</th>
              <th className="px-5 py-3 font-normal">Description</th>
              <th className="px-5 py-3 font-normal">Type</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-muted-foreground">
                  Loading ledger…
                </td>
              </tr>
            )}
            {!isLoading && (data?.rows.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-muted-foreground">
                  No transactions match these filters.
                </td>
              </tr>
            )}
            {(data?.rows ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                  {new Date(r.occurred_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">{r.name}</td>
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.kind}</td>
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.status}</td>
                <td
                  className={
                    "whitespace-nowrap px-5 py-3 text-right tabular-nums " +
                    (Number(r.amount) < 0 ? "text-foreground" : "text-[var(--success)]")
                  }
                >
                  {Number(r.amount) > 0 ? "+" : ""}
                  {Number(r.amount).toLocaleString()} {r.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-xs">
          <button
            disabled={filters.page <= 1}
            onClick={() => setFilter({ page: filters.page - 1 })}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {filters.page} of {pages}
          </span>
          <button
            disabled={filters.page >= pages}
            onClick={() => setFilter({ page: filters.page + 1 })}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </DashShell>
  );
}
