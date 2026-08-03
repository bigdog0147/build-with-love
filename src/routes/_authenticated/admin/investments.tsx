import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell, Tabs } from "@/components/admin/shell";
import { Bars, Panel, PanelHead, StatCard } from "@/components/admin/kit";
import {
  adminGetInvestmentBook,
  adminPayDistribution,
  adminPostValuation,
  adminReviewHolding,
  adminSaveProduct,
} from "@/lib/investments.admin.functions";
import {
  adminGetRaise,
  adminReviewCommitment,
  adminReviewInterest,
  adminSaveRound,
  adminUpdateRoundStatus,
} from "@/lib/raise.functions";
import { AdminDocumentLibrary } from "@/components/admin/document-library";
import { exposureBy, summarisePortfolio, toPosition } from "@/lib/investments";

export const Route = createFileRoute("/_authenticated/admin/investments")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: typeof s.tab === "string" ? s.tab : "products" }),
  component: InvestmentsPage,
  head: () => ({
    meta: [
      { title: "Investments | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Manage GF3X investment products, subscriptions, valuations, distributions and capital raises.",
      },
      { property: "og:title", content: "Investments | Gigafactory 3X Administration" },
      { property: "og:description", content: "Investment product and performance administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  sector: string;
  summary: string;
  description: string;
  currency: string;
  minimum: number;
  target_yield: number;
  term_months: number;
  capacity: number | null;
  status: string;
};
type HoldingRow = {
  id: string;
  user_id: string;
  product_id: string;
  units: number;
  invested: number;
  current_value: number;
  currency: string;
  status: string;
  created_at: string;
};
type ValuationRow = {
  id: string;
  holding_id: string;
  product_id: string;
  user_id: string;
  as_of: string;
  unit_price: number;
  value: number;
};
type DistributionRow = {
  id: string;
  holding_id: string;
  product_id: string;
  user_id: string;
  kind: string;
  amount: number;
  currency: string;
  paid_at: string;
};
type RoundRow = {
  id: string;
  name: string;
  product_id: string | null;
  narrative: string;
  highlights: string[];
  target_amount: number;
  minimum_ticket: number;
  currency: string;
  closes_at: string | null;
  status: string;
};
type InterestRow = {
  id: string;
  round_id: string;
  user_id: string;
  indicative_amount: number;
  currency: string;
  status: string;
  note: string | null;
};
type CommitmentRow = {
  id: string;
  round_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
};
type RaiseData = {
  rounds: RoundRow[];
  interests: InterestRow[];
  commitments: CommitmentRow[];
  products: ProductRow[];
  investorNames: Record<string, string>;
};

const TABS = [
  { key: "products", label: "Products" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "performance", label: "Valuations & income" },
  { key: "raise", label: "Capital raising" },
  { key: "documents", label: "Documents" },
];

const input =
  "w-full rounded-lg border border-white/10 bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60";
const btnGold =
  "rounded-lg px-3.5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60";
const btn = "rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:border-[var(--gold)]/60";

function InvestmentsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchBook = useServerFn(adminGetInvestmentBook);
  const { data: book } = useQuery({
    queryKey: ["admin-investment-book"],
    queryFn: async () => (await fetchBook({} as never)) as BookData,
  });

  const positions = useMemo(
    () => (book?.holdings ?? []).map((h) => toPosition(h, book?.distributions ?? [])),
    [book?.holdings, book?.distributions],
  );
  const summary = useMemo(() => summarisePortfolio(positions, book?.products ?? []), [positions, book?.products]);
  const sectors = useMemo(() => exposureBy(positions, book?.products ?? [], "sector"), [positions, book?.products]);
  const pending = positions.filter((p) => p.status === "pending").length;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-investment-book"] });
    queryClient.invalidateQueries({ queryKey: ["admin-raise"] });
  };
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Action failed.");

  return (
    <AdminShell
      eyebrow="Investments"
      title="Investment administration"
      sub="Product shelf, subscription confirmations, valuations, distributions and capital raising."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Products" value={book?.products.length ?? 0} />
        <StatCard label="Capital deployed" value={summary.invested} format="currency" tone="gold" />
        <StatCard label="Current value" value={summary.currentValue} format="currency" tone="electric" />
        <StatCard label="Pending subscriptions" value={pending} tone="success" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => navigate({ to: ".", search: { tab: key } })} />

      {tab === "products" && <ProductsTab book={book} onDone={invalidate} onFail={fail} />}
      {tab === "subscriptions" && (
        <SubscriptionsTab book={book} positions={positions} onDone={invalidate} onFail={fail} />
      )}
      {tab === "performance" && (
        <PerformanceTab book={book} sectors={sectors} onDone={invalidate} onFail={fail} />
      )}
      {tab === "raise" && <RaiseTab onFail={fail} />}
      {tab === "documents" && <AdminDocumentLibrary />}
    </AdminShell>
  );
}

