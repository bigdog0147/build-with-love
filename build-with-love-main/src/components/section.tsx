import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  gold,
  lead,
}: {
  eyebrow: string;
  title: string;
  gold?: string;
  lead: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-electric)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
          {eyebrow}
        </span>
        <h1 className="mt-6 max-w-4xl font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
          {title} {gold && <span className="gold-text">{gold}</span>}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{lead}</p>
      </div>
    </section>
  );
}

export function Section({
  title,
  eyebrow,
  children,
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</div>
      )}
      {title && <h2 className="mt-3 font-display text-3xl sm:text-4xl">{title}</h2>}
      <div className={title || eyebrow ? "mt-10" : ""}>{children}</div>
    </section>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl border border-border p-6 ${className}`}>{children}</div>
  );
}
