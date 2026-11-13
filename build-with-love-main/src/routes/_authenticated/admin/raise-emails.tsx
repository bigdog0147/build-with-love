import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Code2,
  Eye,
  Mail,
  Download,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Table2,
} from "lucide-react";

import {
  RAISE_EMAIL_VARIABLE_KEYS,
  type RaiseEmailVariableKey,
  renderRaiseAdvanceEmailPreview,
  sendRaiseAdvanceEmailTest,
} from "@/lib/raise-email-preview.functions";
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
  const sendTest = useServerFn(sendRaiseAdvanceEmailTest);
  const testSend = useMutation({
    mutationFn: (e: RaiseEmailEvent) => sendTest({ data: { event: e } }),
  });

  const [event, setEvent] = useState<RaiseEmailEvent>("interest_submitted");
  const [view, setView] = useState<View>("rendered");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Partial<Record<RaiseEmailVariableKey, string>>>({});
  const [debouncedDrafts, setDebouncedDrafts] = useState<Record<string, string>>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo<RaiseEmailEvent[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...RAISE_EMAIL_EVENTS];
    return RAISE_EMAIL_EVENTS.filter(
      (e) =>
        RAISE_EMAIL_EVENT_LABEL[e].toLowerCase().includes(q) || e.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);



  // Clear preview-only edits whenever the scenario changes.
  useEffect(() => {
    setDrafts({});
  }, [event]);

  // Debounce keystrokes so typing feels instant without a render per character.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedDrafts(drafts as Record<string, string>), 250);
    return () => window.clearTimeout(id);
  }, [drafts]);

  const preview = useQuery({
    queryKey: ["raise-email-preview", event, debouncedDrafts],
    queryFn: () => renderPreview({ data: { event, overrides: debouncedDrafts } }),
    placeholderData: (prev) => prev,
    retry: false,
  });

  // Defaults for the editor fields, always rendered from untouched sample data.
  const defaults = useQuery({
    queryKey: ["raise-email-preview", event, {}],
    queryFn: () => renderPreview({ data: { event, overrides: {} } }),
    retry: false,
  });
  const baseVariables = (defaults.data?.variables ?? {}) as Record<string, unknown>;

  const downloadFile = (kind: "html" | "txt") => {
    const body = kind === "html" ? preview.data?.html : preview.data?.text;
    if (!body) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const suffix = preview.data?.overridden.length ? "-edited" : "";
    const blob = new Blob([body], {
      type: kind === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raise-advance-${event}${suffix}-${stamp}.${kind}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
      <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Test delivery</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sends a live dry-run of{" "}
            <span className="text-foreground">{RAISE_EMAIL_EVENT_LABEL[event]}</span> to your own
            admin inbox. No other recipient can be targeted.
          </p>
          <p aria-live="polite" className="mt-2 text-xs">
            {testSend.isPending ? (
              <span className="text-muted-foreground">Sending the test email…</span>
            ) : testSend.data?.ok ? (
              <span className="text-[var(--gold)]">Test email sent to {testSend.data.email}.</span>
            ) : testSend.data && !testSend.data.ok ? (
              <span className="text-[var(--danger)]">{testSend.data.reason}</span>
            ) : testSend.error ? (
              <span className="text-[var(--danger)]">{(testSend.error as Error).message}</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => testSend.mutate(event)}
          disabled={testSend.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)] px-3 py-1.5 text-xs text-[var(--gold)] transition hover:bg-[var(--gold)]/10 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {testSend.isPending ? "Sending…" : "Send test to me"}
        </button>
      </section>

      <section className="mt-4 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Sample variable editor
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tweak any value and the email re-renders instantly. Edits are preview-only and reset
              when you switch events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrafts({})}
            disabled={Object.keys(drafts).length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-[var(--gold)]/60 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to sample
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {RAISE_EMAIL_VARIABLE_KEYS.map((key) => {
            const sample = baseVariables[key];
            const value = drafts[key] ?? (sample === undefined || sample === null ? "" : String(sample));
            const changed = key in drafts;
            const long = key === "nextStep" || key === "note" || key === "confirmationUrl";
            return (
              <label key={key} className={long ? "sm:col-span-2" : undefined}>
                <span className="flex items-center gap-2 font-mono text-[11px] text-[var(--gold)]">
                  {key}
                  {changed ? (
                    <span className="rounded bg-[var(--gold)]/15 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wider">
                      edited
                    </span>
                  ) : null}
                </span>
                {long ? (
                  <textarea
                    rows={2}
                    value={value}
                    onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--gold)]"
                  />
                ) : (
                  <input
                    type={key === "amount" ? "number" : "text"}
                    value={value}
                    onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--gold)]"
                  />
                )}
              </label>
            );
          })}
        </div>

        <p aria-live="polite" className="mt-3 text-[11px] text-muted-foreground">
          {preview.isFetching
            ? "Re-rendering the email…"
            : preview.data?.overridden.length
              ? `Rendering with ${preview.data.overridden.length} edited variable${
                  preview.data.overridden.length === 1 ? "" : "s"
                }: ${preview.data.overridden.join(", ")}`
              : "Rendering with the default sample data."}
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
            <span aria-hidden className="mx-1 w-px self-stretch bg-border" />
            <button
              type="button"
              onClick={() => downloadFile("html")}
              disabled={!preview.data?.html}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> HTML
            </button>
            <button
              type="button"
              onClick={() => downloadFile("txt")}
              disabled={!preview.data?.text}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Plain text
            </button>
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
