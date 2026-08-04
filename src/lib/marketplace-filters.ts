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

export type FacetKey = "category" | "sector" | "stage";

/**
 * How many listings match each option of one facet, with every *other* active
 * filter applied. This is the standard faceted-search behaviour: changing the
 * category doesn't hide its own alternatives, but sector/stage/search/check-size
 * narrowing is reflected in the counts.
 *
 * The returned record always contains an `all` key with the total for the facet.
 */
export function facetCounts(
  products: ShelfProduct[],
  subscribedById: Record<string, number>,
  filters: Partial<MarketplaceFilters>,
  key: FacetKey,
): Record<string, number> {
  const base = filterProducts(products, subscribedById, { ...filters, [key]: "all" });
  const counts: Record<string, number> = { all: base.length };
  for (const p of base) {
    const value = key === "stage" ? deriveStage(p, subscribedById[p.id] ?? 0) : (p[key] ?? "").trim();
    if (!value) continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  if (key === "stage") for (const s of STAGES) counts[s.key] = counts[s.key] ?? 0;
  return counts;
}

/** Appends a facet count to an option label, e.g. "Robotics (3)". */
export function withCount(label: string, count: number | undefined): string {
  return `${label} (${count ?? 0})`;
}

/** Page sizes offered in the marketplace pagination control. */
export const PAGE_SIZES = [6, 12, 24, 48] as const;
export const DEFAULT_PAGE_SIZE = 12;

export type Pagination = {
  page: number;
  perPage: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
};

/** Clamped page/offset maths for a filtered result list. */
export function paginationInfo(total: number, page: number, perPage: number): Pagination {
  const size = Number.isFinite(perPage) && perPage >= 1 ? Math.floor(perPage) : DEFAULT_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(Math.max(0, total) / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const from = total === 0 ? 0 : (current - 1) * size + 1;
  const to = Math.min(total, current * size);
  return { page: current, perPage: size, pageCount, total, from, to };
}

/** Slice of the list for the (clamped) current page. */
export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const info = paginationInfo(items.length, page, perPage);
  return items.slice((info.page - 1) * info.perPage, info.page * info.perPage);
}

/**
 * Page numbers to render, with `null` marking an ellipsis gap. Always includes
 * the first and last page plus a window around the current page.
 */
export function pageWindow(page: number, pageCount: number, span = 1): (number | null)[] {
  const pages = new Set<number>([1, pageCount]);
  for (let p = page - span; p <= page + span; p += 1) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push(null);
    out.push(p);
    prev = p;
  }
  return out;
}
