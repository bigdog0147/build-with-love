import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/dashboard.functions";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { QuickActions } from "@/components/quick-actions";

export const Route = createFileRoute("/_authenticated/wallets")({
  component: WalletsPage,
  head: () => ({
    meta: [
      { title: "Wallets — Gigafactory 3" },
      { name: "description", content: "Every multi-currency wallet, balance and daily movement in one place." },
      { property: "og:title", content: "Wallets — Gigafactory 3" },
      { property: "og:description", content: "Multi-currency holdings and balances." },
    ],
  }),
});

function WalletsPage() {
  const fetch = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch({} as never) });
  const wallets = data?.wallets ?? [];

  return (
    <DashShell>
      <PageHeading eyebrow="Wallets" title="Multi-currency holdings" sub="Fund, move and monitor every wallet in your structure." />
      <QuickActions wallets={wallets} variant="plain" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {wallets.map((w) => {
          const delta = Number(w.delta_pct);
          const tint = w.tint === "gold" ? "var(--gold)" : w.tint === "electric" ? "var(--electric)" : "var(--silver)";
          return (
            <div key={w.id} className="relative overflow-hidden rounded-2xl border border-border p-5 glass">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: tint }} />
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{w.label}</div>
                <span className={delta >= 0 ? "text-[11px] text-[var(--success)]" : "text-[11px] text-[var(--danger)]"}>
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(2)}%
                </span>
              </div>
              <div className="mt-4 font-display text-2xl">{money(Number(w.balance), w.code)}</div>
              {w.fiat_value != null && (
                <div className="mt-1 text-xs text-muted-foreground">≈ {money(Number(w.fiat_value), "USD")}</div>
              )}
            </div>
          );
        })}
        {wallets.length === 0 && <p className="text-sm text-muted-foreground">No wallets yet.</p>}
      </div>
    </DashShell>
  );
}
