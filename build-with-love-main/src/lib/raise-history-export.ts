/**
 * Pure builders for exporting the investor-facing capital raising status
 * history as a CSV file or a printable (PDF-ready) statement.
 *
 * Every stage also carries a before/after diff of the fields that changed.
 *
 * Both exports carry every recorded stage with its full timestamp (ISO plus a
 * human-readable UTC stamp), the actor label that recorded it, amounts and any
 * desk note, so the download is an auditable copy of the on-screen timeline.
 */

import type { RaiseHistoryEvent } from "./raise-history";
import { formatChange, formatChangeSummary } from "./raise-history-diff";

export interface RaiseHistoryExportInput {
  events: RaiseHistoryEvent[];
  roundName: string;
  currency: string;
  investorName: string;
  generatedAt?: string;
  /** Human label for the selected export date range, when one is applied. */
  rangeLabel?: string | null;
  /** Compact range slug appended to export file names. */
  rangeSlug?: string | null;
  /** Human label for the active timeline type filters, when any are applied. */
  filterLabel?: string | null;
  /** Compact filter slug appended to export file names. */
  filterSlug?: string | null;
  /** Human label for the active changed-field filter, when any is applied. */
  fieldLabel?: string | null;
  /** Compact changed-field slug appended to export file names. */
  fieldSlug?: string | null;
  /** When true, export only the changed fields of each transition. */
  diffOnly?: boolean;
  /**
   * When false, the full-history export drops the before/after diff columns
   * and the inline diff visuals from the printable statement. Defaults to true.
   */
  includeDiff?: boolean;


}

export interface RaiseHistoryExportDocument {
  fileName: string;
  title: string;
  html: string;
}

const escape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "round";

/** CSV-safe cell: quotes when the value contains a separator, quote or newline. */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

