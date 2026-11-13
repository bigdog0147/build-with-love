import { createFileRoute } from "@tanstack/react-router";
import { Globe2, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Gigafactory 3" },
      { name: "description", content: "Who Gigafactory 3 is, what we build, and why we exist." },
      { property: "og:title", content: "About Gigafactory 3" },
      { property: "og:description", content: "AI-powered manufacturing ecosystems at global scale." },
    ],
  }),
});

const VALUES = [
  { icon: Sparkles, title: "Engineering Excellence", body: "Precision engineering, obsessive tolerances, first-principles design across every product line." },
  { icon: ShieldCheck, title: "Trust & Governance", body: "Institutional-grade compliance, cyber-physical security and transparent operational reporting." },
  { icon: Leaf, title: "Sustainable by Design", body: "Every gigafactory is built to close the loop — energy, water, materials and heat." },
  { icon: Globe2, title: "Global Scale", body: "Twelve integrated facilities on four continents, engineered as one connected platform." },
];

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="About Gigafactory 3"
        title="A new class of industrial company —"
        gold="engineered, intelligent, integrated."
        lead="We design and operate AI-powered manufacturing ecosystems that combine robotics, advanced automation, clean energy and digital infrastructure into a single, coherent platform for the industries of the next century."
      />

      <Section eyebrow="Mission" title="Building the world's most advanced intelligent industry.">
        <div className="grid gap-8 lg:grid-cols-2">
          <p className="text-lg text-muted-foreground">
            To build the world's most advanced AI-powered manufacturing ecosystems — integrating
            robotics, intelligent automation, clean energy, and digital infrastructure to transform
            global industry from a linear supply chain into a self-optimising network.
          </p>
          <p className="text-lg text-muted-foreground">
            Our vision is to become the global benchmark for intelligent industrial innovation:
            creating the technologies that power the next generation of manufacturing, energy,
            mobility and infrastructure.
          </p>
        </div>
      </Section>

      <Section eyebrow="Principles" title="What we stand for.">
        <div className="grid gap-4 md:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title}>
              <div
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-xl">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="At a glance" title="Gigafactory 3 by the numbers.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "2019", l: "Founded" },
            { k: "12", l: "Integrated facilities" },
            { k: "$4.2B", l: "R&D commitment" },
            { k: "1,900+", l: "Engineers & scientists" },
          ].map((s) => (
            <GlassCard key={s.l}>
              <div className="font-display text-3xl">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.l}</div>
            </GlassCard>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
