import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  Cable,
  ChevronRight,
  Gauge,
  LineChart,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

const CANONICAL = "https://www.gf3x.space/resources/smart-factory-guide";
const TITLE = "Smart Factory Guide: Architecture & Rollout | GF3X";
const DESCRIPTION =
  "What a smart factory is, the five layers of its architecture, how to phase a rollout, what it costs, and how to measure returns — from the engineers at Gigafactory 3X.";

/* ---------------------------------- content --------------------------------- */

const LAYERS = [
  {
    icon: Cable,
    name: "Layer 1 — Sensing and connectivity",
    body: "Every asset becomes addressable. Vibration, thermal, current-draw, torque and vision sensors publish to a deterministic network — typically time-sensitive Ethernet on the line and private 5G for mobile assets. The engineering test is not how many sensors you install, but whether a signal arrives with a trustworthy timestamp and a stable unit of measure.",
  },
  {
    icon: Boxes,
    name: "Layer 2 — The unified namespace",
    body: "Raw signals are worthless while they remain trapped in a PLC tag list. A unified namespace gives every machine, batch, order and operator a single canonical address, so a new application can subscribe to shop-floor reality without another point-to-point integration. This layer is where most smart factory programmes are quietly won or lost.",
  },
  {
    icon: BrainCircuit,
    name: "Layer 3 — Models and digital twins",
    body: "A digital twin is a physics- and data-informed model kept continuously synchronised with the asset it mirrors. It lets you test a changeover, a new tolerance band, or a shift pattern in simulation before you spend real minutes on real steel. Twins also generate the labelled data that supervised models need but factories rarely collect cleanly.",
  },
  {
    icon: Workflow,
    name: "Layer 4 — Closed-loop autonomy",
    body: "Analytics that only produce dashboards produce nothing. In a mature smart factory, the model writes back: adjusting feed rates, re-sequencing a queue around a stalled cell, releasing a maintenance work order, or holding a batch for inspection. Every write-back path needs a defined authority limit and a human-legible reason code.",
  },
  {
    icon: ShieldCheck,
    name: "Layer 5 — Governance and OT security",
    body: "Connectivity expands the attack surface, so segmentation, signed firmware, immutable audit trails and explicit model-change control are part of the architecture, not a later hardening pass. Regulated production adds lineage: for any unit shipped, you must be able to reconstruct which model version influenced which parameter.",
  },
];

const PHASES = [
  {
    phase: "Phase 0 · 4–8 weeks",
    name: "Baseline the truth",
    body: "Instrument what already exists and measure real OEE, changeover time, scrap by cause and unplanned downtime by asset. Programmes that skip this phase cannot later prove they worked.",
  },
  {
    phase: "Phase 1 · 3–6 months",
    name: "One line, end to end",
    body: "Pick a single line that matters commercially and take it all the way to closed loop. A narrow, complete result is far more persuasive internally than broad partial connectivity.",
  },
  {
    phase: "Phase 2 · 6–12 months",
    name: "Replicate the pattern",
    body: "Turn the pilot into a reference architecture — named data contracts, deployment templates, standard alarm semantics — then copy it to adjacent lines rather than rebuilding per line.",
  },
  {
    phase: "Phase 3 · 12–24 months",
    name: "Plant-wide orchestration",
    body: "Scheduling, energy management, quality and logistics begin optimising against a shared model of the plant instead of against local departmental targets.",
  },
  {
    phase: "Phase 4 · continuous",
    name: "Multi-site network",
    body: "Model improvements earned at one plant deploy to the network under version control, and production can be shifted between sites on the basis of live capability rather than static assumptions.",
  },
];

const METRICS = [
  { icon: Gauge, k: "OEE", l: "Availability × performance × quality, measured per asset, not averaged into meaninglessness." },
  { icon: LineChart, k: "Cost per good unit", l: "The only metric that survives contact with a finance review." },
  { icon: Workflow, k: "Changeover minutes", l: "The truest indicator of whether flexibility is real or aspirational." },
  { icon: ShieldCheck, k: "First-pass yield", l: "Quality caught in-process rather than at final inspection." },
];

