import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fingerprint, Lock, ShieldAlert, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  bootstrapSuperAdmin,
  checkAdminDeviceTrust,
  checkAdminLoginGate,
  completeLogin,
  getMyAdminAccount,
  rememberAdminDevice,
  reportLoginFailure,
} from "@/lib/admin-account.functions";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin-permissions";

export const Route = createFileRoute("/admin/login")({
  // Idempotent first-startup provisioning of the Super Administrator.
  loader: () => bootstrapSuperAdmin(),
  component: AdminLogin,
  head: () => ({
    meta: [
      { title: "Administration portal — Gigafactory 3X" },
      { name: "description", content: "Secure GF3X administration console sign-in." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Administration portal — Gigafactory 3X" },
      { property: "og:description", content: "Secure GF3X administration console sign-in." },
    ],
  }),
});

const DEVICE_KEY = "gf3x.admin.device";

function deviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

type Step = "credentials" | "twofa";

function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const codeRef = useRef<HTMLInputElement | null>(null);

  const challenge = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 2 + Math.floor(Math.random() * 7);
    return { a, b, answer: a + b };
  }, []);

  useEffect(() => {
    if (step === "twofa") codeRef.current?.focus();
  }, [step]);

  async function finish(mustChangePassword: boolean) {
    if (remember) await rememberAdminDevice({ data: { deviceId: deviceId() } });
    navigate({ to: mustChangePassword ? "/change-password" : "/admin", replace: true });
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (Number(captcha) !== challenge.answer) {
      setError("Verification challenge failed. Please solve the sum again.");
      return;
    }

    setLoading(true);
    try {
      const gate = await checkAdminLoginGate({ data: { email } });
      if (!gate.allowed) {
        setError(
          gate.retryAfterSeconds > 0
            ? `${gate.reason} Retry in ${Math.ceil(gate.retryAfterSeconds / 60)} minute(s).`
            : (gate.reason ?? "Administrator sign-in temporarily unavailable."),
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const failure = await reportLoginFailure({ data: { email, reason: signInError.message } });
        setError(
          failure.locked
            ? "Account locked for 15 minutes after repeated failures."
            : "Invalid administrator credentials.",
        );
        return;
      }

      // Portal isolation: only provisioned administrator accounts may proceed.
      const account = await getMyAdminAccount({ data: undefined });
      if (!account || !account.is_active) {
        await supabase.auth.signOut();
        setError("403 Access Denied — this account has no administration privileges.");
        return;
      }
      setRole((account.admin_role ?? "administrator") as AdminRole);

      const trust = await checkAdminDeviceTrust({ data: { deviceId: deviceId() } });
      if (account.two_factor_required && !trust.trusted) {
        // Second factor: one-time code delivered to the administrator mailbox.
        await supabase.auth.signOut();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (otpError) {
          setError(otpError.message);
          return;
        }
        setNotice("Two-factor code sent to the administrator mailbox.");
        setStep("twofa");
        return;
      }

      const result = await completeLogin({ data: undefined });
      await finish(result.mustChangePassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (verifyError) throw verifyError;

      const account = await getMyAdminAccount({ data: undefined });
      if (!account || !account.is_active) {
        await supabase.auth.signOut();
        setError("403 Access Denied — this account has no administration privileges.");
        return;
      }
      const result = await completeLogin({ data: undefined });
      await finish(result.mustChangePassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid two-factor code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--surface,#0a0a0b)] text-foreground">
      {/* Animated cybersecurity backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.82 0.14 85 / 30%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.82 0.14 85 / 30%) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage: "radial-gradient(circle at 50% 30%, black, transparent 72%)",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute -top-48 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 animate-pulse rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-electric, var(--gradient-gold))" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-[-10rem] h-[26rem] w-[26rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-14">
        <div className="mb-8 flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-xl font-display text-sm text-[var(--gold-foreground,#000)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            3X
          </span>
          <div>
            <div className="font-display text-lg leading-none">Gigafactory 3X</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Administration Portal
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--surface-elevated)_58%,transparent)] p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--gold)]">
            <Lock className="h-3.5 w-3.5" /> Restricted access
          </div>
          <h1 className="mt-3 font-display text-3xl">
            {step === "credentials" ? "Administrator sign-in" : "Two-factor verification"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "credentials"
              ? "Credentials, challenge and device attestation are recorded in the audit log."
              : "Enter the one-time code sent to your administrator mailbox."}
          </p>

          {step === "credentials" ? (
            <form onSubmit={handleCredentials} className="mt-6 space-y-3">
              <Field label="Administrator email">
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                />
              </Field>
              <Field label={`Security challenge — ${challenge.a} + ${challenge.b}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Answer"
                  className={input}
                />
              </Field>

              <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--gold)]"
                />
                <Fingerprint className="h-3.5 w-3.5" /> Remember this device for 2FA
              </label>

              <Messages error={error} notice={notice} />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
              >
                {loading ? "Authenticating…" : "Authenticate"}
              </button>

              <Link
                to="/admin/forgot-password"
                className="block pt-1 text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot administrator password?
              </Link>
            </form>
          ) : (
            <form onSubmit={handleTwoFactor} className="mt-6 space-y-3">
              <Field label="One-time code">
                <input
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className={`${input} tracking-[0.4em]`}
                />
              </Field>
              <Messages error={error} notice={notice} />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
              >
                {loading ? "Verifying…" : "Verify & enter console"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setCode("");
                  setError(null);
                }}
                className="w-full rounded-xl py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Back to credentials
              </button>
            </form>
          )}

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
            <span>
              No account creation from this portal. Administrator access is provisioned by a Super
              Admin only.
              {role && <> Detected role: {ADMIN_ROLE_LABELS[role]}.</>}
            </span>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" /> Sessions, cookies and permissions are isolated from the
          customer portal.
        </p>
      </div>
    </div>
  );
}

const input =
  "w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)]/60";

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

function Messages({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-xs text-[var(--success)]"
        >
          {notice}
        </div>
      )}
    </>
  );
}
