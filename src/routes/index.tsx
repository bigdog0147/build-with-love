import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CreditCard,
  Diamond,
  Eye,
  EyeOff,
  Gem,
  Landmark,
  LayoutDashboard,
  LineChart,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

// ---- Mock data ---------------------------------------------------------

const wallets = [
  { code: "USD", label: "US Dollar", balance: 482910.44, delta: 1.24, tint: "gold" },
  { code: "EUR", label: "Euro", balance: 216340.10, delta: 0.42, tint: "silver" },
  { code: "BTC", label: "Bitcoin", balance: 12.4183, fiat: 812430.00, delta: 3.87, tint: "electric" },
  { code: "XAU", label: "Gold (oz)", balance: 184.2, fiat: 452110.0, delta: -0.31, tint: "gold" },
] as const;

const allocations = [
  { label: "Equities", value: 42, color: "var(--gold)" },
  { label: "Fixed income", value: 21, color: "var(--silver)" },
  { label: "Digital assets", value: 19, color: "var(--electric)" },
  { label: "Commodities", value: 12, color: "oklch(0.72 0.17 155)" },
  { label: "Cash", value: 6, color: "oklch(0.55 0.02 260)" },
];

const transactions = [
  { id: "tx_9241", name: "SpaceX Series K", type: "Private equity", amount: -125000, currency: "USD", when: "Today, 10:42", status: "Cleared" },
  { id: "tx_9240", name: "Coupon — US Treasury 4.25%", type: "Fixed income", amount: 4820.55, currency: "USD", when: "Today, 08:00", status: "Cleared" },
  { id: "tx_9239", name: "BTC accumulation", type: "Digital asset", amount: -48250, currency: "USD", when: "Yesterday", status: "Cleared" },
  { id: "tx_9238", name: "Wire from Zurich Custody", type: "Transfer", amount: 250000, currency: "CHF", when: "Yesterday", status: "Cleared" },
  { id: "tx_9237", name: "Amex Centurion — Paris", type: "Card", amount: -3184.2, currency: "EUR", when: "Jul 18", status: "Pending" },
  { id: "tx_9236", name: "Dividend — LVMH", type: "Equity income", amount: 1920.4, currency: "EUR", when: "Jul 17", status: "Cleared" },
];

const cards = [
  { name: "Obsidian Reserve", last4: "7742", tier: "Metal · Unlimited", gradient: "linear-gradient(135deg, oklch(0.28 0.02 260), oklch(0.14 0.01 260))" },
  { name: "Aurum Signature", last4: "0318", tier: "Gold · Priority", gradient: "var(--gradient-gold)" },
  { name: "Voltaic Blue", last4: "5591", tier: "Digital · Instant", gradient: "var(--gradient-electric)" },
];

// A hand-authored 30-day performance path for a smooth SVG chart.
const perfPath = [
  38, 41, 39, 44, 47, 45, 49, 52, 50, 54, 58, 55, 60, 63, 61, 66, 64, 69, 72, 70,
  74, 78, 75, 80, 83, 81, 86, 88, 92, 96,
];

// ---- Helpers -----------------------------------------------------------

function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "BTC" ? 4 : 2,
  }).format(n);
}

function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ---- Component ---------------------------------------------------------

function DashboardPage() {
  const [showBalances, setShowBalances] = useState(true);
  const totalUsd = 1_963_790.54;

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 lg:px-8">
        <Sidebar />
        <main className="min-w-0 flex-1 space-y-6">
          <TopBar />
          <HeroPortfolio
            total={totalUsd}
            show={showBalances}
            onToggle={() => setShowBalances((s) => !s)}
          />
          <div className="grid gap-6 xl:grid-cols-3">
            <PerformanceCard />
            <AllocationCard />
          </div>
          <WalletsGrid show={showBalances} />
          <div className="grid gap-6 xl:grid-cols-3">
            <TransactionsCard />
            <CardsColumn />
          </div>
        </main>
      </div>
    </div>
  );
}

// ---- Sidebar -----------------------------------------------------------

