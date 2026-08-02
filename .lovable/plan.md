# Phase 3 — Admin Portal (fully database-backed)

## Current state (verified)

Already real (server functions + Cloud database): Super Admin login with lockout and forced password change, admin dashboard KPIs, customer list and detail, KYC review with decision emails, finance transactions with status changes, withdrawal approvals, email templates/logs, social links, external data.

Still demo-only: investments, assets, reports/operations panels, analytics, notification broadcasts, roles & permissions, and system settings (browser-local storage only). The audit view currently shows authentication events only — admin actions are not recorded.

This phase replaces every one of those with real data.

## 1. Deposits — customer declares, admin approves

- New `deposit_requests` table: amount, currency, wallet, method (bank transfer, card, crypto), reference, proof document path, status (pending / approved / rejected / cancelled), review note, reviewer, timestamps.
- Customer page `/deposits`: submit a deposit intent with reference and optional proof upload, see history, cancel while pending. Requires verified identity, same gate as withdrawals.
- Admin page `/admin/deposits`: queue with filters, approve (credits the wallet and writes a cleared transaction) or decline with a note.
- Branded decision email on approve/decline, reusing the existing email pipeline.

## 2. Investment management

- New tables: `investment_products` (name, category, sector, minimum, target yield, term, status, description, cover image) and `investment_holdings` (customer, product, units, invested amount, current value, status).
- Admin: create/edit/retire products, publish to the customer portal, view subscriptions per product, adjust valuations.
- Customer `/private-markets` switches from static content to published products; subscribing debits the wallet and creates a holding pending admin confirmation.

## 3. Reports

- New `report_runs` table recording generated reports.
- Admin Reports module generates real datasets from the database — customer growth, KYC funnel, deposits vs withdrawals, transaction volume, investment exposure — for a chosen date range, with CSV download and a stored run history.

## 4. Analytics

- Computed live from the database instead of seeded numbers: signups over time, verification conversion, wallet balances by currency, net flows, top products, support ticket volume.
- Time-range switcher (7 / 30 / 90 days) with the existing chart components.

## 5. Notifications

- Admin broadcast composer: send a notification to all customers, or filter by verification status / membership tier, with optional email delivery.
- Broadcast history table (`notification_broadcasts`) with recipient counts.
- Per-customer notification send from the customer detail page.

## 6. Roles & permission management

- Super Admin can invite a new administrator by email (account created server-side, temporary password, forced change on first login), assign role and granular permissions, deactivate/reactivate, force a password reset, and revoke sessions.
- Permission checks enforced server-side on every admin server function, not just hidden in the UI.
- The Super Admin account cannot be demoted or deactivated by anyone else.

## 7. Audit logs

- New `admin_audit_log` table: actor, action, target type/id, before/after summary, IP, user agent, timestamp.
- Every privileged admin action (KYC decision, deposit/withdrawal review, customer edit, role change, settings change, broadcast) writes an entry.
- Admin audit view: searchable and filterable by actor, action and date, with CSV export. Records are append-only — not editable or deletable from the app.

## 8. System settings

- New `system_settings` table (single-row config): platform name, support email, maintenance mode, registration open/closed, deposit/withdrawal minimums and fees, session timeout, default currency and language.
- Settings move out of browser storage; changes take effect app-wide (maintenance mode gates the customer portal, registration flag gates signup) and are audit-logged.

## 9. Dashboard & navigation

- Dashboard KPI tiles extended with pending deposits, pending withdrawals, pending KYC and open tickets, each linking to its queue.
- Admin navigation updated: Deposits, Reports, Analytics, Notifications, Roles & Permissions, Audit Logs and Settings point at the new real modules; retired demo tabs removed so nothing dead-ends.

## Technical notes

- Migrations are grouped by module (deposits, investments, reports, broadcasts, admin audit, system settings), each with grants and row-level security: customers reach only their own rows; admin-wide reads and writes go through permission-checked server functions using the privileged server client.
- All admin logic lives in server functions with the caller's role and permission verified server-side; a shared audit helper wraps every mutation.
- Money movements (deposit approval, investment subscription) reuse the existing balance-hold helpers so wallet and ledger stay consistent.
- Unit tests for report/CSV builders and permission checks; typecheck and existing test suite must stay green.

## Order of work

1. Deposits (table, customer page, admin queue, emails)
2. Admin audit log + permission enforcement helper
3. Roles & admin user management
4. System settings persistence
5. Investment products and holdings
6. Notifications broadcast
7. Reports and analytics from real data
8. Dashboard tiles + navigation cleanup
