import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Atom,
  BatteryCharging,
  Bot,
  Cpu,
  Factory,
  Globe2,
  Leaf,
  Menu,
  Network,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { getMetrics, type Metric } from "@/lib/metrics.functions";

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
        <Highlights />
        <Metrics />
        <Technology />
        <Manufacturing />
        <Industries />
        <Investors />
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
  return (
    <section className="relative flex min-h-[100svh] items-center px-6 pt-32">
      <div className="mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
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
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-5 py-3 text-sm hover:border-[var(--gold)]/50"
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

/* ---------- Metrics ---------- */

function Metrics() {
  const { data: metrics } = useSuspenseQuery(metricsQueryOptions);
  return (
    <section className="relative border-y border-border bg-[color-mix(in_oklab,var(--surface)_60%,transparent)] px-6 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3 lg:grid-cols-6">
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
      </div>
    </section>
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

/* ---------- Technology ---------- */

const TECH = [
  {
    icon: Cpu,
    tag: "AI Platform",
    title: "Industrial foundation models",
    body: "A unified AI platform for perception, control and optimization across every cell, line and site.",
  },
  {
    icon: Bot,
    tag: "Robotics Division",
    title: "Cellular robotic systems",
    body: "Modular robotic cells with sub-millimetre precision and adaptive coordination at fleet scale.",
  },
  {
    icon: BatteryCharging,
    tag: "Battery Systems",
    title: "Cell-to-grid architecture",
    body: "Next-generation battery chemistries with integrated thermal, safety and lifecycle intelligence.",
  },
  {
    icon: Atom,
    tag: "Semiconductors",
    title: "Advanced node manufacturing",
    body: "Deep-UV lithography lines producing power, sensing and edge-inference silicon in-house.",
  },
  {
    icon: Network,
    tag: "Autonomous Networks",
    title: "Self-orchestrating industry",
    body: "Continent-scale production networks that plan, adapt and route autonomously in real time.",
  },
];

function Technology() {
  return (
    <section id="technology" className="relative px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Technology"
          title="Five platforms. One engineered future."
          desc="Every product is developed vertically — from silicon and software to robotics and renewable power."
        />
        <div className="mt-14 space-y-4">
          {TECH.map(({ icon: Icon, tag, title, body }, i) => (
            <div
              key={title}
              className="group grid gap-6 rounded-2xl border border-border p-6 glass transition-colors hover:border-[var(--gold)]/40 md:grid-cols-[minmax(0,1fr)_2fr_auto] md:items-center md:p-8"
            >
              <div className="flex items-center gap-4">
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{
                    background: "color-mix(in oklab, var(--gold) 15%, transparent)",
                    color: "var(--gold)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    0{i + 1} · {tag}
                  </div>
                  <div className="mt-1 font-display text-xl">{title}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground md:pl-8 md:border-l md:border-border">
                {body}
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-1 text-sm text-[var(--gold)] transition-transform group-hover:translate-x-0.5"
              >
                Learn more <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Manufacturing ---------- */

function Manufacturing() {
  return (
    <section id="manufacturing" className="relative px-6 py-28">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Manufacturing"
            title="Lights-out gigafactories, engineered to scale."
            desc="Fully autonomous production campuses coordinated by a real-time digital twin — from raw material to finished system."
            align="left"
          />
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            {[
              "Sub-second telemetry across every actuator and sensor",
              "Closed-loop quality inspection powered by industrial vision AI",
              "Adaptive scheduling that re-plans capacity every 90 seconds",
              "Zero-waste material flows with on-site renewable generation",
            ].map((s) => (
              <li key={s} className="flex items-start gap-3">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--gold)", boxShadow: "0 0 10px var(--gold)" }}
                />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative aspect-square rounded-3xl border border-border glass overflow-hidden">
          <svg viewBox="0 0 400 400" className="h-full w-full">
            <defs>
              <radialGradient id="rg" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="oklch(0.82 0.14 85)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="160" fill="url(#rg)" />
            {[60, 100, 140, 180].map((r, i) => (
              <circle
                key={r}
                cx="200"
                cy="200"
                r={r}
                fill="none"
                stroke="oklch(1 0 0 / 10%)"
                strokeDasharray={i % 2 ? "2 6" : "0"}
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const x = 200 + Math.cos(a) * 180;
              const y = 200 + Math.sin(a) * 180;
              return (
                <line
                  key={i}
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="oklch(1 0 0 / 6%)"
                />
              );
            })}
            {[
              [200, 40],
              [340, 140],
              [320, 300],
              [140, 340],
              [60, 200],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="6" fill="var(--gold)">
                  <animate attributeName="opacity" values="1;0.3;1" dur={`${2 + i}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r="14" fill="none" stroke="var(--gold)" strokeOpacity="0.3" />
              </g>
            ))}
            <circle cx="200" cy="200" r="10" fill="oklch(0.72 0.19 245)" />
          </svg>
          <div className="absolute bottom-4 left-4 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs backdrop-blur">
            <div className="text-muted-foreground">Live network</div>
            <div className="font-display">24 sites synchronised</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Industries ---------- */

const INDUSTRIES = [
  { icon: Factory, name: "Manufacturing" },
  { icon: BatteryCharging, name: "Energy" },
  { icon: Sparkles, name: "Aerospace" },
  { icon: Network, name: "Logistics" },
  { icon: Globe2, name: "Smart Cities" },
  { icon: Atom, name: "Infrastructure" },
  { icon: Cpu, name: "Government" },
  { icon: Leaf, name: "Sustainability" },
];

function Industries() {
  return (
    <section id="industries" className="relative px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Industries"
          title="Deployed where the stakes are highest."
        />
        <div className="mt-14 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {INDUSTRIES.map(({ icon: Icon, name }) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl border border-border bg-[var(--surface)] px-4 py-5 transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40"
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 12%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-sm">{name}</div>
            </div>
          ))}
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
                  href="#contact"
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

/* ---------- Contact ---------- */

function Contact() {
  return (
    <section id="contact" className="relative px-6 py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Contact"
            title="Speak with engineering."
            desc="For enterprise, government and institutional inquiries."
            align="left"
          />
          <div className="mt-8 space-y-4 text-sm">
            {[
              ["Global Headquarters", "Neo District · Singapore"],
              ["Enterprise", "enterprise@gigafactory3.com"],
              ["Investors", "ir@gigafactory3.com"],
              ["Media", "press@gigafactory3.com"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between border-b border-border pb-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{k}</div>
                <div>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="rounded-2xl border border-border p-6 glass md:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" placeholder="Ada Lovelace" />
            <Field label="Company" placeholder="Institution" />
            <Field label="Email" type="email" placeholder="you@company.com" full />
            <Field label="Message" placeholder="Tell us about your requirements" full textarea />
          </div>
          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            Request a briefing <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  full,
  textarea,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  full?: boolean;
  textarea?: boolean;
}) {
  const cls = full ? "sm:col-span-2" : "";
  return (
    <label className={`${cls} block text-sm`}>
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      {textarea ? (
        <textarea
          rows={4}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--gold)]/60"
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--gold)]/60"
        />
      )}
    </label>
  );
}

/* ---------- Footer ---------- */

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
            <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="Newsletter · your email"
                className="flex-1 rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
              />
              <button
                className="rounded-xl px-4 text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-gold)" }}
              >
                Join
              </button>
            </form>
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
