import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck } from "lucide-react";
import { DashShell, PageHeading, cx } from "@/components/dashboard-chrome";
import { listNotifications, markNotificationsRead } from "@/lib/customer.functions";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — Gigafactory 3X" },
      {
        name: "description",
        content: "Account alerts, transaction updates and verification notices.",
      },
      { property: "og:title", content: "Notifications — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Verification milestones, ledger movements and support responses.",
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

function NotificationsPage() {
  const fetchNotifications = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({} as never),
  });

  const mark = useMutation({
    mutationFn: () => markRead({} as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <DashShell>
      <PageHeading
        eyebrow="Activity"
        title="Notifications"
        sub="Verification milestones, ledger movements and support responses."
      />
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {unread > 0 ? `${unread} new alert${unread === 1 ? "" : "s"}` : "You're all caught up"}
        </span>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => mark.mutate()}
            disabled={mark.isPending}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]/60 disabled:opacity-60"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>
      <div className="glass rounded-2xl p-2">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading activity…</p>}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No notifications yet.</p>
        )}
        <ul className="divide-y divide-border/60">
          {(data ?? []).map((n) => (
            <li
              key={n.id}
              className={cx(
                "flex items-start gap-3 px-4 py-3.5",
                !n.read && "bg-[var(--gold)]/5",
              )}
            >
              <Bell className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TONES[n.tone] }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm capitalize">
                  {n.title}
                  {!n.read && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{n.detail}</div>
              </div>
              <time className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(n.at).toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      </div>
    </DashShell>
  );
}

