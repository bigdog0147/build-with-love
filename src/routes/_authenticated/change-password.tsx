import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminAccount, markPasswordChanged } from "@/lib/admin-account.functions";
import type { AdminAccount } from "@/lib/admin-permissions";

export const Route = createFileRoute("/_authenticated/change-password")({
  component: ChangePasswordPage,
  head: () => ({
    meta: [
      { title: "Change password — Gigafactory 3X" },
      { name: "description", content: "Rotate your administrator password before continuing." },
      { property: "og:title", content: "Change password — Gigafactory 3X" },
      { property: "og:description", content: "Rotate your administrator password before continuing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyAdminAccount()
      .then(setAccount)
      .catch(() => setAccount(null));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Use at least 12 characters.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Include upper case, lower case and a number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await markPasswordChanged();
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div
        className="rounded-2xl border border-border p-8"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
      >
        <div
          className="mb-5 grid h-11 w-11 place-items-center rounded-xl"
          style={{ background: "var(--gradient-gold)" }}
        >
          <ShieldCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {account?.must_change_password
            ? "Your initial password must be replaced before you can continue."
            : "Rotate your password to keep the console secure."}
        </p>
        {account && (
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {account.is_super_admin ? "Super Administrator" : "Administrator"} · {account.email}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              New password
            </span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Confirm password
            </span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            {loading ? "Updating…" : "Update password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
