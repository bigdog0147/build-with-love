import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, ScrollText, ShieldCheck, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

export const Route = createFileRoute("/investors")({
  component: InvestorsPage,
  head: () => ({
    meta: [
      { title: "Investors — Gigafactory 3" },
      { name: "description", content: "Growth strategy, sustainability, governance and the corporate outlook for Gigafactory 3." },
      { property: "og:title", content: "Investor Overview — Gigafactory 3" },
      { property: "og:description", content: "Institutional-quality growth, governance and sustainability at industrial scale." },
    ],
  }),
});

const PILLARS = [
  { icon: TrendingUp, title: "Growth Strategy", body: "Compounding revenue across manufacturing platforms, energy assets and licensed technology." },
  { icon: LineChart, title: "Operating Model", body: "Vertically integrated, capital-efficient gigafactories with software-defined margins." },
  { icon: ShieldCheck, title: "Governance", body: "Independent board oversight, audited controls, disciplined capital allocation." },
  { icon: ScrollText, title: "Sustainability", body: "Net-zero operations by 2035, closed-loop materials, transparent ESG reporting." },
];

function InvestorsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Investors"
        title="Institutional quality,"
        gold="industrial scale."
        lead="Gigafactory 3 is engineered to compound. A vertically-integrated platform, a disciplined operating model, and a durable technology moat across the industries that matter most."
      />

      <Section eyebrow="Investment case" title="Four pillars of durable value.">
        <div className="grid gap-4 md:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title} className="p-7">
              <div
                className="grid h-11 w-11 place-items-center rounded-lg"
                style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)", color: "var(--gold)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-5 font-display text-xl">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Highlights" title="Selected operating metrics.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "$8.6B", l: "FY revenue" },
            { k: "27%", l: "Gross margin" },
            { k: "38", l: "Countries served" },
            { k: "A / Stable", l: "Credit outlook" },
          ].map((s) => (
            <GlassCard key={s.l}>
              <div className="font-display text-3xl">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.l}</div>
            </GlassCard>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Figures are illustrative and provided for corporate overview purposes only.
        </p>
      </Section>

      <Section>
        <div
          className="rounded-3xl border border-border p-10"
          style={{ background: "var(--gradient-surface)" }}
        >
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Investor Relations
              </div>
              <h3 className="mt-2 font-display text-2xl">Request the investor briefing.</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Institutional investors and analysts can request our latest corporate presentation
                and financial overview through our IR desk.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
            >
              Contact Investor Relations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