/** Human-readable UTC timestamp, or a stable placeholder when missing. */
export function formatHistoryStamp(at: string | null | undefined) {
  if (!at) return "Not recorded";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "Not recorded";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

const HEADERS = [
  "Stage",
  "Timestamp (ISO 8601)",
  "Timestamp (UTC)",
  "Actor",
  "Status tone",
  "Amount",
  "Currency",
  "Detail",
  "Desk note",
  "Changed fields",
  "Before",
  "After",
  "Change summary",
  "Reference",
] as const;

/** Ordered column names of the export, matching HEADERS. */
export const RAISE_HISTORY_EXPORT_COLUMNS: readonly string[] = HEADERS;

/** Diff columns that the include/exclude toggle controls. */
export const RAISE_HISTORY_DIFF_COLUMN_NAMES: readonly string[] = [
  "Changed fields",
  "Before",
  "After",
  "Change summary",
];

/** Full-history columns with the before/after diff columns removed. */
export const RAISE_HISTORY_EXPORT_COLUMNS_NO_DIFF: readonly string[] = HEADERS.filter(
  (header) => !RAISE_HISTORY_DIFF_COLUMN_NAMES.includes(header),
);

const DIFF_HEADERS = [
  "Stage",
  "Timestamp (ISO 8601)",
  "Timestamp (UTC)",
  "Actor",
  "Field",
  "Before",
  "After",
] as const;

/** Ordered column names of the diff-only export (one row per changed field). */
export const RAISE_HISTORY_DIFF_COLUMNS: readonly string[] = DIFF_HEADERS;

/** True when the before/after diff columns and visuals should be written. */
export const diffColumnsIncluded = (input: RaiseHistoryExportInput) =>
  input.includeDiff !== false;

/** One export row: the exact cell values written to CSV, in column order. */
export function historyRowCells(
  event: RaiseHistoryEvent,
  currency: string,
  includeDiff = true,
): string[] {
  const diffCells = includeDiff
    ? [
        (event.changes ?? []).map((c) => c.field).join("; "),
        (event.changes ?? []).map((c) => c.from ?? "—").join("; "),
        (event.changes ?? []).map((c) => c.to ?? "—").join("; "),
        formatChangeSummary(event.changes),
      ]
    : [];
  return [
    event.label,
    event.at ?? "",
    formatHistoryStamp(event.at),
    event.actor,
    event.tone,
    event.amount === null || event.amount === undefined ? "" : String(event.amount),
    event.amount === null || event.amount === undefined ? "" : currency,
    event.detail,
    event.note ?? "",
    ...diffCells,
    event.reference ?? "",
  ];
}

/**
 * Diff-only rows: one row per changed field, so transitions that recorded no
 * change are dropped entirely from the export.
 */
export function historyDiffRowCells(event: RaiseHistoryEvent): string[][] {
  return (event.changes ?? []).map((change) => [
    event.label,
    event.at ?? "",
    formatHistoryStamp(event.at),
    event.actor,
    change.field,
    change.from ?? "—",
    change.to ?? "—",
  ]);
}

/** Column list for the requested export mode. */
export function exportColumns(input: RaiseHistoryExportInput): readonly string[] {
  if (input.diffOnly) return RAISE_HISTORY_DIFF_COLUMNS;
  return diffColumnsIncluded(input)
    ? RAISE_HISTORY_EXPORT_COLUMNS
    : RAISE_HISTORY_EXPORT_COLUMNS_NO_DIFF;
}

/** Data rows for the requested export mode, oldest event first. */
export function exportRows(input: RaiseHistoryExportInput): string[][] {
  if (input.diffOnly) return input.events.flatMap((event) => historyDiffRowCells(event));
  return input.events.map((event) =>
    historyRowCells(event, input.currency, diffColumnsIncluded(input)),
  );
}

const modeLabel = (diffOnly?: boolean) =>
  diffOnly ? "Changed fields only" : "Full history";

const diffColumnsLabel = (input: RaiseHistoryExportInput) =>
  input.diffOnly ? "Included (one row per change)" : diffColumnsIncluded(input) ? "Included" : "Excluded";


export interface RaiseHistoryExportPreview {
  columns: readonly string[];
  rows: string[][];
  /** Changed field labels per row, aligned with `rows` (compact summary column). */
  changedFields: string[][];
  meta: { label: string; value: string }[];
  rowCount: number;
  csvFileName: string;
  pdfFileName: string;
}

/**
 * Changed field labels for each export row, in the same order as `exportRows`.
 * In diff-only mode a row is a single field change, so each entry has one label.
 */
export function exportRowChangedFields(input: RaiseHistoryExportInput): string[][] {
  if (input.diffOnly) {
    return input.events.flatMap((event) =>
      (event.changes ?? []).map((change) => [change.field]),
    );
  }
  return input.events.map((event) => (event.changes ?? []).map((change) => change.field));
}

/**
 * Exactly what a download will contain: the header row, every data row in
 * export order, and the metadata block written above the table.
 */
export function buildRaiseHistoryExportPreview(
  input: RaiseHistoryExportInput,
): RaiseHistoryExportPreview {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const rows = exportRows(input);
  return {
    columns: exportColumns(input),
    rows,
    changedFields: exportRowChangedFields(input),
    meta: [
      { label: "Round", value: input.roundName },
      { label: "Investor", value: input.investorName },
      { label: "Date range", value: input.rangeLabel ?? "All dates" },
      { label: "Event types", value: input.filterLabel ?? "All event types" },
      { label: "Changed fields", value: input.fieldLabel ?? "All changed fields" },
      { label: "Export mode", value: modeLabel(input.diffOnly) },
      { label: "Diff columns", value: diffColumnsLabel(input) },
      { label: "Currency", value: input.currency },
    ],

    rowCount: rows.length,
    csvFileName: raiseHistoryCsvFileName({
      roundName: input.roundName,
      generatedAt,
      rangeSlug: input.rangeSlug,
      filterSlug: input.filterSlug,
      fieldSlug: input.fieldSlug,
      diffOnly: input.diffOnly,
      includeDiff: diffColumnsIncluded(input),
    }),

    pdfFileName: buildRaiseHistoryReportHtml({ ...input, generatedAt }).fileName.replace(
      /\.html$/,
      ".pdf",
    ),
  };
}

/** Full status history as CSV, oldest event first. */
export function buildRaiseHistoryCsv(input: RaiseHistoryExportInput): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const rows = exportRows(input);
  const lines: string[] = [];

  lines.push(["Round", input.roundName].map(csvCell).join(","));
  lines.push(["Investor", input.investorName].map(csvCell).join(","));
  lines.push(["Generated", generatedAt].map(csvCell).join(","));
  lines.push(["Date range", input.rangeLabel ?? "All dates"].map(csvCell).join(","));
  lines.push(["Event types", input.filterLabel ?? "All event types"].map(csvCell).join(","));
  lines.push(["Changed fields", input.fieldLabel ?? "All changed fields"].map(csvCell).join(","));
  lines.push(["Export mode", modeLabel(input.diffOnly)].map(csvCell).join(","));
  lines.push(["Diff columns", diffColumnsLabel(input)].map(csvCell).join(","));
  lines.push(["Events", input.events.length].map(csvCell).join(","));
  if (input.diffOnly) lines.push(["Changes", rows.length].map(csvCell).join(","));
  lines.push("");
  lines.push(exportColumns(input).map(csvCell).join(","));

  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }

  return lines.join("\r\n");
}

