import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/components/dashboard-chrome";
import {
  BENCHMARKS,
  COMPARISONS,
  RANGES,
  allocationSlices,
  comparisonDelta,
  comparisonPoints,
  performanceSeries,
  seriesDelta,
  type AllocationDimension,
  type ComparisonMode,
  type RangeKey,
  type SeriesDistribution,
  type SeriesHolding,
  type ValuationLike,
} from "@/lib/portfolio-series";
import {
  DEFAULT_PORTFOLIO_RANGE,
  readStoredRange,
  writeStoredRange,
} from "@/lib/portfolio-preferences";
import {
  buildPortfolioCsv,
  buildPortfolioReportHtml,
  downloadTextFile,
  portfolioCsvFileName,
  printPortfolioReport,
} from "@/lib/portfolio-export";


const SLICE_COLORS = [
  "var(--gold)",
  "#8fa6c4",
  "#4da3ff",
  "#c9a227",
  "#6f7d92",
  "#2e7dd1",
  "#e0c060",
];

const DIMENSIONS: { key: AllocationDimension; label: string }[] = [
  { key: "sector", label: "Sector" },
  { key: "category", label: "Category" },
  { key: "project", label: "Project" },
];

function Toggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-full border border-border p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest transition ${
            value === o.key
              ? "bg-[var(--surface-elevated)] text-[var(--gold)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PortfolioCharts({
  holdings,
  valuations,
  distributions,
  products,
  currency,
  investorName,
}: {
  holdings: SeriesHolding[];
  valuations: ValuationLike[];
  distributions: SeriesDistribution[];
  products: { id: string; name: string; sector: string; category: string }[];
  currency?: string;
  investorName?: string;
}) {
  const [range, setRange] = useState<RangeKey>(DEFAULT_PORTFOLIO_RANGE);
  const [dimension, setDimension] = useState<AllocationDimension>("sector");
  const [selected, setSelected] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonMode>("invested");
  const [benchmark, setBenchmark] = useState<string>(BENCHMARKS[2]!.key);

  // Restore after mount so SSR markup and hydration stay identical.
  useEffect(() => {
    setRange(readStoredRange());
  }, []);

  const changeRange = (next: RangeKey) => {
    setRange(next);
    writeStoredRange(next);
  };


  const points = useMemo(
    () => performanceSeries({ holdings, valuations, distributions, range }),
    [holdings, valuations, distributions, range],
  );
  const allPoints = useMemo(
    () => performanceSeries({ holdings, valuations, distributions, range: "ALL" }),
    [holdings, valuations, distributions],
  );
  const benchmarkRate = useMemo(
    () => BENCHMARKS.find((b) => b.key === benchmark)?.annualRate ?? 0,
    [benchmark],
  );
  const chartPoints = useMemo(
    () =>
      comparisonPoints({
        points,
        allPoints,
        mode: comparison,
        benchmarkAnnualRate: benchmarkRate,
      }),
    [points, allPoints, comparison, benchmarkRate],
  );
  const compareLabel = useMemo(() => {
    if (comparison === "invested") return "Invested";
    if (comparison === "previous") return "Previous period";
    if (comparison === "benchmark")
      return BENCHMARKS.find((b) => b.key === benchmark)?.label ?? "Benchmark";
    return "";
  }, [comparison, benchmark]);
  const compareDelta = useMemo(
    () => (comparison === "none" ? null : comparisonDelta(chartPoints)),
    [chartPoints, comparison],
  );
  const delta = useMemo(() => seriesDelta(points), [points]);
  const slices = useMemo(() => allocationSlices({ holdings, products, dimension }), [holdings, products, dimension]);
  const active = useMemo(() => slices.find((s) => s.key === selected) ?? null, [slices, selected]);
  const fmt = (n: number) => money(n, currency);

  const exportInput = () => ({
    points: chartPoints,
    slices,
    dimension,
    range: range === "ALL" ? "All time" : range,
    comparisonLabel: comparison === "none" ? undefined : compareLabel,
    currency,
    investorName,
    generatedAt: new Date().toISOString(),
  });

  const exportCsv = () => {
    const input = exportInput();
    downloadTextFile(portfolioCsvFileName(input), buildPortfolioCsv(input), "text/csv");
  };

  const exportPdf = () => {
    printPortfolioReport(buildPortfolioReportHtml(exportInput()));
  };




  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-xl">Performance</div>
            <p className="text-xs text-muted-foreground">
              Portfolio value plus distributions received across the selected window.
            </p>
          </div>
          <Toggle options={RANGES} value={range} onChange={changeRange} label="Performance time range" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Compare</span>
          <Toggle options={COMPARISONS} value={comparison} onChange={setComparison} label="Performance comparison mode" />
          {comparison === "benchmark" ? (
            <select
              aria-label="Benchmark"
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
              className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs text-foreground"
            >
              {BENCHMARKS.map((b) => (
                <option key={b.key} value={b.key} className="bg-[var(--surface-elevated)]">
                  {b.label}
                </option>
              ))}
            </select>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="rounded-full border border-[var(--gold)]/40 px-3 py-1.5 text-xs uppercase tracking-widest text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
            >
              Export PDF
            </button>
          </div>
        </div>



        <div aria-live="polite" className="mt-3 text-sm">
          {points.length >= 2 ? (
            <>
              <span className={delta.absolute >= 0 ? "text-[var(--success)]" : "text-[var(--danger,#e05a5a)]"}>
                {delta.absolute >= 0 ? "+" : ""}
                {fmt(delta.absolute)} · {delta.percent.toFixed(2)}% over {range === "ALL" ? "all time" : range}
              </span>
              {compareDelta ? (
                <span className="ml-2 text-muted-foreground">
                  vs {compareLabel}: {compareDelta.absolute >= 0 ? "+" : ""}
                  {fmt(compareDelta.absolute)} ({compareDelta.percent >= 0 ? "+" : ""}
                  {compareDelta.percent.toFixed(2)}%)
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground">Not enough history yet for this range.</span>
          )}
        </div>


        <div className="mt-4 h-64 w-full">
          {points.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gf3xTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "currentColor", fontSize: 11, opacity: 0.6 }}
                  tickFormatter={(d: string) => d.slice(5)}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 11, opacity: 0.6 }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  stroke="currentColor"
                  strokeOpacity={0.15}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number, name: string) => [fmt(Number(v)), name]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Value + income"
                  stroke="var(--gold)"
                  strokeWidth={2}
                  fill="url(#gf3xTotal)"
                />
                {comparison !== "none" ? (
                  <Line
                    type="monotone"
                    dataKey="compare"
                    name={compareLabel}
                    stroke={comparison === "benchmark" ? "#4da3ff" : "#8fa6c4"}
                    strokeWidth={1.5}
                    strokeDasharray={comparison === "invested" ? undefined : "5 4"}
                    dot={false}
                    connectNulls
                  />
                ) : null}

              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Performance appears once valuations are recorded for your holdings.
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="font-display text-xl">Allocation</div>
          <Toggle options={DIMENSIONS} value={dimension} onChange={setDimension} label="Allocation breakdown" />
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Select a slice to drill into the underlying holdings and amounts.
        </p>

        <div className="mt-2 h-48 w-full">
          {slices.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="88%"
                  stroke="none"
                  onClick={(entry: unknown) => {
                    const key = (entry as { key?: string; payload?: { key?: string } })?.key
                      ?? (entry as { payload?: { key?: string } })?.payload?.key;
                    if (key) setSelected((prev) => (prev === key ? null : key));
                  }}
                  className="cursor-pointer outline-none"
                >
                  {slices.map((s, i) => (
                    <Cell
                      key={s.key}
                      fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                      opacity={selected && selected !== s.key ? 0.35 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number, name: string) => [fmt(Number(v)), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Allocation appears once you hold a project.
            </div>
          )}
        </div>

        <ul className="mt-4 space-y-1 text-sm">
          {slices.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                aria-pressed={selected === s.key}
                aria-label={`Drill into ${s.label}`}
                onClick={() => setSelected((prev) => (prev === s.key ? null : s.key))}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--surface-elevated)] ${
                  selected === s.key ? "bg-[var(--surface-elevated)]" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                  />
                  <span className="capitalize">{s.label}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {s.percent.toFixed(1)}% · {fmt(s.value)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div aria-live="polite">
          {active && (
            <div className="mt-4 rounded-xl border border-border bg-[var(--surface-elevated)]/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {DIMENSIONS.find((d) => d.key === dimension)?.label} drilldown
                  </div>
                  <div className="font-display text-lg capitalize">{active.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(active.value)} current · {fmt(active.invested)} invested ·{" "}
                    <span className={active.gain >= 0 ? "text-[var(--success)]" : "text-[var(--danger,#e05a5a)]"}>
                      {active.gain >= 0 ? "+" : ""}
                      {fmt(active.gain)} ({active.gainPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <ul className="mt-3 space-y-2">
                {active.holdings.map((h) => (
                  <li key={h.holdingId} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm">{h.project}</div>
                        <div className="text-[11px] capitalize text-muted-foreground">
                          {h.sector} · {h.category}
                        </div>
                      </div>
                      <div className="text-right text-xs tabular-nums">
                        <div>{fmt(h.value)}</div>
                        <div className="text-muted-foreground">{h.shareOfSlice.toFixed(1)}% of slice</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular-nums text-muted-foreground">
                      <span>Invested {fmt(h.invested)}</span>
                      <span className={h.gain >= 0 ? "text-[var(--success)]" : "text-[var(--danger,#e05a5a)]"}>
                        {h.gain >= 0 ? "+" : ""}
                        {fmt(h.gain)} · {h.gainPct.toFixed(2)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

