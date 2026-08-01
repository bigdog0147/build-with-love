import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Cpu,
  Factory,
  FlaskConical,
  Gauge,
  Globe2,
  Truck,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";
import { Reveal, CountUp } from "@/components/reveal";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/infrastructure")({
  component: InfrastructurePage,
  head: () => ({
    meta: [
      { title: "Global Infrastructure — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Gigafactory 3X giga-campuses: production plants, research labs, compute clusters and logistics hubs engineered and orchestrated as one industrial system.",
      },
      { property: "og:title", content: "Global Infrastructure — Gigafactory 3X" },
      {
        property: "og:description",
        content:
          "Production, research, compute and logistics co-located across giga-campuses and run from a single control plane.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.gf3x.space/infrastructure" }],
  }),
});

const REGIONS = [
  {
    region: "North America",
    hub: "Great Lakes Giga-Campus",
    focus: "Battery cell and pack assembly, autonomous logistics fleet operations.",
    status: "Operating",
  },
  {
    region: "Europe",
    hub: "Rhine Corridor Works",
    focus: "Precision robotics, aerospace structures and industrial control silicon.",
    status: "Operating",
  },
  {
    region: "Middle East",
    hub: "Gulf Energy Campus",
    focus: "Grid-scale storage integration and clean-generation engineering.",
    status: "Commissioning",
  },
  {
    region: "Asia Pacific",
    hub: "Pacific Advanced Works",
    focus: "Semiconductor packaging, edge inference modules and test capacity.",
    status: "Operating",
  },
  {
    region: "South Asia",
    hub: "Deccan Automation Park",
    focus: "Automation cells, MES/OT engineering and digital-twin operations centre.",
    status: "Construction",
  },
  {
    region: "Africa",
    hub: "Atlantic Industrial Corridor",
    focus: "Port electrification, heavy-industry retrofit and workforce academy.",
    status: "Planned",
  },
];

const FACILITY_CLASSES = [
  {
    icon: Factory,
    title: "Production plants",
    body: "Lights-out manufacturing cells with closed-loop metrology, in-line inspection and additive tooling.",
  },
  {
    icon: FlaskConical,
    title: "Research laboratories",
    body: "Materials, cell chemistry and robotics labs sitting metres from the production lines they feed.",
  },
  {
    icon: Cpu,
    title: "Compute clusters",
    body: "On-campus training and inference capacity so factory models run without leaving the site network.",
  },
  {
    icon: Truck,
    title: "Logistics hubs",
    body: "Autonomous yard operations, robotic fulfilment and predictive inbound routing.",
  },
  {
    icon: Zap,
    title: "Energy systems",
    body: "On-site renewable generation, grid-scale storage and intelligent load management per campus.",
  },
  {
    icon: Building2,
    title: "Operations centres",
    body: "Digital-twin control rooms mirroring every asset, product and process in real time.",
  },
];

const CAPACITY = [
  { label: "Operating regions", value: 6, suffix: "", sub: "Across four continents" },
  { label: "Campus land area", value: 1240, suffix: " ha", sub: "Owned and under development" },
  { label: "Installed capacity", value: 68, suffix: " GWh", sub: "Annual battery output" },
  { label: "On-site clean power", value: 940, suffix: " MW", sub: "Renewable generation" },
];

function InfrastructurePage() {
  const t = useT();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow={t("infra.eyebrow")}
        title={t("infra.title")}
        gold={t("infra.titleGold")}
        lead={t("infra.lead")}
      />

      <Section eyebrow={t("infra.capacity")} title="Scale, measured">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPACITY.map((m, i) => (
            <Reveal key={m.label} delay={i * 80}>
              <GlassCard className="p-7">
                <div className="font-display text-4xl">
                  <CountUp value={m.value} />
                  <span className="gold-text">{m.suffix}</span>
                </div>
                <div className="mt-3 text-sm">{m.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{m.sub}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow={t("infra.regions")} title="Where we build">
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="bg-[var(--surface)] text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Region</th>
                <th className="px-5 py-3 font-medium">Campus</th>
                <th className="px-5 py-3 font-medium">Engineering focus</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((r) => (
                <tr key={r.region} className="border-t border-border/60">
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-[var(--gold)]" />
                      {r.region}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-foreground/90">{r.hub}</td>
                  <td className="px-5 py-4 text-muted-foreground">{r.focus}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow={t("infra.facilities")} title="One campus, six systems">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITY_CLASSES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 60}>
              <GlassCard className="h-full p-7">
                <div
                  className="grid h-11 w-11 place-items-center rounded-lg"
                  style={{
                    background: "color-mix(in oklab, var(--gold) 14%, transparent)",
                    color: "var(--gold)",
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

      <Section>
        <GlassCard className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              <Gauge className="h-4 w-4 text-[var(--gold)]" /> Capacity planning
            </div>
            <h2 className="mt-3 max-w-2xl font-display text-2xl sm:text-3xl">
              Planning a programme that needs industrial capacity at scale?
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="rounded-lg px-5 py-3 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-gold)" }}
            >
              Talk to our engineers
            </Link>
            <Link
              to="/investors"
              className="rounded-lg border border-border bg-[var(--surface-elevated)] px-5 py-3 text-sm font-medium hover:border-[var(--gold)]/60"
            >
              Investor overview
            </Link>
          </div>
        </GlassCard>
      </Section>

      <SiteFooter />
    </div>
  );
}
