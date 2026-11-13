import type { EmailLogRow } from "./email-logs.functions";

/**
 * CSV export for the admin email delivery log. Pure helpers so the shape can be
 * unit-tested without rendering the admin route.
 */

const COLUMNS = [
  "timestamp",
  "recipient",
  "event_type",
  "status",
  "message_id",
  "event_id",
  "delivery_id",
  "tags",
  "raw_json",
] as const;

/** RFC 4180 quoting; a leading =,+,-,@ is prefixed to defuse spreadsheet formula injection. */
function cell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildEmailLogsCsv(rows: readonly EmailLogRow[]): string {
  const lines = [COLUMNS.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        cell(r.timestamp),
        cell(r.recipient),
        cell(r.eventType),
        cell(r.status ?? ""),
        cell(r.messageId ?? ""),
        cell(r.eventId ?? ""),
        cell(r.deliveryId ?? ""),
        cell(r.tags.join(" ")),
        cell(r.rawJson),
      ].join(","),
    );
  }

  // Trailing newline keeps the last record intact for strict CSV parsers.
  return `${lines.join("\r\n")}\r\n`;
}

export function emailLogsCsvFilename(filters: {
  recipient?: string;
  eventType?: string;
  days: number;
}): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const parts = ["gf3x-email-logs"];
  if (filters.eventType) parts.push(filters.eventType);
  if (filters.recipient) parts.push(filters.recipient.replace(/[^a-zA-Z0-9._-]/g, "_"));
  parts.push(`${filters.days}d`, stamp);
  return `${parts.join("_")}.csv`;
}

/** Triggers a browser download of the CSV; no-ops outside the browser. */
export function downloadEmailLogsCsv(rows: readonly EmailLogRow[], filename: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob(["\uFEFF", buildEmailLogsCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
