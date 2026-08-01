import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Leaf, Recycle, ScaleIcon, ShieldCheck, SunMedium } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/sustainability")({
  component: SustainabilityPage,
  head: () => ({
    meta: [
      { title: "Sustainability — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Clean generation, circular manufacturing, water stewardship and audited ESG governance across every Gigafactory 3X campus.",
      },
      { property: "og:title", content: "Sustainability — Gigafactory 3X" },
      {
        property: "og:description",
        content:
          "Our decarbonisation roadmap, circular material recovery targets and ESG governance framework.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.gf3x.space/sustainability" }],
  }),
});

const PILLARS = [
  {
    icon: SunMedium,
    title: "Clean generation",
    body: "On-site solar, wind and grid-scale storage sized to campus load, with renewable-matched electricity for all owned production.",
  },
  {
    icon: Recycle,
    title: "Circular manufacturing",
    body: "Closed-loop recovery for battery cells, wafers and structural alloys — process scrap returns to the line, not to landfill.",
  },
  {
    icon: Droplets,
    title: "Water stewardship",
    body: "Recirculating cooling and ultrapure water reclamation, with withdrawal targets set per watershed rather than per company.",
  },
  {
    icon: Leaf,
    title: "Low-carbon materials",
    body: "Supplier engineering programmes for green steel, low-carbon aluminium and responsibly sourced critical minerals.",
  },
  {
    icon: ShieldCheck,
    title: "Safety and workforce",
    body: "Automation removes people from hazardous tasks; academies retrain operators into robotics and controls engineering roles.",
  },
  {
    icon: ScaleIcon,
    title: "Audited reporting",
    body: "Independently assured disclosures aligned to recognised reporting frameworks, published annually.",
  },
];

const ROADMAP = [
  {
    year: "2026",
    title: "Renewable-matched electricity",
    body: "100% renewable-matched power across owned production, with on-site generation covering baseline campus load.",
  },
  {
    year: "2028",
    title: "Closed-loop battery lines",
    body: "Cell and pack lines operating with in-house material recovery, cutting virgin critical-mineral intake per kWh.",
  },
  {
    year: "2030",
    title: "Net-zero operations",
    body: "Scope 1 and 2 net zero across all campuses, verified by third-party assurance.",
  },
  {
    year: "2035",
    title: "Supply-chain decarbonisation",
    body: "Scope 3 reduction locked into supplier contracts, with low-carbon material specification as a design requirement.",
  },
];

const GOVERNANCE = [
  ["Board oversight", "A board-level sustainability committee reviews targets, capital allocation and assurance findings quarterly."],
  ["Engineering accountability", "Each campus carries its decarbonisation milestones inside its operating plan, not in a separate report."],
  ["Transparent disclosure", "Annual sustainability report with methodology notes, restatements and progress against every published target."],
  ["Supplier standards", "Tiered supplier code covering emissions data, labour standards and minerals traceability."],
];

function SustainabilityPage() {
  const t = useT();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow={t("sustain.eyebrow")}
        title={t("sustain.title")}
        gold={t("sustain.titleGold")}
        lead={t("sustain.lead")}
      />

      <Section eyebrow={t("sustain.pillars")} title="Six engineering commitments">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 60}>
              <GlassCard className="h-full p-7">
                <div
                  className="grid h-11 w-11 place-items-center rounded-lg"
                  style={{
                    background: "color-mix(in oklab, var(--electric) 14%, transparent)",
                    color: "var(--electric)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-5 font-display text-xl">{title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow={t("sustain.roadmap")} title="Targets with dates attached">
        <ol className="relative space-y-4 border-l border-border/70 pl-6">
          {ROADMAP.map((step, i) => (
            <Reveal as="li" key={step.year} delay={i * 80} className="relative">
              <span
                className="absolute -left-[1.90rem] top-2 h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--gold)" }}
              />
              <GlassCard className="p-6">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {step.year}
                </div>
                <div className="mt-2 font-display text-xl">{step.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </GlassCard>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section eyebrow={t("sustain.governance")} title="How it is governed">
        <div className="grid gap-4 md:grid-cols-2">
          {GOVERNANCE.map(([title, body]) => (
            <GlassCard key={title} className="p-7">
              <div className="font-display text-lg">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section>
        <GlassCard className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
          <h2 className="max-w-2xl font-display text-2xl sm:text-3xl">
            Read how sustainability shapes our capital plan.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/investors"
              className="rounded-lg px-5 py-3 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-gold)" }}
            >
              Investor overview
            </Link>
            <Link
              to="/news"
              className="rounded-lg border border-border bg-[var(--surface-elevated)] px-5 py-3 text-sm font-medium hover:border-[var(--gold)]/60"
            >
              Latest announcements
            </Link>
          </div>
        </GlassCard>
      </Section>

      <SiteFooter />
    </div>
  );
}
