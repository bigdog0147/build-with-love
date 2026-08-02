import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Layers } from "lucide-react";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { listMarketplace } from "@/lib/investments.functions";
import { remainingCapacity } from "@/lib/investments";

export const Route = createFileRoute("/_authenticated/marketplace")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Project marketplace — Gigafactory 3X" },
      {
        name: "description",
        content: "Subscribe to live industrial infrastructure, robotics and energy projects.",
      },
    ],
  }),
});

function MarketplacePage() {
  const fetchShelf = useServerFn(listMarketplace);
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace"],
    queryFn: () => fetchShelf({} as never),
  });

  const products = data?.products ?? [];

  return (
    <DashShell>
      <PageHeading
        eyebrow="Project marketplace"
        title="Live opportunities"
        sub="Industrial projects open for subscription, with live capacity and terms."
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading opportunities…</p>}
      {!isLoading && products.length === 0 && (
        <div className="glass rounded-2xl border border-border p-8 text-sm text-muted-foreground">
          No opportunities are open for subscription right now. New projects are added as they clear
          investment committee.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => {
          const subscribed = data?.subscribed[p.id] ?? 0;
          const remaining = remainingCapacity(p, subscribed);
          const capacity = p.capacity == null ? null : Number(p.capacity);
          const filled = capacity && capacity > 0 ? Math.min(100, (subscribed / capacity) * 100) : null;
          const mine = data?.mine[p.id] ?? 0;
          return (
            <Link
              key={p.id}
              to="/marketplace/$slug"
              params={{ slug: p.slug }}
              className="glass group rounded-2xl border border-border p-5 transition-colors hover:border-[var(--gold)]/60"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Layers className="h-3.5 w-3.5 text-[var(--gold)]" />
                {p.category} · {p.sector}
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="font-display text-xl">{p.name}</div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[var(--gold)]" />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.summary}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Minimum</dt>
                  <dd className="mt-0.5 tabular-nums">{money(Number(p.minimum), p.currency, 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Target yield</dt>
                  <dd className="mt-0.5 text-[var(--success)]">{Number(p.target_yield)}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Term</dt>
                  <dd className="mt-0.5">{p.term_months} mo</dd>
                </div>
              </dl>
              {filled != null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{filled.toFixed(0)}% subscribed</span>
                    <span>
                      {remaining === 0
                        ? "Fully subscribed"
                        : `${money(remaining ?? 0, p.currency, 0)} remaining`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${filled}%`, background: "var(--gradient-gold)" }}
                    />
                  </div>
                </div>
              )}
              {mine > 0 && (
                <div className="mt-4 text-xs text-[var(--gold)]">
                  You hold {money(mine, p.currency, 0)} in this project
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </DashShell>
  );
}
