## Phase 1 — Public Website

What already exists as public routes (verified): `/`, `/about`, `/technologies`, `/industries`, `/innovation`, `/investors`, `/careers`, `/contact`, `/resources/smart-factory-guide`, plus a shared header/footer and the matte-black + gold identity in `src/components/section.tsx` and `src/styles.css`.

What's missing: Global Infrastructure, Sustainability, News & Press, site search, and the language selector.

### 1. New pages (matte-black / gold, same PageHero + GlassCard system)

- `/infrastructure` — Global Infrastructure: giga-campus map/region grid, facility profiles (production, R&D labs, data/compute, logistics hubs), capacity and footprint metrics, scroll-reveal imagery reusing `Reveal` and `PrefetchOnApproach`.
- `/sustainability` — clean-energy strategy, decarbonisation roadmap, circular manufacturing, water/waste stewardship, ESG governance, target table with milestone years.
- `/news` — News & Press index: featured story, filterable list by category (press release, announcement, media coverage), pagination via URL search params.
- `/news/$slug` — article page with hero image, body, published date, share metadata and `NewsArticle` JSON-LD.
- `/press` redirects to `/news` (press kit block lives on the news index: brand assets, media contact).
- `/search` — full search results page.

Header nav is reorganised so it doesn't overflow: primary items (Company, Technology, Industries, Infrastructure, Sustainability, Investors, News, Careers, Contact) grouped into a compact desktop nav plus the existing mobile sheet; search icon and language selector sit next to the Investor Overview CTA.

Footer gains the new links; `sitemap.xml` and `public/llms.txt` are updated to include them.

### 2. News & Press — database + admin editor

New table `public.news_posts`: slug, title, excerpt, body (markdown), category, cover image path, author, status (draft/published), published_at, locale, timestamps.

Access rules in plain terms:
- Anyone can read published posts only.
- Admins can read every post (including drafts) and create, edit and unpublish them.
- Owner/admin reads go through an authenticated path so drafts are visible in the editor.

Public reads use a public server function with the publishable key (no auth), so `/news` renders during SSR and stays SEO-indexable. Admin CRUD lives at `/admin/news` (registered in `src/lib/admin-nav.ts` under an Editorial/Content group), reusing the existing admin kit components: list with status filters, editor form with slug auto-generation, markdown body, cover upload to a new public `news-media` bucket, preview, publish/unpublish, and delete. A small set of seed posts is inserted so the page is never empty.

### 3. Site search (public pages + sections)

A static search index built at module level from page titles, section headings and short summaries for every public route, with a lightweight scoring match (title > heading > body keywords). Two surfaces:
- Command palette (⌘K / search icon) using the existing `components/ui/command.tsx`, keyboard-navigable, grouped by page.
- `/search?q=` results page with highlighted matches, so results are linkable and crawlable.

News titles are excluded from Phase 1 search (your choice was pages + sections); the index is structured so news can be folded in later.

### 4. Multi-language selector with translated public pages

Lightweight in-house i18n (no new heavy dependency):
- `src/lib/i18n/` with a `locale` type, dictionaries per language, a `LocaleProvider` + `useT()` hook, and a `?lang=` search-param-driven locale that also persists to `localStorage` so it survives navigation.
- Locales: **English (default), French, German, Spanish, Arabic, Chinese (Simplified)** — tell me if you want a different set. Arabic sets `dir="rtl"` on the html element and mirrors the layout.
- All public page copy (hero, section headings, body, nav, footer, CTAs) moves into the dictionaries; components read strings through `useT()` instead of inline literals. Admin/dashboard/auth copy stays English in Phase 1.
- Selector: a globe dropdown in the header (and footer) listing native language names; changing it updates the URL and re-renders.
- SEO: each public route emits `hreflang` alternates and a locale-aware `og:locale`; the canonical stays the English URL.

### Technical notes

- Locale lives in root `validateSearch` so it inherits into every child route and stays SSR-correct — no hydration mismatch from reading `localStorage` during render.
- `/news` and `/news/$slug` load via `ensureQueryData` + `useSuspenseQuery` against a public (unauthenticated) server function; `$slug` throws `notFound()` for missing/unpublished posts and defines `errorComponent`/`notFoundComponent`.
- Admin news functions use `requireSupabaseAuth` plus the existing `has_role(auth.uid(),'admin')` gate; nothing admin-only is reachable from a public loader.
- Every new route defines its own `head()` with unique title, description, og:title/og:description, and og:image only where a real absolute image exists.
- No changes to existing auth, banking, KYC or email systems.
