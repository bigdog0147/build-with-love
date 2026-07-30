import { createFileRoute, Link } from "@tanstack/react-router";
import { Diamond, Clock, Mail } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Register — Gigafactory 3X Customer Access" },
      {
        name: "description",
        content:
          "Customer registration for Gigafactory 3X is not open yet. Request access and we will notify you when onboarding begins.",
      },
      { property: "og:title", content: "Register — Gigafactory 3X Customer Access" },
      {
        property: "og:description",
        content:
          "Customer registration is not open yet. Request access and we will notify you when onboarding begins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
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
              Customer Access
            </div>
          </div>
        </Link>

        <div
          className="rounded-2xl border border-border p-8"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            <Clock className="h-3.5 w-3.5 text-[var(--gold)]" />
            Registration closed
          </div>

          <h1 className="font-display text-3xl">Registration is not open yet</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Customer onboarding for Gigafactory 3X is currently invitation-only.
            New self-service registration will open in a later phase. If you
            already hold an account, sign in below — otherwise request access
            and our team will contact you when onboarding begins.
          </p>

          <Link
            to="/contact"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            <Mail className="h-4 w-4" />
            Request access
          </Link>

          <Link
            to="/auth"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-border bg-[var(--surface-elevated)] py-2.5 text-sm font-medium transition-colors hover:border-[var(--gold)]/60"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
