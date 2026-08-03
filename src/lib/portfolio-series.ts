/**
 * Client-safe time-series maths for the investor portfolio charts. Pure so the
 * performance line, the cumulative income line and the allocation split can be
 * unit tested and can never disagree with the portfolio summary numbers.
 */

export type RangeKey = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "6M", label: "6M" },
  { key: "YTD", label: "YTD" },
  { key: "1Y", label: "1Y" },
  { key: "ALL", label: "All" },
];

export type ValuationLike = {
  holding_id: string;
  as_of: string;
  value: number | string;
};

export type SeriesHolding = {
  id: string;
  product_id: string;
  invested: number | string;
  current_value: number | string;
  created_at?: string | null;
};

export type SeriesDistribution = {
  holding_id: string;
  amount: number | string;
  paid_at: string;
};

export type SeriesPoint = {
  date: string;
  value: number;
  invested: number;
  income: number;
  total: number;
};

const num = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const day = (iso: string) => String(iso).slice(0, 10);

/** Inclusive lower bound for a range key, or null for "ALL". */
export function rangeStart(range: RangeKey, now = new Date()): string | null {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  switch (range) {
    case "1M":
      d.setUTCMonth(d.getUTCMonth() - 1);
      break;
    case "3M":
      d.setUTCMonth(d.getUTCMonth() - 3);
      break;
    case "6M":
      d.setUTCMonth(d.getUTCMonth() - 6);
      break;
    case "1Y":
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      break;
    case "YTD":
      return `${now.getUTCFullYear()}-01-01`;
    case "ALL":
    default:
      return null;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Daily-resolution portfolio value series built from recorded valuations, with
 * cost basis as the fallback before a holding's first valuation and today's
 * live `current_value` appended as the final point.
 */
export function performanceSeries(input: {
  holdings: SeriesHolding[];
  valuations: ValuationLike[];
  distributions?: SeriesDistribution[];
  range: RangeKey;
  now?: Date;
}): SeriesPoint[] {
  const { holdings, valuations, distributions = [], range } = input;
  const now = input.now ?? new Date();
  const today = day(now.toISOString());
  if (holdings.length === 0) return [];

  const byHolding = new Map<string, ValuationLike[]>();
  for (const v of valuations) {
    const list = byHolding.get(v.holding_id) ?? [];
    list.push(v);
    byHolding.set(v.holding_id, list);
  }
  for (const list of byHolding.values()) list.sort((a, b) => day(a.as_of).localeCompare(day(b.as_of)));

  const dates = new Set<string>([today]);
  for (const h of holdings) if (h.created_at) dates.add(day(h.created_at));
  for (const v of valuations) dates.add(day(v.as_of));
  for (const d of distributions) dates.add(day(d.paid_at));

  const start = rangeStart(range, now);
  const ordered = [...dates].sort((a, b) => a.localeCompare(b)).filter((d) => d <= today);

  const valueAt = (date: string) =>
    holdings.reduce((sum, h) => {
      const created = h.created_at ? day(h.created_at) : null;
      if (created && created > date) return sum;
      const list = byHolding.get(h.id) ?? [];
      let latest: ValuationLike | undefined;
      for (const v of list) if (day(v.as_of) <= date) latest = v;
      if (date >= today) return sum + num(h.current_value);
      return sum + (latest ? num(latest.value) : num(h.invested));
    }, 0);

  const investedAt = (date: string) =>
    holdings.reduce((sum, h) => {
      const created = h.created_at ? day(h.created_at) : null;
      return created && created > date ? sum : sum + num(h.invested);
    }, 0);

  const incomeAt = (date: string) =>
    distributions.reduce((sum, d) => (day(d.paid_at) <= date ? sum + num(d.amount) : sum), 0);

  const points = ordered.map((date) => {
    const value = valueAt(date);
    const income = incomeAt(date);
    return { date, value, invested: investedAt(date), income, total: value + income };
  });

  if (!start) return points;
  const inRange = points.filter((p) => p.date >= start);
  if (inRange.length >= 2) return inRange;
  // Keep the chart readable when nothing was recorded inside the window.
  return points.slice(-2);
}

/* ---------------------------------------------------------------------------
 * Performance comparison
 * ------------------------------------------------------------------------- */

export type ComparisonMode = "none" | "invested" | "previous" | "benchmark";

export const COMPARISONS: { key: ComparisonMode; label: string }[] = [
  { key: "none", label: "Off" },
  { key: "invested", label: "Invested" },
  { key: "previous", label: "Prev. period" },
  { key: "benchmark", label: "Benchmark" },
];

export type Benchmark = { key: string; label: string; annualRate: number };

/** Reference growth curves, expressed as simple annualised rates. */
export const BENCHMARKS: Benchmark[] = [
  { key: "cash", label: "Cash · 4%", annualRate: 0.04 },
  { key: "bonds", label: "Bonds · 6%", annualRate: 0.06 },
  { key: "equities", label: "Global equities · 8%", annualRate: 0.08 },
  { key: "industrials", label: "Industrial tech · 12%", annualRate: 0.12 },
];

export type ComparisonPoint = SeriesPoint & { compare: number | null };

const DAY_MS = 86_400_000;

const toUtc = (date: string) => Date.parse(`${day(date)}T00:00:00Z`);

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Shift a date string by a whole number of days, staying on UTC days. */
export function shiftDays(date: string, days: number): string {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Latest known total at or before `date`, or null when history starts later. */
function totalAt(points: SeriesPoint[], date: string): number | null {
  let latest: number | null = null;
  for (const p of points) {
    if (day(p.date) <= date) latest = p.total;
    else break;
  }
  return latest;
}

/**
 * Attach a comparison value to each visible point. `previous` re-reads the
 * full history shifted back by exactly one window length so the two curves
 * line up day-for-day; `benchmark` compounds the window's opening value.
 */
export function comparisonPoints(input: {
  points: SeriesPoint[];
  allPoints?: SeriesPoint[];
  mode: ComparisonMode;
  benchmarkAnnualRate?: number;
}): ComparisonPoint[] {
  const { points, mode } = input;
  const allPoints = input.allPoints ?? points;
  if (points.length === 0) return [];
  if (mode === "none") return points.map((p) => ({ ...p, compare: null }));
  if (mode === "invested") return points.map((p) => ({ ...p, compare: p.invested }));

  const first = points[0]!;

  if (mode === "benchmark") {
    const rate = input.benchmarkAnnualRate ?? 0;
    const base = first.total;
    return points.map((p) => ({
      ...p,
      compare: base * Math.pow(1 + rate, daysBetween(first.date, p.date) / 365),
    }));
  }

  // previous period
  const window = Math.max(1, daysBetween(first.date, points[points.length - 1]!.date));
  const sorted = [...allPoints].sort((a, b) => day(a.date).localeCompare(day(b.date)));
  return points.map((p) => ({ ...p, compare: totalAt(sorted, shiftDays(p.date, -window)) }));
}

/** Headline summary of the comparison for the aria-live status line. */
export function comparisonDelta(points: ComparisonPoint[]) {
  const withCompare = points.filter((p) => p.compare !== null);
  if (withCompare.length === 0) return null;
  const last = withCompare[withCompare.length - 1]!;
  const compare = last.compare!;
  const absolute = last.total - compare;
  return { absolute, percent: compare > 0 ? (absolute / compare) * 100 : 0, reference: compare };
}

export type AllocationDimension = "sector" | "category" | "project";

export type AllocationHolding = {
  holdingId: string;
  productId: string;
  project: string;
  sector: string;
  category: string;
  invested: number;
  value: number;
  gain: number;
  gainPct: number;
  /** Share of this slice's current value, 0-100. */
  shareOfSlice: number;
};

export type AllocationSlice = {
  key: string;
  label: string;
  value: number;
  percent: number;
  invested: number;
  gain: number;
  gainPct: number;
  /** Underlying positions rolled into this slice, richest first. */
  holdings: AllocationHolding[];
};

/** Point-in-time allocation split of current value by sector, category or project. */
export function allocationSlices(input: {
  holdings: SeriesHolding[];
  products: { id: string; name: string; sector: string; category: string }[];
  dimension: AllocationDimension;
}): AllocationSlice[] {
  const { holdings, products, dimension } = input;
  const meta = new Map(products.map((p) => [p.id, p]));
  const buckets = new Map<string, AllocationHolding[]>();
  for (const h of holdings) {
    const p = meta.get(h.product_id);
    const label =
      dimension === "project" ? (p?.name ?? "Project") : ((p?.[dimension] as string | undefined) ?? "Unclassified");
    const value = num(h.current_value);
    const invested = num(h.invested);
    const list = buckets.get(label) ?? [];
    list.push({
      holdingId: h.id,
      productId: h.product_id,
      project: p?.name ?? "Unlisted project",
      sector: p?.sector ?? "Unclassified",
      category: p?.category ?? "Unclassified",
      invested,
      value,
      gain: value - invested,
      gainPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
      shareOfSlice: 0,
    });
    buckets.set(label, list);
  }

  const slices = [...buckets.entries()].map(([label, list]) => {
    const value = list.reduce((a, h) => a + h.value, 0);
    const invested = list.reduce((a, h) => a + h.invested, 0);
    return {
      key: label,
      label,
      value,
      percent: 0,
      invested,
      gain: value - invested,
      gainPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
      holdings: list
        .map((h) => ({ ...h, shareOfSlice: value > 0 ? (h.value / value) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
    };
  });

  const total = slices.reduce((a, s) => a + s.value, 0);
  return slices
    .filter((s) => s.value > 0)
    .map((s) => ({ ...s, percent: total > 0 ? (s.value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}


/** Value change across the visible window, used for the range delta badge. */
export function seriesDelta(points: SeriesPoint[]) {
  if (points.length < 2) return { absolute: 0, percent: 0 };
  const first = points[0]!.total;
  const last = points[points.length - 1]!.total;
  const absolute = last - first;
  return { absolute, percent: first > 0 ? (absolute / first) * 100 : 0 };
}
