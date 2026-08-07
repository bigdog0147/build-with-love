import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Handshake } from "lucide-react";
import { toast } from "sonner";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import {
  cancelRaiseCommitment,
  fundRaiseCommitment,
  getRaisePortal,
  submitRaiseInterest,
  withdrawRaiseInterest,
} from "@/lib/raise.functions";
import { raiseProgress } from "@/lib/investments";
import { raiseTimeline } from "@/lib/raise-timeline";
import { RaiseStatusTimeline } from "@/components/raise-status-timeline";
import { RaiseHistoryTimeline } from "@/components/raise-history";
import { raiseHistory } from "@/lib/raise-history";
import { parseRaiseEventTarget } from "@/lib/raise-history-links";
import { RaiseRoundAlerts } from "@/components/raise-round-alerts";
import { indexOverrides } from "@/lib/raise-round-preferences";
import { ConfirmationDownloadLog } from "@/components/confirmation-download-log";
import { recordConfirmationDownload } from "@/lib/confirmation-downloads.functions";


export const Route = createFileRoute("/_authenticated/capital-raising")({
  component: CapitalRaisingPage,
  validateSearch: (search: Record<string, unknown>): { round: string; event: string } => ({
    round: typeof search['round'] === "string" ? search['round'] : "",
    event: typeof search['event'] === "string" ? search['event'] : "",
  }),
  head: () => ({
    meta: [
      { title: "Capital raising — Gigafactory 3X" },
      {
        name: "description",
        content: "Register interest in open rounds and fund accepted commitments.",
      },
    ],
  }),
});

const STATUS_TONE: Record<string, string> = {
  submitted: "text-muted-foreground",
  invited: "text-[var(--gold)]",
  declined: "text-[var(--danger,#e05a5a)]",
  withdrawn: "text-muted-foreground",
  awaiting_funding: "text-[var(--gold)]",
  funded: "text-[var(--success)]",
  accepted: "text-[var(--success)]",
  released: "text-muted-foreground",
  cancelled: "text-muted-foreground",
};

