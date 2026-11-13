import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Atom,
  BatteryCharging,
  Bot,
  Cpu,
  Factory,
  Gauge,
  Globe2,
  Layers,
  LineChart,
  Network,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Users,
  Zap,
} from "lucide-react";
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
    const OG_IMAGE = "https://gf3x.space/og-image.jpg";
    return {
      meta: [
        { title: "Gigafactory 3X — Intelligent Industry Engineering" },
        {
          name: "description",
          content:
            "Gigafactory 3X builds AI-powered manufacturing ecosystems: robotics, batteries, semiconductors, digital twins and clean energy at global scale.",
        },
        { property: "og:title", content: "Gigafactory 3X — Intelligent Industry" },
        {
          property: "og:description",
          content:
            "AI-powered manufacturing ecosystems integrating robotics, automation and clean energy to transform global industry.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://www.gf3x.space/" },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:width", content: "1920" },
        { property: "og:image:height", content: "1088" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: "https://www.gf3x.space/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Gigafactory 3X",
            url: "https://www.gf3x.space/",
            description:
              "Gigafactory 3X builds AI-powered manufacturing ecosystems: robotics, batteries, semiconductors, digital twins and clean energy at global scale.",
          }),
        },
      ],
    };
  },
});

const HIGHLIGHTS = [
  {
    icon: Atom,
    name: "Artificial Intelligence",
    desc: "Sovereign foundation models and industrial copilots orchestrating every plant, cell and process in real time.",
  },
  {
    icon: Bot,
    name: "Robotics & Automation",
    desc: "Autonomous manipulators, mobile fleets and closed-loop control engineered for lights-out precision at scale.",
  },
  {
    icon: Factory,
    name: "Advanced Manufacturing",
    desc: "Vertically integrated giga-scale production — from wafer to finished system — under one digital twin.",
  },
  {
    icon: SunMedium,
    name: "Clean Energy Systems",
    desc: "On-site solar, storage and grid intelligence powering carbon-neutral operations across every gigasite.",
  },
];

const TECH_PREVIEW = [
  {
    icon: Sparkles,
    kicker: "AI Platform",
    title: "Industrial intelligence, deployed at the edge.",
    desc: "A unified stack for perception, planning and generative process design — trained on trillions of factory-floor signals and deployed on sovereign compute.",
  },
  {
    icon: Bot,
    kicker: "Robotics Division",
    title: "Autonomous work, engineered end-to-end.",
    desc: "Manipulators, humanoids and AMR fleets built on a shared control plane. One SDK, one safety model, one operations dashboard.",
  },
  {
    icon: BatteryCharging,
    kicker: "Battery Systems",
    title: "High-density cells for a decarbonised grid.",
    desc: "Solid-state chemistries, integrated packs and gigawatt-scale storage — manufactured in-house, from active material to module.",
  },
  {
    icon: Cpu,
    kicker: "Semiconductor Manufacturing",
    title: "Silicon designed for autonomous systems.",
    desc: "Custom SoCs, power electronics and AI accelerators fabricated in our own advanced-node facilities for latency-critical workloads.",
  },
  {
    icon: Network,
    kicker: "Autonomous Industrial Networks",
    title: "A single operating system for global production.",
    desc: "Every gigasite runs as a node on the G3 Mesh — federated data, unified telemetry, and closed-loop optimisation across continents.",
  },
];

