import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setInitials(profile.initials);
    }
  }, [profile?.display_name, profile?.initials]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), initials: initials.trim().slice(0, 3).toUpperCase() })
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
      <PageHeading eyebrow="Settings" title="Profile & preferences" sub="How your name appears across the platform." />
      <form onSubmit={save} className="max-w-md space-y-4 rounded-2xl border border-border p-6 glass">
        <div>
          <label className={labelCls} htmlFor="s-name">
            Display name
          </label>
          <input id="s-name" className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
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
        <div className="text-xs text-muted-foreground">Tier · {profile?.tier ?? "—"}</div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </DashShell>
  );
}
