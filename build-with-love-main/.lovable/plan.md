
# Phase 5 — Investor Experience

## Current state (verified)

The `investment_products` and `investment_holdings` tables were created in Phase 3 but no application code reads or writes them — the only reference is the backup snapshot list. `/private-markets` renders four hardcoded opportunities and a single "request an allocation" button. `/portfolio` shows wallet totals plus the static `allocations` table, with no notion of subscriptions, cost basis or performance. `/documents` lists KYC identity files only. Admin → Investments is still the browser-local demo registry with hardcoded KPIs (12 programmes, $862M committed). There is no raise-round, valuation-history, document-library or investor-statement concept anywhere.

Phase 5 turns all of that into real, database-backed investor product.

## 1. Project marketplace (`/marketplace`)

- Published `investment_products` become the shelf: cover image, sector, category, summary, minimum, target yield, term, capacity and remaining capacity.
- Filter by sector/category, sort by yield/minimum/term, search by name; state lives in URL search params.
- Product detail page `/marketplace/$slug`: full description, key terms, funding progress against capacity, valuation history chart, attached documents, and the subscribe panel.
- Subscribing debits the chosen wallet at the product currency (reusing the FX conversion helper when wallet and product currency differ), runs the fraud guard, and creates a `pending` holding for admin confirmation. Verified identity required, same gate as deposits/withdrawals.
- Capacity is enforced server-side so a product cannot be oversubscribed.

## 2. Investor dashboard (`/investor`)

Dedicated investor overview, distinct from the banking dashboard:

- Headline tiles: total invested, current value, unrealised gain/loss with percentage, distributions received, weighted average yield, active positions.
- Value-over-time chart built from valuation snapshots.
- Exposure breakdowns by sector and by product, replacing the static allocation table on `/portfolio`.
- Live commitment pipeline: interests submitted, commitments awaiting funding, pending subscriptions.
- Recent activity: subscriptions, valuation updates, distributions.

## 3. Portfolio tracking

- New `holding_valuations` table (holding, as-of date, unit price, value) plus `distributions` (holding, amount, kind: income / capital return, paid date) so performance is real history rather than a single mutable number.
- `/portfolio` becomes position-level: each holding shows units, cost basis, current value, gain/loss, yield, status and a mini value sparkline, expandable to its valuation and distribution history.
- Admin can post valuations per product (fanning out to all holdings) or per holding, and record distributions that credit the investor's wallet and write a ledger transaction.

## 4. Capital raising portal (`/raise`) — two stages

- New `raise_rounds` table: name, linked product (optional), target amount, minimum ticket, currency, open/close dates, status (draft / open / closed / funded), narrative and highlights.
- New `raise_interests` table (stage 1): non-binding expression of interest with indicative amount, notes and status (submitted / invited / declined). No money movement.
- New `raise_commitments` table (stage 2): created only after an admin invites an interested investor; the investor confirms a firm amount, which is held from the wallet, and admin then accepts (debits and creates a holding) or releases the hold.
- Investor view: open rounds with progress against target, submit interest, see invitations, confirm and fund a commitment, track status.
- Admin view: round editor, interest queue with invite/decline, commitment queue with accept/release, and a funding progress panel. Every stage transition emails the investor via the existing pipeline and writes an audit entry.

## 5. Financial reports

- Admin Reports module (currently demo) generates real datasets recorded in `report_runs`: investor growth, subscriptions by product, capital deployed vs committed, distributions paid, portfolio valuation over time, raise-round conversion (interest → commitment → funded).
- Date-range picker, CSV download, and a stored run history.
- Investor-side reports on `/investor/reports`: portfolio statement, transaction statement and distribution summary for a chosen period, each with CSV export.

## 6. Downloadable documents

- New `documents` table plus a private `investor-documents` bucket: title, category (prospectus / factsheet / term sheet / report / statement / agreement), optional product or investor scoping, visibility (all investors / single investor / product subscribers), file path, size, published date.
- Admin uploader with scoping controls and a delete/unpublish action.
- `/documents` gains two sections alongside the existing KYC files: **Library** (admin-uploaded documents the investor is entitled to see, downloaded through short-lived signed URLs) and **Statements** (generated portfolio/transaction statements from section 5).
- Product detail pages surface their own attached documents.

## 7. Navigation and access

- Customer sidebar gains Investor overview, Marketplace, Capital raising and keeps Portfolio and Documents; `/private-markets` redirects to `/marketplace` so the existing URL keeps working.
- Admin navigation: Investments points at the real product/holding console, with new Valuations, Distributions, Raise rounds and Documents modules; the demo registry tabs are removed.

## Technical notes

- Migrations grouped by module (valuations + distributions, raise rounds + interests + commitments, documents), each with grants and row-level security: investors read only their own holdings, interests, commitments and entitled documents; published products and open rounds are readable by authenticated investors; all admin-wide reads/writes go through permission-checked server functions using the privileged client.
- New server-function modules: `investments.functions.ts` / `.server.ts`, `raise.functions.ts` / `.server.ts`, `investor-documents.functions.ts`, `investor-reports.functions.ts`, and admin counterparts — every admin mutation wrapped by the existing audit helper.
- Money movement (subscription, commitment hold, distribution credit) reuses the existing balance-hold and FX helpers so wallet and ledger stay consistent; the fraud guard runs on every debit path.
- Emails: new templates for subscription confirmation, raise invitation, commitment accepted/released and distribution paid, registered in the template registry so they inherit override/versioning and retry behaviour.
- Unit tests for performance math (cost basis, gain/loss, weighted yield), capacity/commitment guards, statement CSV builders and entitlement checks. Typecheck plus the existing suite must stay green.

## Order of work

1. Valuations + distributions schema, then real product/holding server layer
2. Marketplace list, detail and subscribe flow
3. Investor dashboard and position-level portfolio
4. Raise rounds: interest stage, then commitment stage, with admin queues
5. Document library, storage bucket and entitlement-scoped downloads
6. Financial reports (admin datasets + investor statements)
7. Admin console rebuild for investments, valuations, distributions, rounds, documents; navigation cleanup
