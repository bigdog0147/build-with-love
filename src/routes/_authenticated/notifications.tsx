import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Dot,
  MailOpen,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DashShell, PageHeading, cx } from "@/components/dashboard-chrome";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { listNotifications, setAllNotificationsRead, setNotificationRead } from "@/lib/customer.functions";

const searchSchema = z.object({
  page: fallback(z.number().int(), 1).default(1),
  unreadOnly: fallback(z.boolean(), false).default(false),
  round: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
});

const TYPE_LABELS: Record<string, string> = {
  "": "All types",
  alert: "Alerts",
  transaction: "Transactions",
  ticket: "Support tickets",
};

export const Route = createFileRoute("/_authenticated/notifications")({
  validateSearch: zodValidator(searchSchema),
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notification centre — Gigafactory 3X" },
      {
        name: "description",
        content: "Account alerts, transaction updates and verification notices with read tracking.",
      },
      { property: "og:title", content: "Notification centre — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Verification milestones, ledger movements, capital raise decisions and support responses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TONES: Record<string, string> = {
  success: "var(--success)",
  warning: "var(--gold)",
  info: "var(--muted-foreground)",
};

const PAGE_SIZE = 10;

function NotificationsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/notifications" });
  const fetchNotifications = useServerFn(listNotifications);
  const markAll = useServerFn(setAllNotificationsRead);
  const setRead = useServerFn(setNotificationRead);
  const queryClient = useQueryClient();

  useRealtimeNotifications("portal-notifications-list");



  const { page, unreadOnly, round, type } = search;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["notifications", page, unreadOnly, round, type],
    queryFn: () => fetchNotifications({ data: { page, pageSize: PAGE_SIZE, unreadOnly, round, type } }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const mark = useMutation({
    mutationFn: (read: boolean) => markAll({ data: { read } }),
    onSuccess: invalidate,
  });

  const toggle = useMutation({
    mutationFn: (vars: { id: string; read: boolean }) => setRead({ data: vars }),
    onSuccess: invalidate,
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;
  const pageCount = data?.pageCount ?? 1;
  const rounds = data?.rounds ?? [];

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch, page: 1 }) });
  };

  const activeFilters = [round && "round", type && "type"].filter(Boolean).length;

  return (
    <DashShell>
      <PageHeading
        eyebrow="Activity"
        title="Notification centre"
        sub="Verification milestones, ledger movements, capital raise decisions and support responses."
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {[
              { key: false, label: "All" },
              { key: true, label: `Unread${unread ? ` (${unread})` : ""}` },
            ].map((t) => (
              <button
                key={String(t.key)}
                type="button"
                onClick={() => updateSearch({ unreadOnly: t.key })}
                className={cx(
                  "rounded-md px-3 py-1.5 transition-colors",
                  unreadOnly === t.key ? "bg-[var(--gold)]/15 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                aria-label="Filter by round"
                value={round}
                onChange={(e) => updateSearch({ round: e.target.value })}
                className="h-8 appearance-none rounded-lg border border-border bg-transparent pl-8 pr-6 text-xs text-foreground focus:border-[var(--gold)] focus:outline-none"
              >
                <option value="">All rounds</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                aria-label="Filter by alert type"
                value={type}
                onChange={(e) => updateSearch({ type: e.target.value })}
                className="h-8 appearance-none rounded-lg border border-border bg-transparent pl-8 pr-6 text-xs text-foreground focus:border-[var(--gold)] focus:outline-none"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => updateSearch({ round: "", type: "" })}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}

          <span className="text-xs text-muted-foreground">
            {unread > 0 ? `${unread} new alert${unread === 1 ? "" : "s"}` : "You're all caught up"}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => mark.mutate(true)}
              disabled={mark.isPending || unread === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]/60 disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
            <button
              type="button"
              onClick={() => mark.mutate(false)}
              disabled={mark.isPending || (data?.total ?? 0) === unread}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]/60 disabled:opacity-40"
            >
              <MailOpen className="h-3.5 w-3.5" /> Mark all unread
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-2" aria-busy={isFetching}>
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading activity…</p>}
        {!isLoading && items.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            {unreadOnly
              ? "No unread notifications."
              : activeFilters
                ? "No notifications match the selected filters."
                : "No notifications yet."}
          </p>
        )}
        <ul className="divide-y divide-border/60">
          {items.map((n) => (
            <li key={n.id} className={cx("flex items-start gap-3 px-4 py-3.5", !n.read && "bg-[var(--gold)]/5")}>
              <Bell className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TONES[n.tone] }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm capitalize">
                  {n.title}
                  {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />}
                </div>
                <div className="text-xs text-muted-foreground">{n.detail}</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                  {n.roundId && (
                    <Link
                      to="/capital-raising"
                      search={{ round: n.roundId, event: "" }}
                      className="inline-flex items-center gap-1 text-[var(--gold)] hover:underline"
                    >
                      View round <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  {n.alertId && (
                    <button
                      type="button"
                      onClick={() => toggle.mutate({ id: n.alertId as string, read: !n.read })}
                      disabled={toggle.isPending}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-60"
                    >
                      <Dot className="h-3 w-3" />
                      {n.read ? "Mark unread" : "Mark read"}
                    </button>
                  )}
                </div>
              </div>
              <time className="shrink-0 text-[11px] text-muted-foreground">{new Date(n.at).toLocaleDateString()}</time>
            </li>
          ))}
        </ul>
      </div>

      {pageCount > 1 && (
        <nav className="flex items-center justify-between text-xs" aria-label="Notification pages">
          <button
            type="button"
            onClick={() => navigate({ search: (prev: typeof search) => ({ ...prev, page: Math.max(1, prev.page - 1) }) })}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span className="text-muted-foreground">
            Page {data?.page ?? page} of {pageCount} · {data?.total ?? 0} items
          </span>
          <button
            type="button"
            onClick={() => navigate({ search: (prev: typeof search) => ({ ...prev, page: Math.min(pageCount, prev.page + 1) }) })}
            disabled={page >= pageCount}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </DashShell>
  );
}
