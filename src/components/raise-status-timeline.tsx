import { ArrowRight, Check, CircleDot, Minus } from "lucide-react";
import type { RaiseStage, RaiseTimeline } from "@/lib/raise-timeline";

const ICON: Record<RaiseStage["state"], typeof Check> = {
  done: Check,
  current: CircleDot,
  upcoming: Minus,
  blocked: Minus,
};

function dotStyle(state: RaiseStage["state"]) {
  if (state === "done")
    return { className: "text-[var(--success)]", style: { borderColor: "var(--success)" } };
  if (state === "current")
    return {
      className: "text-[var(--gold)]",
      style: { borderColor: "var(--gold)", boxShadow: "0 0 0 4px color-mix(in oklab, var(--gold) 18%, transparent)" },
    };
  return { className: "text-muted-foreground/60", style: { borderColor: "hsl(var(--border))" } };
}

export function RaiseStatusTimeline({ timeline }: { timeline: RaiseTimeline }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-lg">Status</div>
        {timeline.ended && (
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            {timeline.ended}
          </span>
        )}
      </div>

      <ol className="mt-4 space-y-0" aria-label="Capital raising progress">
        {timeline.stages.map((stage, i) => {
          const Icon = ICON[stage.state];
          const dot = dotStyle(stage.state);
          const last = i === timeline.stages.length - 1;
          return (
            <li key={stage.key} className="grid grid-cols-[auto_1fr] gap-x-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border bg-[var(--surface)] ${dot.className}`}
                  style={dot.style}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                {!last && (
                  <span
                    className="w-px flex-1"
                    style={{
                      background:
                        stage.state === "done"
                          ? "color-mix(in oklab, var(--success) 55%, transparent)"
                          : "hsl(var(--border))",
                    }}
                  />
                )}
              </div>
              <div className={last ? "pb-0" : "pb-5"}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-sm ${
                      stage.state === "upcoming" || stage.state === "blocked"
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    {stage.label}
                  </span>
                  {stage.state === "current" && (
                    <span className="rounded-full bg-[var(--gold)]/12 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[var(--gold)]">
                      Now
                    </span>
                  )}
                  {stage.at && stage.state === "done" && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(stage.at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{stage.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        className="mt-4 flex gap-2 rounded-lg border border-[var(--gold)]/25 p-3 text-xs leading-relaxed"
        style={{ background: "color-mix(in oklab, var(--gold) 7%, transparent)" }}
        aria-live="polite"
      >
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--gold)]" aria-hidden />
        <span>
          <span className="text-foreground">Next step: </span>
          <span className="text-muted-foreground">{timeline.nextStep}</span>
        </span>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Every decision on this round is also emailed to you, with the next step spelled out.
      </p>
    </div>
  );
}
