import { createFileRoute } from "@tanstack/react-router";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Gigafactory 3" },
      { name: "description", content: "Global headquarters, regional offices, contact form and support for Gigafactory 3." },
      { property: "og:title", content: "Contact Gigafactory 3" },
      { property: "og:description", content: "Reach our global HQ, regional offices, IR desk or press team." },
    ],
  }),
});

const OFFICES = [
  { city: "Global HQ · Zurich", addr: "Bahnhofstrasse 45, 8001 Zurich, Switzerland" },
  { city: "Americas · Austin", addr: "500 Congress Ave, Austin, TX 78701, USA" },
  { city: "Asia-Pacific · Yokohama", addr: "Minatomirai 2-3, Yokohama 220-0012, Japan" },
  { city: "EMEA · Rotterdam", addr: "Wilhelminakade 909, 3072 Rotterdam, Netherlands" },
];

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Contact"
        title="Talk to"
        gold="Gigafactory 3."
        lead="Investors, partners, press and prospective engineers — send us a message and the right team will get back to you within two business days."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <GlassCard className="p-8">
            {sent ? (
              <div className="py-16 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--gradient-gold)" }}>
                  <Mail className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="mt-6 font-display text-2xl">Message received.</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thank you. A member of our team will be in touch shortly.
                </p>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" name="name" required />
                  <Field label="Work email" name="email" type="email" required />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Company" name="company" />
                  <div>
                    <Label>Enquiry type</Label>
                    <select
                      name="topic"
                      className="mt-2 w-full rounded-lg border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
                      defaultValue="general"
                    >
                      <option value="general">General enquiry</option>
                      <option value="investors">Investor Relations</option>
                      <option value="partnerships">Partnerships</option>
                      <option value="press">Press &amp; Media</option>
                      <option value="careers">Careers</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    className="mt-2 w-full resize-none rounded-lg border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
                    placeholder="Tell us how we can help."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
                  style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
                >
                  Send message
                </button>
              </form>
            )}
          </GlassCard>

          <div className="space-y-4">
            <GlassCard>
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Direct lines</div>
              <div className="mt-4 space-y-3 text-sm">
                <Row icon={<Mail className="h-4 w-4" />} label="General" value="hello@gigafactory3.com" />
                <Row icon={<Mail className="h-4 w-4" />} label="Investors" value="ir@gigafactory3.com" />
                <Row icon={<Mail className="h-4 w-4" />} label="Press" value="press@gigafactory3.com" />
                <Row icon={<Phone className="h-4 w-4" />} label="Switchboard" value="+41 44 000 0000" />
              </div>
            </GlassCard>

            <GlassCard>
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Offices</div>
              <ul className="mt-4 space-y-4 text-sm">
                {OFFICES.map((o) => (
                  <li key={o.city} className="flex gap-3">
                    <div className="mt-0.5 text-[var(--gold)]">
                      {o.city.startsWith("Global") ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{o.city}</div>
                      <div className="text-muted-foreground">{o.addr}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{children}</label>;
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-lg border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
      />
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[var(--gold)]">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <div>{value}</div>
      </div>
    </div>
  );
}
