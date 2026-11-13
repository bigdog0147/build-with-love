import { createFileRoute } from "@tanstack/react-router";
import { Beaker, FileBadge, FlaskConical, Microscope } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

export const Route = createFileRoute("/innovation")({
  component: InnovationPage,
  head: () => ({
    meta: [
      { title: "Innovation — Gigafactory 3" },
      { name: "description", content: "Research labs, patents, engineering programmes and next-generation technologies at Gigafactory 3." },
      { property: "og:title", content: "Innovation at Gigafactory 3" },
      { property: "og:description", content: "Labs, patents and R&D powering the next generation of intelligent industry." },
    ],
  }),
});

const LABS = [
  { name: "Applied AI Lab", city: "Zurich", focus: "Foundation models for physical systems, sim-to-real reinforcement learning." },
  { name: "Robotics Research Center", city: "Yokohama", focus: "Bipedal locomotion, dexterous manipulation, whole-body control." },
  { name: "Advanced Materials Lab", city: "Grenoble", focus: "Battery cell chemistries, composites, high-temperature alloys." },
  { name: "Semiconductor Studio", city: "Austin", focus: "Specialty silicon, power electronics, advanced packaging." },
];

const PROGRAMS = [
  { icon: FlaskConical, k: "1,240+", l: "Active patents" },
  { icon: Microscope, k: "72", l: "Peer-reviewed papers / yr" },
  { icon: Beaker, k: "18", l: "Joint university programmes" },
  { icon: FileBadge, k: "$1.1B", l: "Annual R&D spend" },
];

function InnovationPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Innovation"
        title="A research-first company"
        gold="scaling into industry."
        lead="Our labs sit inside our factories. Every discovery is designed to leave the whiteboard, cross the pilot line, and reach global production."
      />

      <Section eyebrow="R&D at scale" title="Programmes and outputs.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map(({ icon: Icon, k, l }) => (
            <GlassCard key={l}>
              <div
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-3xl">{k}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{l}</div>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Global labs" title="Where the work happens.">
        <div className="grid gap-4 md:grid-cols-2">
          {LABS.map((lab) => (
            <GlassCard key={lab.name} className="p-7">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{lab.city}</div>
              <div className="mt-2 font-display text-xl">{lab.name}</div>
              <p className="mt-3 text-sm text-muted-foreground">{lab.focus}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
