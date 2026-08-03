/**
 * Client-safe search, filter and sort logic for the investor marketplace shelf.
 * Pure functions so the URL-driven filter state can be unit tested and stays
 * consistent with the numbers shown on each opportunity card.
 */

export type ShelfProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  sector: string;
  summary: string;
  currency: string;
  minimum: number | string;
  target_yield: number | string;
  term_months: number | string;
  capacity?: number | string | null;
};

export type Stage = "open" | "filling" | "closing" | "full";

export const STAGES: { key: Stage; label: string; hint: string }[] = [
  { key: "open", label: "Newly open", hint: "Under 25% subscribed" },
  { key: "filling", label: "Filling", hint: "25–75% subscribed" },
  { key: "closing", label: "Closing soon", hint: "Over 75% subscribed" },
  { key: "full", label: "Fully subscribed", hint: "No capacity remaining" },
];

export type SortKey = "recommended" | "yield" | "minimum" | "term" | "name";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "yield", label: "Highest yield" },
  { key: "minimum", label: "Lowest minimum" },
  { key: "term", label: "Shortest term" },
  { key: "name", label: "A–Z" },
];

export type MarketplaceFilters = {
  q: string;
  category: string;
  sector: string;
  stage: string;
  maxMinimum: number;
  sort: SortKey;
};

export const DEFAULT_FILTERS: MarketplaceFilters = {
  q: "",
  category: "all",
  sector: "all",
  stage: "all",
  maxMinimum: 0,
  sort: "recommended",
};

const num = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Percentage of capacity taken, or null when the project is uncapped. */
export function filledPercent(product: ShelfProduct, subscribed: number): number | null {
  const capacity = product.capacity == null ? null : num(product.capacity);
  if (capacity == null || capacity <= 0) return null;
  return Math.min(100, (Math.max(0, subscribed) / capacity) * 100);
}

/** Funding stage of an opportunity, derived from how much capacity is taken. */
export function deriveStage(product: ShelfProduct, subscribed: number): Stage {
  const filled = filledPercent(product, subscribed);
  if (filled == null) return "open";
  if (filled >= 100) return "full";
  if (filled >= 75) return "closing";
  if (filled >= 25) return "filling";
  return "open";
}

/** Sorted, de-duplicated facet values for a select control. */
export function facetValues(products: ShelfProduct[], key: "category" | "sector"): string[] {
  return [...new Set(products.map((p) => (p[key] ?? "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Cheapest and largest minimum check across the shelf, for the slider bounds. */
export function checkSizeBounds(products: ShelfProduct[]): { min: number; max: number } {
  const mins = products.map((p) => num(p.minimum)).filter((n) => n > 0);
  if (mins.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...mins), max: Math.max(...mins) };
}

const matchesQuery = (product: ShelfProduct, q: string) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const terms = needle.split(/\s+/);
  const haystack = [product.name, product.category, product.sector, product.summary]
    .join(" ")
    .toLowerCase();
  return terms.every((t) => haystack.includes(t));
};

/** Applies free-text search plus category, sector, stage and check-size filters. */
export function filterProducts(
  products: ShelfProduct[],
  subscribedById: Record<string, number>,
  filters: Partial<MarketplaceFilters>,
): ShelfProduct[] {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return products.filter((p) => {
    if (!matchesQuery(p, f.q)) return false;
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.sector !== "all" && p.sector !== f.sector) return false;
    if (f.stage !== "all" && deriveStage(p, subscribedById[p.id] ?? 0) !== f.stage) return false;
    if (f.maxMinimum > 0 && num(p.minimum) > f.maxMinimum) return false;
    return true;
  });
}

/** Orders the shelf; "recommended" keeps the admin-curated order. */
export function sortProducts(products: ShelfProduct[], sort: SortKey): ShelfProduct[] {
  const list = [...products];
  switch (sort) {
    case "yield":
      return list.sort((a, b) => num(b.target_yield) - num(a.target_yield));
    case "minimum":
      return list.sort((a, b) => num(a.minimum) - num(b.minimum));
    case "term":
      return list.sort((a, b) => num(a.term_months) - num(b.term_months));
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "recommended":
    default:
      return list;
  }
}

/** Number of filters the investor has actively changed from the defaults. */
export function activeFilterCount(filters: Partial<MarketplaceFilters>): number {
  const f = { ...DEFAULT_FILTERS, ...filters };
  let count = 0;
  if (f.q.trim()) count += 1;
  if (f.category !== "all") count += 1;
  if (f.sector !== "all") count += 1;
  if (f.stage !== "all") count += 1;
  if (f.maxMinimum > 0) count += 1;
  return count;
}