function CapitalRaisingPage() {
  const search = Route.useSearch();
  const eventTarget = parseRaiseEventTarget(search);
  const queryClient = useQueryClient();
  const fetchPortal = useServerFn(getRaisePortal);
  const submitInterest = useServerFn(submitRaiseInterest);
  const withdrawInterest = useServerFn(withdrawRaiseInterest);
  const fund = useServerFn(fundRaiseCommitment);
  const cancel = useServerFn(cancelRaiseCommitment);
  const recordDownload = useServerFn(recordConfirmationDownload);

  // The audit trail is append-only; a failed write must never block the file
  // the investor already has, so it stays silent and just refreshes the list.
  const logDownload = (entry: Parameters<typeof recordDownload>[0]["data"]) => {
    void recordDownload({ data: entry })
      .then(() => queryClient.invalidateQueries({ queryKey: ["confirmation-downloads"] }))
      .catch(() => undefined);
  };


  const { data, isLoading } = useQuery({ queryKey: ["raise-portal"], queryFn: () => fetchPortal({} as never) });
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [wallets, setWallets] = useState<Record<string, string>>({});

  function refresh(message: string) {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["raise-portal"] });
    queryClient.invalidateQueries({ queryKey: ["investor-overview"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Request failed.");

  const interestMutation = useMutation({
    mutationFn: (vars: { roundId: string; amount: number }) => submitInterest({ data: vars }),
    onSuccess: (r) => refresh(r.message),
    onError: fail,
  });
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => withdrawInterest({ data: { id } }),
    onSuccess: (r) => refresh(r.message),
    onError: fail,
  });
  const fundMutation = useMutation({
    mutationFn: (vars: { commitmentId: string; amount: number; walletId: string }) => fund({ data: vars }),
    onSuccess: (r) => refresh(r.message),
    onError: fail,
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: (r) => refresh(r.message),
    onError: fail,
  });

  const rounds = data?.rounds ?? [];
  const alertOverrides = indexOverrides(data?.roundPreferences);
  const raiseGlobal = data?.raiseGlobal ?? {};
  const verified = data?.idStatus === "verified";

  return (
    <DashShell>
      <PageHeading
        eyebrow="Capital raising"
        title="Open rounds"
        sub="Register a non-binding indication of interest. Invited investors then confirm and fund a commitment."
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading rounds…</p>}
      {!isLoading && rounds.length === 0 && (
        <div className="glass rounded-2xl border border-border p-8 text-sm text-muted-foreground">
          No rounds are open. Announcements are sent to investors when a new raise launches.
        </div>
      )}

      <div className="space-y-6">
        {rounds.map((round) => {
          const committed = data?.committed[round.id] ?? 0;
          const progress = raiseProgress(committed, Number(round.target_amount));
          const interest = (data?.interests ?? []).find((i) => i.round_id === round.id);
          const commitment = (data?.commitments ?? []).find(
            (c) => c.round_id === round.id && !["released", "cancelled"].includes(c.status),
          );
          const walletList = (data?.wallets ?? []).filter((w) => w.code === round.currency);
          const timeline = raiseTimeline({
            roundStatus: round.status,
            roundName: round.name,
            currency: round.currency,
            idStatus: data?.idStatus ?? "not_started",
            interest,
            commitment,
          });
          const history = raiseHistory({ round, interest, commitment });

          return (
            <section key={round.id} className="glass rounded-2xl border border-border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                    <Handshake className="h-3.5 w-3.5 text-[var(--gold)]" />
                    {round.status === "open" ? "Open for interest" : round.status}
                  </div>
                  <h2 className="mt-2 font-display text-2xl">{round.name}</h2>
                </div>
                {round.closes_at && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Closes {new Date(round.closes_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              {round.narrative && (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{round.narrative}</p>
              )}

              {round.highlights.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {round.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {money(committed, round.currency, 0)} committed of{" "}
                    {money(Number(round.target_amount), round.currency, 0)}
                  </span>
                  <span>Minimum ticket {money(Number(round.minimum_ticket), round.currency, 0)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, background: "var(--gradient-gold)" }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <RaiseStatusTimeline timeline={timeline} />
              </div>

              <div className="mt-4">
                <RaiseHistoryTimeline
                  events={history}
                  roundId={round.id}
                  target={eventTarget}
                  roundName={round.name}
                  currency={round.currency}
                  investorName={data?.investor?.name ?? "Investor"}
                  onDownload={logDownload}
                />
                <ConfirmationDownloadLog roundId={round.id} />
              </div>


              <RaiseRoundAlerts
                roundId={round.id}
                roundName={round.name}
                global={raiseGlobal}
                override={alertOverrides[round.id]}
              />

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-4">
                  <div className="font-display text-lg">Indication of interest</div>
                  {interest ? (
                    <div className="mt-2 space-y-2 text-sm">
                      <div>
                        {money(Number(interest.indicative_amount), interest.currency, 0)} —{" "}
                        <span className={`capitalize ${STATUS_TONE[interest.status] ?? ""}`}>
                          {interest.status}
                        </span>
                      </div>
                      {interest.review_note && (
                        <p className="text-xs text-muted-foreground">{interest.review_note}</p>
                      )}
                      {["submitted", "invited"].includes(interest.status) && (
                        <button
                          onClick={() => withdrawMutation.mutate(interest.id)}
                          disabled={withdrawMutation.isPending}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--danger,#e05a5a)]/60"
                        >
                          Withdraw interest
                        </button>
                      )}
                    </div>
                  ) : round.status !== "open" ? (
                    <p className="mt-2 text-sm text-muted-foreground">This round is not accepting interest.</p>
                  ) : (
                    <form
                      className="mt-3 flex flex-wrap gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        interestMutation.mutate({
                          roundId: round.id,
                          amount: Number(amounts[`i-${round.id}`] ?? 0),
                        });
                      }}
                    >
                      <input
                        inputMode="decimal"
                        value={amounts[`i-${round.id}`] ?? ""}
                        onChange={(e) => setAmounts((a) => ({ ...a, [`i-${round.id}`]: e.target.value }))}
                        placeholder={`Amount in ${round.currency}`}
                        className="min-w-40 flex-1 rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
                      />
                      <button
                        type="submit"
                        disabled={interestMutation.isPending}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                        style={{ background: "var(--gradient-gold)" }}
                      >
                        Register interest
                      </button>
                    </form>
                  )}
                </div>

                <div className="rounded-xl border border-border/70 p-4">
                  <div className="font-display text-lg">Commitment</div>
                  {!commitment ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Once the capital markets desk invites you to commit, the funding step appears here.
                    </p>
                  ) : commitment.status === "awaiting_funding" ? (
                    !verified ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Identity verification must be approved before you can fund a commitment.
                      </p>
                    ) : walletList.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        You need a {round.currency} wallet to fund this commitment.
                      </p>
                    ) : (
                      <form
                        className="mt-3 space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          fundMutation.mutate({
                            commitmentId: commitment.id,
                            amount: Number(amounts[`c-${round.id}`] ?? commitment.amount),
                            walletId: wallets[round.id] || walletList[0]!.id,
                          });
                        }}
                      >
                        <input
                          inputMode="decimal"
                          value={amounts[`c-${round.id}`] ?? String(Number(commitment.amount))}
                          onChange={(e) => setAmounts((a) => ({ ...a, [`c-${round.id}`]: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
                        />
                        <select
                          value={wallets[round.id] || walletList[0]!.id}
                          onChange={(e) => setWallets((w) => ({ ...w, [round.id]: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
                        >
                          {walletList.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.label} — {money(Number(w.balance), w.code)}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={fundMutation.isPending}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                            style={{ background: "var(--gradient-gold)" }}
                          >
                            {fundMutation.isPending ? "Funding…" : "Confirm & fund"}
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(commitment.id)}
                            className="rounded-xl border border-border px-4 py-2 text-sm"
                          >
                            Decline
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          The amount is held from your wallet until the desk accepts or releases the commitment.
                        </p>
                      </form>
                    )
                  ) : (
                    <div className="mt-2 space-y-1 text-sm">
                      <div>
                        {money(Number(commitment.amount), commitment.currency, 0)} —{" "}
                        <span className={`capitalize ${STATUS_TONE[commitment.status] ?? ""}`}>
                          {commitment.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {commitment.review_note && (
                        <p className="text-xs text-muted-foreground">{commitment.review_note}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </DashShell>
  );
}
