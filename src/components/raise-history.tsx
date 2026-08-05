import { useMemo, useState } from "react";
import { History, ChevronDown, Download, FileText, Table2 } from "lucide-react";
import type { RaiseHistoryEvent, RaiseHistoryTone } from "@/lib/raise-history";
import {
  buildRaiseConfirmation,
  downloadRaiseConfirmation,
  raiseConfirmationTitle,
} from "@/lib/raise-confirmation";
import {
  buildRaiseHistoryCsv,
  buildRaiseHistoryReportHtml,
  downloadTextFile,
  printRaiseHistoryReport,
  raiseHistoryCsvFileName,
} from "@/lib/raise-history-export";
import {
  RAISE_HISTORY_CATEGORIES,
  filterRaiseHistory,
  raiseHistoryCounts,
  type RaiseHistoryCategory,
} from "@/lib/raise-history-filters";



const TONE: Record<RaiseHistoryTone, string> = {
  neutral: "hsl(var(--border))",
  progress: "var(--gold)",
  success: "var(--success)",
  warning: "var(--warning, var(--gold))",
};

function stamp(at: string | null) {
  if (!at) return "Date not recorded";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "Date not recorded";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RaiseHistoryTimeline({
  events,
  roundName,
  currency = "USD",
  investorName = "Investor",
}: {
  events: RaiseHistoryEvent[];
  roundName?: string;
  currency?: string;
  investorName?: string;
}) {
  const [open, setOpen] = useState(false);
  if (events.length === 0) return null;

  const exportInput = {
    events,
    roundName: roundName ?? "Capital raise",
    currency,
    investorName,
  };

  return (
    <div className="rounded-xl border border-border/70 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 font-display text-lg">
          <History className="h-4 w-4 text-[var(--gold)]" aria-hidden />
          Status history
          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              raiseHistoryCsvFileName({ roundName: exportInput.roundName }),
              buildRaiseHistoryCsv(exportInput),
              "text/csv",
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
        >
          <Table2 className="h-3.5 w-3.5" aria-hidden />
          Download history CSV
        </button>
        <button
          type="button"
          onClick={() => printRaiseHistoryReport(buildRaiseHistoryReportHtml(exportInput))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Download history PDF
        </button>
      </div>


      {open && (
        <ol
          className="mt-4 space-y-0"
          aria-label={roundName ? `Status history for ${roundName}` : "Status history"}
        >
          {events.map((event, i) => {
            const last = i === events.length - 1;
            const color = TONE[event.tone];
            return (
              <li key={event.key} className="grid grid-cols-[auto_1fr] gap-x-3">
                <div className="flex flex-col items-center">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: color }}
                    aria-hidden
                  />
                  {!last && (
                    <span
                      className="w-px flex-1"
                      style={{ background: "hsl(var(--border))" }}
                      aria-hidden
                    />
                  )}
                </div>
                <div className={last ? "pb-0" : "pb-5"}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{event.label}</span>
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {event.actor}
                    </span>
                  </div>
                  <time
                    className="mt-0.5 block text-xs text-muted-foreground"
                    dateTime={event.at ?? undefined}
                  >
                    {stamp(event.at)}
                  </time>
                  <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                  {event.downloadable && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadRaiseConfirmation(
                          buildRaiseConfirmation({
                            kind: event.key,
                            reference: event.reference ?? event.key,
                            roundName: roundName ?? "Capital raise",
                            currency,
                            investorName,
                            amount: event.amount ?? null,
                            decidedAt: event.at,
                            actor: event.actor,
                            headline: event.label,
                            detail: event.detail,
                            note: event.note ?? null,
                          }),
                        )
                      }
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Download {raiseConfirmationTitle(event.key).toLowerCase()}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
