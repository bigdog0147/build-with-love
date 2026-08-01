export type LedgerCsvRow = {
  id: string;
  name: string;
  kind: string;
  amount: number;
  currency: string;
  status: string;
  occurred_at: string;
};

export const LEDGER_CSV_HEADERS = [
  "id",
  "date",
  "description",
  "type",
  "amount",
  "currency",
  "status",
] as const;

/** RFC4180-safe cell: quote when the value contains a delimiter/quote/newline. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Guard against spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /["\n\r,]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildLedgerCsv(rows: LedgerCsvRow[]): string {
  const lines = [LEDGER_CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.id),
        csvCell(r.occurred_at),
        csvCell(r.name),
        csvCell(r.kind),
        csvCell(Number(r.amount).toFixed(2)),
        csvCell(r.currency),
        csvCell(r.status),
      ].join(","),
    );
  }
  return lines.join("\r\n");
}

export function ledgerCsvFilename(now = new Date()): string {
  return `gf3x-transactions-${now.toISOString().slice(0, 10)}.csv`;
}
