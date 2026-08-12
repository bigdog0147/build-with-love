import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences.functions";
import { RAISE_EVENT_PREFS } from "@/lib/raise-event-preferences";

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

  function set(patch: Partial<NotificationPreferences>) {
    if (!prefs) return;
    setPrefs({ ...prefs, ...patch } as NotificationPreferences);
    mutation.mutate(patch);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
  const browserZone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

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

      <div className="mt-6 border-t border-white/6 pt-6">
        <h3 className="font-display text-lg">Capital raising events</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Silence emails for individual raise timeline advances. These switches only narrow the Capital
          raising category above — in-app notices are unaffected.
        </p>

        <div className="mt-3 rounded-xl border border-border/70 bg-white/2 p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            How these settings combine
          </p>
          <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">1. Capital raising category</span> is the ceiling. With its
              email switch off, no raise email is sent — whatever the switches below say.
            </li>
            <li>
              <span className="text-foreground">2. Per-round alerts</span> (on each round card, including
              “Mute this round”) then narrow it further for that one round only.
            </li>
            <li>
              <span className="text-foreground">3. Per-event switches below</span> apply last, across every
              round: turning one off stops that event type even where the category and round both allow email.
            </li>
          </ol>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            An email arrives only when all three allow it. Switches can never raise a ceiling set above them,
            and none of them affect in-app notices.
          </p>
        </div>


        <ul className="mt-4 divide-y divide-white/6">
          {RAISE_EVENT_PREFS.map((event) => {
            const on = Boolean(prefs?.[event.key]) && Boolean(prefs?.raise_email);
            const categoryOff = prefs ? !prefs.raise_email : false;
            return (
              <li
                key={event.key}
                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm">{event.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryOff ? "Capital raising emails are switched off above." : event.sub}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${event.label} email`}
                  disabled={categoryOff}
                  onClick={() => toggle(event.key)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-40 " +
                    (on
                      ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  Email {on ? "on" : "off"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 border-t border-white/6 pt-6">
        <h3 className="font-display text-lg">Delivery timing</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Hold emails overnight and choose how often Capital raising alerts arrive. In-app notices are
          always delivered instantly.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(prefs?.quiet_hours_enabled)}
            onClick={() => set({ quiet_hours_enabled: !prefs?.quiet_hours_enabled })}
            className={
              "rounded-lg border px-3 py-1.5 text-xs transition-colors " +
              (prefs?.quiet_hours_enabled
                ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            Quiet hours {prefs?.quiet_hours_enabled ? "on" : "off"}
          </button>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            From
            <select
              aria-label="Quiet hours start"
              value={prefs?.quiet_hours_start ?? 21}
              disabled={!prefs?.quiet_hours_enabled}
              onChange={(e) => set({ quiet_hours_start: Number(e.target.value) })}
              className="rounded-lg border border-border bg-transparent px-2 py-1 text-foreground disabled:opacity-40"
            >
              {hours.map((h) => (
                <option key={h} value={h} className="bg-background">
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Until
            <select
              aria-label="Quiet hours end"
              value={prefs?.quiet_hours_end ?? 7}
              disabled={!prefs?.quiet_hours_enabled}
              onChange={(e) => set({ quiet_hours_end: Number(e.target.value) })}
              className="rounded-lg border border-border bg-transparent px-2 py-1 text-foreground disabled:opacity-40"
            >
              {hours.map((h) => (
                <option key={h} value={h} className="bg-background">
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Time zone
            <span className="rounded-lg border border-border px-2 py-1 text-foreground">
              {prefs?.time_zone ?? "UTC"}
            </span>
            {prefs && prefs.time_zone !== browserZone ? (
              <button
                type="button"
                onClick={() => set({ time_zone: browserZone })}
                className="text-[var(--gold)] underline-offset-2 hover:underline"
              >
                Use {browserZone}
              </button>
            ) : null}
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <p className="text-sm">Capital raising cadence</p>
            <p className="text-xs text-muted-foreground">
              Batch raise timeline alerts into one digest instead of an email per advance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "instant", label: "Instant" },
              { value: "daily", label: "Daily digest" },
              { value: "weekly", label: "Weekly digest" },
            ] as const).map((option) => {
              const active = (prefs?.raise_digest ?? "instant") === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ raise_digest: option.value })}
                  className={
                    "rounded-lg border px-3 py-1.5 text-xs transition-colors " +
                    (active
                      ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {prefs?.raise_digest !== "instant" ? (
          <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            Digest sent at
            <select
              aria-label="Digest hour"
              value={prefs?.digest_hour ?? 8}
              onChange={(e) => set({ digest_hour: Number(e.target.value) })}
              className="rounded-lg border border-border bg-transparent px-2 py-1 text-foreground"
            >
              {hours.map((h) => (
                <option key={h} value={h} className="bg-background">
                  {hourLabel(h)}
                </option>
              ))}
            </select>
            {prefs?.raise_digest === "weekly" ? "each Monday" : "each day"}
          </label>
        ) : null}
      </div>
    </section>
  );
}