type BookData = {
  products: ProductRow[];
  holdings: HoldingRow[];
  valuations: ValuationRow[];
  distributions: DistributionRow[];
  investorNames: Record<string, string>;
};
type Book = BookData | undefined;

function ProductsTab({ book, onDone, onFail }: { book: Book; onDone: () => void; onFail: (e: unknown) => void }) {
  const save = useServerFn(adminSaveProduct);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "Infrastructure",
    sector: "Energy",
    summary: "",
    description: "",
    currency: "USD",
    minimum: "50000",
    targetYield: "10",
    termMonths: "36",
    capacity: "",
    status: "draft",
  });

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: editing ?? undefined,
          name: form.name,
          category: form.category,
          sector: form.sector,
          summary: form.summary,
          description: form.description,
          currency: form.currency,
          minimum: Number(form.minimum),
          targetYield: Number(form.targetYield),
          termMonths: Number(form.termMonths),
          capacity: form.capacity ? Number(form.capacity) : null,
          status: form.status,
        },
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      setEditing(null);
      onDone();
    },
    onError: onFail,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Panel>
        <PanelHead title="Product shelf" sub="Published products appear in the investor marketplace." />
        <ul className="divide-y divide-white/10">
          {(book?.products ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.category} · {p.sector} · min {Number(p.minimum).toLocaleString()} {p.currency} ·{" "}
                  {Number(p.target_yield)}% · <span className="capitalize">{p.status}</span>
                </div>
              </div>
              <button
                className={btn}
                onClick={() => {
                  setEditing(p.id);
                  setForm({
                    name: p.name,
                    category: p.category,
                    sector: p.sector,
                    summary: p.summary,
                    description: p.description,
                    currency: p.currency,
                    minimum: String(Number(p.minimum)),
                    targetYield: String(Number(p.target_yield)),
                    termMonths: String(p.term_months),
                    capacity: p.capacity == null ? "" : String(Number(p.capacity)),
                    status: p.status,
                  });
                }}
              >
                Edit
              </button>
            </li>
          ))}
          {(book?.products ?? []).length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">No products yet.</li>
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHead
          title={editing ? "Edit product" : "New product"}
          right={
            editing ? (
              <button className={btn} onClick={() => setEditing(null)}>
                Cancel
              </button>
            ) : undefined
          }
        />
        <form
          className="space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <input
            className={input}
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <input
              className={input}
              placeholder="Sector"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
          </div>
          <input
            className={input}
            placeholder="One-line summary"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          <textarea
            className={`${input} min-h-28`}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            />
            <input
              className={input}
              placeholder="Minimum"
              value={form.minimum}
              onChange={(e) => setForm({ ...form, minimum: e.target.value })}
            />
            <input
              className={input}
              placeholder="Target yield %"
              value={form.targetYield}
              onChange={(e) => setForm({ ...form, targetYield: e.target.value })}
            />
            <input
              className={input}
              placeholder="Term (months)"
              value={form.termMonths}
              onChange={(e) => setForm({ ...form, termMonths: e.target.value })}
            />
            <input
              className={input}
              placeholder="Capacity (blank = uncapped)"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
            <select
              className={input}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={btnGold}
            style={{ background: "var(--gradient-gold)" }}
          >
            {mutation.isPending ? "Saving…" : editing ? "Save changes" : "Create product"}
          </button>
        </form>
      </Panel>
    </div>
  );
}

