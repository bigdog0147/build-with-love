import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/dashboard.functions";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { QuickActions } from "@/components/quick-actions";

export const Route = createFileRoute("/_authenticated/portfolio")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Gigafactory 3" },
      { name: "description", content: "Asset mix, allocation weights and performance across your holdings." },
      { property: "og:title", content: "Portfolio — Gigafactory 3" },
      { property: "og:description", content: "Asset mix and allocation weights." },
    ],
  }),
});

function PortfolioPage() {
  const fetch = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch({} as never) });
  const allocations = data?.allocations ?? [];
  const wallets = data?.wallets ?? [];

  const totalUsd = wallets.reduce((sum, w) => {
    if (w.code === "USD") return sum + Number(w.balance);
    const fiat = w.fiat_value == null ? Number(w.balance) : Number(w.fiat_value);
    return sum + (Number.isFinite(fiat) ? fiat : 0);
  }, 0);
  const totalPct = allocations.reduce((s, a) => s + Number(a.percent), 0) || 1;

  return (
    <DashShell>
      <PageHeading eyebrow="Portfolio" title="Allocation & performance" sub="How your capital is deployed across asset classes." />
      <QuickActions wallets={wallets} variant="plain" />
      <div className="rounded-2xl border border-border p-6 glass">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Total invested value</div>
        <div className="gold-text mt-1 font-display text-4xl">{money(totalUsd)}</div>
      </div>
      <div className="rounded-2xl border border-border p-6 glass">
        <div className="font-display text-2xl">Asset mix</div>
        <ul className="mt-5 space-y-4">
          {allocations.map((a) => {
            const pct = (Number(a.percent) / totalPct) * 100;
            return (
              <li key={a.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: a.color }} />
                    {a.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {Number(a.percent)}% · {money((totalUsd * pct) / 100)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                  <div className="h-full rounded-full" style={{ width: pct + "%", background: a.color }} />
                </div>
              </li>
            );
          })}
          {allocations.length === 0 && <li className="text-sm text-muted-foreground">No allocations yet.</li>}
        </ul>
      </div>
    </DashShell>
  );
}
