import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import {
  cancelWithdrawal,
  getWithdrawals,
  requestWithdrawal,
} from "@/lib/withdrawals.functions";

export const Route = createFileRoute("/_authenticated/withdrawals")({
  component: WithdrawalsPage,
  head: () => ({
    meta: [
      { title: "Withdrawals — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Request a withdrawal to a verified bank account or external wallet and track its review status.",
      },
      { property: "og:title", content: "Withdrawals — Gigafactory 3X" },
      { property: "og:description", content: "Request and track customer withdrawals." },
    ],
  }),
});

const inputCls =
  "w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60";
const labelCls = "mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[var(--warning)]/10 text-[var(--warning)]",
  approved: "bg-[var(--success)]/10 text-[var(--success)]",
  rejected: "bg-[var(--danger)]/10 text-[var(--danger)]",
  cancelled: "bg-muted text-muted-foreground",
};

function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const fetchData = useServerFn(getWithdrawals);
  const submit = useServerFn(requestWithdrawal);
  const cancel = useServerFn(cancelWithdrawal);

  const { data } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: () => fetchData({} as never),
  });

  const [form, setForm] = useState({
    walletId: "",
    amount: "",
    destinationType: "bank_account",
    destinationLabel: "",
    destinationDetails: "",
    note: "",
  });

  const verified = data?.idStatus === "verified";
  const wallets = data?.wallets ?? [];
  const requests = data?.requests ?? [];

  const create = useMutation({
    mutationFn: () =>
      submit({
        data: {
          walletId: form.walletId || wallets[0]?.id || "",
          amount: Number(form.amount),
          destinationType: form.destinationType,
          destinationLabel: form.destinationLabel,
          destinationDetails: form.destinationDetails,
          note: form.note,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      setForm((f) => ({ ...f, amount: "", destinationDetails: "", note: "" }));
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const drop = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashShell>
      <PageHeading
        eyebrow="Withdrawals"
        title="Move funds out"
        sub="Every withdrawal is reviewed by client operations before settlement."
      />

      {!verified && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
          <div className="text-sm">
            <div className="font-medium">Identity verification required</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Withdrawals unlock once your identity check is approved. Complete the wizard and we
              will email you when the review finishes.
            </p>
            <Link to="/verify" className="mt-2 inline-block text-xs text-[var(--gold)] hover:underline">
              Go to verification →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="space-y-4 rounded-2xl border border-border p-6 glass"
        >
          <div>
            <label className={labelCls} htmlFor="w-wallet">
              From wallet
            </label>
            <select
              id="w-wallet"
              className={inputCls}
              value={form.walletId || wallets[0]?.id || ""}
              onChange={(e) => setForm((f) => ({ ...f, walletId: e.target.value }))}
            >
              {wallets.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.label} · {Number(w.balance).toLocaleString()} {w.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="w-amount">
              Amount
            </label>
            <input
              id="w-amount"
              className={inputCls}
              type="number"
              min="10"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="w-type">
              Destination type
            </label>
            <select
              id="w-type"
              className={inputCls}
              value={form.destinationType}
              onChange={(e) => setForm((f) => ({ ...f, destinationType: e.target.value }))}
            >
              <option value="bank_account">Bank account</option>
              <option value="external_wallet">External wallet</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="w-label">
              Destination name
            </label>
            <input
              id="w-label"
              className={inputCls}
              required
              maxLength={120}
              placeholder="HSBC · Personal current account"
              value={form.destinationLabel}
              onChange={(e) => setForm((f) => ({ ...f, destinationLabel: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="w-details">
              Account / address
            </label>
            <input
              id="w-details"
              className={inputCls}
              maxLength={140}
              placeholder="Only the last four characters are stored"
              value={form.destinationDetails}
              onChange={(e) => setForm((f) => ({ ...f, destinationDetails: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="w-note">
              Note (optional)
            </label>
            <textarea
              id="w-note"
              className={inputCls}
              rows={3}
              maxLength={400}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={!verified || create.isPending || wallets.length === 0}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            {create.isPending ? "Submitting…" : "Request withdrawal"}
          </button>
          <p className="text-[11px] text-muted-foreground">
            The amount is held from your wallet as soon as you submit, so it cannot be spent twice.
          </p>
        </form>

        <div className="rounded-2xl border border-border p-6 glass">
          <div className="mb-4 flex items-center gap-2 text-sm">
            <ArrowUpRight className="h-4 w-4 text-[var(--gold)]" />
            Your requests
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r: any) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      {Number(r.amount).toLocaleString()} {r.currency} · {r.destination_label}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()} ·{" "}
                      {r.destination_type === "bank_account" ? "Bank account" : "External wallet"}
                      {r.destination_details ? ` · ${r.destination_details}` : ""}
                    </div>
                    {r.review_note && (
                      <div className="mt-1 text-xs text-[var(--warning)]">{r.review_note}</div>
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
                  {r.status === "pending" && (
                    <button
                      onClick={() => drop.mutate(r.id)}
                      disabled={drop.isPending}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashShell>
  );
}
