import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight, Download, X, ArrowUpDown } from "lucide-react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- surfaces */

export function Panel({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--surface-elevated)_62%,transparent)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-500",
        glow && "shadow-[0_24px_70px_-30px_oklch(0.82_0.14_85/35%)]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: "linear-gradient(90deg,transparent,var(--gold),transparent)" }}
      />
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="truncate font-display text-base tracking-tight">{title}</h2>
        {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "success" | "danger" | "electric";
}) {
  const tones: Record<string, string> = {
    neutral: "border-white/12 text-muted-foreground",
    gold: "border-[var(--gold)]/40 text-[var(--gold)] bg-[var(--gold)]/10",
    success: "border-[var(--success)]/40 text-[var(--success)] bg-[var(--success)]/10",
    danger: "border-[var(--danger)]/40 text-[var(--danger)] bg-[var(--danger)]/10",
    electric: "border-[var(--electric)]/40 text-[var(--electric)] bg-[var(--electric)]/10",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "gold" | "ghost" | "danger" | "outline";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    gold: "text-[var(--gold-foreground)] shadow-[0_10px_30px_-12px_oklch(0.82_0.14_85/60%)]",
    ghost: "border border-white/12 text-foreground hover:border-[var(--gold)]/50 hover:bg-white/5",
    outline: "border border-white/12 text-muted-foreground hover:text-foreground hover:bg-white/5",
    danger: "border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)]/10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={variant === "gold" ? { background: "var(--gradient-gold)" } : undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 active:scale-[0.97] disabled:opacity-50",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- stats */

export function useCountUp(value: number, ms = 900) {
  const [n, setN] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    const from = ref.current;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (value - from) * eased;
      ref.current = cur;
      setN(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return n;
}

export function StatCard({
  label,
  value,
  format = "number",
  delta,
  series,
  tone = "gold",
  sub,
}: {
  label: string;
  value: number;
  format?: "number" | "currency" | "percent" | "compact";
  delta?: number;
  series?: number[];
  tone?: "gold" | "electric" | "silver" | "success" | "danger";
  sub?: string;
}) {
  const n = useCountUp(value);
  const colors: Record<string, string> = {
    gold: "var(--gold)",
    electric: "var(--electric)",
    silver: "var(--silver)",
    success: "var(--success)",
    danger: "var(--danger)",
  };
  return (
    <Panel className="group p-4 hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        {typeof delta === "number" && (
          <Badge tone={delta >= 0 ? "success" : "danger"}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </Badge>
        )}
      </div>
      <div className="mt-2 font-display text-2xl tabular-nums" style={{ color: colors[tone] }}>
        {fmt(n, format)}
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      {series && <Sparkline data={series} color={colors[tone]} className="mt-3 h-8 w-full" />}
    </Panel>
  );
}

export function fmt(n: number, format: "number" | "currency" | "percent" | "compact" = "number") {
  if (format === "currency")
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: n >= 1000 ? 0 : 2,
    });
  if (format === "percent") return `${n.toFixed(1)}%`;
  if (format === "compact")
    return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
  return Math.round(n).toLocaleString("en-US");
}

/* ------------------------------------------------------------------ charts */

