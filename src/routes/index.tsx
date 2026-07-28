import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Atom, BatteryCharging, Bot, Cpu, Factory, Gauge, Globe2, Network, Radar, Rocket, ShieldCheck, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard } from "@/components/section";
import heroImage from "@/assets/g3-hero.jpg";
import facilityAerial from "@/assets/g3-facility-aerial.jpg.asset.json";
import productionLine from "@/assets/g3-production-line.jpg.asset.json";
import { Reveal, CountUp } from "@/components/reveal";
import { PrefetchOnApproach } from "@/components/prefetch-on-approach";

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

      <section className="relative overflow-hidden border-t border-border/60">
        <PrefetchOnApproach urls={[facilityAerial.url, productionLine.url]} />

        <div
          className="pointer-events-none absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-electric)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <Reveal direction="up" className="max-w-2xl">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Global Operations
              </div>
              <h2 className="mt-3 font-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
                Twelve gigasites. One <span className="gold-text">intelligent network.</span>
              </h2>
              <p className="mt-5 text-base text-muted-foreground sm:text-lg">
                Our facilities operate as a single AI-orchestrated production fabric — synchronised
                through digital twins, closed-loop robotics and sovereign compute. Every cell,
                every line, every plant, engineered to a common standard of precision.
              </p>
            </Reveal>
            <Reveal direction="left" delay={180} className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="rounded-full border border-border bg-[var(--surface)] px-3 py-1">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                ISO 9001 · IATF 16949
              </span>
              <span className="rounded-full border border-border bg-[var(--surface)] px-3 py-1">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--electric)]" />
                Carbon-neutral by 2030
              </span>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            <Reveal direction="up" delay={80} className="col-span-1 lg:col-span-3">
              <figure className="group relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={facilityAerial.url}
                  alt="Aerial view of a Gigafactory 3X production campus"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="h-[22rem] w-full scale-[1.06] object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.1] lg:h-[28rem]"
                  style={{ animation: "kenburns 18s ease-in-out infinite alternate" }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div
                  className="pointer-events-none absolute -inset-x-1/2 top-0 h-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(115deg, transparent 40%, color-mix(in oklab, var(--gold) 22%, transparent) 50%, transparent 60%)",
                    animation: "shimmer 2.4s ease-in-out infinite",
                  }}
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                      Site 07 · Yangtze Delta
                    </div>
                    <div className="mt-2 font-display text-2xl sm:text-3xl">
                      2.1M m² integrated campus
                    </div>
                  </div>
                  <div className="glass rounded-xl px-4 py-3 text-right">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Annual output
                    </div>
                    <div className="font-display text-xl">
                      <CountUp value={1.4} decimals={1} suffix="M units" />
                    </div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>

            <Reveal direction="right" delay={220} className="col-span-1 lg:col-span-2">
              <figure className="group relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={productionLine.url}
                  alt="Robotic assembly line inside a Gigafactory 3X production hall"
                  loading="lazy"
                  className="h-[22rem] w-full scale-[1.06] object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.1] lg:h-[28rem]"
                  style={{ animation: "kenburns-alt 20s ease-in-out infinite alternate" }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--electric), transparent)",
                    animation: "scanline 3.6s linear infinite",
                  }}
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-6">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--electric)]">
                    Lights-out Cell · G3X-Automate
                  </div>
                  <div className="mt-2 font-display text-2xl">
                    <CountUp value={99.98} decimals={2} suffix="% first-pass yield" />
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Globe2, value: 12, suffix: "", l: "Gigasites", s: "Across 4 continents" },
              { icon: Bot, value: 18400, suffix: "", l: "Robots deployed", s: "Fleet-managed by AI" },
              { icon: Gauge, value: 27, suffix: "%", l: "Throughput uplift", s: "Vs. prior generation" },
              { icon: ShieldCheck, value: 100, suffix: "%", l: "Traceable output", s: "Digital-twin verified" },
            ].map(({ icon: Icon, value, suffix, l, s }, i) => (
              <Reveal key={l} direction="up" delay={i * 110} distance={28}>
                <GlassCard className="group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[var(--gold)]/50 hover:shadow-[var(--shadow-glow)]">
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-40"
                    style={{ background: "var(--gradient-gold)" }}
                  />
                  <div
                    className="grid h-9 w-9 place-items-center rounded-lg transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: "color-mix(in oklab, var(--electric) 14%, transparent)",
                      color: "var(--electric)",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-4 font-display text-3xl">
                    <CountUp value={value} suffix={suffix} />
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {l}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground/80">{s}</div>
                </GlassCard>
              </Reveal>
            ))}
          </div>

          <Reveal direction="up" delay={120}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/industries"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
              >
                Tour our industries
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm transition-colors hover:border-[var(--gold)]/60"
              >
                <Zap className="h-4 w-4 text-[var(--electric)]" />
                Inside Gigafactory 3
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
