# Gigafactory 3X

**Engineering Tomorrow’s Intelligent Infrastructure**

Gigafactory 3X is a premium industrial-technology company website and customer dashboard built with TanStack Start, React 19, Tailwind CSS v4, and Lovable Cloud (Supabase). It includes a public marketing site, OTP-based sign-in, an authenticated dashboard, KYC verification, social-media admin controls, and an optional external Supabase backend for document storage and data replication.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Repo structure](#repo-structure)
3. [Prerequisites](#prerequisites)
4. [Local development setup](#local-development-setup)
5. [Environment variables](#environment-variables)
6. [Database setup](#database-setup)
7. [Authentication](#authentication)
8. [Admin features](#admin-features)
9. [Building and deploying](#building-and-deploying)
10. [Security notes](#security-notes)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) (full-stack React 19) |
| Router | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 + custom CSS tokens |
| UI primitives | shadcn/ui + Radix UI |
| Backend / Auth | Lovable Cloud (Supabase) |
| Server RPC | `createServerFn` from `@tanstack/react-start` |
| Icons | Lucide React |
| Package manager | Bun |
| Test runner | Vitest |

---

## Repo structure

```
.
├── public/                         # Static assets (favicon, OG image, robots.txt)
├── src/
│   ├── assets/                     # Brand images and generated assets
│   ├── components/                 # Reusable UI components
│   │   ├── prefetch-on-approach.tsx
│   │   ├── reveal.tsx              # Scroll-triggered reveal animations
│   │   ├── section.tsx
│   │   ├── site-footer.tsx
│   │   ├── site-header.tsx
│   │   ├── social-icon.tsx
│   │   └── social-links-bar.tsx
│   ├── hooks/                      # React hooks (e.g. use-mobile)
│   ├── lib/                        # Business logic and server functions
│   │   ├── dashboard.functions.ts
│   │   ├── external-supabase.*.ts  # Secondary Supabase integration
│   │   ├── kyc-admin.functions.ts
│   │   ├── kyc.functions.ts
│   │   ├── reset-limits.ts         # Env-var parsing + tests
│   │   ├── social.functions.ts
│   │   ├── social.types.ts
│   │   └── utils.ts
│   ├── routes/                     # TanStack file-based routes
│   │   ├── __root.tsx              # Root layout, metadata, error boundaries
│   │   ├── index.tsx               # Marketing homepage
│   │   ├── auth.tsx                # OTP / magic-link sign-in
│   │   ├── register.tsx            # Registration-closed notice
│   │   ├── about.tsx
│   │   ├── technologies.tsx
│   │   ├── industries.tsx
│   │   ├── innovation.tsx
│   │   ├── investors.tsx
│   │   ├── careers.tsx
│   │   ├── contact.tsx
│   │   ├── sitemap[.]xml.ts        # Dynamic sitemap
│   │   └── _authenticated/         # Protected routes
│   │       ├── route.tsx           # Auth gate layout
│   │       ├── dashboard.tsx       # Customer dashboard
│   │       ├── verify.tsx          # KYC verification wizard
│   │       └── admin/              # Admin-only pages
│   │           ├── social.tsx
│   │           └── kyc.tsx
│   ├── router.tsx                  # Router configuration
│   ├── server.ts                   # Nitro / server entry
│   ├── start.ts                    # TanStack Start middleware
│   └── styles.css                  # Global design tokens + keyframes
├── supabase/
│   ├── config.toml                 # Supabase CLI config (auto-generated)
│   ├── external-schema.sql         # Full schema for the external backend
│   └── migrations/                 # Primary backend migrations
│       └── *.sql
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md                       # You are here
```

---

## Prerequisites

- [Bun](https://bun.sh/) installed (preferred; `npm`/`pnpm` work but lockfiles are Bun)
- Node.js 20+ (if not using Bun)
- A Lovable Cloud / Supabase project for the primary backend
- (Optional) A second Supabase project if you intend to use the external-backend features

---

## Local development setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd tanstack_start_ts
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in the values from your Lovable project settings. Do **not** commit secrets.

4. **Start the dev server**

   ```bash
   bun dev
   ```

   The app will be available at `http://localhost:8080`.

5. **Run tests**

   ```bash
   bunx vitest run
   ```

---

## Environment variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

The following variables are required:

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_PROJECT_ID` | Primary Lovable Cloud project ID | `goiavkuonwcgfxwblttt` |
| `SUPABASE_URL` | Primary Supabase API URL | `https://<project-ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Primary anon/public key | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Primary service-role key (server-only) | `sb_secret_...` |
| `VITE_SUPABASE_PROJECT_ID` | Browser-visible project ID | same as `SUPABASE_PROJECT_ID` |
| `VITE_SUPABASE_URL` | Browser-visible Supabase URL | same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-visible public key | same as `SUPABASE_PUBLISHABLE_KEY` |

Optional variables for the **external backend** (validated at runtime):

| Variable | Purpose |
|----------|---------|
| `EXT_SUPABASE_URL` | External Supabase API URL |
| `EXT_SUPABASE_PUBLISHABLE_KEY` | External anon/public key |
| `EXT_SUPABASE_SECRET_KEY` | External service-role key (server-only) |
| `EXT_SUPABASE_JWKS_URL` | External JWKS endpoint for token verification |

Optional app-tuning variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_RESET_LIMIT_COOLDOWN_SECONDS` | OTP resend cooldown in seconds | `60` |

> **Security note:** `.env` is gitignored. `SUPABASE_SERVICE_ROLE_KEY` and `EXT_SUPABASE_SECRET_KEY` are server-only and must never be exposed to the browser. Lovable stores these as encrypted secrets; if you deploy outside Lovable, inject them through your hosting provider’s secret manager.

---

## Database setup

### Primary backend (Lovable Cloud)

The primary backend is managed through Lovable Cloud. Migrations live in `supabase/migrations/` and are applied automatically by the platform. If you need to run them manually via the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### External backend (`external-schema.sql`)

`supabase/external-schema.sql` contains the full application schema intended for a **second Supabase project** (for example, a dedicated KYC/document store or a regional replica).

To set it up:

1. Open the SQL Editor in your external Supabase project.
2. Create a new query and paste the entire contents of `supabase/external-schema.sql`.
3. Run the script. It is idempotent — you can re-run it safely.
4. After the schema is created, create a private storage bucket named `kyc-documents`:
   - Go to Storage → New bucket
   - Name: `kyc-documents`
   - Public bucket: **Off**
   - Save
5. Return to the SQL editor and run the final `GRANT`/`POLICY` block at the bottom of `external-schema.sql` that configures `kyc-documents` access.
6. In your Lovable project secrets, add:
   - `EXT_SUPABASE_URL`
   - `EXT_SUPABASE_PUBLISHABLE_KEY`
   - `EXT_SUPABASE_SECRET_KEY`
   - `EXT_SUPABASE_JWKS_URL`

Once configured, the **Admin → External data** and **Admin → KYC documents** pages in the dashboard will read from and write to the external backend.

---

## Authentication

- Sign-in is **OTP-only** (magic link / email code). Registration is disabled for customers; new accounts must be created by an administrator or through an invite flow.
- Google OAuth is configured by default through Lovable Cloud.
- Protected routes live under `src/routes/_authenticated/`. The `route.tsx` layout checks the Supabase session and redirects unauthenticated users to `/auth`.

---

## Admin features

Admin access is controlled by the `public.user_roles` table and the `public.has_role()` security-definer function. To make a user an admin:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<user-uuid>', 'admin');
```

Admin-only pages:

| Route | Purpose |
|-------|---------|
| `/admin/social` | Manage social-media links shown in the footer |
| `/admin/external` | Browse the external Supabase backend tables |
| `/admin/kyc` | Upload, preview, and manage KYC documents stored in the external backend |

---

## Building and deploying

### Local production build

```bash
bun run build
bun run preview
```

### Deploy through Lovable

The project is designed to deploy on Lovable’s managed platform. Connect your GitHub repository through the Lovable editor (**Plus (+) → GitHub → Connect project**) for two-way sync.

### Custom domain

The canonical domain is configured as `https://gf3x.space` in `src/routes/__root.tsx` and `src/routes/sitemap[.]xml.ts`. Update these values if you change domains, and configure DNS to point to your hosting provider.

### Release checklist

Run through these before announcing a release:

1. `bun run build` succeeds and `bun run preview` boots cleanly.
2. Tests pass (`bunx vitest run`).
3. Environment variables validated (see [Environment variables](#environment-variables)).
4. Sitemap (`/sitemap.xml`) and `robots.txt` reflect any new routes.
5. **Structured data — Google Rich Results Test.** Open <https://search.google.com/test/rich-results>, test the live URL `https://www.gf3x.space/resources/smart-factory-guide`, and confirm the **FAQ**, **Article** and **Breadcrumbs** items are all detected with **0 errors** (warnings for optional properties are acceptable). Take a screenshot of the results panel showing the detected item types and error count, and attach it to the release notes / PR as the structured-data evidence for that release. If any item is missing or errors, fix the JSON-LD in `src/routes/resources.smart-factory-guide.tsx` and re-test before shipping.
6. **Structured data — Google Search Console.** After deployment, open <https://search.google.com/search-console> and navigate to **Enhancements** (or the **Structured data** report under *Experience*). Inspect the exact URL `https://www.gf3x.space/resources/smart-factory-guide` and confirm there are **0 structured data errors** and no invalid items for FAQ, Article, or Breadcrumbs. Take a screenshot of the report showing the URL status, valid item count, and error count, and attach it to the release notes as the Search Console evidence. If any errors appear, fix the JSON-LD in `src/routes/resources.smart-factory-guide.tsx`, re-publish, and re-validate the URL in Search Console before shipping.
7. **Internal links to the Smart Factory Guide.** Confirm every entry point still resolves and uses descriptive anchor text (never "click here" / "read more"):

   ```bash
   # every internal reference to the guide — expect all four to be present
   rg -n "resources/smart-factory-guide" src public --glob '!routeTree.gen.ts'
   ```

   Expected references:
   - `src/components/site-footer.tsx` — footer **Resources** column, anchor text “Smart Factory Guide”.
   - `src/routes/sitemap[.]xml.ts` — sitemap entry (`monthly`, priority `0.8`).
   - `public/llms.txt` — AI-crawler page directory entry with a one-line description.
   - `src/routes/resources.smart-factory-guide.tsx` — self-referencing canonical / `og:url`.

   Then open the deployed site, scroll to the footer, click the link to verify it lands on the guide with a 200 (no redirect), and **screenshot the footer link block** showing the “Smart Factory Guide” anchor. Attach that screenshot to the release notes alongside the Rich Results and Search Console screenshots. If new pages were added that discuss smart manufacturing, add a contextual in-body link to the guide from at least one of them before shipping.
8. Spot-check the admin portal (`/admin/login`) and customer portal (`/login`) sign-in flows on the deployed build.


---


## Security notes

- **Never commit `.env` or secrets.** The repository intentionally excludes them via `.gitignore`.
- **Service-role keys stay server-side.** `EXT_SUPABASE_SECRET_KEY` is only read inside `createServerFn` handlers.
- **RLS is enforced** on all user-facing tables. Migrations include `GRANT` statements and policies.
- **Roles are stored in `public.user_roles`**, never on the `profiles` table, to avoid privilege escalation.
- **Security-definer functions** (`has_role`, `set_updated_at`, etc.) have restricted EXECUTE grants.

---

## License

Proprietary — Gigafactory 3X. All rights reserved.
