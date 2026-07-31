import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Plus, Send, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { depositFunds, investFunds, issueCard, transferFunds } from "@/lib/banking.functions";
import type { Wallet } from "@/lib/dashboard.functions";
import { cx } from "@/components/dashboard-chrome";

type Kind = "transfer" | "deposit" | "invest" | "card";

const STRATEGIES = ["Balanced growth", "Global equities", "Private credit", "Digital assets"];
const SOURCES = ["Bank transfer", "Wire", "Card top-up", "Internal"];
const CARD_TIERS = ["Metal · Unlimited", "Gold · Priority", "Digital · Instant"];

const inputCls =
  "w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60";
const labelCls = "mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground";

export function QuickActions({ wallets, variant = "hero" }: { wallets: Wallet[]; variant?: "hero" | "plain" }) {
  const [open, setOpen] = useState<Kind | null>(null);
  const actions: { kind: Kind; icon: typeof Send; label: string }[] = [
    { kind: "transfer", icon: Send, label: "Transfer" },
    { kind: "deposit", icon: Plus, label: "Deposit" },
    { kind: "invest", icon: TrendingUp, label: "Invest" },
    { kind: "card", icon: CreditCard, label: "New card" },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ kind, icon: Icon, label }, i) => (
          <button
            key={kind}
            onClick={() => setOpen(kind)}
            className={cx(
              "group flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition-all hover:-translate-y-0.5",
              variant === "hero" && i === 0 && "text-primary-foreground",
            )}
            style={
              variant === "hero" && i === 0
                ? { background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }
                : { background: "color-mix(in oklab, var(--surface-elevated) 80%, transparent)" }
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <ActionDialog kind={open} wallets={wallets} onClose={() => setOpen(null)} />
    </>
  );
}

export function ActionDialog({
  kind,
  wallets,
  onClose,
}: {
  kind: Kind | null;
  wallets: Wallet[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const transfer = useServerFn(transferFunds);
  const deposit = useServerFn(depositFunds);
  const invest = useServerFn(investFunds);
  const card = useServerFn(issueCard);

  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [strategy, setStrategy] = useState(STRATEGIES[0]);
  const [cardName, setCardName] = useState("");
  const [cardTier, setCardTier] = useState(CARD_TIERS[2]);

  const selectedWallet = walletId || wallets[0]?.id || "";

  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === "transfer")
        return transfer({ data: { walletId: selectedWallet, amount: Number(amount), recipient } });
      if (kind === "deposit")
        return deposit({ data: { walletId: selectedWallet, amount: Number(amount), source } });
      if (kind === "invest")
        return invest({ data: { walletId: selectedWallet, amount: Number(amount), strategy } });
      return card({ data: { name: cardName, tier: cardTier } });
    },
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setAmount("");
      setRecipient("");
      setCardName("");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    },
  });

  const titles: Record<Kind, { title: string; desc: string; cta: string }> = {
    transfer: { title: "New transfer", desc: "Send funds from one of your wallets.", cta: "Send transfer" },
    deposit: { title: "Add funds", desc: "Credit a wallet from an external source.", cta: "Confirm deposit" },
    invest: { title: "Allocate capital", desc: "Move funds into a managed strategy.", cta: "Allocate" },
    card: { title: "Issue a new card", desc: "Instantly create an additional card.", cta: "Issue card" },
  };
  const meta = kind ? titles[kind] : null;

  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-border bg-[var(--surface)] sm:max-w-md">
        {meta && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{meta.title}</DialogTitle>
              <DialogDescription>{meta.desc}</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              {kind !== "card" && (
                <>
                  <div>
                    <label className={labelCls} htmlFor="qa-wallet">
                      {kind === "deposit" ? "Credit wallet" : "From wallet"}
                    </label>
                    <select
                      id="qa-wallet"
                      className={inputCls}
                      value={selectedWallet}
                      onChange={(e) => setWalletId(e.target.value)}
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.label} · {Number(w.balance).toLocaleString()} {w.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="qa-amount">
                      Amount
                    </label>
                    <input
                      id="qa-amount"
                      className={inputCls}
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}

              {kind === "transfer" && (
                <div>
                  <label className={labelCls} htmlFor="qa-recipient">
                    Recipient
                  </label>
                  <input
                    id="qa-recipient"
                    className={inputCls}
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Name, IBAN or account reference"
                  />
                </div>
              )}

              {kind === "deposit" && (
                <div>
                  <label className={labelCls} htmlFor="qa-source">
                    Source
                  </label>
                  <select id="qa-source" className={inputCls} value={source} onChange={(e) => setSource(e.target.value)}>
                    {SOURCES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {kind === "invest" && (
                <div>
                  <label className={labelCls} htmlFor="qa-strategy">
                    Strategy
                  </label>
                  <select
                    id="qa-strategy"
                    className={inputCls}
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                  >
                    {STRATEGIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {kind === "card" && (
                <>
                  <div>
                    <label className={labelCls} htmlFor="qa-card-name">
                      Card name
                    </label>
                    <input
                      id="qa-card-name"
                      className={inputCls}
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Travel card"
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="qa-card-tier">
                      Tier
                    </label>
                    <select
                      id="qa-card-tier"
                      className={inputCls}
                      value={cardTier}
                      onChange={(e) => setCardTier(e.target.value)}
                    >
                      {CARD_TIERS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
              >
                {mutation.isPending ? "Processing…" : meta.cta}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
