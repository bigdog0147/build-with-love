import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  BatteryCharging,
  Beaker,
  Bot,
  Brain,
  CircuitBoard,
  Cpu,
  Factory,
  FlaskConical,
  Globe2,
  GraduationCap,
  Leaf,
  Lightbulb,
  Loader2,
  CheckCircle2,

  Menu,
  Network,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  X,
} from "lucide-react";

import { getMetrics, type Metric } from "@/lib/metrics.functions";
import facilityAerial from "@/assets/facility-aerial.jpg.asset.json";
import roboticsLine from "@/assets/robotics-line.jpg.asset.json";
import productionLine from "@/assets/production-line.jpg.asset.json";
import facilityExterior from "@/assets/facility-exterior.jpg.asset.json";

const metricsQueryOptions = queryOptions({
  queryKey: ["metrics"],
  queryFn: () => getMetrics(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  component: LandingPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(metricsQueryOptions),
  head: () => ({
    meta: [
      { title: "Gigafactory 3 — Engineering Tomorrow's Intelligent Infrastructure" },
      {
        name: "description",
        content:
          "Gigafactory 3 develops intelligent manufacturing ecosystems powered by AI, robotics, advanced automation and sustainable energy for governments, enterprises and global industries.",
      },
      { property: "og:title", content: "Gigafactory 3 — Intelligent Industrial Technology" },
      {
        property: "og:description",
        content: "AI, robotics, advanced manufacturing and clean energy — engineered at global scale.",
      },
    ],
  }),
});

const NAV = [
  { label: "Technology", href: "#technology" },
  { label: "Manufacturing", href: "#manufacturing" },
  { label: "Industries", href: "#industries" },
  { label: "AI Platform", href: "#ai" },
  { label: "Research", href: "#research" },
  { label: "Investors", href: "#investors" },
  { label: "Careers", href: "#careers" },
  { label: "Contact", href: "#contact" },
];

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden text-foreground">
      <AmbientBackground />

      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <Logo />
            <div className="hidden sm:block">
              <div className="font-display text-base leading-none">Gigafactory 3</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Intelligent Industry
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              className="hidden h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground md:grid"
            >
              <Search className="h-4 w-4" />
            </button>
            <button className="hidden rounded-lg border border-border px-3 py-2 text-[12px] text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground md:inline-flex">
              EN
            </button>
            <a
              href="#contact"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground md:inline-flex"
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              Contact Sales
            </a>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-[var(--surface)] hover:text-foreground"
                >
                  {n.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-xl px-4 py-3 text-center text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-gold)" }}
              >
                Contact Sales
              </a>
            </div>
          </div>
        )}
      </header>

      <main id="top" className="relative">
        <Hero />
        <CompanyOverview />
        <Highlights />
        <CinematicBand />
        <Metrics />

        <Technology />
        <TechnologyGrid />
        <Manufacturing />
        <AIPlatform />
        <GigafactoryNetwork />
        <ResearchInnovation />
        <Industries />


        <Investors />
        <Leadership />
        <Contact />

      </main>

      <Footer />
    </div>
  );
}


/* ---------- Ambient background ---------- */

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-electric)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(1 0 0 / 40%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 40%) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />
      <Particles />
    </div>
  );
}

