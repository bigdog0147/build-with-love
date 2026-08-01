import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";
import { highlightParts, searchSite } from "@/lib/site-search";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 120) : "",
  }),
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Search pages and sections across the Gigafactory 3X site: technologies, industries, infrastructure, sustainability, investors and careers.",
      },
      { property: "og:title", content: "Search — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Find technologies, industries, infrastructure and investor information.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const t = useT();
  const [term, setTerm] = useState(q);

  const hits = useMemo(() => searchSite(q, 30), [q]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow={t("search.eyebrow")}
        title={t("search.title")}
        gold={t("search.titleGold")}
        lead={t("search.lead")}
      />

      <Section>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            void navigate({ to: "/search", search: { q: term } });
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="site-search-input">
            {t("search.placeholder")}
          </label>
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="site-search-input"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full rounded-lg border border-border bg-[var(--surface)] py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--gold)]/60"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg px-6 py-3 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            {t("search.eyebrow")}
          </button>
        </form>

        <div className="mt-8">
          {q.trim().length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("search.lead")}</p>
          ) : hits.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("search.noResults")}</p>
          ) : (
            <>
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                {hits.length} {t("search.results")}
              </div>
              <ul className="mt-5 space-y-3">
                {hits.map((hit) => (
                  <li key={`${hit.path}-${hit.section ?? "page"}`}>
                    <GlassCard className="p-6 transition-colors hover:border-[var(--gold)]/50">
                      <Link to={hit.path} className="block">
                        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                          {hit.page}
                        </div>
                        <div className="mt-1.5 font-display text-lg">
                          <Highlighted text={hit.section ?? hit.page} query={q} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          <Highlighted text={hit.summary} query={q} />
                        </p>
                        <div className="mt-3 text-xs text-[var(--gold)]">
                          gf3x.space{hit.path}
                        </div>
                      </Link>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, i) =>
        part.hit ? (
          <mark key={i} className="bg-transparent text-[var(--gold)]">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
