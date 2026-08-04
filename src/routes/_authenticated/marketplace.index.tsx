import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { listMarketplace } from "@/lib/investments.functions";
import { remainingCapacity } from "@/lib/investments";
import {
  DEFAULT_FILTERS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  SORTS,
  STAGES,
  activeFilterCount,
  checkSizeBounds,
  deriveStage,
  facetCounts,
  facetValues,
  pageWindow,
  paginate,
  paginationInfo,
  withCount,

  filledPercent,
  filterProducts,
  sortProducts,
  type SortKey,
} from "@/lib/marketplace-filters";

type Search = {
  q: string;
  category: string;
  sector: string;
  stage: string;
  maxMinimum: number;
  sort: SortKey;
  page: number;
  perPage: number;
};

export const Route = createFileRoute("/_authenticated/marketplace/")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const str = (v: unknown, fallback: string) =>
      typeof v === "string" && v.trim() ? v : fallback;
    const max = Number(search["maxMinimum"] ?? 0);
    const sort = str(search["sort"], DEFAULT_FILTERS.sort);
    const page = Number(search["page"] ?? 1);
    const perPage = Number(search["perPage"] ?? DEFAULT_PAGE_SIZE);
    return {
      q: str(search["q"], "").slice(0, 120),
      category: str(search["category"], "all"),
      sector: str(search["sector"], "all"),
      stage: str(search["stage"], "all"),
      maxMinimum: Number.isFinite(max) && max > 0 ? Math.round(max) : 0,
      sort: (SORTS.some((s) => s.key === sort) ? sort : DEFAULT_FILTERS.sort) as SortKey,
      page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
      perPage: PAGE_SIZES.includes(perPage as (typeof PAGE_SIZES)[number])
        ? perPage
        : DEFAULT_PAGE_SIZE,
    };
  },
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Project marketplace — Gigafactory 3X" },
      {
        name: "description",
        content: "Search and filter live industrial infrastructure, robotics and energy projects.",
      },
      { property: "og:title", content: "Project marketplace — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Filter live opportunities by category, funding stage and minimum check size.",
      },
    ],
  }),
});

