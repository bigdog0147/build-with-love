import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ShieldAlert, Upload } from "lucide-react";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import { supabase } from "@/integrations/supabase/client";
import { cancelDeposit, getDeposits, requestDeposit } from "@/lib/deposits.functions";
import { DEPOSIT_METHODS, methodLabel } from "@/lib/deposits.server";

export const Route = createFileRoute("/_authenticated/deposits")({
  component: DepositsPage,
  head: () => ({
    meta: [
      { title: "Deposits — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Declare an incoming deposit, attach proof of payment and track confirmation by client operations.",
      },
      { property: "og:title", content: "Deposits — Gigafactory 3X" },
      { property: "og:description", content: "Fund your Gigafactory 3X account and track confirmation." },
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

function DepositsPage() {
  const queryClient = useQueryClient();
  const fetchData = useServerFn(getDeposits);
  const submit = useServerFn(requestDeposit);
  const cancel = useServerFn(cancelDeposit);

  const { data } = useQuery({ queryKey: ["deposits"], queryFn: () => fetchData({} as never) });

  const [form, setForm] = useState({
    walletId: "",
    amount: "",
    method: "bank_transfer",
    reference: "",
    note: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const verified = data?.idStatus === "verified";
  const wallets = data?.wallets ?? [];
  const requests = data?.requests ?? [];
  const depositMin = data?.depositMin ?? 100;

  async function uploadProof() {
    if (!file) return null;
    const { data: session } = await supabase.auth.getUser();
    const uid = session.user?.id;
    if (!uid) throw new Error("Session expired — sign in again.");
    const ext = file.name.split(".").pop()?.toLowerCase().slice(0, 8) ?? "bin";
    const path = `${uid}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("deposit-proofs").upload(path, file);
    if (error) throw new Error(error.message);
    return path;
  }

  const create = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const proofPath = await uploadProof();
        return await submit({
          data: {
            walletId: form.walletId || wallets[0]?.id || "",
            amount: Number(form.amount),
            method: form.method,
            reference: form.reference,
            note: form.note,
            proofPath: proofPath ?? undefined,
          },
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (res) => {
      toast.success(res.message);
      setForm((f) => ({ ...f, amount: "", reference: "", note: "" }));
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const drop = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashShell>
      <PageHeading
        eyebrow="Deposits"
        title="Fund your account"
        sub="Declare the transfer you have sent. Client operations confirm receipt before funds appear in your wallet."
      />

      {!verified && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
          <div className="text-sm">
            <div className="font-medium">Identity verification required</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Funding unlocks once your identity check is approved.
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
            <label className={labelCls} htmlFor="d-wallet">
              Destination wallet
            </label>
            <select
              id="d-wallet"
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
            <label className={labelCls} htmlFor="d-amount">
              Amount
            </label>
            <input
              id="d-amount"
              className={inputCls}
              type="number"
              min={depositMin}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Minimum {depositMin.toLocaleString()} per deposit.
            </p>
          </div>
          <div>
            <label className={labelCls} htmlFor="d-method">
              Funding method
            </label>
            <select
              id="d-method"
              className={inputCls}
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
            >
              {DEPOSIT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="d-ref">
              Payment reference
            </label>
            <input
              id="d-ref"
              className={inputCls}
              maxLength={120}
              placeholder="Bank reference or transaction hash"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="d-proof">
              Proof of payment (optional)
            </label>
            <label
              htmlFor="d-proof"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground hover:border-[var(--gold)]/60"
            >
              <Upload className="h-3.5 w-3.5" />
              {file ? file.name : "Attach a receipt or bank confirmation"}
            </label>
            <input
              id="d-proof"
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="d-note">
              Note (optional)
            </label>
            <textarea
              id="d-note"
              className={inputCls}
              rows={3}
              maxLength={400}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={!verified || create.isPending || uploading || wallets.length === 0}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            {create.isPending || uploading ? "Submitting…" : "Declare deposit"}
          </button>
          <p className="text-[11px] text-muted-foreground">
            Your wallet balance updates only after operations confirms the incoming funds.
          </p>
        </form>

        <div className="rounded-2xl border border-border p-6 glass">
          <div className="mb-4 flex items-center gap-2 text-sm">
            <ArrowDownLeft className="h-4 w-4 text-[var(--gold)]" />
            Your deposits
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deposits declared yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r: any) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      {Number(r.amount).toLocaleString()} {r.currency} · {methodLabel(r.method)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                      {r.reference ? ` · Ref ${r.reference}` : ""}
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
