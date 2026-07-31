import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gem } from "lucide-react";
import { toast } from "sonner";
import { getDashboard } from "@/lib/dashboard.functions";
import { requestVaultAccess } from "@/lib/banking.functions";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";

export const Route = createFileRoute("/_authenticated/private-markets")({
  component: PrivateMarketsPage,
  head: () => ({
    meta: [
      { title: "Private markets — Gigafactory 3" },
      { name: "description", content: "Access private credit, venture and infrastructure allocations by invitation." },
      { property: "og:title", content: "Private markets — Gigafactory 3" },
      { property: "og:description", content: "Private credit, venture and infrastructure allocations." },
    ],
  }),
});

const OPPORTUNITIES = [
  { name: "Gigafactory Infrastructure Fund IV", type: "Infrastructure", min: "$250,000", target: "12–15% IRR" },
  { name: "Robotics Growth Co-Invest", type: "Venture growth", min: "$100,000", target: "18–22% IRR" },
  { name: "Grid Storage Private Credit", type: "Private credit", min: "$50,000", target: "9–11% yield" },
  { name: "Semiconductor Supply Chain SPV", type: "Special situations", min: "$500,000", target: "2.0x MOIC" },
];

function PrivateMarketsPage() {
  const fetchDashboard = useServerFn(getDashboard);
  useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard({} as never) });
  const queryClient = useQueryClient();
  const request = useServerFn(requestVaultAccess);
  const mutation = useMutation({
    mutationFn: () => request({} as never),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Request failed."),
  });

  return (
    <DashShell>
      <PageHeading
        eyebrow="Private markets"
        title="Obsidian Vault"
        sub="Private-market allocations, custody in Zurich, dedicated advisor. By invitation."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {OPPORTUNITIES.map((o) => (
          <div key={o.name} className="rounded-2xl border border-border p-5 glass">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Gem className="h-3.5 w-3.5 text-[var(--gold)]" />
              {o.type}
            </div>
            <div className="mt-2 font-display text-xl">{o.name}</div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Minimum</dt>
                <dd className="mt-0.5">{o.min}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Target</dt>
                <dd className="mt-0.5 text-[var(--success)]">{o.target}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-surface)" }}>
        <div className="font-display text-2xl">Request an allocation</div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Submit a request and your advisor will review eligibility, suitability and available capacity.
        </p>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-4 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          {mutation.isPending ? "Submitting…" : "Request access"}
        </button>
      </div>
    </DashShell>
  );
}