export function Sparkline({
  data,
  color = "var(--gold)",
  className,
}: {
  data: number[];
  color?: string;
  className?: string;
}) {
  const d = usePath(data);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <path d={d.line} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AreaChart({
  data,
  color = "var(--electric)",
  labels,
  height = 200,
}: {
  data: number[];
  color?: string;
  labels?: string[];
  height?: number;
}) {
  const d = usePath(data);
  const id = useMemo(() => `g${Math.random().toString(36).slice(2)}`, []);
  return (
    <div className="w-full">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ height }} className="w-full">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[10, 20, 30].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.07" strokeWidth="0.3" />
        ))}
        <path d={`${d.line} L100,40 L0,40 Z`} fill={`url(#${id})`} />
        <path d={d.line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function usePath(data: number[]) {
  return useMemo(() => {
    if (!data.length) return { line: "M0,40" };
    const max = Math.max(...data);
    const min = Math.min(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * 100;
      const y = 38 - ((v - min) / span) * 34;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return { line: `M${pts.join(" L")}` };
  }, [data]);
}

export function Donut({
  slices,
  size = 168,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="12" />
        {slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              strokeLinecap="butt"
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <ul className="min-w-40 flex-1 space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate text-muted-foreground">{s.label}</span>
            </span>
            <span className="tabular-nums">{((s.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bars({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{d.label}</span>
            <span className="tabular-nums">{fmt(d.value, "compact")}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-[width] duration-1000"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? "var(--gradient-gold)" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Schematic world map with plotted user density nodes. */
export function WorldMap({ nodes }: { nodes: { label: string; x: number; y: number; value: number }[] }) {
  const max = Math.max(...nodes.map((n) => n.value), 1);
  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full">
        {Array.from({ length: 25 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 4} x2={i * 4} y1="0" y2="50" stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.2" />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`h${i}`} x1="0" x2="100" y1={i * 4} y2={i * 4} stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.2" />
        ))}
        {nodes.map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r={1 + (n.value / max) * 3} fill="var(--electric)" fillOpacity="0.25" />
            <circle cx={n.x} cy={n.y} r={0.8} fill="var(--gold)" />
          </g>
        ))}
      </svg>
      <ul className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
        {nodes.slice(0, 6).map((n) => (
          <li key={n.label} className="rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] text-muted-foreground">
            {n.label} · {n.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ inputs */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCx =
  "w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--gold)]/60";

export function Toggle({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-white/10 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300",
          checked ? "border-[var(--gold)]/60 bg-[var(--gold)]/25" : "border-white/12 bg-white/5",
        )}
      >
        <span
          className="absolute top-0.5 h-4.5 w-4.5 rounded-full transition-transform duration-300"
          style={{
            left: 3,
            width: 18,
            height: 18,
            transform: `translateX(${checked ? 20 : 0}px)`,
            background: checked ? "var(--gradient-gold)" : "var(--silver)",
          }}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ drawer */

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <aside className="animate-slide-in-right relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-[color-mix(in_oklab,var(--surface-elevated)_92%,transparent)] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Close panel" className="rounded-lg border border-white/12 p-1.5 hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

/* --------------------------------------------------------------- data table */

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  searchKeys,
  filters,
  pageSize = 8,
  exportName,
  onRowClick,
  empty = "No records match the current filters.",
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T | string)[];
  filters?: { key: string; label: string; options: string[]; value: (row: T) => string }[];
  pageSize?: number;
  exportName?: string;
  onRowClick?: (row: T) => void;
  empty?: string;
  toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [active, setActive] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let out = rows;
    const term = q.trim().toLowerCase();
    if (term) {
      out = out.filter((r) =>
        (searchKeys ?? Object.keys(r)).some((k) =>
          String(r[k as keyof T] ?? "").toLowerCase().includes(term),
        ),
      );
    }
    for (const f of filters ?? []) {
      const v = active[f.key];
      if (v && v !== "All") out = out.filter((r) => f.value(r) === v);
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      out = [...out].sort((a, b) => {
        const av = col?.value ? col.value(a) : (a[sort.key as keyof T] as never);
        const bv = col?.value ? col.value(b) : (b[sort.key as keyof T] as never);
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
        return String(av).localeCompare(String(bv)) * sort.dir;
      });
    }
    return out;
  }, [rows, q, active, sort, columns, filters, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);

  function exportCsv() {
    const head = columns.map((c) => c.label).join(",");
    const body = filtered
      .map((r) =>
        columns
          .map((c) => `"${String(c.value ? c.value(r) : (r[c.key as keyof T] ?? "")).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName ?? "gf3x-export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search…"
            className={cx(inputCx, "py-1.5 pl-8 text-xs")}
          />
        </div>
        {(filters ?? []).map((f) => (
          <select
            key={f.key}
            aria-label={f.label}
            value={active[f.key] ?? "All"}
            onChange={(e) => {
              setActive((s) => ({ ...s, [f.key]: e.target.value }));
              setPage(1);
            }}
            className={cx(inputCx, "w-auto py-1.5 text-xs")}
          >
            {["All", ...f.options].map((o) => (
              <option key={o} value={o} className="bg-black">
                {f.label}: {o}
              </option>
            ))}
          </select>
        ))}
        {toolbar}
        {exportName && (
          <Button onClick={exportCsv} variant="outline">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className={cx("px-4 py-2.5 font-medium sm:px-5", c.className)}>
                  {c.sortable === false ? (
                    c.label
                  ) : (
                    <button
                      onClick={() =>
                        setSort((s) =>
                          s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 },
                        )
                      }
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.label}
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr
                key={String((r as { id?: string }).id ?? i)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cx(
                  "border-t border-white/6 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-white/5",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx("px-4 py-3 align-middle sm:px-5", c.className)}>
                    {c.render ? c.render(r) : String(r[c.key as keyof T] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-muted-foreground sm:px-5">
        <span>
          {filtered.length === 0 ? 0 : (current - 1) * pageSize + 1}–
          {Math.min(current * pageSize, filtered.length)} of {filtered.length}
        </span>
        <span className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            aria-label="Previous page"
            className="rounded-md border border-white/12 p-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-2 tabular-nums">
            {current} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={current === pages}
            aria-label="Next page"
            className="rounded-md border border-white/12 p-1 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    </div>
  );
}