const FAQS = [
  {
    q: "What is a smart factory?",
    a: "A smart factory is a production facility where connected assets, a shared data model and machine-learning systems continuously observe manufacturing and act on it — adjusting process parameters, resequencing work orders and raising maintenance jobs with limited human intervention. The distinguishing feature is not the sensors or the dashboards; it is the closed loop, measured in latency: a smart factory detects a drift and corrects it within seconds to minutes, whereas an instrumented factory reports the same drift in a weekly review after the scrap has already been produced.",
  },
  {
    q: "How is a smart factory different from ordinary factory automation?",
    a: "Traditional automation repeats a fixed sequence very precisely and needs an engineer to change that sequence: a PLC executes the recipe it was given until someone edits the program. A smart factory changes the sequence itself in response to conditions — tool wear measured by spindle load, incoming material variability, order mix, energy tariff windows, an upstream cell running late. Put simply: automation removes manual labour, a smart factory removes manual decisions, and the second one requires a data layer that classic automation projects never needed.",
  },
  {
    q: "Is a smart factory the same as Industry 4.0?",
    a: "They are related but not interchangeable. Industry 4.0 is the broader industrial paradigm covering cyber-physical systems, IoT, cloud analytics and connected value chains across suppliers and logistics. A smart factory is the concrete implementation of that paradigm inside one production site, with a defined asset scope, a named data architecture and a P&L owner. Industry 4.0 is the strategy; the smart factory is where it either produces a measurable change in cost per good unit or remains a slide.",
  },
  {
    q: "What technologies does a smart factory need?",
    a: "In practice, eight building blocks: industrial IoT sensing with synchronised timestamps (sub-millisecond where control loops depend on it); deterministic networking such as TSN or private 5G for cells that cannot tolerate jitter; edge compute for inference that must resolve in under ~50 ms, such as vision-based reject decisions; a unified namespace or equivalent canonical data layer with one authoritative name per signal; digital twins for offline simulation and change rehearsal; robotics and flexible fixturing; machine vision for in-line quality; and OT-specific cybersecurity with signed firmware and device identity. The data layer is the dependency all the others rest on, and it is the one most often deferred.",
  },
  {
    q: "How long does it take to build a smart factory?",
    a: "A single line reaching genuine closed-loop operation typically takes three to six months once baseline instrumentation exists — roughly four to six weeks of sensing and connectivity work, four to eight weeks of data modelling and historian integration, then a supervised model-in-the-loop period before write-back is enabled. Plant-wide orchestration is normally a twelve to twenty-four month programme, and multi-site standardisation is continuous rather than a project with an end date. Brownfield sites move faster than expected on connectivity and slower than expected on data quality, naming conventions and change management.",
  },
  {
    q: "What does a smart factory cost, and what return should we expect?",
    a: "Costs are dominated by integration and systems-engineering effort rather than hardware: in most programmes sensors, gateways and edge compute account for a minority of the budget while integration, data modelling, validation and training consume the majority. Mature programmes generally report double-digit percentage OEE gains, substantial reductions in unplanned downtime and scrap, and materially shorter changeovers. Build the business case on cost per good unit and downtime hours avoided rather than on sensor counts, and insist on a measured baseline captured before Phase 1 — without it the improvement cannot be defended in a finance review.",
  },
  {
    q: "Can an existing brownfield plant become a smart factory?",
    a: "Yes, and most smart factories are brownfield conversions rather than greenfield builds. Legacy machines that expose no digital interface can be made observable with external sensing — current clamps, vibration and acoustic sensors, retrofit encoders — plus protocol gateways that translate Modbus, Profibus or serial output into MQTT or OPC UA, so you rarely need to replace working equipment. The genuine constraints are inconsistent tag naming, flat unsegmented networks and workforce adoption, not machine age.",
  },
  {
    q: "Where should we start if we have no instrumentation at all?",
    a: "Start with one constrained, high-value line rather than a plant-wide survey. Instrument its bottleneck asset first, capture a clean four-to-six-week baseline of availability, cycle time, scrap and changeover minutes, and only then introduce analytics. Keep the first closed loop deliberately narrow — one parameter, one asset, human-approved write-back — because the objective of Phase 1 is a trustworthy data path and an organisation that believes the numbers, not model sophistication.",
  },
  {
    q: "What is a unified namespace, and why does it matter?",
    a: "A unified namespace is a single canonical, event-driven structure — typically MQTT-based — where every asset publishes its current state under one agreed hierarchy, such as site/area/line/cell/signal, and every consumer subscribes rather than polling. It matters because it eliminates the point-to-point integration mesh that makes traditional plant IT brittle: adding a ninth system becomes one subscription instead of eight new interfaces. It also gives models one authoritative name and unit per signal, which is the practical prerequisite for cross-line and cross-site comparison.",
  },
  {
    q: "How accurate does a digital twin need to be?",
    a: "Accuracy should be set by the decision the twin supports, not by fidelity for its own sake. A twin used for throughput and buffer sizing typically needs cycle times and failure distributions within a few percent of observed reality; a twin used to validate a control parameter change needs to reproduce the relevant physics closely enough that the sign and rough magnitude of the effect hold. Validate against held-back historical periods, publish the error band alongside every result, and retire the twin from decision-making when drift exceeds that band.",
  },
  {
    q: "Does a smart factory reduce the workforce?",
    a: "It changes the work more than it shrinks it. Repetitive material handling, manual gauging and clipboard data collection decline, while demand rises for controls engineers, data engineers, maintenance technicians who can interpret model output and operators who can supervise several autonomous cells at once. Budget for training time per operator in the programme itself and design the new roles explicitly; programmes that treat this as role design outperform those that treat it as a headcount exercise.",
  },
  {
    q: "How do you secure a smart factory?",
    a: "Segment OT from IT and enforce the boundary with inspected, brokered traffic instead of flat routing; require signed firmware and authenticated per-device identity; keep immutable audit trails of every parameter write-back including which model version issued it; and place model updates under formal change control with a tested rollback path. Because a compromised or silently drifting model can degrade product quality without ever tripping an IT alarm, treat model integrity as a safety concern with the same review discipline you apply to a machine guard.",
  },
  {
    q: "What are the limits of autonomy on a production line?",
    a: "Autonomy should be bounded by consequence. Parameter trims inside a validated window, dispatch sequencing and maintenance scheduling are reasonable to automate end to end. Actions that alter safety functions, regulated product characteristics or anything that cannot be reversed within one cycle should stay human-approved, with the model recommending and a named person accepting. In every case define the failure mode in advance: what the cell does when confidence drops, when a sensor goes stale and when the network partitions.",
  },
];


