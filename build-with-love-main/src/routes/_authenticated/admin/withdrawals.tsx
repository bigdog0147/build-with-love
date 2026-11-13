import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Banknote } from "lucide-react";
import { adminListWithdrawals, reviewWithdrawal } from "@/lib/withdrawals.functions";

export const Route = createFileRoute("/_authenticated/admin/withdrawals")({
  component: AdminWithdrawalsPage,
  head: () => ({
    meta: [
      { title: "Withdrawal Approvals — Gigafactory 3X Admin" },
      {
        name: "description",
        content:
          "Review, approve or decline customer withdrawal requests and release held balances.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[var(--warning)]/10 text-[var(--warning)]",
  approved: "bg-[var(--success)]/10 text-[var(--success)]",
  rejected: "bg-[var(--danger)]/10 text-[var(--danger)]",
  cancelled: "bg-muted text-muted-foreground",
};

function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const fetchRows = useServerFn(adminListWithdrawals);
  const review = useServerFn(reviewWithdrawal);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => fetchRows({} as never),
  });

  const decide = useMutation({
    mutationFn: (vars: { id: string; decision: "approved" | "rejected" }) =>
      review({ data: { ...vars, reviewNote: notes[vars.id] ?? "" } }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows = (data?.rows ?? []).filter((r: any) =>
    filter === "pending" ? r.status === "pending" : true,
  );
  const people = data?.people ?? {};

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--gold)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to admin dashboard
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Banknote className="h-5 w-5 text-[var(--gold)]" /> Withdrawal approvals
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Funds are already held from the customer's wallet. Approving settles the transaction;
            declining releases the hold back to the wallet and emails the customer.
          </p>
        </div>
        <div className="flex gap-2">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-lg border px-3 py-1.5 text-xs capitalize " +
                (filter === f
                  ? "border-[var(--gold)]/60 bg-[var(--gold)]/10"
                  : "border-border text-muted-foreground")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading requests…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No withdrawal requests to review.</p>
        )}
        {rows.map((r: any) => {
          const person = people[r.user_id];
          return (
            <div key={r.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {Number(r.amount).toLocaleString()} {r.currency} ·{" "}
                    {person?.name ?? r.user_id.slice(0, 8)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.destination_type === "bank_account" ? "Bank account" : "External wallet"} ·{" "}
                    {r.destination_label}
                    {r.destination_details ? ` · ${r.destination_details}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Requested {new Date(r.created_at).toLocaleString()} · KYC{" "}
                    {person?.idStatus ?? "unknown"}
                  </div>
                  {r.note && <div className="mt-1 text-xs">Customer note: {r.note}</div>}
                  {r.review_note && (
                    <div className="mt-1 text-xs text-[var(--warning)]">
                      Decision note: {r.review_note}
                    </div>
                  )}
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[11px] capitalize " +
                    (STATUS_STYLE[r.status] ?? "bg-muted text-muted-foreground")
                  }
                >
                  {r.status}
                </span>
              </div>

              {r.status === "pending" && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <input
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="Decision note (required to decline)"
                    maxLength={400}
                    className="min-w-[16rem] flex-1 rounded-lg border border-border bg-[var(--surface)] px-3 py-2 text-xs outline-none focus:border-[var(--gold)]/60"
                  />
                  <button
                    onClick={() => decide.mutate({ id: r.id, decision: "approved" })}
                    disabled={decide.isPending}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
                    style={{ background: "var(--gradient-gold)" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide.mutate({ id: r.id, decision: "rejected" })}
                    disabled={decide.isPending}
                    className="rounded-lg border border-[var(--danger)]/40 px-3 py-2 text-xs text-[var(--danger)] disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
