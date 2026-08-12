import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Code2, Eye, Mail, Table2 } from "lucide-react";
import { renderRaiseAdvanceEmailPreview } from "@/lib/raise-email-preview.functions";
import {
  RAISE_EMAIL_EVENTS,
  RAISE_EMAIL_EVENT_LABEL,
  type RaiseEmailEvent,
} from "@/lib/raise-email-scenarios";

export const Route = createFileRoute("/_authenticated/admin/raise-emails")({
  component: RaiseEmailPreviewPage,
  head: () => ({
    meta: [
      { title: "Raise Timeline Email Preview — Gigafactory 3X Admin" },
      {
        name: "description",
        content:
          "Preview the raise timeline advance email for every capital raise event type with sample data and template variables.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type View = "rendered" | "text" | "variables";

function RaiseEmailPreviewPage() {
  const renderPreview = useServerFn(renderRaiseAdvanceEmailPreview);
  const [event, setEvent] = useState<RaiseEmailEvent>("interest_submitted");
  const [view, setView] = useState<View>("rendered");

  const preview = useQuery({
    queryKey: ["raise-email-preview", event],
    queryFn: () => renderPreview({ data: { event } }),
    retry: false,
  });

  const views: { key: View; label: string; icon: typeof Eye }[] = [
    { key: "rendered", label: "Rendered", icon: Eye },
    { key: "text", label: "Plain text", icon: Code2 },
    { key: "variables", label: "Variables", icon: Table2 },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        to="/admin/operations"
        search={{ tab: "notifications" }}

        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--gold)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to operations
      </Link>

      <header className="mt-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Mail className="h-5 w-5 text-[var(--gold)]" /> Raise timeline email preview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every capital raise event rendered through the live stage machine, so the stage label,
          next step and desk note match exactly what investors receive.
        </p>
      </header>

      <section className="mt-6 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Event type</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches[0]) {
                  setEvent(matches[0]);
                } else if (e.key === "Escape") {
                  setQuery("");
                }
              }}
              placeholder="Search scenarios (⌘K)"
              aria-label="Search raise timeline event types"
              className="w-56 rounded-lg border border-border bg-transparent py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-[var(--gold)]"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {matches.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEvent(e)}
              aria-pressed={event === e}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                event === e
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
              }`}
            >
              {RAISE_EMAIL_EVENT_LABEL[e]}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="mt-3 text-[11px] text-muted-foreground">
          {query
            ? `${matches.length} of ${RAISE_EMAIL_EVENTS.length} scenarios match "${query}"${
                matches.length ? " — press Enter to jump to the first match" : ""
              }`
            : `${RAISE_EMAIL_EVENTS.length} scenarios. Currently previewing ${RAISE_EMAIL_EVENT_LABEL[event]}.`}
        </p>
      </section>


      <section className="mt-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Subject line
            </p>
            <p className="mt-1 truncate text-sm">
              {preview.data?.subject ?? (preview.isPending ? "Rendering…" : "—")}
            </p>
          </div>
          <div className="flex gap-2">
            {views.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                aria-pressed={view === key}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                  view === key
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {preview.error ? (
            <p className="text-xs text-[var(--danger)]">{(preview.error as Error).message}</p>
          ) : preview.isPending ? (
            <p className="text-xs text-muted-foreground">Rendering the email…</p>
          ) : view === "rendered" ? (
            <iframe
              title={`${RAISE_EMAIL_EVENT_LABEL[event]} email preview`}
              srcDoc={preview.data?.html ?? ""}
              className="h-[620px] w-full rounded-lg border border-border bg-white"
            />
          ) : view === "text" ? (
            <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg border border-border p-4 text-xs text-muted-foreground">
              {preview.data?.text}
            </pre>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 font-medium">Variable</th>
                    <th className="px-3 py-2 font-medium">Sample value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(preview.data?.variables ?? {}).map(([k, v]) => (
                    <tr key={k} className="border-b border-border/60 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[var(--gold)]">
                        {k}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {v === "" || v === null || v === undefined ? (
                          <span className="italic opacity-60">not sent for this event</span>
                        ) : (
                          String(v)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
