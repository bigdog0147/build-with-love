import { useMemo, useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EmailLogRow } from "@/lib/email-logs.functions";

const EVENT_LABEL: Record<string, string> = {
  sent: "Sent",
  rejected: "Rejected",
  bounced: "Bounced",
  complained: "Complaint",
  unsubscribed: "Unsubscribed",
  suppressed: "Suppressed",
  rate_limited: "Rate limited",
};

/** Keys we surface as their own fields, so the raw block stays free of duplicates. */
const CORE_KEYS = new Set([
  "timestamp",
  "recipient",
  "event_type",
  "status",
  "message_id",
  "event_id",
  "eventId",
  "id",
  "delivery_id",
  "deliveryId",
  "run_id",
  "replay_id",
  "request_id",
  "tags",
]);


const HEADER_KEYS = ["headers", "provider_headers", "response_headers", "smtp_headers"];
const PROVIDER_KEYS = [
  "provider_response",
  "provider",
  "response",
  "provider_message",
  "reason",
  "detail",
  "details",
  "error",
  "error_message",
  "diagnostic_code",
  "smtp_response",
];
const TIME_KEYS = [
  "timestamp",
  "created_at",
  "queued_at",
  "sent_at",
  "delivered_at",
  "bounced_at",
  "complained_at",
  "updated_at",
  "occurred_at",
  "retry_after_seconds",
];

function fmt(ts: string) {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function pick(raw: Record<string, unknown>, keys: string[]) {
  return keys
    .filter((k) => raw[k] !== undefined && raw[k] !== null && raw[k] !== "")
    .map((k) => [k, raw[k]] as const);
}

function render(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value, null, 2);
}

function label(key: string) {
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy JSON"}
    </button>
  );
}

function Block({
  title,
  entries,
  empty,
}: {
  title: string;
  entries: readonly (readonly [string, unknown])[];
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <dl className="mt-3 space-y-3">
          {entries.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label(k)}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                {TIME_KEYS.includes(k) && typeof v === "string" ? fmt(v) : render(v)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export function EmailLogDetail({
  row,
  onClose,
}: {
  row: EmailLogRow | null;
  onClose: () => void;
}) {
  const raw = useMemo<Record<string, unknown>>(() => {
    if (!row) return {};
    try {
      const parsed = JSON.parse(row.rawJson) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }, [row]);

  const headers = useMemo(() => pick(raw, HEADER_KEYS), [raw]);
  const provider = useMemo(() => pick(raw, PROVIDER_KEYS), [raw]);
  const times = useMemo(() => pick(raw, TIME_KEYS), [raw]);
  const extras = useMemo(
    () =>
      Object.entries(raw).filter(
        ([k]) =>
          !CORE_KEYS.has(k) &&
          !HEADER_KEYS.includes(k) &&
          !PROVIDER_KEYS.includes(k) &&
          !TIME_KEYS.includes(k),
      ),
    [raw],
  );

  return (
    <Sheet open={Boolean(row)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border sm:max-w-xl"
      >
        {row ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-base">
                {EVENT_LABEL[row.eventType] ?? row.eventType} — {row.recipient}
              </SheetTitle>
              <SheetDescription className="text-xs">
                Full delivery record for this email event, as returned by the email
                platform.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-4 pb-8">
              <Block
                title="Event"
                empty="No event fields."
                entries={[
                  ["event_type", EVENT_LABEL[row.eventType] ?? row.eventType],
                  ["recipient", row.recipient],
                  ...(row.status ? ([["status", row.status]] as const) : []),
                  ...(row.messageId ? ([["message_id", row.messageId]] as const) : []),
                  ...(row.tags.length ? ([["tags", row.tags.join(", ")]] as const) : []),
                ]}
              />

              <Block
                title="Cross-system references"
                empty="The platform returned no event id or delivery reference for this event."
                entries={[
                  ...(row.eventId ? ([["event_id", row.eventId]] as const) : []),
                  ...(row.deliveryId
                    ? ([["delivery_id", row.deliveryId]] as const)
                    : []),
                  ...(row.messageId ? ([["message_id", row.messageId]] as const) : []),
                ]}
              />



              <Block
                title="Delivery timestamps"
                empty="No timestamps beyond the event time."
                entries={
                  times.length ? times : ([["timestamp", row.timestamp]] as const)
                }
              />

              <Block
                title="Provider response"
                empty="The platform returned no provider response for this event. Accepted sends usually carry none; rejections, bounces and complaints do."
                entries={provider}
              />

              <Block
                title="Headers"
                empty="Header metadata is not exposed for managed sends — provider-side bodies and HTTP headers are never returned by the email platform."
                entries={headers}
              />

              {extras.length ? (
                <Block title="Additional metadata" empty="" entries={extras} />
              ) : null}

              <section className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Raw record
                  </h3>
                  <CopyButton value={JSON.stringify(raw, null, 2)} />
                </div>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/40 p-3 font-mono text-[11px] text-muted-foreground">
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </section>

              <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Delivered and opened outcomes are not recorded. A “Sent” event means the
                provider accepted the message for delivery.
              </p>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
