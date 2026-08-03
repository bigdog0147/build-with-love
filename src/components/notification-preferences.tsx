import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences.functions";

const CATEGORIES: { key: "kyc" | "deposits" | "withdrawals" | "security" | "announcements" | "reports" | "raise"; label: string; sub: string }[] = [
  { key: "kyc", label: "Identity verification", sub: "Submission receipts, review progress and decisions." },
  { key: "deposits", label: "Deposits", sub: "Declared funding, approvals and declines." },
  { key: "withdrawals", label: "Withdrawals", sub: "Payout requests, approvals and rejections." },
  { key: "security", label: "Security", sub: "Sign-in alerts, password and device changes." },
  { key: "announcements", label: "Announcements", sub: "Platform updates from the GF3X desk." },
  {
    key: "raise",
    label: "Capital raising",
    sub: "Alerts each time your raise timeline advances to a new highlighted next step.",
  },
  {
    key: "reports",
    label: "Reports & statements",
    sub: "New financial reports, factsheets and downloadable statements in your library.",
  },
];

/** Per-category email and in-app notification switches for the signed-in customer. */
export function NotificationPreferencesPanel() {
  const load = useServerFn(getNotificationPreferences);
  const save = useServerFn(updateNotificationPreferences);
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  const { data } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => load({} as never),
  });

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => save({ data: patch }),
    onSuccess: (r) => {
      toast.success(r.message);
      void qc.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not save preferences"),
  });

  function toggle(key: keyof NotificationPreferences) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] } as NotificationPreferences;
    setPrefs(next);
    mutation.mutate({ [key]: next[key] } as Partial<NotificationPreferences>);
  }

  return (
    <section className="rounded-2xl border border-border p-6 glass" aria-label="Notification preferences">
      <h2 className="font-display text-xl">Notification preferences</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Choose how each type of notice reaches you. Critical compliance decisions are always recorded in
        your in-app inbox.
      </p>

      <ul className="mt-5 divide-y divide-white/6">
        {CATEGORIES.map((c) => {
          const emailKey = `${c.key}_email` as keyof NotificationPreferences;
          const inappKey = `${c.key}_inapp` as keyof NotificationPreferences;
          return (
            <li key={c.key} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="text-sm">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </div>
              <div className="flex gap-2">
                {(
                  [
                    { key: inappKey, label: "In-app" },
                    { key: emailKey, label: "Email" },
                  ] as const
                ).map((channel) => {
                  const on = Boolean(prefs?.[channel.key]);
                  return (
                    <button
                      key={String(channel.key)}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${c.label} ${channel.label}`}
                      onClick={() => toggle(channel.key)}
                      className={
                        "rounded-lg border px-3 py-1.5 text-xs transition-colors " +
                        (on
                          ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {channel.label} {on ? "on" : "off"}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
