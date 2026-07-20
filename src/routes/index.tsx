import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Diamond, Gem, LineChart, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Gigafactory 3 — Private Banking, reimagined" },
      {
        name: "description",
        content: "A dark-luxury private banking cockpit: portfolio, multi-currency wallets, cards and transactions in one place.",
      },
      { property: "og:title", content: "Gigafactory 3 — Private Banking" },
      { property: "og:description", content: "Portfolio, wallets, cards and transactions in one dark-luxury cockpit." },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[32rem] w-[32rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-electric)" }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: "var(--gradient-gold)" }}>
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Gigafactory 3</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Private Bank</div>
          </div>
        </div>
        <Link
          to="/auth"
          className="rounded-xl border border-border bg-[var(--surface)] px-4 py-2 text-sm hover:border-[var(--gold)]/60"
        >
          Sign in
        </Link>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 lg:pt-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Obsidian tier · Invitation only
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Your entire fortune, <span className="gold-text">in one cockpit.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Portfolio, multi-currency wallets, private markets, and metal cards — orchestrated in a
            single, quiet interface designed for those who prefer clarity to noise.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              Enter your dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm hover:border-[var(--gold)]/60"
            >
              Open an account
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: LineChart, title: "Portfolio intelligence", body: "Real-time performance, allocation and risk across every asset class." },
            { icon: Gem, title: "Private markets access", body: "Series-stage venture, real assets and structured deals, on request." },
            { icon: Shield, title: "Discreet by design", body: "Balance privacy toggle, hardware-key sign-in, concierge on standby." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border p-6 glass">
              <div
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 15%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-lg">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