const CORE_TECHS = [
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

      {/* ================= HERO ================= */}
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
        {/* Floating data particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute block h-1 w-1 rounded-full"
              style={{
                left: `${(i * 137) % 100}%`,
                top: `${(i * 53) % 100}%`,
                background: i % 3 === 0 ? "var(--gold)" : "var(--electric)",
                opacity: 0.35,
                animation: `float-particle ${8 + (i % 6)}s ease-in-out ${i * 0.4}s infinite alternate`,
                boxShadow: "0 0 12px currentColor",
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-20 lg:pt-32">
          <Reveal direction="up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              Intelligent Industry · Global Scale
            </span>
          </Reveal>
          <Reveal direction="up" delay={80}>
            <h1 className="mt-6 max-w-5xl font-display text-5xl leading-[1.03] sm:text-6xl lg:text-7xl">
              Engineering Tomorrow's{" "}
              <span className="gold-text">Intelligent Infrastructure.</span>
            </h1>
          </Reveal>
          <Reveal direction="up" delay={160}>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Gigafactory 3 builds intelligent manufacturing ecosystems powered by artificial
              intelligence, advanced robotics, renewable energy and next-generation industrial
              technology — for governments, enterprises and global industries.
            </p>
          </Reveal>
          <Reveal direction="up" delay={220}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/technologies"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
              >
                Explore Technology
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/investors"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm transition-colors hover:border-[var(--gold)]/60"
              >
                Investor Presentation
              </Link>
            </div>
          </Reveal>

          <div className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "12", l: "Global Facilities" },
              { k: "$4.2B", l: "R&D Committed" },
              { k: "38", l: "Countries Served" },
              { k: "1,900+", l: "Engineers & Scientists" },
            ].map((s, i) => (
              <Reveal key={s.l} direction="up" delay={i * 90}>
                <GlassCard>
                  <div className="font-display text-3xl">{s.k}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {s.l}
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMPANY HIGHLIGHTS ================= */}
      <section className="border-t border-border/60 bg-[var(--surface)]/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal direction="up">
            <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              What we build
            </div>
            <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl">
              Four pillars of the modern industrial stack.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, name, desc }, i) => (
              <Reveal key={name} direction="up" delay={i * 110}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-[var(--surface)]/60 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--gold)]/50 hover:shadow-[var(--shadow-glow)]">
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-40"
                    style={{ background: "var(--gradient-gold)" }}
                  />
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: "color-mix(in oklab, var(--gold) 14%, transparent)",
                      color: "var(--gold)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-5 font-display text-xl leading-tight">{name}</div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  <div className="mt-6 flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[var(--gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    Explore {name} <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PERFORMANCE METRICS ================= */}
      <section className="relative overflow-hidden border-t border-border/60">
        <div
          className="pointer-events-none absolute -right-40 top-0 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <Reveal direction="up">
            <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              By the numbers
            </div>
            <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl">
              Performance at <span className="gold-text">planetary scale.</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Globe2, value: 12, l: "Global Facilities", s: "Across 4 continents" },
              { icon: Sparkles, value: 480, l: "AI Systems Deployed", s: "Production-grade models" },
              { icon: Factory, value: 6.4, decimals: 1, suffix: "M", l: "Units / year capacity", s: "Vertically integrated" },
              { icon: LineChart, value: 320, l: "Active Research Projects", s: "24 international labs" },
              { icon: Globe2, value: 38, l: "Countries Served", s: "Government & enterprise" },
              { icon: Users, value: 140, l: "Enterprise Partners", s: "Fortune 500 & sovereign" },
            ].map(({ icon: Icon, value, decimals, suffix, l, s }, i) => (
              <Reveal key={l} direction="up" delay={i * 90}>
                <GlassCard className="group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[var(--gold)]/50 hover:shadow-[var(--shadow-glow)]">
                  <div className="flex items-start justify-between">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-lg transition-transform duration-500 group-hover:scale-110"
                      style={{
                        background: "color-mix(in oklab, var(--gold) 14%, transparent)",
                        color: "var(--gold)",
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-5 font-display text-4xl">
                    <CountUp value={value} decimals={decimals ?? 0} suffix={suffix ?? ""} />
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {l}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground/80">{s}</div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CORE TECH GRID ================= */}
      <section className="border-t border-border/60 bg-[var(--surface)]/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Reveal direction="up">
            <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Core Technologies
            </div>
            <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">
              A vertically-integrated platform for intelligent industry.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_TECHS.map(({ icon: Icon, name }, i) => (
              <Reveal key={name} direction="up" delay={i * 60}>
                <div className="glass h-full rounded-xl border border-border p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-[var(--gold)]/50">
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
              </Reveal>
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

      {/* ================= GLOBAL OPERATIONS ================= */}
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
            <Reveal
              direction="left"
              delay={180}
              className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
            >
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
                  alt="Aerial view of a Gigafactory 3 production campus"
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
                  alt="Robotic assembly line inside a Gigafactory 3 production hall"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
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
                    Lights-out Cell · G3-Automate
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
        </div>
      </section>

      {/* ================= TECHNOLOGY PREVIEW ================= */}
      <section className="border-t border-border/60 bg-[var(--surface)]/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal direction="up">
            <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Technology preview
            </div>
            <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl">
              A single stack, from silicon to <span className="gold-text">sovereign compute.</span>
            </h2>
          </Reveal>

          <div className="mt-14 flex flex-col gap-10">
            {TECH_PREVIEW.map(({ icon: Icon, kicker, title, desc }, i) => {
              const reverse = i % 2 === 1;
              return (
                <Reveal key={kicker} direction="up" delay={40}>
                  <div
                    className={`grid items-center gap-8 md:grid-cols-2 ${
                      reverse ? "md:[&>*:first-child]:order-2" : ""
                    }`}
                  >
                    {/* Illustration panel */}
                    <div className="group relative h-64 overflow-hidden rounded-2xl border border-border bg-[var(--surface)] md:h-72">
                      <div
                        className="absolute inset-0 opacity-70"
                        style={{
                          background:
                            i % 2 === 0
                              ? "radial-gradient(600px 300px at 20% 20%, color-mix(in oklab, var(--gold) 30%, transparent), transparent 60%), radial-gradient(500px 250px at 80% 80%, color-mix(in oklab, var(--electric) 24%, transparent), transparent 60%)"
                              : "radial-gradient(600px 300px at 80% 20%, color-mix(in oklab, var(--electric) 26%, transparent), transparent 60%), radial-gradient(500px 250px at 20% 80%, color-mix(in oklab, var(--gold) 24%, transparent), transparent 60%)",
                        }}
                      />
                      {/* Grid pattern */}
                      <svg
                        aria-hidden
                        className="absolute inset-0 h-full w-full opacity-[0.18]"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <pattern
                            id={`grid-${i}`}
                            width="40"
                            height="40"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 40 0 L 0 0 0 40"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#grid-${i})`} />
                      </svg>
                      {/* Central glyph */}
                      <div className="absolute inset-0 grid place-items-center">
                        <div
                          className="grid h-24 w-24 place-items-center rounded-2xl border border-border backdrop-blur-md transition-transform duration-700 group-hover:scale-110"
                          style={{
                            background:
                              "color-mix(in oklab, var(--surface-elevated) 60%, transparent)",
                            boxShadow: "var(--shadow-glow)",
                            color: "var(--gold)",
                          }}
                        >
                          <Icon className="h-10 w-10" />
                        </div>
                      </div>
                      {/* Scanline */}
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, var(--electric), transparent)",
                          animation: "scanline 4.2s linear infinite",
                        }}
                      />
                    </div>

                    {/* Copy */}
                    <div>
                      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--gold)]">
                        <Layers className="h-3.5 w-3.5" />
                        {kicker}
                      </div>
                      <h3 className="mt-3 font-display text-2xl leading-tight sm:text-3xl">
                        {title}
                      </h3>
                      <p className="mt-4 max-w-xl text-base text-muted-foreground">{desc}</p>
                      <Link
                        to="/technologies"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-4 py-2.5 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--gold)]/60"
                      >
                        Explore {title} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= INVESTOR BANNER ================= */}
      <section className="relative overflow-hidden border-t border-border/60">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(800px 400px at 15% 30%, color-mix(in oklab, var(--gold) 22%, transparent), transparent 60%), radial-gradient(700px 400px at 85% 70%, color-mix(in oklab, var(--electric) 18%, transparent), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-5 lg:items-center">
            <Reveal direction="up" className="lg:col-span-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Investors
              </div>
              <h2 className="mt-3 font-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
                Built for the next decade of{" "}
                <span className="gold-text">industrial value creation.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Gigafactory 3 combines sustainable growth, long-term innovation and disciplined
                corporate governance — with a global expansion roadmap aligned to the next
                industrial supercycle.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/investors"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "var(--gradient-gold)",
                    boxShadow: "var(--shadow-glow)",
                  }}
                >
                  Download Investor Presentation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm transition-colors hover:border-[var(--gold)]/60"
                >
                  Contact Investor Relations
                </Link>
              </div>
            </Reveal>

            <Reveal direction="up" delay={160} className="lg:col-span-2">
              <div className="grid gap-3">
                {[
                  { k: "Sustainable growth", v: "Compounding CAGR across every division" },
                  { k: "Long-term innovation", v: "$4.2B R&D committed through 2030" },
                  { k: "Global expansion", v: "12 gigasites · 4 continents · 38 markets" },
                  { k: "Corporate governance", v: "Independent board · SASB & TCFD aligned" },
                ].map((row, i) => (
                  <Reveal key={row.k} direction="left" delay={i * 90}>
                    <div className="glass flex items-center justify-between gap-4 rounded-xl border border-border p-4 transition-colors hover:border-[var(--gold)]/50">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                          {row.k}
                        </div>
                        <div className="mt-1 text-sm text-foreground/90">{row.v}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
