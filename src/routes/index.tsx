import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Atom, BatteryCharging, Bot, Cpu, Factory, Network, Radar, Rocket } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard } from "@/components/section";
import heroImage from "@/assets/g3-hero.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => {
    const OG_IMAGE =
      "https://id-preview--bf5c2b79-d0e2-46e2-8025-708d09651abd.lovable.app/og-image.jpg";
    return {
      meta: [
        { title: "Gigafactory 3 — Engineering the Future of Intelligent Industry" },
        {
          name: "description",
          content:
            "Gigafactory 3 builds AI-powered manufacturing ecosystems — robotics, batteries, semiconductors, digital twins and clean energy at global scale.",
        },
        { property: "og:title", content: "Gigafactory 3 — Intelligent Industry" },
        {
          property: "og:description",
          content:
            "AI-powered manufacturing ecosystems integrating robotics, automation and clean energy to transform global industry.",
        },
        { property: "og:type", content: "website" },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:width", content: "1920" },
        { property: "og:image:height", content: "1088" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: OG_IMAGE },
      ],
    };
  },
});

const TECHS = [
  { icon: Atom, name: "Artificial Intelligence" },
  { icon: Bot, name: "Robotics" },
  { icon: Factory, name: "Advanced Manufacturing" },
  { icon: BatteryCharging, name: "Battery Systems" },
  { icon: Cpu, name: "Semiconductors" },
  { icon: Network, name: "Industrial Automation" },
  { icon: Radar, name: "Digital Twin Systems" },
  { icon: Rocket, name: "Aerospace Systems" },
];

function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="AI-powered robotic assembly line inside a Gigafactory 3 facility"
          width={1920}
          height={1088}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-40 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--gradient-electric)" }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-20 lg:pt-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Intelligent Industry · Global Scale
          </span>
          <h1 className="mt-6 max-w-5xl font-display text-5xl leading-[1.03] sm:text-6xl lg:text-7xl">
            Engineering Tomorrow's <span className="gold-text">Intelligent Infrastructure.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Gigafactory 3 develops intelligent manufacturing ecosystems powered by artificial
            intelligence, robotics, advanced automation, and sustainable energy to shape the
            future of global industry.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/technologies"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              Explore Our Technologies
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/investors"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm hover:border-[var(--gold)]/60"
            >
              Investor Overview
            </Link>
          </div>

          <div className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "12", l: "Global Facilities" },
              { k: "$4.2B", l: "R&D Committed" },
              { k: "38", l: "Countries Served" },
              { k: "1,900+", l: "Engineers & Scientists" },
            ].map((s) => (
              <GlassCard key={s.l}>
                <div className="font-display text-3xl">{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {s.l}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-[var(--surface)]/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Core Technologies
          </div>
          <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">
            A vertically-integrated platform for intelligent industry.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TECHS.map(({ icon: Icon, name }) => (
              <div
                key={name}
                className="glass rounded-xl border border-border p-5 transition-colors hover:border-[var(--gold)]/50"
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-lg"
                  style={{
                    background: "color-mix(in oklab, var(--gold) 14%, transparent)",
                    color: "var(--gold)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-lg leading-tight">{name}</div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              to="/technologies"
              className="inline-flex items-center gap-2 text-sm text-[var(--gold)] hover:underline"
            >
              See the full technology stack <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
