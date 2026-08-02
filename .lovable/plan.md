## Phase 4 — Enterprise Features

### 1. Multi-currency wallets

- New `fx_rates` table (base USD, per-currency rate, source, fetched_at) plus `currency_settings` (enabled currencies, symbol, decimals, display order) managed from admin.
- Wallet USD estimates stop being static ratios: balances convert through the latest stored rate, so every wallet card, the net-worth tile and the portfolio hero recompute from live rates.
- Cross-currency transfers get a real conversion step: quoted rate, converted amount and optional spread shown before confirmation, and the resulting ledger rows record the rate used.
- Customers can open a wallet in any enabled currency from `/wallets`; admin can enable/disable currencies platform-wide.

### 2. Live exchange rates

- Server helper fetches fiat rates hourly from a free ECB-backed public API (no API key), upserts into `fx_rates`, and records success/failure.
- A scheduled job calls a public server route on an hourly cron; if a fetch fails the last good rates stay in use and the admin panel shows staleness.
- Admin → Exchange rates: current table, last refresh time, manual "Refresh now", and per-currency override for cases where the feed is missing a currency.

### 3. Multi-language support (portal + admin)

- Dictionaries expand from public-site keys to three namespaces: public, customer portal, admin console — all six existing languages (EN, FR, DE, ES, AR, ZH) with English fallback per key.
- Locale persists per user (profile column) instead of URL-only, so signed-in users keep their language across devices; the URL param still wins when present.
- Shared formatting helpers for currency, numbers and dates driven by the active locale; RTL handling verified for Arabic in dashboard and admin layouts.
- Language selector added to the portal and admin headers.

### 4. Fraud detection (rule-based scoring)

- New tables: `risk_events` (subject, kind, score, triggered rules, decision) and `risk_rules` (editable thresholds).
- Rules evaluated server-side on deposit submission, withdrawal request, login and profile/bank-detail changes: amount vs. history, velocity in a rolling window, first-time destination, country/IP mismatch, unverified-identity attempts, duplicate references.
- Each event gets a 0–100 score and a band: allow, review (queues it and holds the money movement), or block with a reason.
- Admin → Risk: review queue with rule breakdown and per-case release/reject, editable thresholds, and every decision written to the existing admin audit log.

### 5. Live chat (both surfaces)

- Public marketing pages: a lightweight third-party chat widget, loaded lazily and configurable/disable-able from Admin → Integrations.
- Customer portal: built-in secure chat — `chat_threads` and `chat_messages` tables, realtime message delivery, typing/read state, file-free text messaging tied to the signed-in user.
- Admin → Support inbox: thread list with unread counts, reply composer, assign/close, and linkage to the existing support tickets.

### 6. Email notification system

- A `notification_preferences` table per customer (deposits, withdrawals, KYC, security, announcements — each in-app and/or email).
- All existing send points route through a single dispatcher that checks preferences and suppression before sending, so a disabled category never emails.
- Security-event emails added (new-device login, password change, bank detail change) using the existing branded template pipeline.
- Customer-facing preferences screen under Settings; admin can see per-customer preference state.

### 7. API integrations

- Outbound: `webhook_endpoints` and `webhook_deliveries` tables — admins register a URL and subscribe to events (deposit approved, withdrawal decided, KYC decided, risk flagged); deliveries are HMAC-signed, retried with backoff and inspectable in the admin UI.
- Inbound: a public API key mechanism (`api_keys`, hashed) with read-only endpoints for wallets/transactions scoped to the issuing customer, rate-limited and documented on an admin reference page.
- Admin → Integrations gains real, database-backed panels replacing the current demo credential lists.

### 8. Backup & recovery

- Admin → Backups: on-demand export of the platform's core tables (customers, wallets, transactions, deposits, withdrawals, holdings, settings) to downloadable JSON/CSV bundles, plus a scheduled nightly export recorded in a `backup_runs` table with row counts and checksum.
- Restore is deliberately review-gated: an import preview shows exactly what would change and requires Super Admin confirmation; audit logged.
- README gains a documented recovery runbook (what's exported, retention, restore steps, and what remains platform-managed).

### Technical notes

- Migrations grouped by module (fx, risk, chat, notifications, webhooks, backups), each with grants and RLS: customers reach only their own rows; admin-wide access goes through permission-checked server functions using the existing `admin-guard.server.ts` helpers with audit logging.
- Money-affecting paths (conversion, risk hold/release) reuse the existing balance-hold helpers so wallet and ledger stay consistent.
- Rate fetching and webhook delivery run as server routes under `/api/public/*` with signature/key verification; cron uses the anon-key pattern.
- Unit tests for FX conversion, rule scoring, webhook signing and backup serialisation; typecheck and the existing suite stay green.

### Order of work

1. FX rates + multi-currency wallets and conversion
2. Notification preferences and dispatcher (+ security emails)
3. Fraud detection rules, scoring and review queue
4. Portal + admin translations and locale formatting
5. Live chat (portal chat + admin inbox, public widget)
6. API integrations (webhooks out, keys in)
7. Backup & recovery exports and runbook
