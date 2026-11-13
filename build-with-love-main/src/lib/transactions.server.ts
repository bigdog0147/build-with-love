export type LedgerFilters = {
  kind?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
};

export const LEDGER_PAGE_SIZE = 25;

/** Normalise raw (URL) filter values into a safe, bounded query shape. */
export function normalizeLedgerFilters(input: LedgerFilters) {
  const clean = (v: string | undefined) => (v ?? "").trim().slice(0, 80);
  const page = Number(input.page);
  return {
    kind: clean(input.kind),
    status: clean(input.status),
    from: /^\d{4}-\d{2}-\d{2}$/.test(clean(input.from)) ? clean(input.from) : "",
    to: /^\d{4}-\d{2}-\d{2}$/.test(clean(input.to)) ? clean(input.to) : "",
    q: clean(input.q),
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 400) : 1,
  };
}
