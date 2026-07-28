import { createFileRoute, useNavigate, Link as RouterLink } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
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
  LogOut,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Suspense, useState } from "react";
import { getDashboard, type Allocation, type Card, type Transaction, type Wallet as WalletT } from "@/lib/dashboard.functions";
import { computeCompletion, getKyc, statusMeta } from "@/lib/kyc.functions";
import { supabase } from "@/integrations/supabase/client";

const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — Gigafactory 3" },
      { name: "description", content: "Your private banking cockpit." },
    ],
  }),
  pendingComponent: () => (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading your cockpit…</div>
  ),
});

// A hand-authored 30-day performance path for the SVG chart.
const perfPath = [
  38, 41, 39, 44, 47, 45, 49, 52, 50, 54, 58, 55, 60, 63, 61, 66, 64, 69, 72, 70,
  74, 78, 75, 80, 83, 81, 86, 88, 92, 96,
];

function money(n: number, currency = "USD", frac?: number) {
  const isCrypto = currency === "BTC" || currency === "ETH";
  if (isCrypto || currency === "XAU") {
    return `${n.toLocaleString("en-US", { maximumFractionDigits: frac ?? (isCrypto ? 4 : 2) })} ${currency}`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: frac ?? 2,
    }).format(n);
  } catch {
    return `${n.toLocaleString("en-US")} ${currency}`;
  }
}

function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

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
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 lg:px-8">
        <Sidebar />
        <main className="min-w-0 flex-1 space-y-6">
          <TopBar displayName={data.profile.display_name} initials={data.profile.initials} tier={data.profile.tier} />
          <AccountStatusPanel />
          <HeroPortfolio
            total={totalUsd}
            show={showBalances}
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
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const nav = [
    { icon: LayoutDashboard, label: "Overview", active: true },
    { icon: Wallet, label: "Wallets" },
    { icon: LineChart, label: "Portfolio" },
    { icon: CreditCard, label: "Cards" },
    { icon: Landmark, label: "Transfers" },
    { icon: Gem, label: "Private markets" },
    { icon: ShieldCheck, label: "Verification", to: "/verify" },
    { icon: Shield, label: "Security" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 flex-col justify-between rounded-2xl p-5 lg:flex glass">
      <div>
        <div className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--gradient-gold)" }}>
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-base leading-none">Gigafactory 3</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Private Bank</div>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={classNames(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />}
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

function TopBar({ displayName, initials, tier }: { displayName: string; initials: string; tier: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

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
          {initials}
        </div>
        <div className="hidden text-xs leading-tight sm:block">
          <div className="font-medium">{displayName}</div>
          <div className="text-muted-foreground">Tier · {tier}</div>
        </div>
      </div>
      <button
        onClick={signOut}
        title="Sign out"
        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-[var(--surface)] text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function HeroPortfolio({ total, show, onToggle }: { total: number; show: boolean; onToggle: () => void }) {
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
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Performance</div>
          <div className="mt-1 font-display text-2xl">Last 30 days</div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 text-xs">
          {["1W", "1M", "3M", "1Y", "All"].map((r, i) => (
            <button
              key={r}
              className={classNames(
                "rounded-md px-3 py-1.5 transition-colors",
                i === 1 ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
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
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Allocation</div>
      <div className="mt-1 font-display text-2xl">Asset mix</div>
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
        <button className="text-xs text-muted-foreground hover:text-foreground">View all →</button>
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
            <div key={w.id} className="group relative overflow-hidden rounded-2xl border border-border p-5 glass">
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
            </div>
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
        <button className="text-xs text-muted-foreground hover:text-foreground">View statement →</button>
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
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Cards</div>
        <div className="mt-1 font-display text-2xl">Your metal collection</div>
        <div className="mt-5 space-y-3">
          {cards.map((c) => (
            <div
              key={c.id}
              className="relative overflow-hidden rounded-xl p-4 text-white"
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
            </div>
          ))}
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
          <button
            className="mt-4 rounded-xl px-4 py-2 text-xs font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            Request access
          </button>
        </div>
      </div>
    </div>
  );
}

// Suppress unused-import warning for useServerFn if router preloader tree-shakes it.
void useServerFn;

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
