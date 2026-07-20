import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Diamond, Eye, EyeOff, Loader2, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { updatePasswordFromRecovery } from "@/lib/password-recovery.functions";

const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_STORAGE_KEY = "gf3:reset-resend-last";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Password — Gigafactory 3" },
      {
        name: "description",
        content: "Choose a new password for your Gigafactory 3 member account.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Supabase parses the recovery token from the URL hash and creates a
  // temporary session with a PASSWORD_RECOVERY event. Wait for it before
  // allowing the user to submit a new password.
  useEffect(() => {
    let cancelled = false;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const hashError = params.get("error_description") || params.get("error");
    if (hashError) {
      setLinkError(decodeURIComponent(hashError));
      setReady(true);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidLink(true);
        setReady(true);
      }
    });

    // Fallback: if session already exists (page opened directly after redirect)
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setValidLink(true);
      }
      setReady(true);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const checks = [
    { id: "len", label: "At least 12 characters", ok: password.length >= 12 },
    { id: "upper", label: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(password) },
    { id: "lower", label: "One lowercase letter (a–z)", ok: /[a-z]/.test(password) },
    { id: "num", label: "One number (0–9)", ok: /\d/.test(password) },
    {
      id: "sym",
      label: "One symbol (!@#$…)",
      ok: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "nospace",
      label: "No leading or trailing spaces",
      ok: password.length > 0 && password === password.trim(),
    },
  ];
  const passedCount = checks.filter((c) => c.ok).length;
  const strengthPct = password.length === 0 ? 0 : (passedCount / checks.length) * 100;
  const strengthLabel =
    passedCount <= 2 ? "Weak" : passedCount <= 4 ? "Fair" : passedCount === 5 ? "Strong" : "Excellent";
  const strengthColor =
    passedCount <= 2
      ? "var(--danger)"
      : passedCount <= 4
        ? "#d97706"
        : "var(--gold)";
  const allPassed = checks.every((c) => c.ok);
  const pwError =
    password.length > 0 && !allPassed
      ? "Password doesn't meet all requirements"
      : null;
  const confirmError =
    confirm.length > 0 && confirm !== password ? "Passwords do not match" : null;
  const canSubmit = validLink && allPassed && confirm === password && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      // Server-side path: validates recovery-session freshness, amr, and
      // password strength before calling updateUser + global signOut.
      await updatePasswordFromRecovery({ data: { password } });
      // Make sure the local session is cleared even if the server-side
      // global signOut didn't propagate to this tab yet.
      await supabase.auth.signOut();
      setDone(true);
      setTimeout(() => navigate({ to: "/auth", replace: true }), 2200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update password";
      // Recovery-session rejection → surface the expired-link panel.
      if (/^Unauthorized/i.test(message)) {
        setLinkError(message.replace(/^Unauthorized:\s*/i, ""));
        setValidLink(false);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-stretch justify-center px-6 py-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-3 self-start">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Gigafactory 3</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Global Network
            </div>
          </div>
        </Link>

        {!ready ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
          </div>
        ) : done ? (
          <SuccessPanel />
        ) : linkError || !validLink ? (
          <InvalidLinkPanel message={linkError} />
        ) : (
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
              Secure recovery
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a strong password you haven't used elsewhere. You'll be signed
              out of all sessions and asked to sign in again.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                  New password
                </span>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    autoComplete="new-password"
                    aria-invalid={Boolean(pwError)}
                    aria-describedby="pw-requirements"
                    className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)]/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength meter */}
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${strengthPct}%`,
                        background: strengthColor,
                        boxShadow:
                          passedCount >= 5 ? "0 0 12px " + strengthColor : "none",
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Password strength</span>
                    <span style={{ color: password.length === 0 ? "var(--muted-foreground)" : strengthColor }}>
                      {password.length === 0 ? "—" : strengthLabel}
                    </span>
                  </div>
                </div>

                {/* Requirements checklist */}
                <ul
                  id="pw-requirements"
                  className="mt-3 grid gap-1.5 sm:grid-cols-2"
                >
                  {checks.map((c) => (
                    <li
                      key={c.id}
                      className={
                        "flex items-center gap-2 text-[11px] transition-colors " +
                        (c.ok ? "text-[var(--gold)]" : "text-muted-foreground")
                      }
                    >
                      <span
                        aria-hidden
                        className={
                          "grid h-3.5 w-3.5 place-items-center rounded-full border text-[9px] " +
                          (c.ok
                            ? "border-[var(--gold)]/60 bg-[var(--gold)]/15"
                            : "border-border")
                        }
                      >
                        {c.ok ? "✓" : ""}
                      </span>
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ul>

                {pwError && (
                  <span role="alert" className="mt-2 block text-[11px] text-[var(--danger)]">
                    {pwError}
                  </span>
                )}
              </label>


              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                  Confirm password
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)]/60"
                />
                {confirmError && (
                  <span className="mt-1 block text-[11px] text-[var(--danger)]">{confirmError}</span>
                )}
              </label>

              {error && (
                <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "var(--gradient-gold)",
                  boxShadow: canSubmit ? "var(--shadow-glow)" : undefined,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating password…
                  </>
                ) : (
                  <>
                    Update password
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold)]" />
                Encrypted in transit · Recovery token expires shortly
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessPanel() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border p-10 text-center"
      style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="relative">
        <div
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="mt-6 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
          Password updated
        </div>
        <h2 className="mt-3 font-display text-3xl">You're all set</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Redirecting you to sign in with your new password…
        </p>
      </div>
    </div>
  );
}

function InvalidLinkPanel({ message }: { message: string | null }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    function tick() {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(RESEND_STORAGE_KEY) : null;
      const last = raw ? parseInt(raw, 10) : 0;
      const remaining = Math.max(
        0,
        RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - last) / 1000),
      );
      setCooldown(remaining);
      if (remaining === 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || sending || cooldown > 0) return;
    setSending(true);
    setError(null);
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (err) throw err;
      window.localStorage.setItem(RESEND_STORAGE_KEY, String(Date.now()));
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setSent(true);
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          const raw = window.localStorage.getItem(RESEND_STORAGE_KEY);
          const last = raw ? parseInt(raw, 10) : 0;
          const remaining = Math.max(
            0,
            RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - last) / 1000),
          );
          setCooldown(remaining);
          if (remaining === 0 && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setSending(false);
    }
  }

  const disabled = !emailValid || sending || cooldown > 0;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border p-10 text-center"
      style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.28em] text-[var(--danger)]">
          Link expired or invalid
        </div>
        <h2 className="mt-3 font-display text-3xl">Recovery link cannot be used</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {message ??
            "This password reset link has expired or has already been used. Request a new one to continue."}
        </p>

        <form onSubmit={resend} className="mx-auto mt-8 max-w-sm space-y-3 text-left" noValidate>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Email address
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSent(false);
                setError(null);
              }}
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)]/60"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          {sent && !error && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-2 text-xs text-[var(--gold)]">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                If an account exists for that address, a new reset link is on its way. Check your inbox
                and spam folder.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "var(--gradient-gold)",
              boxShadow: !disabled ? "var(--shadow-glow)" : undefined,
            }}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              <>Resend available in {cooldown}s</>
            ) : (
              <>
                {sent ? "Resend reset email" : "Send reset email"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold)]" />
            Rate-limited for your protection
          </p>
        </form>

        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground hover:text-[var(--gold)]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
