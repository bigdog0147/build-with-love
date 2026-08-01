import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { Suspense, useState } from "react";
import { getDashboard, type Allocation, type Card, type Transaction, type Wallet as WalletT } from "@/lib/dashboard.functions";
import { computeCompletion, getKyc, statusMeta } from "@/lib/kyc.functions";
import { DashShell, cx as classNames, money } from "@/components/dashboard-chrome";
import { QuickActions } from "@/components/quick-actions";

const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Member Dashboard — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Your private Gigafactory 3X member portal: account balances, portfolio performance, cards, transfers and verification status in one secure cockpit.",
      },
      { property: "og:title", content: "Member Dashboard — Gigafactory 3X Portal" },
      {
        property: "og:description",
        content:
          "Secure member portal for Gigafactory 3X account holders: balances, performance, cards, transfers and verification.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading your cockpit…</div>
  ),
});

// Hand-authored performance series per timeframe for the SVG chart.
const PERF_SERIES: Record<string, number[]> = {
  "1W": [72, 74, 73, 77, 79, 78, 82],
  "1M": [
    38, 41, 39, 44, 47, 45, 49, 52, 50, 54, 58, 55, 60, 63, 61, 66, 64, 69, 72, 70,
    74, 78, 75, 80, 83, 81, 86, 88, 92, 96,
  ],
  "3M": [20, 26, 24, 31, 36, 33, 42, 48, 45, 55, 62, 58, 68, 74, 71, 80, 88, 96],
  "1Y": [10, 18, 15, 26, 34, 30, 41, 52, 47, 60, 72, 68, 79, 88, 96],
  All: [4, 9, 7, 16, 25, 22, 34, 45, 41, 57, 68, 64, 78, 85, 91, 100],
};

const PERF_STATS: Record<string, { ret: string; vol: string; sharpe: string }> = {
  "1W": { ret: "+2.86%", vol: "4.2%", sharpe: "1.94" },
  "1M": { ret: "+18.42%", vol: "6.1%", sharpe: "2.31" },
  "3M": { ret: "+34.10%", vol: "8.4%", sharpe: "2.08" },
  "1Y": { ret: "+62.75%", vol: "11.9%", sharpe: "1.87" },
  All: { ret: "+184.20%", vol: "14.3%", sharpe: "1.71" },
};

function DashboardPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const [showBalances, setShowBalances] = useState(true);

  // Total net worth in USD equivalent. Fall back to the wallet's own balance
  // when fiat_value is missing so non-USD wallets (e.g. EUR) aren't silently
  // dropped from the headline figure.
  const totalUsd = data.wallets.reduce((sum, w) => {
    if (w.code === "USD") return sum + Number(w.balance);
    const fiat = w.fiat_value == null ? Number(w.balance) : Number(w.fiat_value);
    return sum + (Number.isFinite(fiat) ? fiat : 0);
  }, 0);

  return (
    <DashShell>
      <AccountStatusPanel />
      <HeroPortfolio
        total={totalUsd}
        show={showBalances}
        wallets={data.wallets}
        onToggle={() => setShowBalances((s) => !s)}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <PerformanceCard />
        <AllocationCard allocations={data.allocations} />
      </div>
      <WalletsGrid wallets={data.wallets} show={showBalances} />
      <div className="grid gap-6 xl:grid-cols-3">
        <TransactionsCard transactions={data.transactions} show={showBalances} />
        <CardsColumn cards={data.cards} />
      </div>
    </DashShell>
  );
}

function HeroPortfolio({
  total,
  show,
  onToggle,
  wallets,
}: {
  total: number;
  show: boolean;
  onToggle: () => void;
  wallets: WalletT[];
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border p-8"
      style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-gold)" }} />
      <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-electric)" }} />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Total net worth
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <h1 className="gold-text font-display text-5xl sm:text-6xl">
              {show ? money(total) : "•••••••••"}
            </h1>
            <button
              onClick={onToggle}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide balances" : "Show balances"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-2.5 py-1 text-[var(--success)]">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +2.14% today
            </span>
            <span className="text-muted-foreground">Live across all wallets</span>
          </div>
        </div>
        <QuickActions wallets={wallets} />
      </div>
    </section>
  );
}

