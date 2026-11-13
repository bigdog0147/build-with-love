import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard } from "lucide-react";
import { getDashboard } from "@/lib/dashboard.functions";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import { QuickActions } from "@/components/quick-actions";

export const Route = createFileRoute("/_authenticated/cards")({
  component: CardsPage,
  head: () => ({
    meta: [
      { title: "Cards — Gigafactory 3" },
      { name: "description", content: "View your metal and digital cards, and issue a new one instantly." },
      { property: "og:title", content: "Cards — Gigafactory 3" },
      { property: "og:description", content: "Metal and digital card collection." },
    ],
  }),
});

function CardsPage() {
  const fetch = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch({} as never) });
  const cards = data?.cards ?? [];

  return (
    <DashShell>
      <PageHeading eyebrow="Cards" title="Your card collection" sub="Issue, review and manage every card linked to your accounts." />
      <QuickActions wallets={data?.wallets ?? []} variant="plain" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.id}
            className="relative overflow-hidden rounded-2xl p-5 text-white"
            style={{ background: c.gradient, minHeight: 170 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] opacity-80">{c.tier}</div>
                <div className="mt-1 font-display text-xl">{c.name}</div>
              </div>
              <CreditCard className="h-5 w-5 opacity-80" />
            </div>
            <div className="mt-10 font-mono text-sm tracking-widest opacity-90">•••• •••• •••• {c.last4}</div>
          </div>
        ))}
        {cards.length === 0 && <p className="text-sm text-muted-foreground">No cards issued yet.</p>}
      </div>
    </DashShell>
  );
}
