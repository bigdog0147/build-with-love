import { useMemo, useState } from "react";
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
  RANGES,
  allocationSlices,
  performanceSeries,
  seriesDelta,
  type AllocationDimension,
  type RangeKey,
  type SeriesDistribution,
  type SeriesHolding,
  type ValuationLike,
} from "@/lib/portfolio-series";

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
}: {
  holdings: SeriesHolding[];
  valuations: ValuationLike[];
  distributions: SeriesDistribution[];
  products: { id: string; name: string; sector: string; category: string }[];
  currency?: string;
}) {
  const [range, setRange] = useState<RangeKey>("6M");
  const [dimension, setDimension] = useState<AllocationDimension>("sector");

  const points = useMemo(
    () => performanceSeries({ holdings, valuations, distributions, range }),
    [holdings, valuations, distributions, range],
  );
  const delta = useMemo(() => seriesDelta(points), [points]);
  const slices = useMemo(() => allocationSlices({ holdings, products, dimension }), [holdings, products, dimension]);
  const fmt = (n: number) => money(n, currency);

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
          <Toggle options={RANGES} value={range} onChange={setRange} label="Performance time range" />
        </div>

        <div aria-live="polite" className="mt-3 text-sm">
          {points.length >= 2 ? (
            <span className={delta.absolute >= 0 ? "text-[var(--success)]" : "text-[var(--danger,#e05a5a)]"}>
              {delta.absolute >= 0 ? "+" : ""}
              {fmt(delta.absolute)} · {delta.percent.toFixed(2)}% over {range === "ALL" ? "all time" : range}
            </span>
          ) : (
            <span className="text-muted-foreground">Not enough history yet for this range.</span>
          )}
        </div>

        <div className="mt-4 h-64 w-full">
          {points.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Line type="monotone" dataKey="invested" name="Invested" stroke="#8fa6c4" strokeWidth={1.5} dot={false} />
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

        <div className="mt-2 h-48 w-full">
          {slices.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="88%" stroke="none">
                  {slices.map((s, i) => (
                    <Cell key={s.key} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
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

        <ul className="mt-4 space-y-2 text-sm">
          {slices.map((s, i) => (
            <li key={s.key} className="flex items-center justify-between gap-3">
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
