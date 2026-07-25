import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Diamond } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Gigafactory 3 Private Bank" },
      { name: "description", content: "Access your private banking cockpit." },
    ],
  }),
});

// Cooldown (seconds) between resend attempts. Kept short for UX; abuse
// throttling on the server side is handled separately (see reset-limits.ts).
const RESEND_COOLDOWN_SECONDS = 30;

type Mode = "sign-in" | "sign-up" | "otp";
type OtpStep = "request" | "verify";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setNotice("Check your inbox to confirm your account, then sign in.");
        setMode("sign-in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
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
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-electric)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-10 flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Gigafactory 3</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Private Bank
            </div>
          </div>
        </Link>

        <div
          className="rounded-2xl border border-border p-8"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          {mode === "otp" ? (
            <OtpFlow
              onBack={() => {
                setMode("sign-in");
                setError(null);
                setNotice(null);
              }}
              onSuccess={() => navigate({ to: "/dashboard", replace: true })}
            />
          ) : (
            <>
              <h1 className="font-display text-3xl">
                {mode === "sign-in" ? "Welcome back" : "Open your account"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "sign-in"
                  ? "Access your portfolio, wallets and cards."
                  : "A dashboard tailored to your holdings will be provisioned instantly."}
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
                {mode === "sign-up" && (
                  <Field label="Full name">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Elena Marchetti"
                      className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
                    />
                  </Field>
                )}
                <Field label="Email">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@bank.com"
                    className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
                  />
                </Field>

                {error && (
                  <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
                    {error}
                  </div>
                )}
                {notice && (
                  <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-xs text-[var(--success)]">
                    {notice}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
                >
                  {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
                </button>
              </form>

              <button
                onClick={() => {
                  setMode("otp");
                  setError(null);
                  setNotice(null);
                }}
                className="mt-4 w-full rounded-xl border border-border bg-[var(--surface-elevated)] py-2.5 text-sm font-medium transition-colors hover:border-[var(--gold)]/60"
              >
                Sign in with email code
              </button>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-[var(--gold)] hover:underline"
                >
                  {mode === "sign-in" ? "Open an account" : "Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OtpFlow({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<OtpStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [remaining, setRemaining] = useState(0);

  const resendButtonRef = useRef<HTMLButtonElement | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const wasCoolingDownRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  // Announce cooldown completion + restore focus to the resend button when
  // it becomes actionable again. Only steal focus if the user isn't actively
  // interacting with another control (e.g. still typing the code).
  useEffect(() => {
    if (remaining === 0 && wasCoolingDownRef.current) {
      wasCoolingDownRef.current = false;
      setStatus("Resend available.");
      const active = typeof document !== "undefined" ? document.activeElement : null;
      const focusIsElsewhere =
        active instanceof HTMLElement &&
        active !== document.body &&
        active !== resendButtonRef.current;
      if (!focusIsElsewhere) {
        resendButtonRef.current?.focus();
      }
    }
  }, [remaining]);

  const startCooldown = useCallback(() => {
    setRemaining(RESEND_COOLDOWN_SECONDS);
    wasCoolingDownRef.current = true;
    setStatus(`Code sent. You can resend in ${RESEND_COOLDOWN_SECONDS} seconds.`);
  }, []);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      startCooldown();
      setStep("verify");
      // Focus the code input after it mounts.
      setTimeout(() => codeInputRef.current?.focus(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (remaining > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
      setStatus("Resend failed.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Sign in with a code</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {step === "request"
          ? "We'll email you a one-time code."
          : `Enter the 6-digit code we sent to ${email}.`}
      </p>

      {/* Polite live region for cooldown / resend announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        data-testid="resend-status"
        className="sr-only"
      >
        {remaining > 0
          ? `Resend available in ${remaining} second${remaining === 1 ? "" : "s"}.`
          : status}
      </div>

      {step === "request" ? (
        <form onSubmit={requestCode} className="mt-6 space-y-3">
          <Field label="Email">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@bank.com"
              className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
            />
          </Field>
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
            {loading ? "Sending…" : "Send code"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-6 space-y-3">
          <Field label="Verification code">
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm tracking-[0.4em] outline-none focus:border-[var(--gold)]/60"
            />
          </Field>

          {error && (
            <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length === 0}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            {loading ? "Verifying…" : "Verify & sign in"}
          </button>

          <button
            ref={resendButtonRef}
            type="button"
            onClick={resendCode}
            disabled={remaining > 0 || loading}
            aria-disabled={remaining > 0 || loading}
            aria-describedby="resend-status-visible"
            data-testid="resend-button"
            className="w-full rounded-xl border border-border bg-[var(--surface-elevated)] py-2.5 text-sm font-medium transition-colors hover:border-[var(--gold)]/60 disabled:opacity-60"
          >
            {remaining > 0 ? `Resend code in ${remaining}s` : "Resend code"}
          </button>
          <p
            id="resend-status-visible"
            className="text-center text-xs text-muted-foreground"
          >
            {remaining > 0
              ? "Please wait before requesting another code."
              : "Didn't get it? Check spam or resend."}
          </p>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different method
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
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
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