function MarketplacePage() {
  const fetchShelf = useServerFn(listMarketplace);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace"],
    queryFn: () => fetchShelf({} as never),
  });

  const products = data?.products ?? [];
  const subscribedById = data?.subscribed ?? {};

  // Any filter/sort change resets to page 1; explicit page moves keep filters.
  const setFilter = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, page: 1, ...patch }) });
  const goToPage = (page: number) =>
    navigate({ search: (prev: Search) => ({ ...prev, page }) });

  const categories = useMemo(() => facetValues(products, "category"), [products]);
  const sectors = useMemo(() => facetValues(products, "sector"), [products]);
  const categoryCounts = useMemo(
    () => facetCounts(products, subscribedById, search, "category"),
    [products, subscribedById, search],
  );
  const sectorCounts = useMemo(
    () => facetCounts(products, subscribedById, search, "sector"),
    [products, subscribedById, search],
  );
  const stageCounts = useMemo(
    () => facetCounts(products, subscribedById, search, "stage"),
    [products, subscribedById, search],
  );
  const bounds = useMemo(() => checkSizeBounds(products), [products]);
  const matches = useMemo(
    () => sortProducts(filterProducts(products, subscribedById, search), search.sort),
    [products, subscribedById, search],
  );
  const pageInfo = paginationInfo(matches.length, search.page, search.perPage);
  const visible = useMemo(
    () => paginate(matches, search.page, search.perPage),
    [matches, search.page, search.perPage],
  );
  const activeCount = activeFilterCount(search);


  return (
    <DashShell>
      <PageHeading
        eyebrow="Project marketplace"
        title="Live opportunities"
        sub="Industrial projects open for subscription, with live capacity and terms."
      />

      <div className="glass rounded-2xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--gold)]" />
            Refine
            {activeCount > 0 && <span className="text-[var(--gold)]">· {activeCount} active</span>}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter({ ...DEFAULT_FILTERS, sort: search.sort })}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-[var(--gold)]"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <label className="lg:col-span-2">
            <span className="text-xs text-muted-foreground">Search</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-[var(--surface-elevated)] px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                value={search.q}
                onChange={(e) => setFilter({ q: e.target.value })}
                placeholder="Project name, sector or keyword"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <Select
            label="Category"
            value={search.category}
            onChange={(v) => setFilter({ category: v })}
            options={[
              { value: "all", label: withCount("All categories", categoryCounts.all) },
              ...categories.map((c) => ({ value: c, label: withCount(c, categoryCounts[c]) })),
            ]}
          />
          <Select
            label="Sector"
            value={search.sector}
            onChange={(v) => setFilter({ sector: v })}
            options={[
              { value: "all", label: withCount("All sectors", sectorCounts.all) },
              ...sectors.map((s) => ({ value: s, label: withCount(s, sectorCounts[s]) })),
            ]}
          />
          <Select
            label="Funding stage"
            value={search.stage}
            onChange={(v) => setFilter({ stage: v })}
            options={[
              { value: "all", label: withCount("Any stage", stageCounts.all) },
              ...STAGES.map((s) => ({
                value: s.key,
                label: `${withCount(s.label, stageCounts[s.key])} — ${s.hint}`,
              })),
            ]}
          />

          <Select
            label="Sort by"
            value={search.sort}
            onChange={(v) => setFilter({ sort: v as SortKey })}
            options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
          />

          <label className="lg:col-span-2">
            <span className="text-xs text-muted-foreground">
              Maximum check size{" "}
              <span className="text-foreground">
                {search.maxMinimum > 0 ? money(search.maxMinimum, undefined, 0) : "No limit"}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={bounds.max || 0}
              step={Math.max(1000, Math.round((bounds.max || 0) / 50) || 1000)}
              value={Math.min(search.maxMinimum, bounds.max || 0)}
              disabled={!bounds.max}
              onChange={(e) => setFilter({ maxMinimum: Number(e.target.value) })}
              aria-label="Maximum minimum check size"
              className="mt-3 w-full accent-[var(--gold)]"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Hides projects whose minimum subscription exceeds this amount.
            </span>
          </label>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading opportunities…</p>}

      {!isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {matches.length === 0
              ? `Showing 0 of ${products.length} opportunities`
              : `Showing ${pageInfo.from}–${pageInfo.to} of ${matches.length} matching opportunities · page ${pageInfo.page} of ${pageInfo.pageCount}`}
          </p>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Per page
            <select
              value={search.perPage}
              onChange={(e) => setFilter({ perPage: Number(e.target.value) })}
              className="rounded-lg border border-border bg-[var(--surface-elevated)] px-2 py-1.5 text-xs outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div className="glass rounded-2xl border border-border p-8 text-sm text-muted-foreground">
          No opportunities are open for subscription right now. New projects are added as they clear
          investment committee.
        </div>
      )}

      {!isLoading && products.length > 0 && matches.length === 0 && (
        <div className="glass rounded-2xl border border-border p-8 text-sm text-muted-foreground">
          No opportunities match these filters.{" "}
          <button
            type="button"
            onClick={() => setFilter({ ...DEFAULT_FILTERS, sort: search.sort })}
            className="text-[var(--gold)]"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((p) => {
          const subscribed = subscribedById[p.id] ?? 0;
          const remaining = remainingCapacity(p, subscribed);
          const filled = filledPercent(p, subscribed);
          const stage = deriveStage(p, subscribed);
          const stageLabel = STAGES.find((s) => s.key === stage)?.label ?? "Open";
          const mine = data?.mine[p.id] ?? 0;
          return (
            <Link
              key={p.id}
              to="/marketplace/$slug"
              params={{ slug: p.slug }}
              className="glass group rounded-2xl border border-border p-5 transition-colors hover:border-[var(--gold)]/60"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-[var(--gold)]" />
                  {p.category} · {p.sector}
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stageLabel}
                </span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="font-display text-xl">{p.name}</div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[var(--gold)]" />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.summary}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Minimum</dt>
                  <dd className="mt-0.5 tabular-nums">{money(Number(p.minimum), p.currency, 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Target yield</dt>
                  <dd className="mt-0.5 text-[var(--success)]">{Number(p.target_yield)}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Term</dt>
                  <dd className="mt-0.5">{p.term_months} mo</dd>
                </div>
              </dl>
              {filled != null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{filled.toFixed(0)}% subscribed</span>
                    <span>
                      {remaining === 0
                        ? "Fully subscribed"
                        : `${money(remaining ?? 0, p.currency, 0)} remaining`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${filled}%`, background: "var(--gradient-gold)" }}
                    />
                  </div>
                </div>
              )}
              {mine > 0 && (
                <div className="mt-4 text-xs text-[var(--gold)]">
                  You hold {money(mine, p.currency, 0)} in this project
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {!isLoading && pageInfo.pageCount > 1 && (
        <nav aria-label="Marketplace pagination" className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(pageInfo.page - 1)}
            disabled={pageInfo.page <= 1}
            className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-[var(--gold)] disabled:opacity-40 disabled:hover:text-muted-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          {pageWindow(pageInfo.page, pageInfo.pageCount).map((p, i) =>
            p == null ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => goToPage(p)}
                aria-current={p === pageInfo.page ? "page" : undefined}
                className={`min-w-9 rounded-xl border px-3 py-2 text-xs tabular-nums transition-colors ${
                  p === pageInfo.page
                    ? "border-[var(--gold)]/60 text-[var(--gold)]"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => goToPage(pageInfo.page + 1)}
            disabled={pageInfo.page >= pageInfo.pageCount}
            className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-[var(--gold)] disabled:opacity-40 disabled:hover:text-muted-foreground"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </DashShell>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label>
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-[var(--surface-elevated)] px-3 py-2.5 text-sm outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
