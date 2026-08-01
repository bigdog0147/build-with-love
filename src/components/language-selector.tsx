import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { LOCALES, LOCALE_META, useLocale, useSetLocale, useT } from "@/lib/i18n";

export function LanguageSelector({ align = "end" }: { align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = useT();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.language")}
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        {locale}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            className={`absolute z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-[var(--surface-elevated)] py-1 shadow-2xl ${
              align === "end" ? "right-0" : "left-0"
            }`}
          >
            {LOCALES.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground/85 hover:bg-[var(--surface)] hover:text-foreground"
                >
                  <span>{LOCALE_META[code].native}</span>
                  {code === locale && <Check className="h-3.5 w-3.5 text-[var(--gold)]" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
