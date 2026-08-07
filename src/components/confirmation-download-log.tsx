import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronLeft, ChevronRight, HistoryIcon } from "lucide-react";
import { listConfirmationDownloads } from "@/lib/confirmation-downloads.functions";
import {
  downloadSourceLabel,
  downloadSummary,
  formatDownloadStamp,
  groupDownloadsByRound,
  totalDocumentsDownloaded,
} from "@/lib/confirmation-downloads";

const PAGE_SIZE = 8;

/**
 * Investor-facing audit trail: which confirmation document was downloaded,
 * from which round, when, and through which route (portal, bulk ZIP, or the
 * signed link in a decision email).
 */
export function ConfirmationDownloadLog({ roundId = null }: { roundId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const fetchLog = useServerFn(listConfirmationDownloads);

  const { data, isLoading } = useQuery({
    queryKey: ["confirmation-downloads", roundId ?? "all", page],
    queryFn: () => fetchLog({ data: { page, pageSize: PAGE_SIZE, roundId } }),
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const groups = useMemo(() => groupDownloadsByRound(rows), [rows]);
  const documents = useMemo(() => totalDocumentsDownloaded(rows), [rows]);

  return (
    <section className="mt-4 rounded-xl border border-border/70 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 font-display text-lg">
          <HistoryIcon className="h-4 w-4 text-[var(--gold)]" aria-hidden />
          Download audit trail
          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
            {total} {total === 1 ? "download" : "downloads"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="mt-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading download history…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No confirmation documents downloaded yet. Each download is recorded here with its
              round and timestamp.
            </p>
          )}

          {!isLoading && rows.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                Showing {rows.length} of {total} recorded downloads ({documents}{" "}
                {documents === 1 ? "document" : "documents"} on this page).
              </p>
              <div className="mt-3 space-y-4">
                {groups.map((group) => (
                  <div key={group.key}>
                    <h3 className="text-[11px] uppercase tracking-widest text-[var(--gold)]">
                      {group.roundName}
                    </h3>
                    <ul className="mt-1.5 divide-y divide-border/60">
                      {group.rows.map((row) => (
                        <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
                          <span className="text-sm font-medium">{downloadSummary(row)}</span>
                          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {downloadSourceLabel(row.source)}
                          </span>
                          <time className="ml-auto text-xs text-muted-foreground" dateTime={row.created_at}>
                            {formatDownloadStamp(row.created_at)}
                          </time>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {pages > 1 && (
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 transition-colors hover:border-[var(--gold)]/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                    Previous
                  </button>
                  <span>
                    Page {page} of {pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 transition-colors hover:border-[var(--gold)]/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
