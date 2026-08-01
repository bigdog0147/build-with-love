import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set a new password — Gigafactory 3X" },
      {
        name: "description",
        content: "Choose a new password for your Gigafactory 3X customer account.",
      },
      { property: "og:title", content: "Set a New Password — Gigafactory 3X Portal" },
      {
        property: "og:description",
        content:
          "Securely choose a new password for your Gigafactory 3X customer portal account.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isRecovery = hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      setReady(isRecovery || Boolean(data.session));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
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
      setDone(true);
      await supabase.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14 text-foreground">
      <div
        className="rounded-2xl border border-border p-8"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
      >
        <ShieldCheck className="h-6 w-6 text-[var(--gold)]" />
        <h1 className="mt-4 font-display text-3xl">New password</h1>

        {done ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Your password has been updated. Sign in with your new credentials.
            </p>
            <button
              onClick={() => navigate({ to: "/login", replace: true })}
              className="mt-6 w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-gold)" }}
            >
              Go to sign in
            </button>
          </>
        ) : !ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            This page needs a valid recovery link. Request a new one from{" "}
            <Link to="/forgot-password" className="text-[var(--gold)] hover:underline">
              forgot password
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
            />
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
            />
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]"
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-gold)" }}
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
