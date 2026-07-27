import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Rocket, Users2, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
  head: () => ({
    meta: [
      { title: "Careers — Gigafactory 3" },
      { name: "description", content: "Recruitment, engineering culture, internships and global opportunities at Gigafactory 3." },
      { property: "og:title", content: "Careers at Gigafactory 3" },
      { property: "og:description", content: "Build the systems that will define the next century of industry." },
    ],
  }),
});

const TRACKS = [
  { icon: Wrench, title: "Engineering", body: "Robotics, mechatronics, control systems, embedded, hardware, manufacturing." },
  { icon: Rocket, title: "Research", body: "AI research, materials science, battery chemistry, semiconductor design." },
  { icon: Users2, title: "Operations", body: "Plant leadership, quality, supply chain, program management, deployment." },
  { icon: GraduationCap, title: "Early Careers", body: "Internships, apprenticeships and graduate rotational programmes across our labs." },
];

const OPENINGS = [
  { role: "Senior Robotics Engineer", team: "Robotics", loc: "Yokohama, JP" },
  { role: "AI Research Scientist — Physical Systems", team: "Applied AI Lab", loc: "Zurich, CH" },
  { role: "Battery Cell Chemist", team: "Advanced Materials", loc: "Grenoble, FR" },
  { role: "MES / OT Platform Engineer", team: "Industrial Automation", loc: "Austin, TX" },
  { role: "Digital Twin Software Engineer", team: "Digital Twin Systems", loc: "Remote / Global" },
  { role: "Plant Director — Battery Systems", team: "Operations", loc: "Rotterdam, NL" },
];

function CareersPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Careers"
        title="Engineer the systems that will define"
        gold="the next century."
        lead="Our engineers ship real hardware into real factories. If you want your work measured in tonnes, megawatts and milliseconds — this is the place."
      />

      <Section eyebrow="Tracks" title="Where you can work.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title}>
              <div
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-lg">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Open roles" title="Selected openings.">
        <div className="overflow-hidden rounded-2xl border border-border">
          {OPENINGS.map((o, i) => (
            <div
              key={o.role}
              className={`flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between ${
                i > 0 ? "border-t border-border/60" : ""
              }`}
              style={{ background: "color-mix(in oklab, var(--surface) 60%, transparent)" }}
            >
              <div>
                <div className="font-display text-lg">{o.role}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {o.team} · {o.loc}
                </div>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-[var(--surface)] px-4 py-2 text-sm hover:border-[var(--gold)]/60"
              >
                Apply <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
