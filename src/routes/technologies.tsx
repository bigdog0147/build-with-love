import { createFileRoute } from "@tanstack/react-router";
import { Atom, BatteryCharging, Bot, Cpu, Factory, Network, Radar } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

export const Route = createFileRoute("/technologies")({
  component: TechPage,
  head: () => ({
    meta: [
      { title: "Core Technologies — Gigafactory 3" },
      { name: "description", content: "AI, robotics, manufacturing, batteries, semiconductors, automation and digital twin systems." },
      { property: "og:title", content: "Core Technologies — Gigafactory 3" },
      { property: "og:description", content: "The vertically-integrated technology stack behind intelligent industry." },
    ],
  }),
});

const TECHS = [
  { icon: Atom, title: "Artificial Intelligence", body: "Foundation models tuned for physical systems, computer vision on the line, and reinforcement learning for supply-chain optimisation." },
  { icon: Bot, title: "Robotics", body: "Bipedal and industrial robots engineered for precision assembly, autonomous logistics and dexterous manipulation." },
  { icon: Factory, title: "Advanced Manufacturing", body: "Lights-out production cells with closed-loop metrology, additive manufacturing, and vertically integrated tooling." },
  { icon: BatteryCharging, title: "Battery Systems", body: "Next-generation cell chemistries, gigafactory-scale pack assembly and grid-scale energy storage platforms." },
  { icon: Cpu, title: "Semiconductor Technologies", body: "Specialty silicon and packaging for AI inference at the edge, industrial control and power electronics." },
  { icon: Network, title: "Industrial Automation", body: "Deterministic control fabrics, MES/OT integration and factory-wide software defined orchestration." },
  { icon: Radar, title: "Digital Twin Systems", body: "Real-time digital twins of every asset, product and plant — simulated, monitored, and optimised continuously." },
];

function TechPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Core Technologies"
        title="One vertically-integrated"
        gold="technology platform."
        lead="From silicon to steel, from foundation models to factory floors — Gigafactory 3 designs and operates the full stack of intelligent industry."
      />

      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          {TECHS.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title} className="p-8">
              <div
                className="grid h-12 w-12 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-5 font-display text-2xl">{title}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
