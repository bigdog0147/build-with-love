import { Link as RouterLink, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Banknote,
  History,
  Bell,
  BellRing,
  FileText,
  LifeBuoy,
  CreditCard,
  Diamond,
  FileBarChart,
  FolderOpen,
  Handshake,
  Store,
  Gem,
  Landmark,
  LayoutDashboard,
  LineChart,
  LogOut,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { type ReactNode } from "react";
import { getDashboard } from "@/lib/dashboard.functions";
import { getUnreadNotificationCount } from "@/lib/customer.functions";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { supabase } from "@/integrations/supabase/client";

export function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { icon: LayoutDashboard, label: "Overview", to: "/dashboard" as const },
    { icon: Wallet, label: "Wallets", to: "/wallets" as const },
    { icon: LineChart, label: "Portfolio", to: "/portfolio" as const },
    { icon: CreditCard, label: "Cards", to: "/cards" as const },
    { icon: Landmark, label: "Transfers", to: "/transfers" as const },
    { icon: Banknote, label: "Withdrawals", to: "/withdrawals" as const },
    { icon: History, label: "Transactions", to: "/transactions" as const },
    { icon: Store, label: "Marketplace", to: "/marketplace" as const },
    { icon: Handshake, label: "Capital raising", to: "/capital-raising" as const },
    { icon: FileBarChart, label: "Statements", to: "/statements" as const },
    { icon: FolderOpen, label: "Document library", to: "/library" as const },
    { icon: Gem, label: "Private markets", to: "/private-markets" as const },
    { icon: ShieldCheck, label: "Verification", to: "/verify" as const },
    { icon: BadgeCheck, label: "Review status", to: "/verification-status" as const },
    { icon: Bell, label: "Notifications", to: "/notifications" as const },
    { icon: BellRing, label: "Notification settings", to: "/notification-settings" as const },
    { icon: FileText, label: "Documents", to: "/documents" as const },
    { icon: LifeBuoy, label: "Support", to: "/support" as const },
    { icon: Shield, label: "Security", to: "/security" as const },
    { icon: Settings, label: "Settings", to: "/settings" as const },
  ];

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 flex-col justify-between rounded-2xl p-5 lg:flex glass">
      <div className="min-h-0 overflow-y-auto">
        <RouterLink to="/dashboard" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--gradient-gold)" }}>
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-base leading-none">Gigafactory 3</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Private Bank</div>
          </div>
        </RouterLink>
        <nav className="space-y-1">
          {nav.map(({ icon: Icon, label, to }) => {
            const active = pathname === to;
            return (
              <RouterLink
                key={label}
                to={to}
                className={cx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />}
              </RouterLink>
            );
          })}
        </nav>
      </div>
      <div className="rounded-xl border border-border/70 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
          Concierge
        </div>
        <div className="mt-1 text-sm">Available 24/7</div>
        <RouterLink
          to="/contact"
          className="mt-3 block w-full rounded-md bg-foreground/95 px-3 py-1.5 text-center text-xs font-medium text-background"
        >
          Call your advisor
        </RouterLink>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { label: "Overview", to: "/dashboard" as const },
    { label: "Wallets", to: "/wallets" as const },
    { label: "Portfolio", to: "/portfolio" as const },
    { label: "Cards", to: "/cards" as const },
    { label: "Transfers", to: "/transfers" as const },
    { label: "Withdrawals", to: "/withdrawals" as const },
    { label: "Transactions", to: "/transactions" as const },
    { label: "Marketplace", to: "/marketplace" as const },
    { label: "Capital raising", to: "/capital-raising" as const },
    { label: "Statements", to: "/statements" as const },
    { label: "Library", to: "/library" as const },
    { label: "Private markets", to: "/private-markets" as const },
    { label: "Verification", to: "/verify" as const },
    { label: "Review status", to: "/verification-status" as const },
    { label: "Notifications", to: "/notifications" as const },
    { label: "Notification settings", to: "/notification-settings" as const },
    { label: "Documents", to: "/documents" as const },
    { label: "Support", to: "/support" as const },
    { label: "Security", to: "/security" as const },
    { label: "Settings", to: "/settings" as const },
  ];
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
      {items.map((i) => (
        <RouterLink
          key={i.to}
          to={i.to}
          className={cx(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs",
            pathname === i.to
              ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          {i.label}
        </RouterLink>
      ))}
    </div>
  );
}

function NotificationBell() {
  const fetchUnread = useServerFn(getUnreadNotificationCount);
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => fetchUnread({} as never),
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
  const count = data?.count ?? 0;

  useRealtimeNotifications("portal-unread-notifications");

  const label = count > 0 ? `${count} unread notification${count === 1 ? "" : "s"}` : "Notifications";

  return (
    <RouterLink
      to="/notifications"
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-[var(--surface)] text-muted-foreground hover:text-foreground"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold text-[var(--destructive-foreground)]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </RouterLink>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchDashboard = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard({} as never) });
  const profile = data?.profile;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
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
      <NotificationBell />
      <RouterLink
        to="/settings"
        className="flex items-center gap-3 rounded-xl border border-border bg-[var(--surface)] py-1.5 pl-1.5 pr-3"
      >
        <div
          className="grid h-8 w-8 place-items-center rounded-lg font-display text-sm text-primary-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          {profile?.initials ?? "…"}
        </div>
        <div className="hidden text-xs leading-tight sm:block">
          <div className="font-medium">{profile?.display_name ?? "Client"}</div>
          <div className="text-muted-foreground">Tier · {profile?.tier ?? "—"}</div>
        </div>
      </RouterLink>
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

export function DashShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 lg:px-8">
        <Sidebar />
        <main className="min-w-0 flex-1 space-y-6">
          <TopBar />
          <MobileNav />
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <header>
      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</div>
      <h1 className="mt-1 font-display text-3xl">{title}</h1>
      {sub && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
    </header>
  );
}

export function money(n: number, currency = "USD", frac?: number) {
  const isCrypto = currency === "BTC" || currency === "ETH";
  if (isCrypto || currency === "XAU") {
    return `${n.toLocaleString("en-US", { maximumFractionDigits: frac ?? (isCrypto ? 4 : 2) })} ${currency}`;
  }
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: frac ?? 2 }).format(n);
  } catch {
    return `${n.toLocaleString("en-US")} ${currency}`;
  }
}
