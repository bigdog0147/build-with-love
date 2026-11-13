import { createFileRoute } from "@tanstack/react-router";
import { Building2, Factory, Landmark, Plane, Truck, Wind, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

export const Route = createFileRoute("/industries")({
  component: IndustriesPage,
  head: () => ({
    meta: [
      { title: "Industries — Gigafactory 3" },
      { name: "description", content: "Manufacturing, energy, aerospace, logistics, smart cities, infrastructure and government solutions." },
      { property: "og:title", content: "Industries served by Gigafactory 3" },
      { property: "og:description", content: "AI-powered systems built for the industries that move the world." },
    ],
  }),
});

const INDUSTRIES = [
  { icon: Factory, title: "Manufacturing", body: "Autonomous production for automotive, industrial equipment and precision goods." },
  { icon: Wind, title: "Energy", body: "Grid-scale storage, clean generation, and intelligent load management for utilities." },
  { icon: Plane, title: "Aerospace", body: "Composite structures, propulsion components and autonomous flight systems." },
  { icon: Truck, title: "Logistics", body: "Autonomous fleets, robotic fulfilment and predictive routing for global supply chains." },
  { icon: Building2, title: "Smart Cities", body: "Connected mobility, resilient utilities and civic-scale digital twins." },
  { icon: Zap, title: "Infrastructure", body: "Electrification of ports, rail and heavy industry — engineered as one system." },
  { icon: Landmark, title: "Government Solutions", body: "Sovereign compute, secure manufacturing and critical-infrastructure programmes." },
];

function IndustriesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Industries"
        title="Built for the industries that"
        gold="move the world."
        lead="Our platform is deployed by manufacturers, utilities, governments and aerospace primes to modernise the systems the global economy runs on."
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title} className="p-7">
              <div
                className="grid h-11 w-11 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--electric) 14%, transparent)", color: "var(--electric)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-5 font-display text-xl">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