function SubscriptionsTab({
  book,
  positions,
  onDone,
  onFail,
}: {
  book: Book;
  positions: ReturnType<typeof toPosition>[];
  onDone: () => void;
  onFail: (e: unknown) => void;
}) {
  const review = useServerFn(adminReviewHolding);
  const [note, setNote] = useState<Record<string, string>>({});
  const names = new Map((book?.products ?? []).map((p) => [p.id, p.name]));

  const mutation = useMutation({
    mutationFn: (vars: { id: string; decision: "activate" | "reject" | "close"; note?: string }) =>
      review({ data: vars }),
    onSuccess: (r) => {
      toast.success(r.message);
      onDone();
    },
    onError: onFail,
  });

  return (
    <Panel>
      <PanelHead
        title="Subscriptions"
        sub="Confirm pending subscriptions, reject with an automatic refund, or close active holdings."
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-2 text-left font-normal">Investor</th>
              <th className="px-3 py-2 text-left font-normal">Project</th>
              <th className="px-3 py-2 text-right font-normal">Invested</th>
              <th className="px-3 py-2 text-right font-normal">Value</th>
              <th className="px-3 py-2 text-left font-normal">Status</th>
              <th className="px-5 py-2 text-right font-normal">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {positions.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3">
                  {book?.investorNames[(book?.holdings ?? []).find((h) => h.id === p.id)?.user_id ?? ""] ??
                    "Investor"}
                </td>
                <td className="px-3 py-3">{names.get(p.productId) ?? "Project"}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {p.invested.toLocaleString()} {p.currency}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{p.currentValue.toLocaleString()}</td>
                <td className="px-3 py-3 capitalize">{p.status}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <input
                      className="w-40 rounded-lg border border-white/10 bg-[var(--surface)] px-2 py-1.5 text-xs outline-none"
                      placeholder="Note"
                      value={note[p.id] ?? ""}
                      onChange={(e) => setNote({ ...note, [p.id]: e.target.value })}
                    />
                    {p.status === "pending" && (
                      <>
                        <button
                          className={btn}
                          onClick={() => mutation.mutate({ id: p.id, decision: "activate", note: note[p.id] })}
                        >
                          Activate
                        </button>
                        <button
                          className={btn}
                          onClick={() => mutation.mutate({ id: p.id, decision: "reject", note: note[p.id] })}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === "active" && (
                      <button
                        className={btn}
                        onClick={() => mutation.mutate({ id: p.id, decision: "close", note: note[p.id] })}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No subscriptions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PerformanceTab({
  book,
  sectors,
  onDone,
  onFail,
}: {
  book: Book;
  sectors: { label: string; value: number }[];
  onDone: () => void;
  onFail: (e: unknown) => void;
}) {
  const postValuation = useServerFn(adminPostValuation);
  const payDistribution = useServerFn(adminPayDistribution);
  const active = (book?.holdings ?? []).filter((h) => h.status === "active");
  const names = new Map((book?.products ?? []).map((p) => [p.id, p.name]));

  const [holdingId, setHoldingId] = useState("");
  const [unitPrice, setUnitPrice] = useState("1.00");
  const [asOf, setAsOf] = useState("");
  const [valNote, setValNote] = useState("");
  const [distHolding, setDistHolding] = useState("");
  const [distAmount, setDistAmount] = useState("");
  const [distKind, setDistKind] = useState<"income" | "capital_return">("income");
  const [distNote, setDistNote] = useState("");

  const valuation = useMutation({
    mutationFn: () =>
      postValuation({
        data: {
          holdingId: holdingId || active[0]?.id || "",
          unitPrice: Number(unitPrice),
          asOf: asOf || undefined,
          note: valNote,
        },
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      onDone();
    },
    onError: onFail,
  });

  const distribution = useMutation({
    mutationFn: () =>
      payDistribution({
        data: {
          holdingId: distHolding || active[0]?.id || "",
          amount: Number(distAmount),
          kind: distKind,
          note: distNote,
        },
      }),
    onSuccess: (r) => {
      toast.success(r.message);
      setDistAmount("");
      onDone();
    },
    onError: onFail,
  });

  const holdingLabel = (h: HoldingRow) =>
    `${book?.investorNames[h.user_id] ?? "Investor"} — ${names.get(h.product_id) ?? "Project"} (${Number(
      h.units,
    ).toLocaleString()} units)`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHead title="Post a valuation" sub="Marks the holding to a new unit price for the investor." />
        <form
          className="space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            valuation.mutate();
          }}
        >
          <select className={input} value={holdingId} onChange={(e) => setHoldingId(e.target.value)}>
            <option value="">Select a holding…</option>
            {active.map((h) => (
              <option key={h.id} value={h.id}>
                {holdingLabel(h)}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="Unit price"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
            <input type="date" className={input} value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </div>
          <input
            className={input}
            placeholder="Note (optional)"
            value={valNote}
            onChange={(e) => setValNote(e.target.value)}
          />
          <button
            type="submit"
            disabled={valuation.isPending}
            className={btnGold}
            style={{ background: "var(--gradient-gold)" }}
          >
            {valuation.isPending ? "Posting…" : "Post valuation"}
          </button>
        </form>
      </Panel>

      <Panel>
        <PanelHead title="Pay a distribution" sub="Credits income or a capital return to the investor's wallet." />
        <form
          className="space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            distribution.mutate();
          }}
        >
          <select className={input} value={distHolding} onChange={(e) => setDistHolding(e.target.value)}>
            <option value="">Select a holding…</option>
            {active.map((h) => (
              <option key={h.id} value={h.id}>
                {holdingLabel(h)}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="Amount"
              value={distAmount}
              onChange={(e) => setDistAmount(e.target.value)}
            />
            <select
              className={input}
              value={distKind}
              onChange={(e) => setDistKind(e.target.value as "income" | "capital_return")}
            >
              <option value="income">Income</option>
              <option value="capital_return">Capital return</option>
            </select>
          </div>
          <input
            className={input}
            placeholder="Note (optional)"
            value={distNote}
            onChange={(e) => setDistNote(e.target.value)}
          />
          <button
            type="submit"
            disabled={distribution.isPending}
            className={btnGold}
            style={{ background: "var(--gradient-gold)" }}
          >
            {distribution.isPending ? "Paying…" : "Pay distribution"}
          </button>
        </form>
      </Panel>

      <Panel>
        <PanelHead title="Exposure by sector" />
        <div className="p-5">
          <Bars data={sectors.map((s) => ({ label: s.label, value: s.value }))} />
          {sectors.length === 0 && <p className="text-sm text-muted-foreground">No active exposure.</p>}
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Recent activity" />
        <ul className="divide-y divide-white/10 text-sm">
          {(book?.valuations ?? []).slice(0, 6).map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="text-muted-foreground">
                Valuation · {names.get(v.product_id) ?? "Project"} ·{" "}
                {book?.investorNames[v.user_id] ?? "Investor"}
              </span>
              <span className="tabular-nums">{Number(v.value).toLocaleString()}</span>
            </li>
          ))}
          {(book?.distributions ?? []).slice(0, 6).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="text-muted-foreground">
                {String(d.kind).replace(/_/g, " ")} · {names.get(d.product_id) ?? "Project"} ·{" "}
                {book?.investorNames[d.user_id] ?? "Investor"}
              </span>
              <span className="tabular-nums text-[var(--success)]">
                {Number(d.amount).toLocaleString()} {d.currency}
              </span>
            </li>
          ))}
          {(book?.valuations ?? []).length === 0 && (book?.distributions ?? []).length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">No valuations or distributions yet.</li>
          )}
        </ul>
      </Panel>
    </div>
  );
}

function RaiseTab({ onFail }: { onFail: (e: unknown) => void }) {
  const queryClient = useQueryClient();
  const fetchRaise = useServerFn(adminGetRaise);
  const saveRound = useServerFn(adminSaveRound);
  const reviewInterest = useServerFn(adminReviewInterest);
  const reviewCommitment = useServerFn(adminReviewCommitment);
  const updateRoundStatus = useServerFn(adminUpdateRoundStatus);

  const { data } = useQuery({
    queryKey: ["admin-raise"],
    queryFn: async () => (await fetchRaise({} as never)) as RaiseData,
  });
  const [form, setForm] = useState({
    id: "",
    name: "",
    productId: "",
    narrative: "",
    highlights: "",
    targetAmount: "",
    minimumTicket: "",
    currency: "USD",
    closesAt: "",
    status: "draft",
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notify, setNotify] = useState<Record<string, boolean>>({});

  const refresh = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["admin-raise"] });
  };

  const save = useMutation({
    mutationFn: () =>
      saveRound({
        data: {
          id: form.id || undefined,
          name: form.name,
          productId: form.productId || null,
          narrative: form.narrative,
          highlights: form.highlights
            .split("\n")
            .map((h) => h.trim())
            .filter(Boolean),
          targetAmount: Number(form.targetAmount),
          minimumTicket: Number(form.minimumTicket),
          currency: form.currency,
          closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
          status: form.status,
        },
      }),
    onSuccess: (r) => {
      refresh(r.message);
      setForm({ ...form, id: "" });
    },
    onError: onFail,
  });

  const roundStatus = useMutation({
    mutationFn: (vars: {
      id: string;
      status: "draft" | "open" | "closed" | "funded";
      note?: string;
      notify?: boolean;
    }) => updateRoundStatus({ data: vars }),
    onSuccess: (r) => refresh(r.message),
    onError: onFail,
  });

  const interest = useMutation({
    mutationFn: (vars: { id: string; decision: "invite" | "decline"; note?: string }) =>
      reviewInterest({ data: vars }),
    onSuccess: (r) => refresh(r.message),
    onError: onFail,
  });
  const commitment = useMutation({
    mutationFn: (vars: { id: string; decision: "accept" | "release"; note?: string }) =>
      reviewCommitment({ data: vars }),
    onSuccess: (r) => refresh(r.message),
    onError: onFail,
  });

  const roundName = new Map((data?.rounds ?? []).map((r) => [r.id, r.name]));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <PanelHead
            title="Rounds"
            sub="Change a round's status to notify every participating investor by email automatically."
          />
          <ul className="divide-y divide-white/10">
            {(data?.rounds ?? []).map((r) => (
              <li key={r.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Target {Number(r.target_amount).toLocaleString()} {r.currency} · min ticket{" "}
                      {Number(r.minimum_ticket).toLocaleString()} ·{" "}
                      <span className="capitalize">{r.status}</span>
                    </div>
                  </div>
                  <button
                    className={btn}
                    onClick={() =>
                      setForm({
                        id: r.id,
                        name: r.name,
                        productId: r.product_id ?? "",
                        narrative: r.narrative,
                        highlights: r.highlights.join("\n"),
                        targetAmount: String(Number(r.target_amount)),
                        minimumTicket: String(Number(r.minimum_ticket)),
                        currency: r.currency,
                        closesAt: r.closes_at ? String(r.closes_at).slice(0, 10) : "",
                        status: r.status,
                      })
                    }
                  >
                    Edit
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(["draft", "open", "closed", "funded"] as const).map((s) => (
                    <button
                      key={s}
                      disabled={s === r.status || roundStatus.isPending}
                      className={`${btn} capitalize disabled:opacity-40`}
                      onClick={() =>
                        roundStatus.mutate({
                          id: r.id,
                          status: s,
                          note: notes[`round-${r.id}`] || undefined,
                          notify: notify[r.id] !== false,
                        })
                      }
                    >
                      Mark {s}
                    </button>
                  ))}
                  <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={notify[r.id] !== false}
                      onChange={(e) => setNotify({ ...notify, [r.id]: e.target.checked })}
                    />
                    Send decision emails
                  </label>
                </div>
                <input
                  className={input}
                  placeholder="Desk note included in the decision email (optional)"
                  value={notes[`round-${r.id}`] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [`round-${r.id}`]: e.target.value })}
                />
              </li>
            ))}
            {(data?.rounds ?? []).length === 0 && (
              <li className="px-5 py-6 text-sm text-muted-foreground">No rounds yet.</li>
            )}
          </ul>
        </Panel>


        <Panel>
          <PanelHead
            title={form.id ? "Edit round" : "New round"}
            right={
              form.id ? (
                <button className={btn} onClick={() => setForm({ ...form, id: "" })}>
                  Cancel
                </button>
              ) : undefined
            }
          />
          <form
            className="space-y-3 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <input
              className={input}
              placeholder="Round name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <select
              className={input}
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">No linked product</option>
              {(data?.products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <textarea
              className={`${input} min-h-24`}
              placeholder="Narrative"
              value={form.narrative}
              onChange={(e) => setForm({ ...form, narrative: e.target.value })}
            />
            <textarea
              className={`${input} min-h-20`}
              placeholder="Highlights (one per line)"
              value={form.highlights}
              onChange={(e) => setForm({ ...form, highlights: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={input}
                placeholder="Target amount"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              />
              <input
                className={input}
                placeholder="Minimum ticket"
                value={form.minimumTicket}
                onChange={(e) => setForm({ ...form, minimumTicket: e.target.value })}
              />
              <input
                className={input}
                placeholder="Currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              />
              <input
                type="date"
                className={input}
                value={form.closesAt}
                onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
              />
            </div>
            <select
              className={input}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="funded">Funded</option>
            </select>
            <button
              type="submit"
              disabled={save.isPending}
              className={btnGold}
              style={{ background: "var(--gradient-gold)" }}
            >
              {save.isPending ? "Saving…" : form.id ? "Save round" : "Create round"}
            </button>
          </form>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Indications of interest" sub="Invite an investor to commit, or decline." />
        <ul className="divide-y divide-white/10">
          {(data?.interests ?? []).map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  {data?.investorNames[i.user_id] ?? "Investor"} — {roundName.get(i.round_id) ?? "Round"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Number(i.indicative_amount).toLocaleString()} {i.currency} ·{" "}
                  <span className="capitalize">{i.status}</span>
                  {i.note ? ` · ${i.note}` : ""}
                </div>
              </div>
              {i.status === "submitted" && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-40 rounded-lg border border-white/10 bg-[var(--surface)] px-2 py-1.5 text-xs outline-none"
                    placeholder="Note"
                    value={notes[i.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })}
                  />
                  <button
                    className={btn}
                    onClick={() => interest.mutate({ id: i.id, decision: "invite", note: notes[i.id] })}
                  >
                    Invite
                  </button>
                  <button
                    className={btn}
                    onClick={() => interest.mutate({ id: i.id, decision: "decline", note: notes[i.id] })}
                  >
                    Decline
                  </button>
                </div>
              )}
            </li>
          ))}
          {(data?.interests ?? []).length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">No indications of interest yet.</li>
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHead
          title="Commitments"
          sub="Accepting a funded commitment deploys the held capital; releasing returns it to the wallet."
        />
        <ul className="divide-y divide-white/10">
          {(data?.commitments ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  {data?.investorNames[c.user_id] ?? "Investor"} — {roundName.get(c.round_id) ?? "Round"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Number(c.amount).toLocaleString()} {c.currency} ·{" "}
                  <span className="capitalize">{c.status.replace(/_/g, " ")}</span>
                </div>
              </div>
              {c.status === "funded" && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-40 rounded-lg border border-white/10 bg-[var(--surface)] px-2 py-1.5 text-xs outline-none"
                    placeholder="Note"
                    value={notes[c.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                  />
                  <button
                    className={btn}
                    onClick={() => commitment.mutate({ id: c.id, decision: "accept", note: notes[c.id] })}
                  >
                    Accept
                  </button>
                  <button
                    className={btn}
                    onClick={() => commitment.mutate({ id: c.id, decision: "release", note: notes[c.id] })}
                  >
                    Release
                  </button>
                </div>
              )}
            </li>
          ))}
          {(data?.commitments ?? []).length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">No commitments yet.</li>
          )}
        </ul>
      </Panel>
    </div>
  );
}
