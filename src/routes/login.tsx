import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Diamond, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import {
  checkAdminLoginGate,
  completeLogin,
  getMyAdminAccount,
  reportLoginFailure,
} from "@/lib/admin-account.functions";

export const Route = createFileRoute("/login")({
  component: CustomerLogin,
  head: () => ({
    meta: [
      { title: "Customer sign in — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Sign in to the Gigafactory 3X customer portal to manage wallets, investments, cards and verification.",
      },
      { property: "og:title", content: "Customer sign in — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Secure access to your Gigafactory 3X customer dashboard.",
      },
    ],
  }),
});

const ADMIN_NOTICE =
  "This account belongs to the administration portal. Please sign in at /admin/login.";

function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const gate = await checkAdminLoginGate({ data: { email } });
      if (!gate.allowed) {
        setError(
          gate.retryAfterSeconds > 0
            ? `${gate.reason} Try again in ${Math.ceil(gate.retryAfterSeconds / 60)} minute(s).`
            : (gate.reason ?? "Sign-in temporarily unavailable."),
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const unconfirmed = /confirm/i.test(signInError.message);
        const failure = await reportLoginFailure({ data: { email, reason: signInError.message } });
        if (unconfirmed) {
          setUnconfirmed(true);
          setError("Your email address is not confirmed yet. Resend the confirmation link below.");
          return;
        }
        setError(
          failure.locked
            ? "Too many failed attempts. This account is locked for 15 minutes."
            : signInError.message,
        );
        return;
      }

      // Portal isolation: administrator credentials may never open a customer session.
      const adminAccount = await getMyAdminAccount({ data: undefined });
      if (adminAccount) {
        await supabase.auth.signOut();
        setError(ADMIN_NOTICE);
        return;
      }

      await completeLogin({ data: undefined });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-electric)" }}
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
          <h1 className="font-display text-3xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your wallets, investments, cards and documents.
          </p>

          <button
            onClick={handleGoogle}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-[var(--surface-elevated)] py-2.5 text-sm font-medium transition-colors hover:border-[var(--gold)]/60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
              />
            </label>

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
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              {loading ? "Please wait…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
            <Link to="/register" className="text-[var(--gold)] hover:underline">
              Create an account
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-[var(--surface)] px-3 py-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--electric,var(--gold))]" />
            Customer sessions are isolated from the administration portal.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