/** CSV file name for a round's status history. */
export function raiseHistoryCsvFileName(input: {
  roundName: string;
  generatedAt?: string;
  rangeSlug?: string | null;
  filterSlug?: string | null;
  fieldSlug?: string | null;
  diffOnly?: boolean;
  includeDiff?: boolean;
}) {
  const stamp = (input.generatedAt ?? new Date().toISOString()).slice(0, 10);
  const range = input.rangeSlug ? `-${slug(input.rangeSlug)}` : "";
  const filters = input.filterSlug ? `-${slug(input.filterSlug)}` : "";
  const fields = input.fieldSlug ? `-${slug(input.fieldSlug)}` : "";
  const mode = input.diffOnly ? "-diff-only" : input.includeDiff === false ? "-no-diff" : "";
  return `gf3x-${slug(input.roundName)}-status-history${range}${filters}${fields}${mode}-${stamp}.csv`;
}



/** Printable statement of the full status history, ready to save as PDF. */
export function buildRaiseHistoryReportHtml(
  input: RaiseHistoryExportInput,
): RaiseHistoryExportDocument {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const title = "Capital Raising — Status History";
  const showDiff = diffColumnsIncluded(input);


  const diffEvents = input.diffOnly
    ? input.events.filter((event) => (event.changes ?? []).length > 0)
    : [];

  const rows = input.diffOnly
    ? diffEvents
        .flatMap((event) =>
          (event.changes ?? []).map(
            (c) => `<tr>
          <td>
            <strong>${escape(event.label)}</strong>
            <div class="ref">${escape(event.actor)}</div>
          </td>
          <td>
            ${escape(formatHistoryStamp(event.at))}
            ${event.at ? `<div class="ref">${escape(event.at)}</div>` : ""}
          </td>
          <td>${escape(c.field)}</td>
          <td>
            <span class="was">${escape(c.from ?? "—")}</span>
            <span class="arrow">&rarr;</span>
            <span class="now">${escape(c.to ?? "—")}</span>
          </td>
        </tr>`,
          ),
        )
        .join("\n        ")
    : input.events
        .map(
          (event) => `<tr>
          <td>
            <strong>${escape(event.label)}</strong>
            <div class="detail">${escape(event.detail)}</div>
            ${
              showDiff && event.changes && event.changes.length
                ? `<ul class="diff">${event.changes
                    .map(
                      (c) =>
                        `<li><span class="field">${escape(c.field)}</span>
                           <span class="was">${escape(c.from ?? "—")}</span>
                           <span class="arrow">&rarr;</span>
                           <span class="now">${escape(c.to ?? "—")}</span></li>`,
                    )
                    .join("")}</ul>`
                : ""
            }

            ${event.note ? `<div class="note">Desk note: ${escape(event.note)}</div>` : ""}
            ${event.reference ? `<div class="ref">Reference ${escape(event.reference)}</div>` : ""}
          </td>
          <td>
            ${escape(formatHistoryStamp(event.at))}
            ${event.at ? `<div class="ref">${escape(event.at)}</div>` : ""}
          </td>
          <td>${escape(event.actor)}</td>
          <td class="num">${escape(formatMoney(event.amount ?? null, input.currency))}</td>
        </tr>`,
        )
        .join("\n        ");


  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(title)} — ${escape(input.roundName)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 48px 32px; background: #0b0b0c; color: #f5f4f1;
         font-family: "Helvetica Neue", Arial, sans-serif; font-size: 13px; line-height: 1.6; }
  .sheet { max-width: 900px; margin: 0 auto; background: #131315; border: 1px solid #2a2a2d;
           border-radius: 16px; padding: 40px; }
  .brand { display: flex; align-items: baseline; justify-content: space-between;
           border-bottom: 1px solid #2a2a2d; padding-bottom: 18px; gap: 16px; flex-wrap: wrap; }
  .brand strong { font-size: 18px; letter-spacing: 0.14em; text-transform: uppercase; color: #d4af62; }
  .brand span { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8a90; }
  h1 { font-size: 22px; margin: 28px 0 4px; }
  .lede { color: #b6b5b1; margin: 0 0 26px; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 26px; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #232326; vertical-align: top; }
  th { font-weight: 400; color: #8a8a90; font-size: 11px;
       text-transform: uppercase; letter-spacing: 0.12em; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .detail { color: #b6b5b1; margin-top: 3px; }
  .note { border-left: 2px solid #d4af62; padding-left: 10px; margin-top: 6px; color: #d8d7d3; }
  .diff { list-style: none; margin: 8px 0 0; padding: 0; }
  .diff li { display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px; margin-top: 3px; }
  .diff .field { color: #8a8a90; text-transform: uppercase; letter-spacing: 0.08em; }
  .diff .was { color: #b6b5b1; text-decoration: line-through; }
  .diff .arrow { color: #d4af62; }
  .diff .now { color: #f5f4f1; font-weight: 600; }
  .ref { color: #7e7e84; font-size: 11px; margin-top: 4px; }
  footer { border-top: 1px solid #2a2a2d; padding-top: 18px; color: #7e7e84; font-size: 11px; }
  @media print {
    body { background: #ffffff; color: #111111; padding: 0; }
    .sheet { border: none; background: #ffffff; }
    .brand strong { color: #8a6d24; }
    th, td, .brand, footer { border-color: #dddddd; }
    .lede, th, footer, .detail, .ref { color: #555555; }
    .note { color: #222222; border-color: #8a6d24; }
    .diff .field, .diff .was { color: #555555; }
    .diff .arrow { color: #8a6d24; }
    .diff .now { color: #111111; }
  }
</style>
</head>
<body>
  <main class="sheet">
    <div class="brand">
      <strong>Gigafactory 3X</strong>
      <span>Capital Markets Desk</span>
    </div>
    <h1>${escape(title)}</h1>
    <p class="lede">
      ${escape(input.roundName)} — prepared for ${escape(input.investorName)}.
      ${
        input.diffOnly
          ? `${diffEvents.length} ${diffEvents.length === 1 ? "transition" : "transitions"} with recorded changes, oldest first.`
          : `${input.events.length} recorded ${input.events.length === 1 ? "stage" : "stages"}, oldest first.`
      }
      Date range: ${escape(input.rangeLabel ?? "All dates")}.
      Event types: ${escape(input.filterLabel ?? "All event types")}.
      Changed fields: ${escape(input.fieldLabel ?? "All changed fields")}.
      Export mode: ${escape(modeLabel(input.diffOnly))}.
      Diff columns: ${escape(diffColumnsLabel(input))}.

      All timestamps are shown in UTC.
    </p>
    <table>
      <thead>
        <tr>
          <th>Stage</th>
          <th>Timestamp</th>
          <th>${input.diffOnly ? "Field" : "Recorded by"}</th>
          ${input.diffOnly ? `<th>Before &rarr; After</th>` : `<th class="num">Amount</th>`}
        </tr>
      </thead>
      <tbody>
        ${
          rows ||
          `<tr><td colspan="4">${
            input.diffOnly
              ? "No field changes were recorded for the selected transitions."
              : "No status events recorded yet."
          }</td></tr>`
        }
      </tbody>
    </table>
    <footer>
      Generated ${escape(formatHistoryStamp(generatedAt))} from your capital raising portal. This
      statement restates decisions already recorded in your account; it is a history record, not an
      offer or a solicitation to invest.
    </footer>
  </main>
</body>
</html>`;

  return {
    fileName: `gf3x-${slug(input.roundName)}-status-history${
      input.rangeSlug ? `-${slug(input.rangeSlug)}` : ""
    }${input.filterSlug ? `-${slug(input.filterSlug)}` : ""}${
      input.fieldSlug ? `-${slug(input.fieldSlug)}` : ""
    }${input.diffOnly ? "-diff-only" : showDiff ? "" : "-no-diff"}-${generatedAt.slice(0, 10)}.html`,

    title,
    html,
  };
}

/** Triggers a browser download for text content; no-ops on the server. */
export function downloadTextFile(fileName: string, content: string, mimeType: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Opens the printable statement so the browser's print dialog can save it as
 * PDF. Falls back to a file download when popups are blocked.
 */
export function printRaiseHistoryReport(doc: RaiseHistoryExportDocument) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "noopener,noreferrer,width=980,height=1200");
  if (!win) {
    downloadTextFile(doc.fileName, doc.html, "text/html");
    return;
  }
  win.document.open();
  win.document.write(doc.html);
  win.document.close();
  win.focus();
  win.setTimeout(() => win.print(), 350);
}