function Particles() {
  const dots = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="absolute inset-0">
      {dots.map((i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const size = 2 + ((i * 7) % 4);
        const delay = (i % 10) * 0.6;
        const dur = 8 + ((i * 3) % 10);
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background: i % 3 === 0 ? "var(--gold)" : "oklch(1 0 0 / 60%)",
              opacity: 0.35,
              boxShadow: i % 3 === 0 ? "0 0 12px var(--gold)" : "0 0 8px oklch(1 0 0 / 40%)",
              animation: `floaty ${dur}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes floaty {
          0%,100% { transform: translateY(0) translateX(0); opacity:.25; }
          50%     { transform: translateY(-20px) translateX(8px); opacity:.55; }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}

/* ---------- Logo ---------- */

function Logo() {
  return (
    <div
      className="grid h-10 w-10 place-items-center rounded-lg"
      style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 20V8l9-5 9 5v12" />
        <path d="M8 20v-6h8v6" />
        <path d="M12 3v5" />
      </svg>
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden px-6 pt-32">
      {/* Cinematic backdrop */}
      <div aria-hidden className="absolute inset-0 -z-0">
        {!heroLoaded && (
          <div
            className="absolute inset-0 skeleton-block gf-shimmer"
            style={{ borderRadius: 0 }}
          />
        )}
        <img
          src={roboticsLine.url}
          alt=""
          onLoad={() => setHeroLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            heroLoaded ? "opacity-[0.35]" : "opacity-0"
          }`}
          style={{ transform: "scale(1.05)", filter: "grayscale(60%) contrast(1.05)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.14 0.01 250 / 0.4) 0%, oklch(0.10 0.01 250 / 0.85) 55%, oklch(0.08 0.01 250) 100%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay opacity-40"
          style={{ background: "radial-gradient(ellipse at 70% 30%, var(--gold) 0%, transparent 55%)" }}
        />
      </div>


      <div className="mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" />
            Intelligent Industry · Est. 2026
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            Engineering Tomorrow's <br />
            <span className="gold-text">Intelligent Infrastructure</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg text-muted-foreground">
            Gigafactory 3 develops intelligent manufacturing ecosystems powered by artificial
            intelligence, advanced robotics, renewable energy and next-generation industrial
            technology — for governments, enterprises and global industries.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#technology"
              className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              Explore Technology
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#investors"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/40 px-5 py-3 text-sm backdrop-blur-md hover:border-[var(--gold)]/50"
            >
              Investor Presentation
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-14 grid max-w-xl grid-cols-3 gap-6 text-sm">
            {[
              { k: "Global", v: "Operations" },
              { k: "Autonomous", v: "Factories" },
              { k: "AI-Native", v: "Platform" },
            ].map((x) => (
              <div key={x.k} className="border-l border-border pl-4">
                <div className="font-display text-xl">{x.k}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{x.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroVisual />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        Scroll
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative aspect-[4/5] w-full max-w-md mx-auto">
      <div
        className="absolute inset-0 rounded-3xl border border-border glass overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Circuit lines */}
        <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full opacity-70">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.72 0.19 245)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={i}
              x1="0"
              x2="400"
              y1={30 + i * 32}
              y2={30 + i * 32}
              stroke="oklch(1 0 0 / 6%)"
              strokeWidth="1"
            />
          ))}
          <path
            d="M20,460 L120,460 L120,320 L220,320 L220,200 L320,200 L320,80 L380,80"
            fill="none"
            stroke="url(#g1)"
            strokeWidth="2"
          />
          <path
            d="M20,420 L80,420 L80,260 L180,260 L180,140 L260,140"
            fill="none"
            stroke="url(#g1)"
            strokeWidth="1.5"
            opacity="0.6"
          />
          {[
            [120, 320],
            [220, 200],
            [320, 80],
            [180, 260],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="var(--gold)" opacity="0.9">
              <animate attributeName="r" values="4;7;4" dur={`${2 + i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>

        {/* Floating data cards */}
        <div className="absolute left-6 top-6 rounded-xl border border-border bg-background/60 p-3 text-xs backdrop-blur-md">
          <div className="text-muted-foreground">AI Cell · 07</div>
          <div className="font-display text-lg">99.982%</div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--gold)]">Uptime</div>
        </div>

        <div className="absolute bottom-6 right-6 rounded-xl border border-border bg-background/60 p-3 text-xs backdrop-blur-md">
          <div className="text-muted-foreground">Throughput</div>
          <div className="font-display text-lg">12,480<span className="text-sm text-muted-foreground">/hr</span></div>
          <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-[var(--surface)]">
            <div className="h-full w-3/4" style={{ background: "var(--gradient-gold)" }} />
          </div>
        </div>

        <div className="absolute right-6 top-24 rounded-xl border border-border bg-background/60 p-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-[var(--gold)]">
            <Sparkles className="h-3 w-3" />
            <span className="uppercase tracking-widest">Digital Twin</span>
          </div>
          <div className="mt-1 text-muted-foreground">Cell sync 1.2 ms</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Company Overview ---------- */

const OVERVIEW_PILLARS = [
  {
    k: "Founded",
    v: "2026",
    d: "Global HQ",
  },
  {
    k: "47",
    v: "Countries",
    d: "Operational footprint",
  },
  {
    k: "12,400+",
    v: "Engineers",
    d: "Across 9 disciplines",
  },
  {
    k: "$34B",
    v: "R&D committed",
    d: "Through 2030",
  },
];

function CompanyOverview() {
  return (
    <section id="company" className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          {/* Left — narrative */}
          <div className="lg:col-span-6">
            <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--gold)]">
              About Gigafactory 3
            </div>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Building the operating system for{" "}
              <span className="gold-text">global industry.</span>
            </h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
              Gigafactory 3 is an industrial technology company engineering the next generation
              of intelligent manufacturing. We design, build and operate autonomous factories
              powered by proprietary AI, robotics and clean-energy systems — delivered as a
              single, vertically integrated platform.
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Our mission is to make advanced manufacturing programmable — so nations, enterprises
              and industries can produce anything, anywhere, with precision, resilience and
              sustainability engineered in from the first line of code.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#technology"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
              >
                Our Technology <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#investors"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/40 px-5 py-3 text-sm backdrop-blur-md hover:border-[var(--gold)]/50"
              >
                Corporate Overview <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right — image + floating credentials */}
          <div className="relative lg:col-span-6">
            <div
              className="relative overflow-hidden rounded-3xl border border-border"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <img
                src={facilityExterior.url}
                alt="Gigafactory 3 global headquarters facility"
                className="aspect-[4/5] w-full object-cover"
                style={{ filter: "grayscale(30%) contrast(1.05) brightness(0.9)" }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, oklch(0.08 0.01 250 / 0.85) 100%)",
                }}
              />
              <div
                className="absolute inset-0 mix-blend-overlay opacity-30"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 20%, var(--gold) 0%, transparent 55%)",
                }}
              />
              <div className="absolute inset-x-6 bottom-6">
                <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                  Headquarters
                </div>
                <div className="mt-1 font-display text-2xl text-white">
                  Campus 01 · Intelligent Industry Park
                </div>
              </div>
            </div>

            {/* Floating credential card */}
            <div className="absolute -left-4 -top-6 hidden w-64 rounded-2xl border border-border p-5 glass backdrop-blur-xl md:block">
              <div className="flex items-center gap-2 text-[var(--gold)]">
                <Leaf className="h-4 w-4" />
                <span className="text-[10px] uppercase tracking-[0.28em]">Certified</span>
              </div>
              <div className="mt-2 font-display text-lg leading-tight">
                Net-zero operations by 2032
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Powered end-to-end by on-site renewables and grid-integrated storage.
              </div>
            </div>

            <div className="absolute -bottom-6 -right-4 hidden w-64 rounded-2xl border border-border p-5 glass backdrop-blur-xl md:block">
              <div className="flex items-center gap-2 text-[var(--gold)]">
                <Globe2 className="h-4 w-4" />
                <span className="text-[10px] uppercase tracking-[0.28em]">Sovereign-grade</span>
              </div>
              <div className="mt-2 font-display text-lg leading-tight">
                Trusted by 40+ governments
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Deployed across defence, infrastructure and national industrial programmes.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom credentials strip */}
        <div className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {OVERVIEW_PILLARS.map((p) => (
            <div key={p.k} className="bg-background/60 p-8 backdrop-blur-md">
              <div className="font-display text-4xl gold-text">{p.k}</div>
              <div className="mt-2 text-sm text-foreground">{p.v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {p.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Highlights ---------- */



const HIGHLIGHTS = [
  {
    icon: Cpu,
    title: "Artificial Intelligence",
    body: "Foundation models purpose-built for industrial control, vision and predictive engineering.",
  },
  {
    icon: Bot,
    title: "Robotics & Automation",
    body: "Multi-arm cellular robotics coordinated by autonomous scheduling and fleet intelligence.",
  },
  {
    icon: Factory,
    title: "Advanced Manufacturing",
    body: "Lights-out gigafactories delivering precision at scale across continents.",
  },
  {
    icon: BatteryCharging,
    title: "Clean Energy Systems",
    body: "Grid-integrated battery, storage and renewable infrastructure engineered for continuity.",
  },
];

function Highlights() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Capabilities" title="A vertically integrated technology stack" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-border p-6 glass transition-all hover:-translate-y-1 hover:border-[var(--gold)]/50"
            >
              <div
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{
                  background: "color-mix(in oklab, var(--gold) 15%, transparent)",
                  color: "var(--gold)",
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-5 font-display text-lg">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              <div
                className="pointer-events-none absolute inset-x-6 bottom-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: "var(--gradient-gold)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Cinematic band ---------- */

function CinematicBand() {
  return (
    <section className="relative h-[70vh] w-full overflow-hidden">
      <img
        src={facilityAerial.url}
        alt="Gigafactory 3 global facility"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "grayscale(20%) contrast(1.05) brightness(0.85)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.10 0.01 250) 0%, transparent 25%, transparent 70%, oklch(0.10 0.01 250) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-16 mx-auto max-w-7xl px-6">
        <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--gold)]">
          Operational · 47 countries
        </div>
        <h3 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl">
          A single intelligent factory, <span className="gold-text">continental in scale.</span>
        </h3>
      </div>
    </section>
  );
}

/* ---------- Metrics ---------- */


function Metrics() {
  return (
    <section className="relative border-y border-border bg-[color-mix(in_oklab,var(--surface)_60%,transparent)] px-6 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3 lg:grid-cols-6">
        <Suspense fallback={<MetricsSkeleton />}>
          <MetricsList />
        </Suspense>
      </div>
    </section>
  );
}

function MetricsList() {
  const { data: metrics } = useSuspenseQuery(metricsQueryOptions);
  return (
    <>
      {metrics.map((m: Metric) => (
        <Counter
          key={m.id}
          value={m.value}
          suffix={m.suffix}
          label={m.label}
          decimals={m.decimals}
          sub={m.sub ?? undefined}
        />
      ))}
    </>
  );
}

function MetricsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="text-center">
          <div className="mx-auto h-10 w-28 rounded-md skeleton-block gf-shimmer sm:h-12" />
          <div className="mx-auto mt-3 h-3 w-20 rounded skeleton-block gf-shimmer" />
          <div className="mx-auto mt-2 h-2 w-14 rounded skeleton-block gf-shimmer opacity-70" />
        </div>
      ))}
    </>
  );
}


function Counter({
  value,
  suffix = "",
  label,
  decimals = 0,
  sub,
}: {
  value: number;
  suffix?: string;
  label: string;
  decimals?: number;
  sub?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const start = performance.now();
            const dur = 1600;
            const step = (t: number) => {
              const p = Math.min(1, (t - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              setN(value * eased);
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl gold-text sm:text-5xl">
        {n.toFixed(decimals)}
        {suffix}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground/70">{sub}</div>}
    </div>
  );
}

/* ---------- Core Technologies ---------- */

const CORE_TECH = [
  {
    icon: Cpu,
    tag: "Artificial Intelligence",
    title: "Industrial foundation models",
    body: "A unified AI stack for perception, control, forecasting and generative engineering across every cell, line and site.",
    stat: "180B",
    statLabel: "Parameters trained on industrial telemetry",
  },
  {
    icon: Bot,
    tag: "Robotics",
    title: "Cellular robotic systems",
    body: "Modular robotic cells with sub-millimetre precision, adaptive coordination and closed-loop learning at fleet scale.",
    stat: "0.08mm",
    statLabel: "Repeatable positioning tolerance",
  },
  {
    icon: Factory,
    tag: "Advanced Manufacturing",
    title: "Autonomous gigafactories",
    body: "Lights-out production campuses coordinated by a real-time digital twin — from raw material to finished system.",
    stat: "24/7",
    statLabel: "Continuous autonomous operation",
  },
  {
    icon: BatteryCharging,
    tag: "Battery Systems",
    title: "Cell-to-grid architecture",
    body: "Next-generation battery chemistries with integrated thermal, safety and lifecycle intelligence.",
    stat: "1.4 TWh",
    statLabel: "Annual storage capacity deployed",
  },
  {
    icon: Atom,
    tag: "Semiconductors",
    title: "Advanced node manufacturing",
    body: "Deep-UV lithography lines producing power, sensing and edge-inference silicon in-house.",
    stat: "3nm",
    statLabel: "Leading-node production capability",
  },
  {
    icon: Network,
    tag: "Industrial Automation",
    title: "Self-orchestrating networks",
    body: "Continent-scale production networks that plan, adapt and route autonomously in real time.",
    stat: "90 s",
    statLabel: "Capacity re-planning cadence",
  },
  {
    icon: Sparkles,
    tag: "Digital Twin Systems",
    title: "Photoreal factory simulation",
    body: "Physics-accurate twins of every facility — used for design, control synthesis and predictive operations.",
    stat: "1.2 ms",
    statLabel: "Cell-to-twin synchronization",
  },
];

function Technology() {
  const [active, setActive] = useState(0);
  const featured = CORE_TECH[active];
  const FeaturedIcon = featured.icon;

  return (
    <section id="technology" className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Core Technologies"
          title="Seven platforms. One engineered future."
          desc="Every layer of the stack is developed vertically — from silicon and software to robotics, energy and orchestration."
        />

        {/* Featured showcase */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          {/* Feature card */}
          <div
            className="relative overflow-hidden rounded-3xl border border-border p-8 glass lg:col-span-7 lg:p-12"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
              style={{ background: "var(--gradient-gold)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, oklch(1 0 0 / 40%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 40%) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{
                    background: "color-mix(in oklab, var(--gold) 15%, transparent)",
                    color: "var(--gold)",
                  }}
                >
                  <FeaturedIcon className="h-5 w-5" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--gold)]">
                  0{active + 1} · {featured.tag}
                </div>
              </div>

              <h3
                key={featured.title}
                className="mt-6 font-display text-3xl leading-tight animate-fade-in sm:text-4xl lg:text-5xl"
              >
                {featured.title}
              </h3>
              <p
                key={featured.body}
                className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground animate-fade-in"
              >
                {featured.body}
              </p>

              <div className="mt-10 flex flex-wrap items-end gap-10">
                <div>
                  <div className="font-display text-5xl gold-text sm:text-6xl">
                    {featured.stat}
                  </div>
                  <div className="mt-2 max-w-[16rem] text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {featured.statLabel}
                  </div>
                </div>
                <a
                  href="#contact"
                  className="ml-auto inline-flex items-center gap-2 rounded-xl border border-border bg-background/40 px-5 py-3 text-sm backdrop-blur-md transition-colors hover:border-[var(--gold)]/50"
                >
                  Technical brief <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Selector list */}
          <div className="lg:col-span-5">
            <ul className="grid gap-2">
              {CORE_TECH.map((t, i) => {
                const Icon = t.icon;
                const isActive = i === active;
                return (
                  <li key={t.tag}>
                    <button
                      onClick={() => setActive(i)}
                      className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${
                        isActive
                          ? "border-[var(--gold)]/60 bg-background/60"
                          : "border-border bg-background/20 hover:border-[var(--gold)]/30 hover:bg-background/40"
                      }`}
                    >
                      <div
                        className="grid h-10 w-10 flex-none place-items-center rounded-lg"
                        style={{
                          background: isActive
                            ? "var(--gradient-gold)"
                            : "color-mix(in oklab, var(--gold) 10%, transparent)",
                          color: isActive
                            ? "var(--primary-foreground)"
                            : "var(--gold)",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                          0{i + 1}
                        </div>
                        <div className="mt-0.5 truncate font-display text-base">
                          {t.tag}
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-4 w-4 flex-none transition-all ${
                          isActive
                            ? "text-[var(--gold)] translate-x-0.5"
                            : "text-muted-foreground opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Technology Grid (3x2 + banner + counters) ---------- */

const TECH_GRID = [
  {
    icon: Brain,
    tag: "Artificial Intelligence",
    body: "Developing intelligent systems capable of predictive analytics, industrial automation, computer vision, and autonomous decision support to improve efficiency across manufacturing and infrastructure.",
    cta: "Learn more",
  },
  {
    icon: Bot,
    tag: "Robotics & Automation",
    body: "Designing autonomous robotic platforms and precision automation systems that improve safety, productivity, and manufacturing accuracy.",
    cta: "Explore robotics",
  },
  {
    icon: Factory,
    tag: "Advanced Manufacturing",
    body: "Building digitally connected production environments powered by AI, intelligent sensors, and next-generation manufacturing technologies.",
    cta: "View platform",
  },
  {
    icon: Zap,
    tag: "Renewable Energy Systems",
    body: "Creating intelligent energy solutions designed to improve sustainability, optimize power management, and support resilient industrial operations.",
    cta: "Discover energy",
  },
  {
    icon: CircuitBoard,
    tag: "Industrial Software",
    body: "Developing digital platforms that connect machines, facilities, and operational data to enable intelligent industrial management.",
    cta: "View software",
  },
  {
    icon: FlaskConical,
    tag: "Research & Innovation",
    body: "Driving continuous innovation through research programs exploring future technologies, engineering breakthroughs, and emerging industrial solutions.",
    cta: "Research center",
  },
];

const TECH_STATS = [
  { value: 12, suffix: "+", label: "Technology programs", sub: "Active across the stack" },
  { value: 50, suffix: "+", label: "Research initiatives", sub: "Global engineering network" },
  { value: 100, suffix: "+", label: "Innovation concepts", sub: "In prototyping & validation" },
  { value: 24, suffix: "/7", label: "Engineering excellence", sub: "Continuous operations" },
];

function TechnologyGrid() {
  return (
    <section id="technology-grid" className="relative px-6 py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-[420px] max-w-6xl opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, oklch(0.72 0.19 245 / 22%), transparent 60%), radial-gradient(ellipse at 75% 55%, oklch(0.82 0.14 85 / 18%), transparent 65%)",
        }}
      />
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Technology"
          title="Engineering the technologies that build tomorrow"
          desc="At Gigafactory 3, we develop intelligent technologies that transform industries through artificial intelligence, advanced automation, robotics, sustainable energy, and next-generation manufacturing systems."
        />

        <div className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
          <p>
            Innovation is not just about creating products — it is about building the systems that
            power the future. Our technology ecosystem integrates intelligent software, precision
            engineering, advanced manufacturing, and digital infrastructure into scalable solutions
            for industries around the world.
          </p>
        </div>

        {/* 3x2 grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_GRID.map((t, i) => {
            const Icon = t.icon;
            return (
              <article
                key={t.tag}
                className="group relative overflow-hidden rounded-2xl border border-border p-7 glass transition-all duration-500 hover:-translate-y-1 hover:border-[var(--gold)]/50 animate-fade-in"
                style={{
                  animationDelay: `${i * 80}ms`,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.82 0.14 85 / 40%), transparent 40%, oklch(0.72 0.19 245 / 30%))",
                    mask: "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
                    WebkitMask:
                      "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: "1px",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: "var(--gradient-gold)" }}
                />

                <div className="relative">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: "color-mix(in oklab, var(--gold) 14%, transparent)",
                      color: "var(--gold)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="mt-5 text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                    0{i + 1}
                  </div>
                  <h3 className="mt-2 font-display text-xl leading-snug">{t.tag}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.body}</p>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--gold)] transition-transform duration-300 hover:translate-x-0.5"
                  >
                    {t.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {/* Statement banner */}
        <div
          className="relative mt-20 overflow-hidden rounded-3xl border border-border"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${roboticsLine.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "grayscale(0.7) brightness(0.35)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, oklch(0.16 0.015 260 / 92%) 0%, oklch(0.16 0.015 260 / 55%) 55%, oklch(0.72 0.19 245 / 25%) 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, oklch(1 0 0 / 40%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 40%) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          <div className="relative grid gap-10 p-10 lg:grid-cols-3 lg:p-16">
            <div className="lg:col-span-2">
              <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--gold)]">
                The Gigafactory 3 doctrine
              </div>
              <h3 className="mt-4 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
                <span className="gold-text">Innovation driven.</span>
                <br />
                Intelligence powered.
                <br />
                <span className="text-muted-foreground">Future ready.</span>
              </h3>
            </div>
            <div className="flex flex-col justify-end gap-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                A futuristic manufacturing campus of robotic systems, holographic interfaces,
                automated production lines and intelligent energy infrastructure — engineered as a
                single, coherent industrial platform.
              </p>
              <a
                href="#contact"
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--gold)]/40 bg-background/40 px-5 py-3 text-sm text-foreground backdrop-blur-md transition-all hover:border-[var(--gold)] hover:shadow-[0_0_24px_-6px_oklch(0.82_0.14_85/60%)]"
              >
                Request a technology briefing <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Animated stats */}
        <div className="mt-16 grid gap-8 rounded-2xl border border-border p-8 glass sm:grid-cols-2 lg:grid-cols-4">
          {TECH_STATS.map((s) => (
            <Counter
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={s.label}
              sub={s.sub}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Manufacturing ---------- */

const ECOSYSTEM_STAGES = [
  {
    n: "01",
    tag: "Ingest",
    title: "Raw materials & precision inputs",
    body: "Automated intake, spectral inspection and traceable material genealogy from the first gram to the finished system.",
  },
  {
    n: "02",
    tag: "Fabricate",
    title: "Robotic cellular production",
    body: "Multi-arm robotic cells synchronised at millisecond cadence, orchestrated by autonomous scheduling and vision AI.",
  },
  {
    n: "03",
    tag: "Assemble",
    title: "Adaptive assembly at scale",
    body: "Reconfigurable lines that switch product mix in minutes — the same floor builds vehicles, energy systems or robotics.",
  },
  {
    n: "04",
    tag: "Validate",
    title: "Closed-loop quality intelligence",
    body: "Every unit inspected by industrial vision AI and physics-based twin comparison before it leaves the line.",
  },
  {
    n: "05",
    tag: "Deliver",
    title: "Integrated global logistics",
    body: "Autonomous inland networks, port operations and last-mile fleets, coordinated from the same control plane.",
  },
];

const ECOSYSTEM_STATS = [
  { k: "24", v: "Interconnected sites", d: "Across 4 continents" },
  { k: "< 90 s", v: "Re-planning cadence", d: "Global capacity optimizer" },
  { k: "99.98%", v: "Line uptime", d: "Trailing 12 months" },
  { k: "0", v: "Landfill waste", d: "Closed material loops" },
];

function Manufacturing() {
  return (
    <section id="manufacturing" className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Manufacturing Ecosystem"
          title="One continuous system, from raw material to finished product."
          desc="Every gigafactory operates as a node inside a single intelligent manufacturing ecosystem — coordinated in real time by our AI platform."
        />

        {/* Cinematic image + overlay */}
        <div className="mt-14 grid gap-8 lg:grid-cols-12">
          <div
            className="relative overflow-hidden rounded-3xl border border-border lg:col-span-7"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <img
              src={productionLine.url}
              alt="Autonomous production line"
              className="aspect-[4/3] w-full object-cover"
              style={{ filter: "grayscale(35%) contrast(1.05) brightness(0.9)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 30%, oklch(0.08 0.01 250 / 0.9) 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
              style={{ background: "var(--gradient-gold)" }}
            />
            <div className="absolute inset-x-6 bottom-6">
              <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                Cell 07 · Live telemetry
              </div>
              <div className="mt-1 font-display text-2xl text-white sm:text-3xl">
                12,480 <span className="text-lg text-muted-foreground">units / hr</span>
              </div>
              <div className="mt-3 h-1 w-56 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-4/5" style={{ background: "var(--gradient-gold)" }} />
              </div>
            </div>

            <div className="absolute right-6 top-6 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                Digital twin
              </div>
              <div className="mt-1 font-display">1.2 ms sync</div>
            </div>
          </div>

          {/* KPI panel */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-5">
            {ECOSYSTEM_STATS.map((s) => (
              <div
                key={s.v}
                className="rounded-2xl border border-border p-6 glass backdrop-blur"
              >
                <div className="font-display text-3xl gold-text">{s.k}</div>
                <div className="mt-2 text-sm text-foreground">{s.v}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {s.d}
                </div>
              </div>
            ))}
            <div className="col-span-2 rounded-2xl border border-border p-6 glass backdrop-blur">
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Sub-second telemetry across every actuator and sensor",
                  "Closed-loop vision-AI quality inspection",
                  "Adaptive scheduling re-plans capacity every 90 seconds",
                  "Zero-waste flows with on-site renewable generation",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--gold)", boxShadow: "0 0 10px var(--gold)" }}
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Ecosystem pipeline */}
        <div className="mt-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--gold)]">
                The pipeline
              </div>
              <h3 className="mt-3 font-display text-2xl sm:text-3xl">
                Five coordinated stages, one autonomous flow.
              </h3>
            </div>
            <a
              href="#contact"
              className="hidden items-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-2 text-sm backdrop-blur-md hover:border-[var(--gold)]/50 md:inline-flex"
            >
              Request site tour <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="relative">
            {/* connector line */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px lg:block"
              style={{
                background:
                  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--gold) 45%, transparent), transparent)",
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {ECOSYSTEM_STAGES.map((s) => (
                <div
                  key={s.n}
                  className="group relative rounded-2xl border border-border p-6 glass transition-all hover:-translate-y-1 hover:border-[var(--gold)]/50"
                >
                  <div
                    className="grid h-10 w-10 place-items-center rounded-full font-display text-sm"
                    style={{
                      background: "var(--gradient-gold)",
                      color: "var(--primary-foreground)",
                      boxShadow: "var(--shadow-glow)",
                    }}
                  >
                    {s.n}
                  </div>
                  <div className="mt-5 text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                    {s.tag}
                  </div>
                  <div className="mt-2 font-display text-lg leading-snug">{s.title}</div>
                  <p className="mt-3 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ---------- AI Platform ---------- */

const AI_MODULES = [
  {
    tag: "Perception",
    title: "Industrial vision & sensing",
    body: "Real-time fusion of camera, LiDAR, spectral and acoustic streams — 4M inferences per second per site.",
    metric: "4M/s",
  },
  {
    tag: "Control",
    title: "Autonomous cell orchestration",
    body: "Closed-loop reinforcement learning controllers coordinating thousands of actuators at millisecond cadence.",
    metric: "0.9 ms",
  },
  {
    tag: "Forecast",
    title: "Predictive engineering",
    body: "Physics-informed models forecasting yield, wear and demand across every line, weeks in advance.",
    metric: "> 98%",
  },
  {
    tag: "Generate",
    title: "Generative design & code",
    body: "Foundation models that generate part geometry, control code and process recipes from engineering intent.",
    metric: "180B",
  },
];

const AI_STACK = [
  {
    layer: "Applications",
    body: "Vision, control, forecasting, generative engineering, natural-language operations.",
  },
  {
    layer: "Foundation models",
    body: "GF3-Industrial · 180B parameters, trained on 40+ years of industrial telemetry.",
  },
  {
    layer: "Data platform",
    body: "Real-time feature store, digital-twin fabric and closed-loop feedback pipelines.",
  },
  {
    layer: "Compute",
    body: "In-house edge inference silicon paired with sovereign, liquid-cooled AI campuses.",
  },
];

function AIPlatform() {
  return (
    <section id="ai" className="relative overflow-hidden px-6 py-32">
      {/* section backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(1 0 0 / 40%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 40%) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-electric)" }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="AI Platform"
          title="The intelligence layer for global industry."
          desc="GF3 Intelligence is our proprietary AI platform — a unified stack of foundation models, control systems and data fabric that runs every factory, product and network we build."
        />

        {/* Hero panel: stack + live console */}
        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          {/* Stack visualization */}
          <div
            className="relative overflow-hidden rounded-3xl border border-border p-8 glass lg:col-span-7 lg:p-10"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="text-[11px] uppercase tracking-[0.32em] text-[var(--gold)]">
              GF3 Intelligence · Platform stack
            </div>
            <h3 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
              A single vertically integrated <span className="gold-text">AI stack.</span>
            </h3>

            <div className="mt-10 space-y-3">
              {AI_STACK.map((s, i) => (
                <div
                  key={s.layer}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-border bg-background/30 p-4 transition-colors hover:border-[var(--gold)]/40"
                  style={{
                    opacity: 1 - i * 0.06,
                  }}
                >
                  <div
                    className="grid h-8 w-8 place-items-center rounded-md font-display text-xs"
                    style={{
                      background: "color-mix(in oklab, var(--gold) 15%, transparent)",
                      color: "var(--gold)",
                    }}
                  >
                    L{4 - i}
                  </div>
                  <div>
                    <div className="font-display text-base">{s.layer}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.body}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--gold)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Live console */}
          <div
            className="relative overflow-hidden rounded-3xl border border-border glass lg:col-span-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <span className="h-2 w-2 rounded-full bg-[var(--gold)] shadow-[0_0_10px_var(--gold)]" />
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                GF3-Industrial · live console
              </div>
              <div className="ml-auto text-[10px] text-muted-foreground/70">us-east · 04:12:07</div>
            </div>
            <div className="p-5 font-mono text-[12px] leading-relaxed text-muted-foreground">
              <div>
                <span className="text-[var(--gold)]">$</span> gf3 infer --cell=07 --stream
              </div>
              <div className="mt-2">→ perception.fusion   <span className="text-foreground">ok</span>  <span className="text-muted-foreground/70">0.42ms</span></div>
              <div>→ control.policy      <span className="text-foreground">ok</span>  <span className="text-muted-foreground/70">0.31ms</span></div>
              <div>→ twin.sync           <span className="text-foreground">ok</span>  <span className="text-muted-foreground/70">1.18ms</span></div>
              <div className="mt-3 text-foreground">
                yield forecast · <span className="gold-text font-display">98.7%</span> · +0.4% vs base
              </div>
              <div className="mt-1 text-foreground">
                anomalies detected · <span className="gold-text font-display">0</span> across 12,480 units/hr
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%]" style={{ background: "var(--gradient-gold)" }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
                <span>Model load</span>
                <span>92%</span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[var(--gold)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-[0.28em]">Autonomous mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Capability grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AI_MODULES.map((m) => (
            <div
              key={m.tag}
              className="group relative overflow-hidden rounded-2xl border border-border p-6 glass transition-all hover:-translate-y-1 hover:border-[var(--gold)]/50"
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                  {m.tag}
                </div>
                <div className="font-display text-lg gold-text">{m.metric}</div>
              </div>
              <div className="mt-4 font-display text-lg leading-snug">{m.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
              <div
                className="pointer-events-none absolute inset-x-6 bottom-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: "var(--gradient-gold)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Gigafactory Network ---------- */

type SiteStatus = "operational" | "commissioning" | "planned";

const NETWORK_SITES: {
  id: string;
  name: string;
  region: string;
  x: number; // % of viewbox
  y: number;
  status: SiteStatus;
  capacity: string;
  output: string;
  uptime: string;
  since: string;
  focus: string;
}[] = [
  {
    id: "gf-01",
    name: "Campus 01 · Global HQ",
    region: "Asia-Pacific",
    x: 78,
    y: 46,
    status: "operational",
    capacity: "1.4 TWh / yr",
    output: "12,480 units/hr",
    uptime: "99.98%",
    since: "2026",
    focus: "AI · Robotics · Semiconductors",
  },
  {
    id: "gf-02",
    name: "Campus 02 · North Sea",
    region: "Europe",
    x: 48,
    y: 32,
    status: "operational",
    capacity: "980 GWh / yr",
    output: "8,240 units/hr",
    uptime: "99.94%",
    since: "2027",
    focus: "Battery · Clean energy",
  },
  {
    id: "gf-03",
    name: "Campus 03 · Sonoran",
    region: "North America",
    x: 20,
    y: 42,
    status: "operational",
    capacity: "1.1 TWh / yr",
    output: "10,100 units/hr",
    uptime: "99.96%",
    since: "2027",
    focus: "Robotics · Advanced manufacturing",
  },
  {
    id: "gf-04",
    name: "Campus 04 · Atacama",
    region: "South America",
    x: 30,
    y: 72,
    status: "commissioning",
    capacity: "620 GWh / yr",
    output: "3,120 units/hr",
    uptime: "97.10%",
    since: "2028",
    focus: "Solar · Storage",
  },
  {
    id: "gf-05",
    name: "Campus 05 · Rift Valley",
    region: "Africa",
    x: 55,
    y: 62,
    status: "commissioning",
    capacity: "480 GWh / yr",
    output: "2,140 units/hr",
    uptime: "96.20%",
    since: "2028",
    focus: "Grid · Infrastructure",
  },
  {
    id: "gf-06",
    name: "Campus 06 · Pilbara",
    region: "Oceania",
    x: 84,
    y: 72,
    status: "planned",
    capacity: "1.6 TWh / yr",
    output: "—",
    uptime: "—",
    since: "2029",
    focus: "Battery · Materials",
  },
];

const STATUS_STYLES: Record<
  SiteStatus,
  { label: string; color: string; ring: string; text: string }
> = {
  operational: {
    label: "Operational",
    color: "var(--gold)",
    ring: "0 0 0 6px color-mix(in oklab, var(--gold) 20%, transparent)",
    text: "text-[var(--gold)]",
  },
  commissioning: {
    label: "Commissioning",
    color: "oklch(0.78 0.16 220)",
    ring: "0 0 0 6px color-mix(in oklab, oklch(0.78 0.16 220) 25%, transparent)",
    text: "text-foreground",
  },
  planned: {
    label: "Planned",
    color: "oklch(0.65 0.02 250)",
    ring: "0 0 0 6px color-mix(in oklab, oklch(0.65 0.02 250) 25%, transparent)",
    text: "text-muted-foreground",
  },
};

function GigafactoryNetwork() {
  const [activeId, setActiveId] = useState(NETWORK_SITES[0].id);
  const active = NETWORK_SITES.find((s) => s.id === activeId) ?? NETWORK_SITES[0];

  const counts = {
    operational: NETWORK_SITES.filter((s) => s.status === "operational").length,
    commissioning: NETWORK_SITES.filter((s) => s.status === "commissioning").length,
    planned: NETWORK_SITES.filter((s) => s.status === "planned").length,
  };

  return (
    <section id="network" className="relative overflow-hidden px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Gigafactory Network"
          title="One intelligent grid. Continental in scale."
          desc="Six flagship campuses across four continents — synchronised by a single autonomous control plane."
        />

        {/* Network legend / rollup */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { k: "Operational", v: counts.operational, s: "operational" as SiteStatus },
              { k: "Commissioning", v: counts.commissioning, s: "commissioning" as SiteStatus },
              { k: "Planned 2028–2030", v: counts.planned, s: "planned" as SiteStatus },
            ]
          ).map((r) => {
            const st = STATUS_STYLES[r.s];
            return (
              <div
                key={r.k}
                className="flex items-center gap-4 rounded-2xl border border-border p-5 glass"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: st.color, boxShadow: `0 0 12px ${st.color}` }}
                />
                <div>
                  <div className="font-display text-2xl">{r.v}</div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {r.k}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 rounded-2xl border border-border p-5 glass">
            <Globe2 className="h-5 w-5 text-[var(--gold)]" />
            <div>
              <div className="font-display text-2xl gold-text">47</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Countries served
              </div>
            </div>
          </div>
        </div>

        {/* Map + detail panel */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Map */}
          <div
            className="relative overflow-hidden rounded-3xl border border-border p-6 glass lg:col-span-8"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                Global control plane · Live
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" />
                Sync 1.2 ms
              </div>
            </div>

            <div className="relative mt-4 aspect-[16/9] w-full">
              {/* Grid backdrop */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, oklch(1 0 0 / 8%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 8%) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  maskImage:
                    "radial-gradient(ellipse at center, black 55%, transparent 90%)",
                }}
              />
              {/* Stylised world map */}
              <svg
                viewBox="0 0 1000 500"
                className="absolute inset-0 h-full w-full"
                aria-hidden
              >
                <defs>
                  <radialGradient id="glowGold" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="linkGrad" x1="0" x2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 245)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Continents (abstract dotted shapes) */}
                {Array.from({ length: 220 }).map((_, i) => {
                  const x = (i * 53) % 1000;
                  const y = (i * 97) % 500;
                  // rough continental mask
                  const inLand =
                    (x > 120 && x < 340 && y > 120 && y < 380) ||
                    (x > 440 && x < 580 && y > 100 && y < 320) ||
                    (x > 700 && x < 900 && y > 130 && y < 360) ||
                    (x > 260 && x < 400 && y > 320 && y < 460) ||
                    (x > 500 && x < 640 && y > 280 && y < 430) ||
                    (x > 800 && x < 920 && y > 320 && y < 420);
                  if (!inLand) return null;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={1.6}
                      fill="oklch(1 0 0 / 22%)"
                    />
                  );
                })}

                {/* Connection lines between operational sites */}
                {NETWORK_SITES.filter((s) => s.status !== "planned").map((a, i, arr) =>
                  arr.slice(i + 1).map((b) => (
                    <line
                      key={`${a.id}-${b.id}`}
                      x1={a.x * 10}
                      y1={a.y * 5}
                      x2={b.x * 10}
                      y2={b.y * 5}
                      stroke="url(#linkGrad)"
                      strokeWidth={
                        a.id === active.id || b.id === active.id ? 1.4 : 0.7
                      }
                      opacity={a.id === active.id || b.id === active.id ? 0.9 : 0.35}
                    />
                  ))
                )}
              </svg>

              {/* Site markers (HTML for interactivity) */}
              {NETWORK_SITES.map((s) => {
                const st = STATUS_STYLES[s.status];
                const isActive = s.id === active.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    aria-label={`${s.name} — ${st.label}`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  >
                    <span
                      className="block h-3 w-3 rounded-full transition-all"
                      style={{
                        background: st.color,
                        boxShadow: isActive
                          ? `0 0 0 8px color-mix(in oklab, ${st.color} 28%, transparent), 0 0 22px ${st.color}`
                          : st.ring,
                      }}
                    />
                    {s.status === "operational" && (
                      <span
                        aria-hidden
                        className="absolute inset-0 -m-1 rounded-full"
                        style={{
                          boxShadow: `0 0 0 2px color-mix(in oklab, ${st.color} 45%, transparent)`,
                          animation: "ping 2.4s cubic-bezier(0,0,0.2,1) infinite",
                        }}
                      />
                    )}
                    <span
                      className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] backdrop-blur transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {s.id.toUpperCase()}
                    </span>
                  </button>
                );
              })}

              <style>{`
                @keyframes ping {
                  0% { transform: scale(1); opacity: .7; }
                  80%,100% { transform: scale(2.4); opacity: 0; }
                }
              `}</style>
            </div>

            {/* Status legend */}
            <div className="mt-4 flex flex-wrap items-center gap-5 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {(Object.keys(STATUS_STYLES) as SiteStatus[]).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: STATUS_STYLES[k].color,
                      boxShadow: `0 0 8px ${STATUS_STYLES[k].color}`,
                    }}
                  />
                  {STATUS_STYLES[k].label}
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div
            className="relative overflow-hidden rounded-3xl border border-border glass lg:col-span-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="border-b border-border p-6">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                  {active.region}
                </div>
                <div
                  className="flex items-center gap-2 rounded-full border border-border bg-background/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: STATUS_STYLES[active.status].color }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: STATUS_STYLES[active.status].color,
                      boxShadow: `0 0 8px ${STATUS_STYLES[active.status].color}`,
                    }}
                  />
                  {STATUS_STYLES[active.status].label}
                </div>
              </div>
              <h3 className="mt-3 font-display text-2xl leading-tight">{active.name}</h3>
              <div className="mt-1 text-xs text-muted-foreground">{active.focus}</div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                { k: "Capacity", v: active.capacity },
                { k: "Live output", v: active.output },
                { k: "Uptime (30d)", v: active.uptime },
                { k: "Online since", v: active.since },
              ].map((row) => (
                <div key={row.k} className="bg-background/60 p-5">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {row.k}
                  </div>
                  <div className="mt-1 font-display text-lg">{row.v}</div>
                </div>
              ))}
            </div>

            <div className="p-6">
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Live telemetry
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { k: "Grid load", w: "82%" },
                  { k: "Robotic fleet", w: "94%" },
                  { k: "AI inference", w: "71%" },
                ].map((b) => (
                  <div key={b.k}>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{b.k}</span>
                      <span className="text-foreground">{b.w}</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: b.w, background: "var(--gradient-gold)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="#contact"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm backdrop-blur-md transition-colors hover:border-[var(--gold)]/50"
              >
                Request site briefing <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Industries ---------- */

const INDUSTRIES = [
  {
    id: "manufacturing",
    icon: Factory,
    name: "Manufacturing",
    tag: "Discrete & process",
    lead: "Autonomous production for the world's most demanding factories.",
    body:
      "Turnkey lights-out lines for automotive, electronics and heavy industry — orchestrated by GF3 Intelligence and continuously optimised for yield.",
    stats: [
      { k: "Yield uplift", v: "+18%" },
      { k: "Downtime", v: "-64%" },
    ],
    uses: ["Automotive assembly", "Electronics SMT", "Heavy machinery"],
  },
  {
    id: "energy",
    icon: BatteryCharging,
    name: "Energy",
    tag: "Generation & storage",
    lead: "Continental-scale clean generation, storage and dispatch.",
    body:
      "Grid-forming inverters, iron-air storage and autonomous microgrid controllers keep utilities and hyperscale operators firm on renewables.",
    stats: [
      { k: "Storage online", v: "8.4 GWh" },
      { k: "Firm renewable", v: "94%" },
    ],
    uses: ["Utility storage", "Data-center firming", "Industrial microgrids"],
  },
  {
    id: "aerospace",
    icon: Rocket,
    name: "Aerospace",
    tag: "Air & orbital",
    lead: "Advanced structures, propulsion and orbital infrastructure.",
    body:
      "Composite airframes, hypersonic thermal systems and reusable launch structures machined to sub-100 micron tolerances at gigafactory volume.",
    stats: [
      { k: "Tolerance", v: "0.08 mm" },
      { k: "Payload cadence", v: "Weekly" },
    ],
    uses: ["Reusable launch", "Satellite platforms", "Hypersonic systems"],
  },
  {
    id: "logistics",
    icon: Network,
    name: "Logistics",
    tag: "Autonomous supply",
    lead: "AI-orchestrated ports, warehouses and long-haul corridors.",
    body:
      "Autonomous ground fleets, robotic sortation and predictive routing eliminate bottlenecks across intercontinental supply chains.",
    stats: [
      { k: "Throughput", v: "+42%" },
      { k: "On-time SLA", v: "99.6%" },
    ],
    uses: ["Smart ports", "Robotic warehousing", "Autonomous fleet"],
  },
  {
    id: "cities",
    icon: Globe2,
    name: "Smart Cities",
    tag: "Urban intelligence",
    lead: "Sensing, mobility and energy stacks for the next century of cities.",
    body:
      "City-scale digital twins integrate mobility, grid and utility telemetry — reducing emissions and unlocking real-time responsive infrastructure.",
    stats: [
      { k: "Emissions cut", v: "-31%" },
      { k: "Traffic time", v: "-22%" },
    ],
    uses: ["Digital twin cities", "Adaptive mobility", "Urban microgrids"],
  },
  {
    id: "infrastructure",
    icon: Atom,
    name: "Infrastructure",
    tag: "Civil & industrial",
    lead: "Engineered infrastructure delivered as an integrated system.",
    body:
      "Pre-engineered modular substations, water treatment and telecom cores that ship, install and commission months faster than traditional builds.",
    stats: [
      { k: "Time to online", v: "-58%" },
      { k: "Modular sites", v: "1,240+" },
    ],
    uses: ["Modular substations", "Water systems", "Telecom cores"],
  },
  {
    id: "government",
    icon: ShieldCheck,
    name: "Government",
    tag: "Sovereign platforms",
    lead: "Sovereign AI, secure compute and mission-critical systems.",
    body:
      "Air-gapped inference clusters, secure sensor networks and autonomous logistics purpose-built for defence, intelligence and civil agencies.",
    stats: [
      { k: "Clearance grade", v: "Tier-1" },
      { k: "Sovereign clusters", v: "17" },
    ],
    uses: ["Sovereign AI", "Border sensing", "Mission logistics"],
  },
  {
    id: "sustainability",
    icon: Leaf,
    name: "Sustainability",
    tag: "Circular systems",
    lead: "Closed-loop materials, water and energy across every gigafactory.",
    body:
      "In-house recycling of batteries, silicon and rare metals — with every campus targeting net-zero operations and water-positive discharge by 2030.",
    stats: [
      { k: "Water recycled", v: "96%" },
      { k: "Battery recovery", v: "98%" },
    ],
    uses: ["Battery recycling", "Water reuse", "Circular alloys"],
  },
];

function Industries() {
  const [activeId, setActiveId] = useState(INDUSTRIES[0].id);
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0];
  const ActiveIcon = active.icon;

  return (
    <section id="industries" className="relative overflow-hidden px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Industries Served"
          title="Deployed where the stakes are highest."
          desc="Governments, Fortune 500 operators and frontier innovators run production systems on Gigafactory 3 platforms."
        />

        {/* Tabs */}
        <div className="mt-14 flex flex-wrap gap-2">
          {INDUSTRIES.map(({ id, icon: Icon, name }) => {
            const on = id === activeId;
            return (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                  on
                    ? "border-[color:color-mix(in_oklab,var(--gold)_70%,transparent)] bg-[color:color-mix(in_oklab,var(--gold)_10%,transparent)] text-[var(--gold)]"
                    : "border-border text-muted-foreground hover:border-[color:color-mix(in_oklab,var(--gold)_40%,transparent)] hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {name}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <div
          key={active.id}
          className="mt-8 grid animate-fade-in gap-6 overflow-hidden rounded-3xl border border-border p-8 glass lg:grid-cols-12 lg:p-10"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-white/5">
                <ActiveIcon className="h-5 w-5 text-[var(--gold)]" />
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                  {active.tag}
                </div>
                <div className="font-display text-2xl">{active.name}</div>
              </div>
            </div>
            <h3 className="mt-8 font-display text-3xl leading-tight sm:text-4xl">
              {active.lead}
            </h3>
            <p className="mt-4 max-w-2xl text-muted-foreground">{active.body}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {active.uses.map((u) => (
                <span
                  key={u}
                  className="rounded-full border border-border/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {u}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid h-full gap-4 sm:grid-cols-2">
              {active.stats.map((s) => (
                <div
                  key={s.k}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-white/[0.02] p-6"
                >
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {s.k}
                  </div>
                  <div className="mt-6 font-display text-4xl gold-text">{s.v}</div>
                </div>
              ))}
              <a
                href="#contact"
                className="group flex items-center justify-between rounded-2xl border border-border bg-white/[0.02] p-6 transition hover:border-[color:color-mix(in_oklab,var(--gold)_60%,transparent)] sm:col-span-2"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                    Talk to our team
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {active.name} deployments & partnerships
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-[var(--gold)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ---------- Investors ---------- */

function Investors() {
  return (
    <section id="investors" className="relative px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-10 md:p-16"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--gradient-gold)" }}
          />
          <div className="relative grid gap-12 md:grid-cols-2 md:items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]">
                Investors
              </div>
              <h3 className="mt-4 font-display text-4xl md:text-5xl">
                Building the industrial <span className="gold-text">supermajor</span> of the next century.
              </h3>
              <p className="mt-5 max-w-xl text-muted-foreground">
                A disciplined capital allocation model, vertically integrated engineering and
                long-duration contracts across governments and enterprises — engineered for durable,
                sustainable growth.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/gigafactory3-investor-overview.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
                  style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
                >
                  Download Investor Presentation
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm hover:border-[var(--gold)]/50"
                >
                  Shareholder Portal
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: "Sustainable Growth", v: "Compounding revenue across 24 global sites" },
                { k: "Long-term Innovation", v: "18 % of revenue reinvested into R&D" },
                { k: "Global Expansion", v: "Operations across 47 countries" },
                { k: "Corporate Governance", v: "Independent, investor-aligned board" },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-border bg-[var(--surface)] p-5">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--gold)]">{x.k}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Leadership ---------- */

const LEADERSHIP = [
  {
    initials: "AR",
    name: "Dr. Adira Ramanathan",
    role: "Chair & Chief Executive Officer",
    bio: "Founder of Gigafactory 3. Previously led planetary-scale AI infrastructure programs and advanced-manufacturing systems at three trillion-dollar operators.",
    tags: ["Strategy", "AI systems", "Industrial scale"],
  },
  {
    initials: "KS",
    name: "Kenji Sato",
    role: "Chief Technology Officer",
    bio: "Architect of GF3 Intelligence and our foundation-model platform. 20+ years across silicon design, autonomous robotics and edge inference.",
    tags: ["Silicon", "Foundation models", "Robotics"],
  },
  {
    initials: "MA",
    name: "Dr. Mara Okafor",
    role: "President, Manufacturing Ecosystem",
    bio: "Operates our global campus network — from Shanghai to Berlin — with a focus on lights-out production, yield engineering and industrial safety.",
    tags: ["Operations", "Yield", "Safety"],
  },
  {
    initials: "LV",
    name: "Lars Vogel",
    role: "President, Energy & Infrastructure",
    bio: "Leads grid-scale storage, microgrid autonomy and modular civil infrastructure. Ex-utility CTO with 8+ GW of firm renewables deployed.",
    tags: ["Energy", "Grid", "Civil systems"],
  },
  {
    initials: "SP",
    name: "Sofía Pereira",
    role: "Chief Financial Officer",
    bio: "Steers capital allocation, project finance and investor relations across a multi-continent industrial portfolio and $4.2B annual R&D program.",
    tags: ["Capital", "Governance", "IR"],
  },
  {
    initials: "AN",
    name: "Amir Nazari",
    role: "Chief Research Officer",
    bio: "Directs 32 research labs across materials, silicon, bio-industrial and orbital programs. Holds 140+ granted patents.",
    tags: ["Materials", "Photonics", "Bio-industrial"],
  },
];

const BOARD = [
  "Former U.S. Under Secretary of Energy",
  "Chair, European Industrial Policy Council",
  "Ex-CEO, top-3 global semiconductor foundry",
  "Managing Partner, sovereign infrastructure fund",
  "Chair, International AI Safety Institute",
  "Former CEO, tier-1 aerospace prime",
];

function Leadership() {
  return (
    <section id="leadership" className="relative overflow-hidden px-6 py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px 480px at 85% 10%, color-mix(in oklab, var(--gold) 8%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Leadership"
          title="Engineers, operators and scientists."
          desc="An executive team drawn from the most demanding industrial, technology and government programs in the world."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LEADERSHIP.map((p) => (
            <article
              key={p.name}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border p-7 glass transition hover:-translate-y-1 hover:border-[color:color-mix(in_oklab,var(--gold)_50%,transparent)]"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="grid h-14 w-14 place-items-center rounded-2xl border border-border font-display text-lg text-[var(--gold)]"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--gold) 18%, transparent), transparent)",
                  }}
                >
                  {p.initials}
                </div>
                <div>
                  <div className="font-display text-lg leading-tight">{p.name}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[var(--gold)]">
                    {p.role}
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{p.bio}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -bottom-px h-px opacity-0 transition group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--gold), transparent)",
                }}
              />
            </article>
          ))}
        </div>

        {/* Board */}
        <div
          className="mt-16 overflow-hidden rounded-3xl border border-border p-8 glass sm:p-10"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                Board of Directors
              </div>
              <h3 className="mt-3 font-display text-3xl sm:text-4xl">
                Governance built for global scale.
              </h3>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                An independent board of former heads of state, industrial CEOs and scientific
                leaders — chartered to uphold engineering integrity, safety and long-term value.
              </p>
            </div>
            <a
              href="#investors"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-foreground transition hover:border-[color:color-mix(in_oklab,var(--gold)_60%,transparent)] hover:text-[var(--gold)]"
            >
              Governance overview <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BOARD.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 rounded-2xl border border-border bg-white/[0.02] p-4 text-sm text-muted-foreground"
              >
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]"
                  style={{ boxShadow: "0 0 10px var(--gold)" }}
                />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact & Global Offices ---------- */

const OFFICES = [
  {
    region: "Asia-Pacific",
    city: "Singapore",
    role: "Global Headquarters",
    address: "Neo District · Marina Bay",
    tz: "GMT+8",
    hours: "24 / 7 operations",
  },
  {
    region: "Greater China",
    city: "Shanghai",
    role: "Manufacturing HQ",
    address: "Lingang Special Area",
    tz: "GMT+8",
    hours: "Mon–Sat · 08:00–20:00",
  },
  {
    region: "Europe",
    city: "Berlin",
    role: "European HQ",
    address: "Mitte · Engineering Campus",
    tz: "GMT+1",
    hours: "Mon–Fri · 08:00–19:00",
  },
  {
    region: "North America",
    city: "Austin",
    role: "AI & Silicon HQ",
    address: "East Sixth · Research Campus",
    tz: "GMT-6",
    hours: "Mon–Fri · 08:00–19:00",
  },
  {
    region: "Middle East",
    city: "Abu Dhabi",
    role: "Energy HQ",
    address: "Masdar City",
    tz: "GMT+4",
    hours: "Sun–Thu · 08:00–18:00",
  },
  {
    region: "Latin America",
    city: "São Paulo",
    role: "Regional HQ",
    address: "Faria Lima Tower",
    tz: "GMT-3",
    hours: "Mon–Fri · 08:00–18:00",
  },
];

const CONTACT_CHANNELS = [
  { k: "Enterprise", v: "enterprise@gigafactory3.com" },
  { k: "Investors", v: "ir@gigafactory3.com" },
  { k: "Government", v: "gov@gigafactory3.com" },
  { k: "Media", v: "press@gigafactory3.com" },
  { k: "Careers", v: "careers@gigafactory3.com" },
  { k: "Global desk", v: "+65 6800 3300" },
];

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100, "Max 100 characters"),
  company: z.string().trim().min(2, "Company or institution is required").max(120, "Max 120 characters"),
  email: z.string().trim().email("Enter a valid email").max(255, "Max 255 characters"),
  country: z.string().trim().min(2, "Country or region is required").max(80, "Max 80 characters"),
  interest: z.string().trim().min(3, "Tell us your area of interest").max(160, "Max 160 characters"),
  message: z.string().trim().min(10, "Please provide at least 10 characters").max(1000, "Max 1000 characters"),
});
type ContactValues = z.infer<typeof contactSchema>;
type ContactField = keyof ContactValues;

const CONTACT_INITIAL: ContactValues = {
  name: "", company: "", email: "", country: "", interest: "", message: "",
};

function Contact() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [values, setValues] = useState<ContactValues>(CONTACT_INITIAL);
  const [touched, setTouched] = useState<Record<ContactField, boolean>>({
    name: false, company: false, email: false, country: false, interest: false, message: false,
  });

  const parsed = useMemo(() => contactSchema.safeParse(values), [values]);
  const errors: Partial<Record<ContactField, string>> = useMemo(() => {
    if (parsed.success) return {};
    const out: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as ContactField;
      if (!out[k]) out[k] = issue.message;
    }
    return out;
  }, [parsed]);

  const isValid = parsed.success;

  const setField = (k: ContactField) => (v: string) =>
    setValues((prev) => ({ ...prev, [k]: v }));
  const markTouched = (k: ContactField) => () =>
    setTouched((prev) => ({ ...prev, [k]: true }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (!isValid) {
      setTouched({ name: true, company: true, email: true, country: true, interest: true, message: true });
      return;
    }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 1100);
  };

  const reset = () => {
    setValues(CONTACT_INITIAL);
    setTouched({ name: false, company: false, email: false, country: false, interest: false, message: false });
    setStatus("idle");
  };

  return (
    <section id="contact" className="relative overflow-hidden px-6 py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1000px 500px at 10% 100%, color-mix(in oklab, var(--gold) 8%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Contact & Global Offices"
          title="Speak with engineering."
          desc="For enterprise, government and institutional inquiries — across every time zone we operate in."
        />

        {/* Form + channels */}
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <form
            onSubmit={onSubmit}
            aria-busy={status === "submitting"}
            noValidate
            className="rounded-3xl border border-border p-8 glass lg:col-span-7"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
              Request a briefing
            </div>
            <h3 className="mt-3 font-display text-2xl sm:text-3xl">
              Confidential inquiry
            </h3>

            {status === "success" ? (
              <div
                role="status"
                className="mt-8 flex items-start gap-4 rounded-2xl border border-[color:color-mix(in_oklab,var(--gold)_50%,transparent)] bg-[color:color-mix(in_oklab,var(--gold)_6%,transparent)] p-6 animate-fade-in"
              >
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-[var(--gold)]" />
                <div>
                  <div className="font-display text-lg">Inquiry received.</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A partnerships lead in your region will be in touch within one business day.
                    Reference forwarded to the appropriate desk.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--gold)] hover:underline"
                  >
                    Submit another inquiry
                  </button>
                </div>
              </div>
            ) : (
              <>
                <fieldset
                  disabled={status === "submitting"}
                  className={`mt-8 grid gap-4 sm:grid-cols-2 transition-opacity ${
                    status === "submitting" ? "opacity-60" : "opacity-100"
                  }`}
                >
                  <Field name="name" label="Full name" placeholder="Ada Lovelace" value={values.name} onChange={setField("name")} onBlur={markTouched("name")} error={touched.name ? errors.name : undefined} maxLength={100} required />
                  <Field name="company" label="Company / Institution" placeholder="Organization" value={values.company} onChange={setField("company")} onBlur={markTouched("company")} error={touched.company ? errors.company : undefined} maxLength={120} required />
                  <Field name="email" label="Email" type="email" placeholder="you@company.com" value={values.email} onChange={setField("email")} onBlur={markTouched("email")} error={touched.email ? errors.email : undefined} maxLength={255} required />
                  <Field name="country" label="Country" placeholder="Country / Region" value={values.country} onChange={setField("country")} onBlur={markTouched("country")} error={touched.country ? errors.country : undefined} maxLength={80} required />
                  <Field name="interest" label="Interest" placeholder="AI, robotics, energy, infrastructure…" value={values.interest} onChange={setField("interest")} onBlur={markTouched("interest")} error={touched.interest ? errors.interest : undefined} maxLength={160} full required />
                  <Field name="message" label="Message" placeholder="Tell us about your requirements" value={values.message} onChange={setField("message")} onBlur={markTouched("message")} error={touched.message ? errors.message : undefined} maxLength={1000} full textarea required />
                </fieldset>
                <button
                  type="submit"
                  disabled={status === "submitting" || !isValid}
                  aria-disabled={status === "submitting" || !isValid}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 gf-spin" />
                      Transmitting securely…
                    </>
                  ) : (
                    <>
                      Submit inquiry <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="mt-4 text-xs text-muted-foreground">
                  {isValid
                    ? "All submissions are reviewed by our regional partnerships team within one business day."
                    : "Complete all fields to enable submission. All inquiries are reviewed within one business day."}
                </p>
              </>
            )}
          </form>




          <div className="grid gap-4 lg:col-span-5">
            <div
              className="rounded-3xl border border-border p-8 glass"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                Direct channels
              </div>
              <h3 className="mt-3 font-display text-2xl">Route your request</h3>
              <ul className="mt-6 divide-y divide-border">
                {CONTACT_CHANNELS.map((c) => (
                  <li key={c.k} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      {c.k}
                    </span>
                    <span className="text-foreground">{c.v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="flex items-center gap-4 rounded-3xl border border-border p-6 glass"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-white/5"
              >
                <ShieldCheck className="h-5 w-5 text-[var(--gold)]" />
              </span>
              <div>
                <div className="text-sm">Secure & sovereign inquiries</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  PGP-encrypted channels available on request for government partners.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global offices */}
        <div className="mt-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                Global offices
              </div>
              <h3 className="mt-3 font-display text-3xl sm:text-4xl">
                Present in every region we operate.
              </h3>
            </div>
            <a
              href="#network"
              className="hidden items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-foreground transition hover:border-[color:color-mix(in_oklab,var(--gold)_60%,transparent)] hover:text-[var(--gold)] sm:inline-flex"
            >
              View network <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OFFICES.map((o) => (
              <div
                key={o.city}
                className="group relative overflow-hidden rounded-2xl border border-border p-6 glass transition hover:-translate-y-0.5 hover:border-[color:color-mix(in_oklab,var(--gold)_50%,transparent)]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                    {o.region}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {o.tz}
                  </div>
                </div>
                <div className="mt-5 font-display text-2xl">{o.city}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {o.role}
                </div>
                <div className="mt-6 space-y-1 text-sm text-muted-foreground">
                  <div>{o.address}</div>
                  <div className="text-xs">{o.hours}</div>
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -bottom-px h-px opacity-0 transition group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--gold), transparent)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


function Field({
  name,
  label,
  placeholder,
  type = "text",
  full,
  textarea,
  value,
  onChange,
  onBlur,
  error,
  maxLength,
  required,
}: {
  name?: string;
  label: string;
  placeholder?: string;
  type?: string;
  full?: boolean;
  textarea?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  maxLength?: number;
  required?: boolean;
}) {
  const cls = full ? "sm:col-span-2" : "";
  const invalid = Boolean(error);
  const controlId = name ? `field-${name}` : undefined;
  const errorId = name ? `field-${name}-error` : undefined;
  const base =
    "w-full rounded-xl border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--gold)]/60";
  const borderCls = invalid
    ? "border-red-500/70 focus:border-red-500/80"
    : "border-border";
  return (
    <label htmlFor={controlId} className={`${cls} block text-sm`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>
          {label}
          {required && <span className="ml-1 text-[var(--gold)]">*</span>}
        </span>
        {maxLength && value !== undefined && (
          <span className="normal-case tracking-normal text-[10px] text-muted-foreground/60">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {textarea ? (
        <textarea
          id={controlId}
          name={name}
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onBlur={onBlur}
          maxLength={maxLength}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={`${base} ${borderCls}`}
        />
      ) : (
        <input
          id={controlId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onBlur={onBlur}
          maxLength={maxLength}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={`${base} ${borderCls}`}
        />
      )}
      {invalid && (
        <p id={errorId} className="mt-1.5 text-[11px] normal-case tracking-normal text-red-400">
          {error}
        </p>
      )}
    </label>
  );
}

/* ---------- Footer ---------- */

const newsletterSchema = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(255, "Max 255 characters");

function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const parsed = useMemo(() => newsletterSchema.safeParse(email), [email]);
  const isValid = parsed.success;
  const error = !isValid && touched ? parsed.error.issues[0]?.message : undefined;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (!isValid) {
      setTouched(true);
      return;
    }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900);
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="mt-6 flex max-w-sm items-center gap-3 rounded-xl border border-[color:color-mix(in_oklab,var(--gold)_50%,transparent)] bg-[color:color-mix(in_oklab,var(--gold)_6%,transparent)] px-4 py-3 text-sm animate-fade-in"
      >
        <CheckCircle2 className="h-4 w-4 text-[var(--gold)]" />
        <span>Subscribed. Watch your inbox for the next briefing.</span>
      </div>
    );
  }

  const inputBorder = error ? "border-red-500/70" : "border-border";

  return (
    <form onSubmit={onSubmit} aria-busy={status === "submitting"} noValidate className="mt-6 max-w-sm">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={status === "submitting"}
          placeholder="Newsletter · your email"
          maxLength={255}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={`flex-1 rounded-xl border ${inputBorder} bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition disabled:opacity-60 focus:border-[var(--gold)]/60`}
        />
        <button
          type="submit"
          disabled={status === "submitting" || !isValid}
          aria-disabled={status === "submitting" || !isValid}
          className="inline-flex min-w-[76px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "var(--gradient-gold)" }}
        >
          {status === "submitting" ? <Loader2 className="h-4 w-4 gf-spin" /> : "Join"}
        </button>
      </div>
      {error && (
        <p id="newsletter-error" className="mt-2 text-[11px] text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}


function Footer() {

  const cols = [
    {
      h: "Company",
      links: ["Overview", "Leadership", "Newsroom", "Sustainability"],
    },
    {
      h: "Technology",
      links: ["AI Platform", "Robotics", "Battery Systems", "Semiconductors"],
    },
    {
      h: "Industries",
      links: ["Manufacturing", "Energy", "Aerospace", "Government"],
    },
    {
      h: "Resources",
      links: ["Research", "Investors", "Careers", "Legal"],
    },
  ];
  return (
    <footer className="relative border-t border-border px-6 pb-10 pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <div className="font-display text-lg leading-none">Gigafactory 3</div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Intelligent Industry
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm text-muted-foreground">
              Engineering the future of intelligent industry — from silicon to skyline.
            </p>
            <NewsletterForm />

          </div>

          {cols.map((c) => (
            <div key={c.h}>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {c.h}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-foreground/80 hover:text-[var(--gold)]">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} Gigafactory 3. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Research & Innovation ---------- */

const RESEARCH_STATS = [
  { icon: FlaskConical, k: "Research labs", v: "32", sub: "across 12 countries" },
  { icon: ShieldCheck, k: "Active patents", v: "4,180", sub: "+612 filed in 2025" },
  { icon: GraduationCap, k: "PhD researchers", v: "1,940", sub: "38 disciplines" },
  { icon: Lightbulb, k: "R&D commitment", v: "$4.2B", sub: "≈ 11% of revenue" },
];

const RESEARCH_PROGRAMS = [
  {
    icon: Atom,
    tag: "Materials",
    title: "Solid-state chemistry",
    body:
      "Next-generation solid electrolytes, ceramic composites and rare-earth-free magnets developed in our Osaka and Munich labs.",
    tags: ["Solid-state cells", "Rare-earth-free", "Composite alloys"],
  },
  {
    icon: Cpu,
    tag: "Silicon",
    title: "Neuromorphic compute",
    body:
      "3nm accelerators and neuromorphic photonic cores designed in-house to run trillion-parameter industrial models at the edge.",
    tags: ["3nm process", "Photonics", "Edge inference"],
  },
  {
    icon: Bot,
    tag: "Robotics",
    title: "Dexterous manipulation",
    body:
      "Multi-modal foundation models for humanoid and industrial arms — trained across billions of hours of simulated & real telemetry.",
    tags: ["Foundation models", "Tactile sensing", "Sim-to-real"],
  },
  {
    icon: Leaf,
    tag: "Energy",
    title: "Grid-scale storage",
    body:
      "Long-duration iron-air and thermal batteries paired with autonomous microgrid controllers for continental clean-energy backbones.",
    tags: ["Iron-air", "Thermal storage", "Microgrid AI"],
  },
  {
    icon: Beaker,
    tag: "Bio-industrial",
    title: "Precision biomanufacturing",
    body:
      "Engineered microbes and enzymatic pathways producing high-value polymers, proteins and pharma precursors at industrial scale.",
    tags: ["Bioreactors", "Enzyme design", "Green chemistry"],
  },
  {
    icon: Rocket,
    tag: "Frontier",
    title: "Orbital & hypersonic",
    body:
      "Reusable launch structures, hypersonic thermal shielding and in-orbit assembly platforms for next-decade infrastructure.",
    tags: ["Reusable launch", "Thermal shielding", "In-orbit assembly"],
  },
];

const RESEARCH_PIPELINE = [
  { phase: "Discovery", detail: "Fundamental science · 3–7 yr horizon", pct: 100 },
  { phase: "Applied R&D", detail: "Prototype platforms & pilots", pct: 78 },
  { phase: "Industrialisation", detail: "Pilot line → gigafactory transfer", pct: 52 },
  { phase: "Deployment", detail: "Global rollout & certification", pct: 26 },
];

function ResearchInnovation() {
  return (
    <section id="research" className="relative overflow-hidden px-6 py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1000px 500px at 15% 10%, color-mix(in oklab, var(--gold) 8%, transparent), transparent 60%), radial-gradient(900px 500px at 85% 90%, color-mix(in oklab, var(--electric) 8%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Research & Innovation"
          title="A decade of breakthroughs. Engineered every day."
          desc="From fundamental materials science to orbital infrastructure — our research organisation compounds discovery into deployable industrial technology."
        />

        {/* Stats */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESEARCH_STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.k}
                className="group relative overflow-hidden rounded-2xl border border-border p-6 glass transition hover:border-[color:color-mix(in_oklab,var(--gold)_50%,transparent)]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white/5">
                    <Icon className="h-5 w-5 text-[var(--gold)]" />
                  </span>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {s.k}
                  </div>
                </div>
                <div className="mt-5 font-display text-4xl gold-text">{s.v}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Programs */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {RESEARCH_PROGRAMS.map((p) => {
            const Icon = p.icon;
            return (
              <article
                key={p.title}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border p-7 glass transition hover:-translate-y-1 hover:border-[color:color-mix(in_oklab,var(--gold)_50%,transparent)]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-white/5">
                    <Icon className="h-5 w-5 text-[var(--gold)]" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
                    {p.tag}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -bottom-px h-px opacity-0 transition group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--gold), transparent)",
                  }}
                />
              </article>
            );
          })}
        </div>

        {/* Pipeline */}
        <div
          className="mt-16 overflow-hidden rounded-3xl border border-border p-8 glass sm:p-10"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
                Innovation pipeline
              </div>
              <h3 className="mt-3 font-display text-3xl sm:text-4xl">
                Discovery to deployment — engineered as one system.
              </h3>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-foreground transition hover:border-[color:color-mix(in_oklab,var(--gold)_60%,transparent)] hover:text-[var(--gold)]"
            >
              Partner with our labs <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {RESEARCH_PIPELINE.map((p, i) => (
              <div key={p.phase} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-[color:color-mix(in_oklab,var(--gold)_60%,transparent)] font-display text-xs text-[var(--gold)]">
                    {i + 1}
                  </span>
                  <div className="text-sm font-medium">{p.phase}</div>
                </div>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.pct}%`,
                      background:
                        "linear-gradient(90deg, var(--gold), color-mix(in oklab, var(--gold) 40%, transparent))",
                      boxShadow: "0 0 12px color-mix(in oklab, var(--gold) 40%, transparent)",
                    }}
                  />
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{p.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ---------- Section header ---------- */

function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${a} max-w-3xl`}>
      <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</div>
      <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{title}</h2>
      {desc && <p className="mt-4 text-muted-foreground">{desc}</p>}
    </div>
  );
}
