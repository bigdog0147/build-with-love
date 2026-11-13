import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getDashboard } from "@/lib/dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";


export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Gigafactory 3" },
      { name: "description", content: "Update your display name, initials and account preferences." },
      { property: "og:title", content: "Settings — Gigafactory 3" },
      { property: "og:description", content: "Profile and account preferences." },
    ],
  }),
});

const inputCls =
  "w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60";
const labelCls = "mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground";

function SettingsPage() {
  const fetchDashboard = useServerFn(getDashboard);
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard({} as never) });
  const profile = data?.profile;

  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [organization, setOrganization] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setInitials(profile.initials);
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setPhone(profile.phone ?? "");
      setCountry(profile.country ?? "");
      setOrganization(profile.organization ?? "");
      setUsername(profile.username ?? "");
    }
  }, [profile?.id, profile?.updated_at]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        initials: initials.trim().slice(0, 3).toUpperCase(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        country: country.trim() || null,
        organization: organization.trim() || null,
        username: username.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated.");
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <DashShell>
      <PageHeading
        eyebrow="Settings"
        title="Profile & preferences"
        sub="Your identity details across the platform. Contact and legal-name changes may require re-verification."
      />
      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-2xl border border-border p-6 glass">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="s-name">
              Display name
            </label>
            <input
              id="s-name"
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-initials">
              Initials
            </label>
            <input
              id="s-initials"
              className={inputCls}
              value={initials}
              maxLength={3}
              onChange={(e) => setInitials(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-first">
              First name
            </label>
            <input id="s-first" className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-last">
              Last name
            </label>
            <input id="s-last" className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-username">
              Username
            </label>
            <input
              id="s-username"
              className={inputCls}
              value={username}
              maxLength={40}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-phone">
              Phone
            </label>
            <input
              id="s-phone"
              type="tel"
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-country">
              Country of residence
            </label>
            <input id="s-country" className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="s-org">
              Organization
            </label>
            <input
              id="s-org"
              className={inputCls}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Tier · {profile?.tier ?? "—"} · Membership · {profile?.membership ?? "—"}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <Link
        to="/notification-settings"
        className="inline-flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-border p-6 glass hover:border-[var(--gold)]/60"
      >
        <span>
          <span className="block font-display text-lg">Notification settings</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Choose in-app and email delivery for each notice type, quiet hours and digest cadence.
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--gold)]" />
      </Link>
    </DashShell>
  );
}
