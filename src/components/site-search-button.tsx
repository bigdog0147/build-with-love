import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchSite } from "@/lib/site-search";
import { useT } from "@/lib/i18n";

export function SiteSearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && /^(input|textarea|select)$/i.test(target.tagName) === true;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo(() => searchSite(query, 12), [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof hits>();
    for (const hit of hits) {
      const list = map.get(hit.page) ?? [];
      list.push(hit);
      map.set(hit.page, list);
    }
    return [...map.entries()];
  }, [hits]);

  function go(path: string) {
    setOpen(false);
    setQuery("");
    void navigate({ to: path });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.search")}
        title={t("search.openHint")}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-foreground"
      >
        <Search className="h-4 w-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("search.placeholder")}
        />
        <CommandList>
          {query.trim().length > 0 && hits.length === 0 && (
            <CommandEmpty>{t("search.noResults")}</CommandEmpty>
          )}
          {grouped.map(([page, items]) => (
            <CommandGroup key={page} heading={page}>
              {items.map((hit) => (
                <CommandItem
                  key={`${hit.path}-${hit.section ?? "page"}`}
                  value={`${hit.page} ${hit.section ?? ""} ${hit.summary}`}
                  onSelect={() => go(hit.path)}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{hit.section ?? hit.page}</div>
                    <div className="truncate text-xs text-muted-foreground">{hit.summary}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {query.trim().length > 0 && (
            <CommandGroup heading={t("search.eyebrow")}>
              <CommandItem
                value={`__all__ ${query}`}
                onSelect={() => {
                  setOpen(false);
                  void navigate({ to: "/search", search: { q: query } });
                }}
              >
                {t("search.results")} → /search
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
