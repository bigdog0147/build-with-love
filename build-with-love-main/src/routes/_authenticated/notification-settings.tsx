import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell } from "lucide-react";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import { NotificationPreferencesPanel } from "@/components/notification-preferences";

export const Route = createFileRoute("/_authenticated/notification-settings")({
  component: NotificationSettingsPage,
  head: () => ({
    meta: [
      { title: "Notification settings — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Choose in-app and email notifications by type, set quiet hours and pick your capital raising digest cadence.",
      },
      { property: "og:title", content: "Notification settings — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Per-type in-app and email delivery controls for verification, funding, security and raise alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function NotificationSettingsPage() {
  return (
    <DashShell>
      <PageHeading
        eyebrow="Settings"
        title="Notification settings"
        sub="Decide which alerts reach your in-app inbox, which arrive by email, and when they are delivered."
      />

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 hover:border-[var(--gold)]/60"
        >
          <Bell className="h-3.5 w-3.5" /> Open notification centre
        </Link>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          Profile settings <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <NotificationPreferencesPanel />

      <p className="text-xs text-muted-foreground">
        Compliance decisions such as verification outcomes are always written to your in-app inbox, even when
        email delivery is switched off. Per-round overrides for individual capital raises live on the{" "}
        <Link to="/capital-raising" search={{ round: "", event: "" }} className="text-[var(--gold)] hover:underline">
          capital raising
        </Link>{" "}
        page.
      </p>
    </DashShell>
  );
}
