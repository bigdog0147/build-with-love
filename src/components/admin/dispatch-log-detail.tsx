import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, Copy, Loader2, ShieldOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getDispatchLogEntry, type DispatchLogDetail } from "@/lib/dispatch-detail.functions";

function fmt(at: string | null) {
  if (!at) return "—";
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? at : d.toLocaleString();
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Code({ value }: { value: string }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border border-border/60 bg-background/60 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
      {value}
    </pre>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="break-all text-xs text-foreground">{value}</p>
    </div>
  );
}

function DetailBody({ d }: { d: DispatchLogDetail }) {
  const [view, setView] = useState<"preview" | "html" | "text">("preview");
  return (
    <div className="mt-4 space-y-3">
      <Section title="Dispatch">
        <div className="grid grid-cols-2 gap-3">
          <Field label="When" value={fmt(d.createdAt)} />
          <Field label="Outcome" value={`${d.status} · ${d.attempts} attempt${d.attempts === 1 ? "" : "s"}`} />
          <Field label="Notice" value={`${d.label} (${d.category})`} />
          <Field label="Template" value={d.template ?? "in-app only"} />
          <Field label="Recipient" value={d.recipientEmail ?? "not on file"} />
          <Field label="Idempotency key" value={d.idempotencyKey ?? "—"} />
          {d.resentFrom ? (
            <Field label="Queued by resend" value={fmt(d.resentAt)} />
          ) : null}
        </div>
      </Section>

      <Section
        title="Rendered template payload"
        action={
          d.rendered ? (
            <div className="flex gap-1">
              {(["preview", "html", "text"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wider transition ${
                    view === v
                      ? "border-[var(--gold)]/60 bg-[var(--gold)]/10 text-[var(--gold)]"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          ) : null
        }
      >
        {d.renderError ? (
          <p className="flex items-start gap-1.5 text-[11px] text-amber-400">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            {d.renderError}
          </p>
        ) : !d.rendered ? (
          <p className="text-[11px] text-muted-foreground">
            This notice had no email template — it was delivered in-app only.
          </p>
        ) : (
          <div className="space-y-2">
            <Field label="Subject" value={d.rendered.subject} />
            {view === "preview" ? (
              <iframe
                title="Rendered email preview"
                srcDoc={d.rendered.html}
                className="h-72 w-full rounded-lg border border-border/60 bg-white"
              />
            ) : view === "html" ? (
              <Code value={d.rendered.html} />
            ) : (
              <Code value={d.rendered.text} />
            )}
          </div>
        )}
        {d.templateDataJson ? (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Template variables
              </p>
              <CopyButton value={d.templateDataJson} label="template variables" />
            </div>
            <Code value={d.templateDataJson} />
          </div>
        ) : null}
        {d.payloadJson ? (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Stored notice snapshot
              </p>
              <CopyButton value={d.payloadJson} label="notice snapshot" />
            </div>
            <Code value={d.payloadJson} />
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            No notice snapshot was stored for this entry, so it cannot be replayed.
          </p>
        )}
      </Section>

      <Section title="Suppression &amp; preferences">
        {d.suppression.providerSuppressed ? (
          <p className="mb-2 flex items-start gap-1.5 rounded-lg border border-red-400/40 bg-red-400/10 p-2 text-[11px] text-red-300">
            <ShieldOff className="mt-0.5 h-3 w-3 shrink-0" />
            This inbox is blocked by the email platform — {d.suppression.providerSuppressionReason}.
          </p>
        ) : null}
        {d.suppression.skip ? (
          <div className="mb-2 flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded border border-amber-400/40 px-1.5 py-0.5 font-mono text-amber-400">
              skip: {d.suppression.skip.code}
            </span>
            {d.suppression.skip.event ? (
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-muted-foreground">
                event: {d.suppression.skip.event}
              </span>
            ) : null}
            {d.suppression.skip.source ? (
              <span className="rounded border border-[var(--gold)]/40 px-1.5 py-0.5 font-mono text-[var(--gold)]">
                pref: {d.suppression.skip.source}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mb-2 text-[11px] text-muted-foreground">
            No suppression or opt-out reason was recorded for this dispatch.
          </p>
        )}
        {d.suppression.preferences.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {d.suppression.preferences.map((p) => (
              <li
                key={p.key}
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                  p.enabled
                    ? "border-emerald-400/40 text-emerald-400"
                    : "border-red-400/40 text-red-300"
                }`}
              >
                {p.key}: {p.enabled ? "on" : "off"}
              </li>
            ))}
          </ul>
        ) : null}
        {d.suppression.roundMuted !== null ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Round-level email alerts are {d.suppression.roundMuted ? "muted" : "active"} for this
            recipient.
          </p>
        ) : null}
      </Section>

      <Section title="Provider response">
        {d.provider.unavailable ? (
          <p className="text-[11px] text-muted-foreground">{d.provider.unavailable}</p>
        ) : d.provider.events.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            The email platform recorded no delivery events for this inbox around this dispatch.
          </p>
        ) : (
          <ul className="space-y-2">
            {d.provider.events.map((e, i) => (
              <li key={`${e.messageId ?? "evt"}-${i}`} className="rounded-lg border border-border/60 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-foreground">
                    {e.eventType}
                    {e.status ? ` · ${e.status}` : ""}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{fmt(e.timestamp)}</span>
                </div>
                {e.messageId ? (
                  <p className="mt-0.5 break-all font-mono text-[10px] text-muted-foreground">
                    {e.messageId}
                  </p>
                ) : null}
                <details className="mt-1">
                  <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-muted-foreground">
                    Raw provider payload
                  </summary>
                  <Code value={e.rawJson} />
                </details>
              </li>
            ))}
          </ul>
        )}
        {d.attemptTrail.some((a) => a.error) ? (
          <div className="mt-2">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Failure reasons recorded per attempt
            </p>
            <ul className="space-y-1">
              {d.attemptTrail
                .filter((a) => a.error)
                .map((a) => (
                  <li key={a.attempt} className="text-[11px] text-red-300">
                    #{a.attempt}: {a.error}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </Section>
    </div>
  );
}

/** Row detail drawer for one dispatch audit entry. */
export function DispatchLogDetailSheet({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const fetchDetail = useServerFn(getDispatchLogEntry);
  const detail = useQuery({
    queryKey: ["dispatch-log-detail", id],
    queryFn: () => fetchDetail({ data: { id: id! } }),
    enabled: Boolean(id),
  });

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Dispatch entry detail</SheetTitle>
          <SheetDescription>
            The rendered template payload, suppression picture, and provider delivery events for
            this audit row.
          </SheetDescription>
        </SheetHeader>
        {detail.isPending ? (
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading entry…
          </p>
        ) : detail.error ? (
          <p className="mt-6 text-xs text-[var(--danger)]">{(detail.error as Error).message}</p>
        ) : detail.data ? (
          <DetailBody d={detail.data} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