/* ----------------------------------- route ---------------------------------- */

export const Route = createFileRoute("/resources/smart-factory-guide")({
  component: SmartFactoryGuidePage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "The Smart Factory: Architecture, Rollout and Returns" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "The Smart Factory: Architecture, Rollout and Returns",
          description: DESCRIPTION,
          mainEntityOfPage: { "@type": "WebPage", "@id": CANONICAL },
          about: [
            { "@type": "Thing", name: "Smart factory" },
            { "@type": "Thing", name: "Smart manufacturing" },
            { "@type": "Thing", name: "Industry 4.0" },
          ],
          author: { "@type": "Organization", name: "Gigafactory 3X", url: "https://www.gf3x.space/" },
          publisher: { "@type": "Organization", name: "Gigafactory 3X", url: "https://www.gf3x.space/" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.gf3x.space/" },
            { "@type": "ListItem", position: 2, name: "Resources", item: "https://www.gf3x.space/resources" },
            { "@type": "ListItem", position: 3, name: "Smart Factory Guide", item: CANONICAL },
          ],
        }),
      },
    ],
  }),
});

function SmartFactoryGuidePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <PageHero
        eyebrow="Resources · Engineering guide"
        title="The smart factory:"
        gold="architecture, rollout and returns."
        lead="A practical guide to smart manufacturing from the engineers who build it — what a smart factory actually is, the five layers it is built from, how to phase a rollout without stalling, and which numbers prove it worked."
      />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 pt-8">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <li aria-current="page" className="text-foreground">
            Smart factory guide
          </li>
        </ol>
      </nav>

      <Section eyebrow="Definition" title="What a smart factory really is.">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              A <strong className="text-foreground">smart factory</strong> is a production facility in which connected
              assets, a shared data model and machine-learning systems continuously observe what is happening on the
              floor and act on it — without waiting for a human to notice, interpret and intervene. The visible
              artefacts are familiar: sensors, robots, screens. The defining property is invisible, and it is the
              closed loop between measurement and action.
            </p>
            <p>
              That distinction matters because it separates two things the market routinely conflates. A plant with
              thousands of sensors and a beautiful control room is instrumented. A plant where a drifting spindle
              triggers a compensating feed-rate change and a maintenance work order inside the same shift is smart.
              The first is a reporting achievement; only the second changes cost per unit.
            </p>
            <p>
              We build both greenfield and brownfield conversions at Gigafactory 3X, and the pattern holds across
              sites: the hard problem is almost never the machine learning. It is making shop-floor reality legible
              enough — consistent units, trustworthy timestamps, stable identifiers — that a model can be trusted to
              write back to a process at all.
            </p>
            <p>
              Read the sections below in order. They follow the sequence we use in real programmes: define the
              architecture, phase the rollout, instrument the economics, then decide what the plant is allowed to do
              on its own.
            </p>
          </div>
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">In this guide</div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "The five architectural layers",
                "A phased rollout that survives review",
                "Metrics that prove the return",
                "Where autonomy should stop",
                "Frequently asked questions",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </Section>

      <Section eyebrow="Architecture" title="The five layers of a smart factory.">
        <div className="grid gap-4 md:grid-cols-2">
          {LAYERS.map(({ icon: Icon, name, body }) => (
            <GlassCard key={name} className={name.startsWith("Layer 5") ? "md:col-span-2" : ""}>
              <div
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl">{name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          These layers are strictly sequential in dependency, though not in delivery. You can pilot a model before the
          namespace is complete, but you cannot scale one — which is why programmes that buy analytics before fixing
          their data layer tend to plateau at a handful of impressive, unreproducible pilots.
        </p>
      </Section>

      <Section eyebrow="Implementation" title="A rollout that survives its own business case.">
        <ol className="space-y-4">
          {PHASES.map(({ phase, name, body }, i) => (
            <li key={name}>
              <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                <div className="shrink-0">
                  <div className="font-display text-3xl gold-text">{String(i).padStart(2, "0")}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{phase}</div>
                </div>
                <div>
                  <h3 className="font-display text-xl">{name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </GlassCard>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Economics" title="Four numbers that decide the programme.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map(({ icon: Icon, k, l }) => (
            <GlassCard key={k}>
              <div
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--electric, var(--gold)) 14%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-xl">{k}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l}</p>
            </GlassCard>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Notice what is absent: sensor count, dashboard count, data volume. None of them appear in a cost per good
          unit, and a programme that reports them instead is usually avoiding the number that matters. Capture the
          baseline before Phase 1 begins — retrofitted baselines are never believed, and rightly so.
        </p>
      </Section>

      <Section eyebrow="Autonomy limits" title="Where the machine should stop deciding.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Autonomous by default",
              b: "Parameter compensation inside a validated envelope, queue re-sequencing, predictive maintenance scheduling, energy load shifting.",
            },
            {
              t: "Autonomous with review",
              b: "Tolerance-band changes, supplier material substitution, new recipe deployment, shift-pattern optimisation.",
            },
            {
              t: "Never autonomous",
              b: "Safety-system overrides, regulatory release of product, quality-specification changes, model deployment without signed change control.",
            },
          ].map(({ t, b }) => (
            <GlassCard key={t}>
              <h3 className="font-display text-lg">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Smart factory questions, answered.">
        <div className="grid gap-4 lg:grid-cols-2">
          {FAQS.map(({ q, a }) => (
            <GlassCard key={q}>
              <h3 className="font-display text-lg leading-snug">{q}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section>
        <GlassCard className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl">Planning a smart factory programme?</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Our engineering teams design, build and operate intelligent production at giga-scale. Start with the
              technology stack, or talk to us about your site.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/technologies"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-[#0a0a0a]"
              style={{ background: "var(--gradient-gold)" }}
            >
              Explore our technologies <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-[var(--surface)]"
            >
              Contact our engineering team <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </GlassCard>
      </Section>

      <SiteFooter />
    </div>
  );
}