function PerformanceCard() {
  const [range, setRange] = useState("1M");
  const series = PERF_SERIES[range];
  const stats = PERF_STATS[range];
  const w = 640;
  const h = 220;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const step = w / (series.length - 1);
  const y = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 20) - 10;
  const d = series.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${y(v)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;

  return (
    <div className="rounded-2xl border border-border p-6 xl:col-span-2 glass">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Performance</div>
          <div className="mt-1 font-display text-2xl">
            {range === "All" ? "All time" : `Last ${range}`}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 text-xs">
          {Object.keys(PERF_SERIES).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={classNames(
                "rounded-md px-3 py-1.5 transition-colors",
                range === r ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full">
          <defs>
            <linearGradient id="perf-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="perf-stroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="oklch(0.72 0.19 245)" />
              <stop offset="100%" stopColor="oklch(0.86 0.14 88)" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#perf-fill)" />
          <path d={d} fill="none" stroke="url(#perf-stroke)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
        <Stat label="Return" value={stats.ret} positive />
        <Stat label="Volatility" value={stats.vol} />
        <Stat label="Sharpe" value={stats.sharpe} positive />
      </div>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={classNames("mt-1 font-display text-lg", positive && "text-[var(--success)]")}>{value}</div>
    </div>
  );
}

function AllocationCard({ allocations }: { allocations: Allocation[] }) {
  const total = allocations.reduce((s, a) => s + Number(a.percent), 0) || 1;
  let acc = 0;
  const R = 70;
  const C = 2 * Math.PI * R;
  return (
    <div className="rounded-2xl border border-border p-6 glass">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Allocation</div>
          <div className="mt-1 font-display text-2xl">Asset mix</div>
        </div>
        <RouterLink to="/portfolio" className="text-xs text-muted-foreground hover:text-foreground">
          Details →
        </RouterLink>
      </div>
      <div className="mt-6 flex items-center gap-6">
        <svg viewBox="0 0 180 180" className="h-40 w-40 -rotate-90">
          <circle cx="90" cy="90" r={R} stroke="var(--muted)" strokeWidth="18" fill="none" />
          {allocations.map((a) => {
            const dash = (Number(a.percent) / total) * C;
            const el = (
              <circle
                key={a.id}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-acc}
                strokeLinecap="butt"
              />
            );
            acc += dash;
            return el;
          })}
        </svg>
        <ul className="flex-1 space-y-2 text-sm">
          {allocations.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: a.color }} />
                <span className="text-muted-foreground">{a.label}</span>
              </span>
              <span className="font-medium tabular-nums">{Number(a.percent)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WalletsGrid({ wallets, show }: { wallets: WalletT[]; show: boolean }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Wallets</div>
          <h2 className="font-display text-xl">Multi-currency holdings</h2>
        </div>
        <RouterLink to="/wallets" className="text-xs text-muted-foreground hover:text-foreground">
          View all →
        </RouterLink>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {wallets.map((w) => {
          const delta = Number(w.delta_pct);
          const positive = delta >= 0;
          const tintColor =
            w.tint === "gold" ? "var(--gold)" : w.tint === "electric" ? "var(--electric)" : "var(--silver)";
          const balance = Number(w.balance);
          const fiat = w.fiat_value == null ? null : Number(w.fiat_value);
          return (
            <RouterLink
              to="/wallets"
              key={w.id}
              className="group relative block overflow-hidden rounded-2xl border border-border p-5 glass transition-transform hover:-translate-y-0.5"
            >
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ background: tintColor }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-lg font-display text-xs"
                    style={{
                      background: `color-mix(in oklab, ${tintColor} 15%, transparent)`,
                      color: tintColor,
                      border: `1px solid color-mix(in oklab, ${tintColor} 30%, transparent)`,
                    }}
                  >
                    {w.code}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{w.label}</div>
                    <div className="text-[11px] text-muted-foreground">Wallet · {w.code}</div>
                  </div>
                </div>
                <span
                  className={classNames(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    positive
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : "bg-[var(--danger)]/10 text-[var(--danger)]",
                  )}
                >
                  {positive ? "+" : ""}
                  {delta.toFixed(2)}%
                </span>
              </div>
              <div className="mt-5">
                <div className="font-display text-2xl">
                  {show ? money(balance, w.code) : "••••••"}
                </div>
                {fiat != null && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    ≈ {show ? money(fiat, "USD") : "••••••"}
                  </div>
                )}
              </div>
            </RouterLink>
          );
        })}
      </div>
    </section>
  );
}

function TransactionsCard({ transactions, show }: { transactions: Transaction[]; show: boolean }) {
  return (
    <div className="rounded-2xl border border-border p-6 xl:col-span-2 glass">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Activity</div>
          <div className="mt-1 font-display text-2xl">Recent transactions</div>
        </div>
        <RouterLink to="/transfers" className="text-xs text-muted-foreground hover:text-foreground">
          View statement →
        </RouterLink>
      </div>
      <div className="mt-5 divide-y divide-border/60">
        {transactions.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No transactions yet.</div>
        )}
        {transactions.map((t) => {
          const amount = Number(t.amount);
          const positive = amount >= 0;
          return (
            <div key={t.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={classNames(
                    "grid h-9 w-9 place-items-center rounded-lg",
                    positive
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : "bg-[var(--danger)]/10 text-[var(--danger)]",
                  )}
                >
                  {positive ? "+" : "−"}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.kind} · {new Date(t.occurred_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={classNames("font-display text-sm tabular-nums", positive ? "text-[var(--success)]" : "")}>
                  {show ? (positive ? "+" : "") + money(amount, t.currency) : "••••"}
                </div>
                <div
                  className={classNames(
                    "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px]",
                    t.status === "Pending"
                      ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardsColumn({ cards }: { cards: Card[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-6 glass">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Cards</div>
            <div className="mt-1 font-display text-2xl">Your metal collection</div>
          </div>
          <RouterLink to="/cards" className="text-xs text-muted-foreground hover:text-foreground">
            Manage →
          </RouterLink>
        </div>
        <div className="mt-5 space-y-3">
          {cards.map((c) => (
            <RouterLink
              to="/cards"
              key={c.id}
              className="relative block overflow-hidden rounded-xl p-4 text-white"
              style={{ background: c.gradient, minHeight: 120 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] opacity-80">{c.tier}</div>
                  <div className="mt-1 font-display text-lg">{c.name}</div>
                </div>
                <CreditCard className="h-5 w-5 opacity-80" />
              </div>
              <div className="mt-6 font-mono text-sm tracking-widest opacity-90">
                •••• •••• •••• {c.last4}
              </div>
            </RouterLink>
          ))}
          {cards.length === 0 && <p className="text-sm text-muted-foreground">No cards yet.</p>}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-border p-6"
        style={{ background: "var(--gradient-surface)" }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Invitation</div>
          <div className="mt-1 font-display text-2xl">Obsidian Vault</div>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Private-market allocations, custody in Zurich, dedicated advisor. By invitation.
          </p>
          <RouterLink
            to="/private-markets"
            className="mt-4 inline-block rounded-xl px-4 py-2 text-xs font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            Request access
          </RouterLink>
        </div>
      </div>
    </div>
  );
}

function AccountStatusPanel() {
  const { data: kyc } = useQuery({ queryKey: ["kyc"], queryFn: () => getKyc() });
  if (!kyc) return null;
  const pct = computeCompletion(kyc);
  const status = statusMeta(kyc.id_status);
  const items = [
    { label: "Email verified", ok: kyc.email_verified },
    { label: "Phone verified", ok: kyc.phone_verified },
    { label: "Identity documents", ok: kyc.id_status !== "not_started" },
    { label: "Two-factor auth", ok: kyc.two_factor_enabled },
    { label: "Compliance profile", ok: !!kyc.tax_country && !!kyc.source_of_funds },
  ];
  const verified = kyc.id_status === "verified";
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border p-5"
      style={{ background: "var(--gradient-surface)" }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--gradient-gold)" }}>
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-display text-lg">Account status</div>
            <span className={"rounded-full px-2 py-0.5 text-[11px] " + status.className}>{status.label}</span>
            <span className="text-xs text-muted-foreground">Profile completion {pct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-elevated)]">
            <div className="h-full rounded-full" style={{ width: pct + "%", background: "var(--gradient-gold)" }} />
          </div>
          <ul className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {items.map((it) => (
              <li
                key={it.label}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 " +
                  (it.ok
                    ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                    : "border-border text-muted-foreground")
                }
              >
                <span className={"h-1.5 w-1.5 rounded-full " + (it.ok ? "bg-current" : "bg-muted-foreground/40")} />
                {it.label}
              </li>
            ))}
          </ul>
          {!verified && (
            <p className="mt-3 text-xs text-muted-foreground">
              Complete identity verification to unlock transfers, private markets, and institutional research.
            </p>
          )}
        </div>
        <RouterLink
          to="/verify"
          className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          {verified ? "Review profile" : "Continue verification"}
        </RouterLink>
      </div>
    </section>
  );
}
