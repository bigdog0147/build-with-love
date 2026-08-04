import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { PortfolioCharts } from "@/components/portfolio-charts";
import { getInvestorOverview } from "@/lib/investments.functions";
import { COUNTED_STATUSES, exposureBy, summarisePortfolio, toPosition } from "@/lib/investments";

/** Marketplace search params are required by the router; link with the defaults. */
const MARKETPLACE_DEFAULT_SEARCH = {
  q: "",
  category: "all",
  sector: "all",
  stage: "all",
  maxMinimum: 0,
  sort: "recommended" as const,
  page: 1,
  perPage: 12,
};


export const Route = createFileRoute("/_authenticated/portfolio")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Gigafactory 3X" },
      {
        name: "description",
        content: "Position-level performance, cost basis, distributions and sector exposure.",
      },
      { property: "og:title", content: "Portfolio — Gigafactory 3X" },
      { property: "og:description", content: "Position-level performance and sector exposure." },
    ],
  }),
});

function PortfolioPage() {
  const fetchOverview = useServerFn(getInvestorOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["investor-overview"],
    queryFn: () => fetchOverview({} as never),
  });

  const positions = useMemo(
    () => (data?.holdings ?? []).map((h) => toPosition(h, data?.distributions ?? [])),
    [data?.holdings, data?.distributions],
  );
  const summary = useMemo(() => summarisePortfolio(positions, data?.products ?? []), [positions, data?.products]);
  const sectors = useMemo(() => exposureBy(positions, data?.products ?? [], "sector"), [positions, data?.products]);
  const chartHoldings = useMemo(
    () => (data?.holdings ?? []).filter((h) => (COUNTED_STATUSES as readonly string[]).includes(h.status)),
    [data?.holdings],
  );

  const productName = useMemo(() => {
    const map: Record<string, { name: string; slug: string; currency: string }> = {};
    for (const p of data?.products ?? []) map[p.id] = { name: p.name, slug: p.slug, currency: p.currency };
    return map;
  }, [data?.products]);

  return (
    <DashShell>
      <PageHeading
        eyebrow="Portfolio"
        title="Positions & performance"
        sub="Cost basis, unrealised gain, distributions received and exposure across your holdings."
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading portfolio…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Current value" value={money(summary.currentValue)} big />
        <Stat label="Invested" value={money(summary.invested)} />
        <Stat
          label="Unrealised gain"
          value={`${summary.gain >= 0 ? "+" : ""}${money(summary.gain)} · ${summary.gainPct.toFixed(2)}%`}
          tone={summary.gain >= 0 ? "up" : "down"}
        />
        <Stat
          label="Total return"
          value={`${summary.totalReturn >= 0 ? "+" : ""}${money(summary.totalReturn)} · ${summary.totalReturnPct.toFixed(2)}%`}
          tone={summary.totalReturn >= 0 ? "up" : "down"}
        />
      </div>

      <PortfolioCharts
        holdings={chartHoldings}
        valuations={data?.valuations ?? []}
        distributions={data?.distributions ?? []}
        products={data?.products ?? []}
      />



      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass rounded-2xl border border-border p-2">
          <div className="px-4 pt-4 font-display text-xl">Holdings</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-normal">Project</th>
                  <th className="px-4 py-2 text-right font-normal">Invested</th>
                  <th className="px-4 py-2 text-right font-normal">Value</th>
                  <th className="px-4 py-2 text-right font-normal">Distributions</th>
                  <th className="px-4 py-2 text-right font-normal">Total return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {positions.map((p) => {
                  const meta = productName[p.productId];
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        {meta ? (
                          <Link
                            to="/marketplace/$slug"
                            params={{ slug: meta.slug }}
                            className="hover:text-[var(--gold)]"
                          >
                            {meta.name}
                          </Link>
                        ) : (
                          "Project"
                        )}
                        <div className="text-xs capitalize text-muted-foreground">{p.status}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(p.invested, p.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(p.currentValue, p.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(p.distributions, p.currency)}</td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${p.totalReturn >= 0 ? "text-[var(--success)]" : "text-[var(--danger,#e05a5a)]"}`}
                      >
                        {p.totalReturn >= 0 ? "+" : ""}
                        {p.totalReturnPct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && positions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No holdings yet.{" "}
                      <Link to="/marketplace" search={MARKETPLACE_DEFAULT_SEARCH} className="text-[var(--gold)]">
                        Browse the marketplace
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl border border-border p-6">
            <div className="font-display text-xl">Sector exposure</div>
            <ul className="mt-4 space-y-4">
              {sectors.map((s) => (
                <li key={s.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.percent.toFixed(1)}% · {money(s.value)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.percent}%`, background: "var(--gradient-gold)" }}
                    />
                  </div>
                </li>
              ))}
              {sectors.length === 0 && (
                <li className="text-sm text-muted-foreground">Exposure appears once you hold a project.</li>
              )}
            </ul>
          </div>

          <div className="glass rounded-2xl border border-border p-6">
            <div className="font-display text-xl">Income received</div>
            <div className="gold-text mt-1 font-display text-3xl">{money(summary.distributions)}</div>
            <ul className="mt-4 space-y-3 text-sm">
              {(data?.distributions ?? []).slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {productName[d.product_id]?.name ?? "Project"}
                    <span className="ml-1.5 text-xs capitalize">
                      {String(d.kind).replace(/_/g, " ")}
                    </span>
                  </span>
                  <span className="tabular-nums">{money(Number(d.amount), d.currency)}</span>
                </li>
              ))}
              {(data?.distributions ?? []).length === 0 && (
                <li className="text-muted-foreground">No distributions paid yet.</li>
              )}
            </ul>
            <Link to="/statements" className="mt-4 inline-block text-sm text-[var(--gold)]">
              Generate a statement →
            </Link>
          </div>
        </div>
      </div>
    </DashShell>
  );
}

function Stat({
  label,
  value,
  big,
  tone,
}: {
  label: string;
  value: string;
  big?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-display ${big ? "gold-text text-3xl" : "text-xl"} ${
          tone === "up" ? "text-[var(--success)]" : tone === "down" ? "text-[var(--danger,#e05a5a)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
