import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import {
  finishAdminPasswordReset,
  inspectAdminResetLink,
} from "@/lib/admin-password-reset.functions";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  ADMIN_RESET_CODE_LENGTH,
  validateAdminPassword,
} from "@/lib/admin-password-policy";

type Search = { token?: string };

export const Route = createFileRoute("/admin/reset-password")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search['token'] === "string" ? search['token'] : undefined,
  }),
  component: AdminResetPassword,
  head: () => ({
    meta: [
      { title: "Set a new administrator password — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Complete your one-time, email-verified administrator password reset for the Gigafactory 3X console.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Set a new administrator password — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Complete the single-use administrator password reset for the GF3X console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AdminResetPassword() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [state, setState] = useState<"checking" | "invalid" | "ready" | "done">("checking");
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    inspectAdminResetLink({ data: { token } })
      .then((res) => {
        setEmailMasked(res.emailMasked);
        setState(res.valid ? "ready" : "invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length !== ADMIN_RESET_CODE_LENGTH) {
      setError(`Enter the ${ADMIN_RESET_CODE_LENGTH}-digit code from the email.`);
      return;
    }
    const policyError = validateAdminPassword(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await finishAdminPasswordReset({
        data: { token: token ?? "", code: code.trim(), password },
      });
      if (!result.ok) {
        setError(result.error ?? "Could not reset the password.");
        return;
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--surface,#0a0a0b)] text-foreground">
      <div
        className="pointer-events-none absolute -top-48 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
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
            <Lock className="h-3.5 w-3.5" /> One-time reset
          </div>
          <h1 className="mt-3 font-display text-3xl">
            {state === "done" ? "Password updated" : "Set a new password"}
          </h1>

          {state === "checking" && (
            <p className="mt-3 text-sm text-muted-foreground">Validating your secure link…</p>
          )}

          {state === "invalid" && (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                This reset link is invalid, already used or expired. Reset links are single-use and
                valid for 30 minutes.
              </p>
              <Link
                to="/admin/forgot-password"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-gold)" }}
              >
                <KeyRound className="h-4 w-4" /> Request a new link
              </Link>
            </>
          )}

          {state === "done" && (
            <>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
                Your administrator password has been changed and the reset token was consumed.
              </p>
              <button
                onClick={() => navigate({ to: "/admin/login", replace: true })}
                className="mt-5 w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-gold)" }}
              >
                Go to administrator sign-in
              </button>
            </>
          )}

          {state === "ready" && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the verification code sent to{" "}
                <span className="text-foreground">{emailMasked ?? "your mailbox"}</span> and choose
                a new password.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <Field label={`Verification code (${ADMIN_RESET_CODE_LENGTH} digits)`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className={`${input} tracking-[0.4em]`}
                  />
                </Field>
                <Field label={`New password (min ${ADMIN_PASSWORD_MIN_LENGTH} characters)`}>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={input}
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={input}
                  />
                </Field>

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
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
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
