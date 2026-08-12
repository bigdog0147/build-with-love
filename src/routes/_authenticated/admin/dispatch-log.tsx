import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { parseSkipReason } from "@/lib/dispatch-skip-reason";
import { toast } from "sonner";
import { Fragment, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Download,
  KeyRound,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  Check,
  ScrollText,
  Pause,
  Play,
  Radio,

  Search,
  Send,
  X,
} from "lucide-react";
import { DispatchLogDetailSheet } from "@/components/admin/dispatch-log-detail";


import {
  DISPATCH_PAGE_SIZES,
  DISPATCH_STATUSES,
  listDispatchAuditLog,
  exportDispatchAuditLog,

  resendDispatchJob,
  type DispatchAttemptRow,
  type DispatchLogRow,
  type DispatchStatus,

} from "@/lib/dispatch-audit.functions";


export const Route = createFileRoute("/_authenticated/admin/dispatch-log")({
  component: DispatchLogPage,
  head: () => ({
    meta: [
      { title: "Email Dispatch Audit Log — Gigafactory 3X Admin" },
      {
        name: "description",
        content:
          "Audit every background notification and email dispatch job by template, status, date range and idempotency key.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Email Dispatch Audit Log — Gigafactory 3X Admin" },
      {
        property: "og:description",
        content:
          "Filter dispatch jobs by template, outcome, date range and idempotency key to prove what was delivered.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const STATUS_LABEL: Record<string, string> = {
  sent: "Sent",
  skipped: "Skipped",
  failed: "Failed",
};

function statusTone(status: string) {
  if (status === "sent") return "text-emerald-400 border-emerald-400/40 bg-emerald-400/10";
  if (status === "failed") return "text-red-400 border-red-400/40 bg-red-400/10";
  return "text-amber-400 border-amber-400/40 bg-amber-400/10";
}

function ms(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(value < 10000 ? 2 : 1)}s`;
}

const ATTEMPT_TONE: Record<string, string> = {
  sent: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  skipped: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  retry: "text-sky-400 border-sky-400/40 bg-sky-400/10",
  failed: "text-red-400 border-red-400/40 bg-red-400/10",
};

function AttemptTrail({ row }: { row: DispatchLogRow }) {
  const trail: DispatchAttemptRow[] = row.attemptTrail;
  if (trail.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground">
        No per-attempt trail was recorded for this entry (it predates attempt tracing).
        {row.attempts ? ` Total attempts: ${row.attempts}.` : ""}
        {row.detail ? ` Last reason: ${row.detail}` : ""}
      </div>
    );
  }
  const totalBackoff = trail.reduce((sum, a) => sum + (a.backoffMs ?? 0), 0);
  const totalWork = trail.reduce((sum, a) => sum + (a.durationMs ?? 0), 0);
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {trail.length} attempt{trail.length === 1 ? "" : "s"} · {ms(totalWork)} working ·{" "}
        {ms(totalBackoff)} waiting
      </p>
      <table className="w-full text-left text-[11px]">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border/60">
            <th className="py-1 pr-3 font-medium">#</th>
            <th className="py-1 pr-3 font-medium">Started</th>
            <th className="py-1 pr-3 font-medium">Outcome</th>
            <th className="py-1 pr-3 font-medium">Duration</th>
            <th className="py-1 pr-3 font-medium">Backoff before next</th>
            <th className="py-1 font-medium">Failure reason</th>
          </tr>
        </thead>
        <tbody>
          {trail.map((a) => (
            <tr key={`${row.id}-${a.attempt}`} className="border-b border-border/40 last:border-0">
              <td className="py-1.5 pr-3 text-muted-foreground">{a.attempt}</td>
              <td className="whitespace-nowrap py-1.5 pr-3 text-muted-foreground">
                {a.startedAt ? fmt(a.startedAt) : "—"}
              </td>
              <td className="py-1.5 pr-3">
                <span
                  className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                    ATTEMPT_TONE[a.outcome] ?? "border-border text-muted-foreground"
                  }`}
                >
                  {a.outcome}
                </span>
                {a.retryable ? (
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-amber-400">
                    retryable
                  </span>
                ) : null}
              </td>
              <td className="whitespace-nowrap py-1.5 pr-3 text-muted-foreground">
                {ms(a.durationMs)}
              </td>
              <td className="whitespace-nowrap py-1.5 pr-3 text-muted-foreground">
                {a.backoffMs ? ms(a.backoffMs) : "—"}
              </td>
              <td className="py-1.5 text-muted-foreground">{a.error ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(ts: string) {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function csv(rows: DispatchLogRow[]) {
  const head = [
    "Timestamp",
    "Status",
    "Category",
    "Template",
    "Label",
    "Attempts",
    "Retryable",
    "Idempotency key",
    "Detail",
    "User",
    "Last failure",
    "Total attempt ms",
    "Skip event",
    "Skip preference",
    "Resendable",
    "Resent from",
    "Resent at",
  ];
  const cell = (v: string | number | boolean | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.createdAt,
      r.status,
      r.category,
      r.template ?? "",
      r.label,
      r.attempts,
      r.retryable,
      r.idempotencyKey ?? "",
      r.detail ?? "",
      r.userId ?? "",
      [...r.attemptTrail].reverse().find((a) => a.error)?.error ?? "",
      r.attemptTrail.reduce((sum, a) => sum + (a.durationMs ?? 0), 0),
      parseSkipReason(r.detail)?.event ?? "",
      parseSkipReason(r.detail)?.source ?? "",
      r.resendable,
      r.resentFrom ?? "",
      r.resentAt ?? "",
    ]
      .map(cell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\r\n");
}


function DispatchLogPage() {
  const fetchLog = useServerFn(listDispatchAuditLog);

  const [template, setTemplate] = useState("");
  const [statuses, setStatuses] = useState<DispatchStatus[]>([]);

  /** Adds/removes one outcome from the multi-select chip filter. */
  const toggleStatus = (s: DispatchStatus) =>
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const log = useQuery({
    queryKey: [
      "admin-dispatch-log",
      template,
      statuses.join(","),
      from,
      to,
      idempotencyKey,
      page,
      pageSize,
    ],
    queryFn: () =>
      fetchLog({ data: { template, statuses, from, to, idempotencyKey, page, pageSize } }),
    retry: false,
  });

  // ---- live updates ----------------------------------------------------
  const [live, setLive] = useState(true);
  const [pendingLive, setPendingLive] = useState(0);
  const [connected, setConnected] = useState(false);
  const liveRef = useRef(live);
  liveRef.current = live;
  const firstPageRef = useRef(page === 1);
  firstPageRef.current = page === 1;
  const refetchRef = useRef(log.refetch);
  refetchRef.current = log.refetch;

  useEffect(() => {
    const channel = supabase
      .channel("admin-dispatch-log-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_dispatch_log" },
        () => {
          if (liveRef.current && firstPageRef.current) {
            void refetchRef.current();
          } else {
            setPendingLive((n) => n + 1);
          }
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => {
      setConnected(false);
      void supabase.removeChannel(channel);
    };
  }, []);

  const resumeLive = () => {
    setLive(true);
    setPendingLive(0);
    void log.refetch();
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailId, setDetailId] = useState<string | null>(null);

  const toggleRow = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));


  const resendFn = useServerFn(resendDispatchJob);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const resend = useMutation({
    mutationFn: (id: string) => resendFn({ data: { id } }),
    onMutate: (id: string) => setResendingId(id),
    onSettled: () => setResendingId(null),
    onSuccess: (result) => {
      toast.success("Resend queued", {
        description: `New idempotency key: ${result.idempotencyKey}`,
      });
      void log.refetch();
    },
    onError: (error) =>
      toast.error("Resend failed", { description: (error as Error).message }),
  });

  const rows = log.data?.rows ?? [];
  const counts = log.data?.counts;
  const filtered = Boolean(template || statuses.length || from || to || idempotencyKey);

  // Any filter change re-opens the audit trail from the newest page.
  const currentPage = log.data?.page ?? page;
  const totalPages = log.data?.totalPages ?? 1;
  const totalRows = log.data?.totalRows ?? 0;
  const firstRow = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = rows.length === 0 ? 0 : firstRow + rows.length - 1;

  const applyFilter = (fn: () => void) => {
    fn();
    setPage(1);
    setExpanded({});
  };

  const clearAll = () => {
    applyFilter(() => {
      setTemplate("");
      setStatuses([]);
      setFrom("");
      setTo("");
      setKeyInput("");
      setIdempotencyKey("");
    });
  };


  const [exportingAll, setExportingAll] = useState(false);
  const fetchExport = useServerFn(exportDispatchAuditLog);

  /** Builds a filter-aware filename and triggers the browser download. */
  const downloadCsv = (data: DispatchLogRow[], scope: "page" | "filtered") => {
    if (!data.length) return;
    const blob = new Blob([csv(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const parts = [
      "dispatch-audit",
      scope,
      template || null,
      statuses.length ? statuses.join("+") : null,
      from || null,
      to || null,
      idempotencyKey ? "key" : null,
      new Date().toISOString().slice(0, 10),
    ].filter(Boolean) as string[];
    a.download = `${parts.join("-").replace(/[^a-zA-Z0-9._-]+/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /** Pulls every row matching the active filters (all pages) and exports it. */
  const exportFiltered = async () => {
    setExportingAll(true);
    try {
      const result = await fetchExport({
        data: { template, statuses, from, to, idempotencyKey },
      });
      if (!result.rows.length) {
        toast.info("Nothing to export", { description: "No rows match the current filters." });
        return;
      }
      downloadCsv(result.rows, "filtered");
      toast.success(`Exported ${result.rows.length} row${result.rows.length === 1 ? "" : "s"}`, {
        description: result.truncated
          ? "Capped at the first 5,000 matching rows — narrow the date range for more."
          : "All rows matching the current filters, with every visible column.",
      });
    } catch (error) {
      toast.error("Export failed", { description: (error as Error).message });
    } finally {
      setExportingAll(false);
    }
  };


  const chip = (active: boolean) =>
    `rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
      active
        ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
        : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
    }`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        to="/admin/operations"
        search={{ tab: "notifications" }}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--gold)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to operations
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ScrollText className="h-5 w-5 text-[var(--gold)]" /> Email dispatch audit log
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every background notification and email job, with the template used, the idempotency
            key, attempt count and outcome — proof of what was dispatched and what was skipped.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(rows, "page")}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" /> This page{rows.length ? ` (${rows.length})` : ""}
          </button>
          <button
            type="button"
            onClick={exportFiltered}
            disabled={totalRows === 0 || exportingAll}
            title="Download every row matching the current filters, across all pages"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/50 px-3 py-2 text-xs text-[var(--gold)] transition hover:bg-[var(--gold)]/10 disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
          >
            {exportingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}{" "}
            Export filtered CSV{totalRows ? ` (${totalRows})` : ""}
          </button>

          <button
            type="button"
            onClick={() => log.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
          >
            {log.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>

          <button
            type="button"
            onClick={() => (live ? setLive(false) : resumeLive())}
            aria-pressed={live}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
              live
                ? "border-[var(--gold)]/60 text-[var(--gold)]"
                : "border-border text-muted-foreground hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
            }`}
          >
            {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {live ? "Pause live updates" : "Resume live updates"}
          </button>

          <span
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"
            aria-live="polite"
          >
            <Radio
              className={`h-3.5 w-3.5 ${
                live && connected ? "animate-pulse text-emerald-400" : "text-muted-foreground"
              }`}
            />
            {live ? (connected ? "Live" : "Connecting…") : "Paused"}
          </span>

          {pendingLive > 0 ? (
            <button
              type="button"
              onClick={() => {
                setPage(1);
                resumeLive();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/60 bg-[var(--gold)]/10 px-3 py-2 text-xs text-[var(--gold)]"
            >
              {pendingLive} new {pendingLive === 1 ? "entry" : "entries"} — show latest
            </button>
          ) : null}
        </div>
      </header>

      <section className="mt-6 space-y-4 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Outcome</span>
          <button
            type="button"
            onClick={() => applyFilter(() => setStatuses([]))}
            aria-pressed={statuses.length === 0}
            className={chip(statuses.length === 0)}
          >
            All outcomes
          </button>
          {DISPATCH_STATUSES.map((s) => {
            const active = statuses.includes(s);
            const count = counts?.[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => applyFilter(() => toggleStatus(s))}
                aria-pressed={active}
                className={chip(active)}
              >
                {active ? <Check className="mr-1 inline h-3 w-3" /> : null}
                {STATUS_LABEL[s]}
                {typeof count === "number" ? (
                  <span className="ml-1 text-muted-foreground">({count})</span>
                ) : null}
              </button>
            );
          })}
          {statuses.length > 1 ? (
            <span className="text-[11px] text-muted-foreground">
              {statuses.length} outcomes selected
            </span>
          ) : null}
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Template
          </span>
          <button type="button" onClick={() => applyFilter(() => setTemplate(""))} className={chip(template === "")}>
            All templates
          </button>
          {(log.data?.templates ?? []).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => applyFilter(() => setTemplate(t))}
              aria-pressed={template === t}
              className={`${chip(template === t)} font-mono`}
            >
              {t}
            </button>
          ))}
          {log.data && log.data.templates.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">
              No templated dispatches recorded yet.
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => applyFilter(() => setFrom(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-xs normal-case tracking-normal text-foreground outline-none focus:border-[var(--gold)]"
            />
          </label>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => applyFilter(() => setTo(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-xs normal-case tracking-normal text-foreground outline-none focus:border-[var(--gold)]"
            />
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilter(() => setIdempotencyKey(keyInput.trim()));
            }}
            className="text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            <label htmlFor="idem">Idempotency key</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-border px-3 py-2 focus-within:border-[var(--gold)]">
              <KeyRound className="h-3.5 w-3.5" />
              <input
                id="idem"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="raise-advance-…"
                className="w-full bg-transparent font-mono text-xs normal-case tracking-normal text-foreground outline-none"
              />
            </div>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-[11px] text-muted-foreground">
            {log.isPending
              ? "Loading dispatch history…"
              : counts
                ? `${counts.total} job${counts.total === 1 ? "" : "s"} — ${counts.sent} sent, ${counts.skipped} skipped, ${counts.failed} failed${
                    totalRows > 0
                      ? ` · showing ${firstRow}–${lastRow} (page ${currentPage} of ${totalPages})`
                      : ""
                  }`
                : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                  setExpanded({});
                }}
                className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs normal-case tracking-normal text-foreground outline-none focus:border-[var(--gold)]"
              >
                {DISPATCH_PAGE_SIZES.map((size) => (
                  <option key={size} value={size} className="bg-background">
                    {size}
                  </option>
                ))}
              </select>
            </label>
            {filtered ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            ) : null}
          </div>
        </div>

      </section>

      <section className="mt-4 overflow-x-auto rounded-xl border border-border">
        {log.error ? (
          <p className="p-4 text-xs text-[var(--danger)]">{(log.error as Error).message}</p>
        ) : log.isPending ? (
          <p className="p-4 text-xs text-muted-foreground">Loading dispatch history…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            No dispatch jobs match these filters.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="w-8 px-3 py-2 font-medium" aria-label="Expand" />
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Outcome</th>
                <th className="px-3 py-2 font-medium">Notice</th>
                <th className="px-3 py-2 font-medium">Template</th>
                <th className="px-3 py-2 font-medium">Idempotency key</th>
                <th className="px-3 py-2 font-medium">Attempts</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.id}>
                <tr className="border-b border-border/60 align-top last:border-0">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleRow(r.id)}
                      aria-expanded={Boolean(expanded[r.id])}
                      aria-label={
                        expanded[r.id] ? "Hide attempt details" : "Show attempt details"
                      }
                      className="rounded-md border border-border p-1 text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
                    >
                      {expanded[r.id] ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {fmt(r.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusTone(r.status)}`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-foreground">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground">{r.category}</p>
                    {r.detail ? (
                      <p className="mt-1 max-w-md text-[11px] text-muted-foreground">
                        {parseSkipReason(r.detail)?.code ?? r.detail}
                      </p>
                    ) : null}
                    {(() => {
                      const parsed = parseSkipReason(r.detail);
                      if (!parsed?.event && !parsed?.source) return null;
                      return (
                        <p className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                          {parsed.event ? (
                            <span className="rounded border border-border px-1.5 py-0.5 font-mono text-muted-foreground">
                              event: {parsed.event}
                            </span>
                          ) : null}
                          {parsed.source ? (
                            <span className="rounded border border-[var(--gold)]/40 px-1.5 py-0.5 font-mono text-[var(--gold)]">
                              pref: {parsed.source}
                            </span>
                          ) : null}
                        </p>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-[var(--gold)]">
                    {r.template ?? "—"}
                  </td>
                  <td className="max-w-[18rem] break-all px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {r.idempotencyKey ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {r.attempts}
                    {r.retryable ? (
                      <span className="ml-1 text-[10px] uppercase tracking-wider text-amber-400">
                        retryable
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <button
                      type="button"
                      onClick={() => resend.mutate(r.id)}
                      disabled={!r.resendable || resend.isPending}
                      title={
                        r.resendable
                          ? "Queue a new dispatch with a resend-scoped idempotency key"
                          : "No stored notice snapshot for this entry — it cannot be replayed"
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gold)]/50 px-2.5 py-1.5 text-[11px] text-[var(--gold)] transition hover:bg-[var(--gold)]/10 disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
                    >
                      {resendingId === r.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Resend
                    </button>

                    <button
                      type="button"
                      onClick={() => setDetailId(r.id)}
                      title="Open the full payload, suppression and provider response detail"
                      className="ml-1.5 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
                    >
                      <Search className="h-3 w-3" />
                      Details
                    </button>
                    {r.resentFrom ? (
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        resend{r.resentAt ? ` · ${fmt(r.resentAt)}` : ""}
                      </p>
                    ) : null}
                  </td>
                </tr>
                {expanded[r.id] ? (
                  <tr className="border-b border-border/60 last:border-0">
                    <td colSpan={8} className="px-3 pb-3">
                      <AttemptTrail row={r} />
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {totalRows > 0 ? (
        <nav
          aria-label="Dispatch log pages"
          className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
        >
          <p className="text-[11px] text-muted-foreground">
            Showing {firstRow}–{lastRow} of {totalRows} job{totalRows === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setExpanded({});
              }}
              disabled={currentPage <= 1 || log.isFetching}
              className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
              aria-label="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(Math.max(currentPage - 1, 1));
                setExpanded({});
              }}
              disabled={currentPage <= 1 || log.isFetching}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
            >
              <ChevronLeft className="h-3 w-3" /> Previous
            </button>
            <span aria-live="polite" className="px-1 text-[11px] text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                setPage(Math.min(currentPage + 1, totalPages));
                setExpanded({});
              }}
              disabled={currentPage >= totalPages || log.isFetching}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(totalPages);
                setExpanded({});
              }}
              disabled={currentPage >= totalPages || log.isFetching}
              className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
              aria-label="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>
      ) : null}

      <DispatchLogDetailSheet id={detailId} onClose={() => setDetailId(null)} />

    </main>

  );
}
