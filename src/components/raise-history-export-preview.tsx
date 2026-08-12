/**
 * Pre-download preview of a status history export.
 *
 * Shows the metadata block, the exact column list and every row that will be
 * written, so an investor can confirm the CSV or PDF contents before saving.
 */

import { FileText, Table2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildRaiseHistoryExportPreview,
  type RaiseHistoryExportInput,
} from "@/lib/raise-history-export";

export function RaiseHistoryExportPreviewDialog({
  open,
  onOpenChange,
  input,
  onConfirmCsv,
  onConfirmPdf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: RaiseHistoryExportInput;
  onConfirmCsv: () => void;
  onConfirmPdf: () => void;
}) {
  const preview = buildRaiseHistoryExportPreview(input);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">Export preview</DialogTitle>
          <DialogDescription>
            {preview.rowCount} {preview.rowCount === 1 ? "row" : "rows"} and{" "}
            {preview.columns.length} columns will be exported, in this order. The leading “Changed”
            column summarises which fields changed per row and is not written to the file.
          </DialogDescription>

        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-border/70 p-3 text-xs sm:grid-cols-3">
          {preview.meta.map((item) => (
            <div key={item.label}>
              <dt className="uppercase tracking-widest text-muted-foreground">{item.label}</dt>
              <dd className="mt-0.5 text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="max-h-[45vh] overflow-auto rounded-lg border border-border/70">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">
              Rows and columns included in the status history export
            </caption>
            <thead className="sticky top-0 bg-muted/60 backdrop-blur">
              <tr>
                <th scope="col" className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                  #
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider text-muted-foreground"
                  title="Fields that changed in this transition (summary only — not a CSV column)"
                >
                  Changed
                </th>
                {preview.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={preview.columns.length + 2}
                    className="px-2 py-6 text-center text-muted-foreground"
                  >
                    No events match the current filters, so the export would be empty.
                  </td>
                </tr>
              )}
              {preview.rows.map((row, i) => {
                const changed = preview.changedFields[i] ?? [];
                return (
                <tr key={i} className="border-t border-border/60 align-top">
                  <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-2 py-2">
                    {changed.length === 0 ? (
                      <span className="text-muted-foreground/60">No change</span>
                    ) : (
                      <span
                        className="flex max-w-[200px] flex-wrap gap-1"
                        title={`${changed.length} changed: ${changed.join(", ")}`}
                      >
                        {changed.slice(0, 3).map((field) => (
                          <span
                            key={field}
                            className="rounded border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-1.5 py-0.5 text-[10px] text-[var(--gold)]"
                          >
                            {field}
                          </span>
                        ))}
                        {changed.length > 3 && (
                          <span className="px-1 py-0.5 text-[10px] text-muted-foreground">
                            +{changed.length - 3}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  {row.map((cell, j) => (
                    <td key={j} className="max-w-[220px] px-2 py-2">
                      {cell === "" ? (
                        <span className="text-muted-foreground/60">—</span>
                      ) : (
                        <span className="block truncate" title={cell}>
                          {cell}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                );
              })}
            </tbody>

          </table>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Files: <span className="text-foreground">{preview.csvFileName}</span> ·{" "}
          <span className="text-foreground">{preview.pdfFileName}</span>
        </p>

        <DialogFooter className="gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={preview.rowCount === 0}
            onClick={onConfirmCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-[var(--gold)]/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Table2 className="h-3.5 w-3.5" aria-hidden />
            Download CSV
          </button>
          <button
            type="button"
            disabled={preview.rowCount === 0}
            onClick={onConfirmPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1.5 text-xs text-[var(--gold)] transition-colors hover:border-[var(--gold)]/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Download PDF
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
