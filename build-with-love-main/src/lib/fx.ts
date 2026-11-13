/**
 * Pure FX helpers — shared by the server (rate refresh, conversion) and the
 * browser (wallet valuations). No imports, so it is safe on both sides.
 */

export type FxRate = {
  code: string;
  rate_to_usd: number;
  source: string;
  is_manual: boolean;
  fetched_at: string;
};

export type CurrencySetting = {
  code: string;
  label: string;
  symbol: string;
  decimals: number;
  kind: string;
  is_enabled: boolean;
  sort_order: number;
};

export type RateMap = Record<string, number>;

/** Builds a `{ USD: 1, EUR: 1.08, ... }` lookup from stored rate rows. */
export function toRateMap(rates: Pick<FxRate, "code" | "rate_to_usd">[]): RateMap {
  const map: RateMap = { USD: 1 };
  for (const r of rates) {
    const value = Number(r.rate_to_usd);
    if (Number.isFinite(value) && value > 0) map[r.code.toUpperCase()] = value;
  }
  return map;
}

/** Converts `amount` of `from` into USD. Returns null when the rate is unknown. */
export function toUsd(amount: number, from: string, rates: RateMap): number | null {
  const rate = rates[(from ?? "").toUpperCase()];
  if (!Number.isFinite(amount) || rate == null) return null;
  return round(amount * rate, 2);
}

/** Converts between any two currencies through the USD base. */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: RateMap,
): { amount: number; rate: number } | null {
  const fromRate = rates[(from ?? "").toUpperCase()];
  const toRate = rates[(to ?? "").toUpperCase()];
  if (!Number.isFinite(amount) || !fromRate || !toRate) return null;
  const rate = fromRate / toRate;
  return { amount: round(amount * rate, 8), rate: round(rate, 8) };
}

/** Applies a percentage spread against the customer (used on conversions). */
export function applySpread(amount: number, spreadPct: number) {
  const pct = Number.isFinite(spreadPct) ? Math.max(0, spreadPct) : 0;
  return round(amount * (1 - pct / 100), 8);
}

export function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Rates older than this are shown as stale in the admin console. */
export const RATE_STALE_MINUTES = 180;

export function isStale(fetchedAt: string | null | undefined, now = Date.now()) {
  if (!fetchedAt) return true;
  const ts = new Date(fetchedAt).getTime();
  if (!Number.isFinite(ts)) return true;
  return now - ts > RATE_STALE_MINUTES * 60_000;
}

/**
 * Normalises a Frankfurter (ECB) response — `{ base: "USD", rates: { EUR: 0.92 } }`
 * — into per-currency USD values (how much one unit is worth in USD).
 */
export function fromFrankfurter(payload: {
  base?: string;
  rates?: Record<string, number>;
}): RateMap {
  const out: RateMap = { USD: 1 };
  const rates = payload?.rates ?? {};
  for (const [code, perUsd] of Object.entries(rates)) {
    const value = Number(perUsd);
    if (Number.isFinite(value) && value > 0) out[code.toUpperCase()] = round(1 / value, 8);
  }
  return out;
}

/** Locale-aware money formatting driven by the currency's decimal setting. */
export function formatMoney(
  amount: number,
  code: string,
  locale = "en",
  decimals?: number,
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: decimals ?? 2,
      minimumFractionDigits: decimals ?? 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(decimals ?? 2)} ${code}`;
  }
}
