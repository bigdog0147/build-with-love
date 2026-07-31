import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  Bell,
  BarChart3,
  ChevronDown,
  Cog,
  Factory,
  Gauge,
  Globe,
  Layers,
  LogOut,
  Lock,
  Menu,
  Plug,
  Search,
  Shield,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ADMIN_NAV, ALL_NAV_ITEMS, navHref, type NavGroup } from "@/lib/admin-nav";
import { getAdminStatus } from "@/lib/social.functions";
import { getMyAdminAccount } from "@/lib/admin-account.functions";

import { supabase } from "@/integrations/supabase/client";
import { cx, Badge } from "./kit";

const ICONS: Record<NavGroup["icon"], typeof Gauge> = {
  gauge: Gauge,
  users: Users,
  shield: Shield,
  wallet: Wallet,
  factory: Factory,
  layers: Layers,
  bell: Bell,
  chart: BarChart3,
  globe: Globe,
  lock: Lock,
  plug: Plug,
  cog: Cog,
};

function useCurrent() {
  return useRouterState({
    select: (s) => ({ path: s.location.pathname, search: s.location.searchStr }),
  });
}

function NavTree({ onNavigate }: { onNavigate?: () => void }) {
  const { path, search } = useCurrent();
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const g of ADMIN_NAV) state[g.label] = g.items.some((i) => i.to === path);
    state.Command = true;
    return state;
  });

  return (
    <nav className="space-y-1.5">
      {ADMIN_NAV.map((group) => {
        const Icon = ICONS[group.icon];
        const expanded = open[group.label] ?? false;
        const groupActive = group.items.some((i) => i.to === path);
        return (
          <div key={group.label}>
            <button
              onClick={() => setOpen((s) => ({ ...s, [group.label]: !s[group.label] }))}
              aria-expanded={expanded}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs uppercase tracking-[0.16em] transition-colors",
                groupActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cx("h-4 w-4 shrink-0", groupActive && "text-[var(--gold)]")} />
              <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
              <ChevronDown className={cx("h-3.5 w-3.5 transition-transform duration-300", expanded && "rotate-180")} />
            </button>
            <div
              className="grid overflow-hidden transition-[grid-template-rows] duration-300"
              style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
            >
              <ul className="ml-4 min-h-0 space-y-0.5 border-l border-white/8 pl-3">
                {group.items.map((item) => {
                  const href = navHref(item);
                  const active =
                    path === item.to && (!item.tab || search.includes(`tab=${item.tab}`) || (!search && item.tab === group.items.find((i) => i.to === item.to)?.tab));
                  return (
                    <li key={item.label + href}>
                      <Link
                        to={item.to as never}
                        search={(item.tab ? { tab: item.tab } : {}) as never}
                        onClick={onNavigate}
                        className={cx(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-all duration-200",
                          active
                            ? "bg-white/8 text-foreground shadow-[inset_0_0_0_1px_oklch(0.82_0.14_85/25%)]"
                            : "text-muted-foreground hover:translate-x-0.5 hover:text-foreground",
                        )}
                      >
                        <span className="min-w-0 truncate">{item.label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/admin" className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm text-[var(--gold-foreground)]"
        style={{ background: "var(--gradient-gold)" }}
      >
        3X
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-sm leading-none">Gigafactory 3X</span>
        <span className="block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Control Center</span>
      </span>
    </Link>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const items = ALL_NAV_ITEMS;
    if (!t) return items.slice(0, 8);
    return items
      .filter((i) => `${i.label} ${i.group} ${i.keywords ?? ""}`.toLowerCase().includes(t))
      .slice(0, 10);
  }, [q]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-24">
      <button aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="animate-scale-in relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/12 bg-[color-mix(in_oklab,var(--surface-elevated)_94%,transparent)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a module…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-white/12 px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.map((r) => (
            <li key={r.group + r.label}>
              <button
                onClick={() => {
                  navigate({ to: r.to as never, search: (r.tab ? { tab: r.tab } : {}) as never });
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/8"
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">{r.group}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No module found.</li>}
        </ul>
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  eyebrow,
  sub,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  sub?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const navigate = useNavigate();
  const fetchAdmin = useServerFn(getAdminStatus);
  const admin = useQuery({ queryKey: ["admin-status"], queryFn: () => fetchAdmin({}), retry: false });
  const fetchAdminAccount = useServerFn(getMyAdminAccount);
  const adminAccount = useQuery({
    queryKey: ["admin-account"],
    queryFn: () => fetchAdminAccount({}),
    retry: false,
  });

  // Force rotation of the initial administrator password before anything else.
  useEffect(() => {
    if (adminAccount.data?.must_change_password) {
      navigate({ to: "/change-password", replace: true });
    }
  }, [adminAccount.data?.must_change_password, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  if (admin.isSuccess && !admin.data.isAdmin) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6 text-center">
        <div>
          <Lock className="mx-auto h-8 w-8 text-[var(--danger)]" />
          <h1 className="mt-4 font-display text-3xl">403 Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The GF3X administration portal is isolated from customer accounts. This session has no
            administrator privileges and the attempt has been logged.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-block rounded-lg border border-white/12 px-4 py-2 text-sm hover:bg-white/5"
          >
            Return to your customer dashboard
          </Link>
        </div>
      </main>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }


  return (
    <div className="min-h-screen">
      <CommandPalette open={palette} onClose={() => setPalette(false)} />

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" onClick={() => setDrawer(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <aside className="animate-slide-in-right absolute inset-y-0 left-0 w-[86%] max-w-xs overflow-y-auto border-r border-white/10 bg-[color-mix(in_oklab,var(--surface-elevated)_94%,transparent)] p-4">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Brand />
              <button onClick={() => setDrawer(false)} aria-label="Close" className="rounded-lg border border-white/12 p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavTree onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-[1680px] gap-6 px-3 py-4 sm:px-5 lg:px-8 lg:py-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--surface-elevated)_58%,transparent)] p-4 backdrop-blur-xl lg:flex">
          <div className="mb-5">
            <Brand />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <NavTree />
          </div>
          <button
            onClick={() => setPalette(true)}
            className="mt-3 flex items-center gap-2 rounded-lg border border-white/12 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" /> Search modules
            <kbd className="ml-auto rounded border border-white/12 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--surface-elevated)_58%,transparent)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setDrawer(true)}
                aria-label="Open navigation"
                className="rounded-lg border border-white/12 p-2 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                {eyebrow && <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--gold)]">{eyebrow}</p>}
                <h1 className="truncate font-display text-lg leading-tight sm:text-xl">{title}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setPalette(true)}
                aria-label="Search modules"
                className="rounded-lg border border-white/12 p-2 text-muted-foreground hover:text-foreground lg:hidden"
              >
                <Search className="h-4 w-4" />
              </button>
              <span className="hidden sm:inline-flex">
                <Badge tone="success">
                  <Activity className="h-3 w-3" /> Live
                </Badge>
              </span>
              <button onClick={signOut} aria-label="Sign out" className="rounded-lg border border-white/12 p-2 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {(sub || actions) && (
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              {sub ? <p className="max-w-2xl text-sm text-muted-foreground">{sub}</p> : <span />}
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

/** Tab strip driven by the `?tab=` search param. */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-all duration-300",
            active === t.key
              ? "border-[var(--gold)]/50 bg-[var(--gold)]/12 text-foreground"
              : "border-white/12 text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
