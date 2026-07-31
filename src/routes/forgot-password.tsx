import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset your password — Gigafactory 3X" },
      {
        name: "description",
        content: "Request a secure password reset link for your Gigafactory 3X customer account.",
      },
      { property: "og:title", content: "Reset your password — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Request a secure password reset link for the customer portal.",
      },
    ],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset link");
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
        <KeyRound className="h-6 w-6 text-[var(--gold)]" />
        <h1 className="mt-4 font-display text-3xl">Forgot password</h1>
        {sent ? (
          <p className="mt-3 text-sm text-muted-foreground">
            If an account exists for <span className="text-foreground">{email}</span>, a reset link is
            on its way. The link expires shortly for your security.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the email on your customer account and we'll send a reset link.
            </p>
            <input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <Link
          to="/login"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
