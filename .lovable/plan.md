## Phase 2 — Customer Portal

Most of Phase 2 already ships: registration, login, KYC wizard + status page, dashboard, wallets, investments, deposits, notifications, support tickets and change-password all exist. This plan closes the four real gaps and tightens the portal into one coherent customer experience.

---

### 1. Withdrawals (new)

**Database** — a `withdrawal_requests` table:
- wallet reference, amount, currency, destination type (bank / external wallet), destination label + masked details, optional note
- status: `pending`, `approved`, `rejected`, `cancelled`; reviewer, review note, reviewed timestamp
- customers can read and create their own rows, and cancel their own while still pending; admins can read all and approve/reject
- created/updated timestamps with an update trigger, plus the required table grants

**Customer flow** — new `/withdrawals` page:
- amount + wallet + destination form, validated client and server side
- **on submit the amount is held**: the wallet balance is debited immediately and a `Pending` withdrawal transaction is written, so the funds cannot be spent twice
- blocked with a clear explainer unless identity verification is `verified` (existing KYC status drives this)
- request list with status chips, timestamps, rejection reasons, and a cancel button for pending requests (cancel returns the held amount and marks the transaction reversed)

**Admin flow** — new admin module `Admin → Withdrawals`:
- queue of pending requests with customer, amount, destination and KYC status
- Approve → transaction flips to `Cleared`, notification + email to the customer
- Reject (with a required reason) → held amount returns to the wallet, transaction marked reversed, notification + email sent

### 2. Email verification (confirm before sign-in)

- Keeps the current behaviour: new accounts must click the emailed confirmation link before they can sign in.
- New public `/verify-email` page: "check your inbox" state, the address it was sent to, a **resend confirmation** button with a cooldown timer, and aria-live status announcements.
- Registration redirects there after signup instead of showing an inline message.
- Login shows a specific, actionable message when sign-in fails because the address is unconfirmed, with a direct link to resend.

### 3. Transaction history (new full ledger)

New `/transactions` page:
- filters for type, status and date range, plus free-text search on the description
- pagination (server-side, newest first)
- **CSV export of the currently filtered set**
- filters live in the URL so a filtered view can be bookmarked and shared
- dashboard's "Recent transactions" card gets a "View all" link into it

### 4. Profile & Security

- `/settings` becomes a real profile editor: first/last name, display name, phone, country, organization and interests — all fields the profile already stores but the UI never exposed.
- `/security` gains a consolidated overview: email-verification state, identity-verification state, two-factor state, password last-changed, and links to change password and to verification.
- Customer sidebar navigation gains Withdrawals, Transactions and Profile & Security entries so every Phase 2 item is reachable.

---

### Technical notes

- Withdrawal logic lives in a new `src/lib/withdrawals.functions.ts` using `createServerFn` with `requireSupabaseAuth`; admin review functions verify the admin role through the authenticated client before acting. Balance hold/release reuses the existing wallet-adjust and transaction-log helpers in `banking.functions.ts`.
- Approval/rejection emails reuse the existing branded email template system and retry helper, following the same shape as the KYC decision emails.
- The transaction ledger reuses the existing CSV builder pattern already unit-tested for email logs, with its own tests for filter/format edge cases.
- All new customer routes sit under the existing `_authenticated` layout, so they inherit the current auth gate; the verify-email page is public.
