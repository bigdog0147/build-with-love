import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Diamond, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search['email'] === "string" ? search['email'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Confirm your email — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Confirm your email address to activate your Gigafactory 3X customer account, or resend the confirmation link.",
      },
      { property: "og:title", content: "Confirm your email — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Activate your Gigafactory 3X customer account.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const COOLDOWN_SECONDS = 60;

function VerifyEmailPage() {
  const { email: emailParam } = useSearch({ from: "/verify-email" });
  const [email, setEmail] = useState(emailParam ?? "");
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resendRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    const target = email.trim();
    if (!target) {
      setError("Enter the email address you registered with.");
      return;
    }
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (err) {
      setError(err.message);
      return;
    }
    setStatus(`Confirmation link sent to ${target}. Check your inbox and spam folder.`);
    setCooldown(COOLDOWN_SECONDS);
    resendRef.current?.focus();
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[26rem] w-[26rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14">
        <Link to="/" className="mb-10 flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Gigafactory 3X</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Customer Portal
            </div>
          </div>
        </Link>

        <div
          className="rounded-2xl border border-border p-8"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          <MailCheck className="h-6 w-6 text-[var(--gold)]" />
          <h1 className="mt-4 font-display text-3xl">Confirm your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a confirmation link
            {emailParam ? (
              <>
                {" "}
                to <span className="text-foreground">{emailParam}</span>
              </>
            ) : null}
            . Click it to activate your account — you can sign in once your address is confirmed.
          </p>

          <form onSubmit={resend} className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <button
              ref={resendRef}
              type="submit"
              disabled={cooldown > 0}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-gold)" }}
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend confirmation link"}
            </button>
          </form>

          <div aria-live="polite" role="status" className="mt-4 min-h-5 text-xs">
            {status && <span className="text-[var(--success)]">{status}</span>}
          </div>
          {error && (
            <div
              role="alert"
              className="mt-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]"
            >
              {error}
            </div>
          )}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already confirmed?{" "}
            <Link to="/login" className="text-[var(--gold)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