function Sidebar() {
  const nav = [
    { icon: LayoutDashboard, label: "Overview", active: true },
    { icon: Wallet, label: "Wallets" },
    { icon: LineChart, label: "Portfolio" },
    { icon: CreditCard, label: "Cards" },
    { icon: Landmark, label: "Transfers" },
    { icon: Gem, label: "Private markets" },
    { icon: Shield, label: "Security" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 flex-col justify-between rounded-2xl p-5 lg:flex glass">
      <div>
        <div className="mb-8 flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-base leading-none">Gigafactory 3</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Private Bank
            </div>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={classNames(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="rounded-xl border border-border/70 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
          Concierge
        </div>
        <div className="mt-1 text-sm">Available 24/7</div>
        <button className="mt-3 w-full rounded-md bg-foreground/95 px-3 py-1.5 text-xs font-medium text-background">
          Call your advisor
        </button>
      </div>
    </aside>
  );
}

// ---- Top bar -----------------------------------------------------------

function TopBar() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search accounts, holdings, transactions…"
          className="w-full rounded-xl border border-border bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--gold)]/60"
        />
      </div>
      <button className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-[var(--surface)] text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-[var(--surface)] py-1.5 pl-1.5 pr-3">
        <div
          className="grid h-8 w-8 place-items-center rounded-lg font-display text-sm text-primary-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          EM
        </div>
        <div className="hidden text-xs leading-tight sm:block">
          <div className="font-medium">Elena Marchetti</div>
          <div className="text-muted-foreground">Tier · Obsidian</div>
        </div>
      </div>
    </div>
  );
}

// ---- Hero portfolio ----------------------------------------------------

function HeroPortfolio({
  total,
  show,
  onToggle,
}: {
  total: number;
  show: boolean;
  onToggle: () => void;
}) {
  const actions = [
    { icon: Send, label: "Transfer" },
    { icon: Plus, label: "Deposit" },
    { icon: TrendingUp, label: "Invest" },
    { icon: CreditCard, label: "New card" },
  ];
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border p-8"
      style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-electric)" }}
      />
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
            <span className="text-muted-foreground">+$41,208.90 · past 24h</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(({ icon: Icon, label }, i) => (
            <button
              key={label}
              className={classNames(
                "group flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition-all hover:-translate-y-0.5",
                i === 0 && "text-primary-foreground",
              )}
              style={
                i === 0
                  ? { background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }
                  : { background: "color-mix(in oklab, var(--surface-elevated) 80%, transparent)" }
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Performance chart -------------------------------------------------

function PerformanceCard() {
  const w = 640;
  const h = 220;
  const max = Math.max(...perfPath);
  const min = Math.min(...perfPath);
  const step = w / (perfPath.length - 1);
  const y = (v: number) => h - ((v - min) / (max - min)) * (h - 20) - 10;
  const d = perfPath.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${y(v)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;

  return (
    <div className="rounded-2xl border border-border p-6 xl:col-span-2 glass">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Performance
          </div>
          <div className="mt-1 font-display text-2xl">Last 30 days</div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 text-xs">
          {["1W", "1M", "3M", "1Y", "All"].map((r, i) => (
            <button
              key={r}
              className={classNames(
                "rounded-md px-3 py-1.5 transition-colors",
                i === 1
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
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
        <Stat label="Return" value="+18.42%" positive />
        <Stat label="Volatility" value="6.1%" />
        <Stat label="Sharpe" value="2.31" positive />
      </div>
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={classNames(
          "mt-1 font-display text-lg",
          positive && "text-[var(--success)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ---- Allocation --------------------------------------------------------

function AllocationCard() {
  const total = allocations.reduce((s, a) => s + a.value, 0);
  let acc = 0;
  const R = 70;
  const C = 2 * Math.PI * R;
  return (
    <div className="rounded-2xl border border-border p-6 glass">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Allocation
      </div>
      <div className="mt-1 font-display text-2xl">Asset mix</div>
      <div className="mt-6 flex items-center gap-6">
        <svg viewBox="0 0 180 180" className="h-40 w-40 -rotate-90">
          <circle cx="90" cy="90" r={R} stroke="var(--muted)" strokeWidth="18" fill="none" />
          {allocations.map((a) => {
            const dash = (a.value / total) * C;
            const el = (
              <circle
                key={a.label}
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
            <li key={a.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: a.color }}
                />
                <span className="text-muted-foreground">{a.label}</span>
              </span>
              <span className="font-medium tabular-nums">{a.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- Wallets grid ------------------------------------------------------

function WalletsGrid({ show }: { show: boolean }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Wallets
          </div>
          <h2 className="font-display text-xl">Multi-currency holdings</h2>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground">
          View all →
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {wallets.map((w) => {
          const positive = w.delta >= 0;
          const tintColor =
            w.tint === "gold" ? "var(--gold)" : w.tint === "electric" ? "var(--electric)" : "var(--silver)";
          return (
            <div
              key={w.code}
              className="group relative overflow-hidden rounded-2xl border border-border p-5 glass"
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
                    <div className="text-sm">{w.label}</div>
                    <div className="text-[11px] text-muted-foreground">Wallet · {w.code}</div>
                  </div>
                </div>
                <span
                  className={classNames(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px]",
                    positive
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : "bg-[var(--danger)]/10 text-[var(--danger)]",
                  )}
                >
                  {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {positive ? "+" : ""}
                  {w.delta}%
                </span>
              </div>
              <div className="mt-5">
                <div className="font-display text-2xl tabular-nums">
                  {show
                    ? w.code === "BTC"
                      ? `${w.balance} BTC`
                      : w.code === "XAU"
                      ? `${w.balance} oz`
                      : money(w.balance, w.code)
                    : "••••••"}
                </div>
                {"fiat" in w && show && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    ≈ {money(w.fiat!)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- Transactions ------------------------------------------------------

function TransactionsCard() {
  return (
    <div className="rounded-2xl border border-border p-6 xl:col-span-2 glass">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Activity
          </div>
          <h2 className="font-display text-xl">Recent transactions</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 text-xs">
          {["All", "Trades", "Transfers", "Cards"].map((t, i) => (
            <button
              key={t}
              className={classNames(
                "rounded-md px-3 py-1.5",
                i === 0
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 divide-y divide-border/60">
        {transactions.map((t) => {
          const positive = t.amount >= 0;
          return (
            <div key={t.id} className="flex items-center gap-4 py-3.5">
              <div
                className={classNames(
                  "grid h-10 w-10 place-items-center rounded-xl border",
                  positive
                    ? "border-[var(--success)]/25 bg-[var(--success)]/10 text-[var(--success)]"
                    : "border-border bg-[var(--surface)] text-muted-foreground",
                )}
              >
                {positive ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.type} · {t.when}
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <span
                  className={classNames(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    t.status === "Cleared"
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : "bg-[var(--gold)]/10 text-[var(--gold)]",
                  )}
                >
                  {t.status}
                </span>
              </div>
              <div
                className={classNames(
                  "w-32 text-right font-display tabular-nums",
                  positive ? "text-[var(--success)]" : "text-foreground",
                )}
              >
                {positive ? "+" : "−"}
                {money(Math.abs(t.amount), t.currency)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Cards column ------------------------------------------------------

function CardsColumn() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border p-6 glass">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Cards
            </div>
            <h2 className="font-display text-xl">Your instruments</h2>
          </div>
          <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {cards.map((c) => (
            <div
              key={c.last4}
              className="relative overflow-hidden rounded-xl p-4 text-primary-foreground"
              style={{ background: c.gradient, boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg">{c.name}</div>
                  <div className="text-[11px] opacity-80">{c.tier}</div>
                </div>
                <Diamond className="h-5 w-5 opacity-90" />
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div className="font-mono text-sm tracking-widest opacity-90">
                  •••• •••• •••• {c.last4}
                </div>
                <div className="text-[10px] uppercase tracking-widest opacity-75">
                  Gigafactory
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="rounded-2xl border border-border p-6"
        style={{ background: "var(--gradient-surface)" }}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--gold)]">
          <Sparkles className="h-3.5 w-3.5" />
          Invitation
        </div>
        <div className="mt-2 font-display text-lg">
          Access the <span className="gold-text">Obsidian Vault</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated private markets, off-market real estate, and rare-asset syndicates —
          by invitation only.
        </p>
        <button
          className="mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          Request access
        </button>
      </div>
    </div>
  );
}
