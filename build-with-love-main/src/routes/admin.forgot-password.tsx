import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { startAdminPasswordReset } from "@/lib/admin-password-reset.functions";

export const Route = createFileRoute("/admin/forgot-password")({
  component: AdminForgotPassword,
  head: () => ({
    meta: [
      { title: "Administrator password reset — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Request a one-time, email-verified reset link for your Gigafactory 3X administration console account.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Administrator password reset — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Email-verified, single-use password reset for the GF3X administration console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await startAdminPasswordReset({
        data: { email: email.trim(), origin: window.location.origin },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the reset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell title="Reset administrator password">
      {sent ? (
        <div role="status" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If <span className="text-foreground">{email}</span> belongs to an active administrator,
            a single-use reset link and a 6-digit verification code have been sent to that mailbox.
          </p>
          <p className="text-xs text-muted-foreground">
            The link expires in 30 minutes and can be used once. Requesting a new link invalidates
            any earlier one.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter your administrator email. We send a one-time link plus a verification code — both
            are required to set a new password.
          </p>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Administrator email
            </span>
            <input
              type="email"
              required
              maxLength={320}
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
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
            {loading ? "Sending secure link…" : "Send reset link"}
          </button>
        </form>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
        <span>
          Every reset request, failure and completion is recorded in the immutable audit log.
        </span>
      </div>

      <Link
        to="/admin/login"
        className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Back to administrator sign-in
      </Link>
    </Shell>
  );
}

const input =
  "w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)]/60";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
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
          <KeyRound className="h-5 w-5 text-[var(--gold)]" />
          <h1 className="mt-3 font-display text-3xl">{title}</h1>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
