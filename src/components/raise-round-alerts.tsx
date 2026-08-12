/**
 * Per-round Capital raising alert toggles shown inside each round card.
 *
 * Global notification settings set the ceiling: when a channel is off globally the
 * toggle is disabled and explains where to change it.
 */
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { updateRaiseRoundPreference } from "@/lib/raise.functions";
import {
  raisePrefSummary,
  resolveRaisePrefs,
  type RaiseGlobalPrefs,
  type RaiseRoundOverride,
} from "@/lib/raise-round-preferences";

type Props = {
  roundId: string;
  roundName: string;
  global: RaiseGlobalPrefs;
  override: RaiseRoundOverride | undefined;
};

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-2 text-sm ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--gold)]"
      />
      <span>{label}</span>
    </label>
  );
}

export function RaiseRoundAlerts({ roundId, roundName, global, override }: Props) {
  const queryClient = useQueryClient();
  const save = useServerFn(updateRaiseRoundPreference);
  const [email, setEmail] = useState(override ? Boolean(override.email_enabled) : true);
  const [inapp, setInapp] = useState(override ? Boolean(override.inapp_enabled) : true);

  useEffect(() => {
    setEmail(override ? Boolean(override.email_enabled) : true);
    setInapp(override ? Boolean(override.inapp_enabled) : true);
  }, [override?.email_enabled, override?.inapp_enabled, override]);

  const mutation = useMutation({
    mutationFn: (vars: { email: boolean; inapp: boolean }) =>
      save({ data: { roundId, email: vars.email, inapp: vars.inapp } }),
    onSuccess: (r) => {
      toast.success(r.message);
      queryClient.invalidateQueries({ queryKey: ["raise-portal"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not save preferences.");
      setEmail(override ? Boolean(override.email_enabled) : true);
      setInapp(override ? Boolean(override.inapp_enabled) : true);
    },
  });

  const emailGlobalOff = global.raise_email === false;
  const inappGlobalOff = global.raise_inapp === false;
  const resolved = resolveRaisePrefs(global, { email_enabled: email, inapp_enabled: inapp });

  function update(next: { email: boolean; inapp: boolean }) {
    setEmail(next.email);
    setInapp(next.inapp);
    mutation.mutate(next);
  }

  return (
    <div className="mt-4 rounded-xl border border-border/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-[var(--gold)]" />
          <span className="font-display text-lg">Alerts for this round</span>
        </div>
        <span
          aria-live="polite"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          {mutation.isPending ? "Saving…" : raisePrefSummary(resolved)}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Choose how you hear about stage changes in {roundName}. Other rounds are unaffected.
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        These toggles sit under your Capital raising category ceiling: if that category is off, nothing is
        sent here. Muting this round only silences {roundName}, and per-event switches in{" "}
        <Link to="/settings" className="text-[var(--gold)] underline-offset-2 hover:underline">
          notification settings
        </Link>{" "}
        can still hold back individual timeline events across every round.
      </p>


      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Toggle
          label="Email alerts"
          checked={resolved.email}
          disabled={emailGlobalOff || mutation.isPending}
          onChange={(value) => update({ email: value, inapp })}
        />
        <Toggle
          label="In-app alerts"
          checked={resolved.inapp}
          disabled={inappGlobalOff || mutation.isPending}
          onChange={(value) => update({ email, inapp: value })}
        />
        {(email || inapp) && (
          <button
            type="button"
            onClick={() => update({ email: false, inapp: false })}
            disabled={mutation.isPending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]/60 disabled:opacity-60"
          >
            Mute this round
          </button>
        )}
      </div>

      {(emailGlobalOff || inappGlobalOff) && (
        <p className="mt-3 text-xs text-muted-foreground">
          Capital raising {emailGlobalOff && inappGlobalOff ? "alerts are" : emailGlobalOff ? "emails are" : "in-app notices are"}{" "}
          switched off for every round in your{" "}
          <Link to="/settings" className="text-[var(--gold)] underline-offset-2 hover:underline">
            notification settings
          </Link>
          .
        </p>
      )}
    </div>
  );
}
