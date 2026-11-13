/**
 * Shared shapes and labels for the confirmation-document download audit trail.
 *
 * Kept free of server imports so both the recording call sites and the display
 * component can use the same vocabulary.
 */

export type ConfirmationDownloadSource = "portal" | "bulk" | "email_link";

export type ConfirmationDownloadRow = {
  id: string;
  round_id: string | null;
  round_name: string;
  event_key: string;
  document_title: string;
  reference: string | null;
  source: string;
  document_count: number;
  created_at: string;
};

export const CONFIRMATION_DOWNLOAD_SOURCES: ConfirmationDownloadSource[] = [
  "portal",
  "bulk",
  "email_link",
];

const SOURCE_LABELS: Record<ConfirmationDownloadSource, string> = {
  portal: "Portal download",
  bulk: "Bulk archive",
  email_link: "Secure email link",
};

export function normalizeDownloadSource(value: unknown): ConfirmationDownloadSource {
  return CONFIRMATION_DOWNLOAD_SOURCES.includes(value as ConfirmationDownloadSource)
    ? (value as ConfirmationDownloadSource)
    : "portal";
}

export function downloadSourceLabel(value: unknown): string {
  return SOURCE_LABELS[normalizeDownloadSource(value)];
}

/** "Allocation accepted (2 documents)" style summary for one audit row. */
export function downloadSummary(row: ConfirmationDownloadRow): string {
  const count = Number(row.document_count ?? 1);
  return count > 1 ? `${row.document_title} (${count} documents)` : row.document_title;
}

export function formatDownloadStamp(at: string): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Total documents represented by the visible rows (bundles count as many). */
export function totalDocumentsDownloaded(rows: ConfirmationDownloadRow[]): number {
  return rows.reduce((sum, row) => sum + Math.max(1, Number(row.document_count ?? 1)), 0);
}

/** Newest-first rows grouped by round, preserving recency order of the groups. */
export function groupDownloadsByRound(
  rows: ConfirmationDownloadRow[],
): { key: string; roundName: string; rows: ConfirmationDownloadRow[] }[] {
  const groups = new Map<string, { key: string; roundName: string; rows: ConfirmationDownloadRow[] }>();
  for (const row of rows) {
    const key = row.round_id ?? `name:${row.round_name}`;
    const existing = groups.get(key);
    if (existing) existing.rows.push(row);
    else groups.set(key, { key, roundName: row.round_name, rows: [row] });
  }
  return [...groups.values()];
}
