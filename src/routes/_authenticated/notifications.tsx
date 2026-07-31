import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import { listNotifications } from "@/lib/customer.functions";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — Gigafactory 3X" },
      {
        name: "description",
        content: "Account alerts, transaction updates and verification notices.",
      },
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
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({} as never),
  });

  return (
    <DashShell>
      <PageHeading
        eyebrow="Activity"
        title="Notifications"
        sub="Verification milestones, ledger movements and support responses."
      />
      <div className="glass rounded-2xl p-2">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading activity…</p>}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No notifications yet.</p>
        )}
        <ul className="divide-y divide-border/60">
          {(data ?? []).map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-4 py-3.5">
              <Bell className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TONES[n.tone] }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm capitalize">{n.title}</div>
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
