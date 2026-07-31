import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/dashboard.functions";
import { DashShell, PageHeading, money, cx } from "@/components/dashboard-chrome";
import { QuickActions } from "@/components/quick-actions";

export const Route = createFileRoute("/_authenticated/transfers")({
  component: TransfersPage,
  head: () => ({
    meta: [
      { title: "Transfers — Gigafactory 3" },
      { name: "description", content: "Send funds, add deposits and review your full transaction statement." },
      { property: "og:title", content: "Transfers — Gigafactory 3" },
      { property: "og:description", content: "Transfers, deposits and statement history." },
    ],
  }),
});

function TransfersPage() {
  const fetch = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch({} as never) });
  const transactions = data?.transactions ?? [];

  return (
    <DashShell>
      <PageHeading eyebrow="Transfers" title="Move money" sub="Initiate transfers and deposits, then track them here in real time." />
      <QuickActions wallets={data?.wallets ?? []} variant="plain" />
      <div className="rounded-2xl border border-border p-6 glass">
        <div className="font-display text-2xl">Statement</div>
        <div className="mt-5 divide-y divide-border/60">
          {transactions.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No transactions yet.</div>
          )}
          {transactions.map((t) => {
            const amount = Number(t.amount);
            const positive = amount >= 0;
            return (
              <div key={t.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.kind} ·{" "}
                    {new Date(t.occurred_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className={cx("font-display text-sm tabular-nums", positive && "text-[var(--success)]")}>
                    {(positive ? "+" : "") + money(amount, t.currency)}
                  </div>
                  <div
                    className={cx(
                      "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px]",
                      t.status === "Pending"
                        ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashShell>
  );
}
