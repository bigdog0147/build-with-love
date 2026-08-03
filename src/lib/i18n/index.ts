import { useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  DEFAULT_LOCALE,
  DICTIONARIES,
  LOCALE_META,
  LOCALES,
  isLocale,
  type Locale,
  type TranslationKey,
} from "./dictionaries";

export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  isLocale,
  type Locale,
  type TranslationKey,
};

export const LOCALE_STORAGE_KEY = "gf3x.locale";

/** Current locale, derived from the `?lang=` search param (SSR-safe). */
export function useLocale(): Locale {
  return useRouterState({
    select: (s) => {
      const raw = (s.location.search as { lang?: unknown } | undefined)?.lang;
      return isLocale(raw) ? raw : DEFAULT_LOCALE;
    },
  });
}

/** Translation function for the active locale, falling back to English. */
export function useT() {
  const locale = useLocale();
  return useCallback(
    (key: TranslationKey): string =>
      DICTIONARIES[locale]?.[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key,
    [locale],
  );
}

/** Switches the active locale, keeping the current route and other params. */
export function useSetLocale() {
  const navigate = useNavigate();
  return useCallback(
    (next: Locale) => {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        /* storage unavailable — locale still lives in the URL */
      }
      void navigate({
        to: ".",
        // Locale is a cross-route param, so the reducer is intentionally untyped here.
        search: ((prev: Record<string, unknown>) => ({
          ...prev,
          lang: next === DEFAULT_LOCALE ? undefined : next,
        })) as never,
        replace: true,
      });
    },
    [navigate],
  );
}
