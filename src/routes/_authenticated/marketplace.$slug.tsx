import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { getMarketplaceProduct, subscribeToProduct } from "@/lib/investments.functions";
import { getDocumentDownloadUrl } from "@/lib/documents.functions";
import { remainingCapacity, toPosition } from "@/lib/investments";

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

export const Route = createFileRoute("/_authenticated/marketplace/$slug")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "Opportunity — Gigafactory 3X" },
      { name: "description", content: "Project terms, documents and subscription." },
    ],
  }),
  errorComponent: ({ error }) => (
    <DashShell>
      <div role="alert" className="glass rounded-2xl border border-border p-8">
        <div className="font-display text-xl">Opportunity unavailable</div>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/marketplace" search={MARKETPLACE_DEFAULT_SEARCH} className="mt-4 inline-block text-sm text-[var(--gold)]">
          Back to marketplace
        </Link>
      </div>
    </DashShell>
  ),
  notFoundComponent: () => (
    <DashShell>
      <div className="glass rounded-2xl border border-border p-8 text-sm text-muted-foreground">
        This opportunity no longer exists.
      </div>
    </DashShell>
  ),
});

function ProductPage() {
  const { slug } = useParams({ from: "/_authenticated/marketplace/$slug" });
  const queryClient = useQueryClient();
  const fetchProduct = useServerFn(getMarketplaceProduct);
  const subscribe = useServerFn(subscribeToProduct);
  const download = useServerFn(getDocumentDownloadUrl);

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-product", slug],
    queryFn: () => fetchProduct({ data: { slug } }),
  });

  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");

  const product = data?.product;
  const wallets = data?.wallets ?? [];
  const verified = data?.idStatus === "verified";
  const remaining = product ? remainingCapacity(product, data?.subscribed ?? 0) : null;

  const positions = useMemo(() => (data?.holdings ?? []).map((h) => toPosition(h)), [data?.holdings]);
  const holdingTotal = positions
    .filter((p) => p.status !== "rejected")
    .reduce((s, p) => s + p.currentValue, 0);

  const mutation = useMutation({
    mutationFn: () =>
      subscribe({
        data: {
          productId: product!.id,
          walletId: walletId || wallets[0]?.id || "",
          amount: Number(amount),
        },
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["marketplace-product", slug] });
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["investor-overview"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Subscription failed."),
  });

  const openDocument = useMutation({
    mutationFn: (id: string) => download({ data: { id } }),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Download failed."),
  });

  if (isLoading || !product) {
    return (
      <DashShell>
        <p className="text-sm text-muted-foreground">Loading opportunity…</p>
      </DashShell>
    );
  }

  return (
    <DashShell>
      <Link to="/marketplace" search={MARKETPLACE_DEFAULT_SEARCH} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Marketplace
      </Link>
      <PageHeading
        eyebrow={`${product.category} · ${product.sector}`}
        title={product.name}
        sub={product.summary}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-border p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Term label="Minimum" value={money(Number(product.minimum), product.currency, 0)} />
              <Term label="Target yield" value={`${Number(product.target_yield)}%`} accent />
              <Term label="Term" value={`${product.term_months} months`} />
              <Term
                label="Capacity"
                value={
                  product.capacity == null
                    ? "Uncapped"
                    : `${money(remaining ?? 0, product.currency, 0)} left`
                }
              />
            </div>
          </div>

          <div className="glass rounded-2xl border border-border p-6">
            <div className="font-display text-xl">About this project</div>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {product.description
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>

          <div className="glass rounded-2xl border border-border p-6">
            <div className="font-display text-xl">Project documents</div>
            <ul className="mt-4 divide-y divide-border/60">
              {(data?.documents ?? []).map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 py-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{doc.title}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {doc.category.replace(/_/g, " ")} · {(Number(doc.file_size) / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => openDocument.mutate(doc.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]/60"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </li>
              ))}
              {(data?.documents ?? []).length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">
                  Documents are published here once the data room opens.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border p-6" style={{ background: "var(--gradient-surface)" }}>
            <div className="font-display text-xl">Subscribe</div>
            {!verified ? (
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2 text-[var(--warning,#e0a83b)]">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  Identity verification must be approved before you can subscribe.
                </div>
                <Link to="/verify" className="inline-block text-sm text-[var(--gold)]">
                  Complete verification →
                </Link>
              </div>
            ) : (
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
              >
                <label className="block text-sm">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Amount ({product.currency})
                  </span>
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(Number(product.minimum))}
                    className="mt-1.5 w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Funding wallet
                  </span>
                  <select
                    value={walletId || wallets[0]?.id || ""}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label} — {money(Number(w.balance), w.code)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs text-muted-foreground">
                  Subscriptions in a different currency are converted at the prevailing rate plus spread.
                </p>
                <button
                  type="submit"
                  disabled={mutation.isPending || wallets.length === 0}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
                >
                  {mutation.isPending ? "Submitting…" : "Subscribe"}
                </button>
              </form>
            )}
          </div>

          <div className="glass rounded-2xl border border-border p-6">
            <div className="font-display text-lg">Your position</div>
            {positions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">You have no holding in this project yet.</p>
            ) : (
              <>
                <div className="gold-text mt-1 font-display text-3xl">
                  {money(holdingTotal, product.currency)}
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {positions.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <span className="capitalize text-muted-foreground">{p.status}</span>
                      <span className="tabular-nums">
                        {money(p.currentValue, p.currency)}{" "}
                        <span className={p.gain >= 0 ? "text-[var(--success)]" : "text-[var(--danger,#e05a5a)]"}>
                          {p.gain >= 0 ? "+" : ""}
                          {p.gainPct.toFixed(2)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </DashShell>
  );
}

function Term({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-lg ${accent ? "text-[var(--success)]" : ""}`}>{value}</div>
    </div>
  );
}
