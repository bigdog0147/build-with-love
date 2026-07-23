## Server-side rate limiting for password reset resends

Add an ad-hoc, table-based limiter to `requestPasswordReset` that silently throttles abusive callers while keeping the client UX byte-identical.

### Schema (migration)

New table `public.reset_rate_limits`:
- `id uuid pk default gen_random_uuid()`
- `key_type text not null` — `'email_hash'` or `'ip'`
- `key_value text not null`
- `attempted_at timestamptz not null default now()`
- index on `(key_type, key_value, attempted_at desc)`

RLS enabled, no policies (server-only via service role). No grants to `anon`/`authenticated`.

Extend `auth_audit_log.event_type` usage with a new value `'reset_rate_limited'` (text column, no enum change needed).

### Limits (fixed sliding windows)

- Per email hash: **3 / hour**, **8 / day**
- Per IP: **10 / hour**, **30 / day**

Thresholds live as constants in `src/lib/reset-rate-limit.server.ts` for easy tuning.

### Server logic

New helper `src/lib/reset-rate-limit.server.ts`:
- `checkAndRecord({ emailHash, ip })` — uses `supabaseAdmin` to count rows in the relevant windows, then inserts one row per key. Returns `{ limited: boolean, reason?: string }`.
- Best-effort cleanup: opportunistically delete rows older than 24h on ~1% of calls (no cron needed).

Update `src/lib/reset-request.functions.ts`:
1. Compute `emailHash` (reuse `hashEmail` from `audit.server`) and read IP via `getRequestContext`.
2. Call `checkAndRecord`. If `limited`, record `auth_audit_log` with `event_type: 'reset_rate_limited'`, success=false, reason, and **skip** the Supabase `resetPasswordForEmail` call.
3. Otherwise proceed as today.
4. **Always** return `{ ok: true }` — response shape/timing unchanged.

### Client

No changes. The existing 60s cooldown, masked hint, and neutral success panel continue to render identically whether or not the limiter fired.

### Tests

- `src/lib/reset-rate-limit.server.test.ts` (new): unit-test the window math with a mocked supabaseAdmin — verifies limit boundaries, per-key isolation (email vs ip), and that `checkAndRecord` still records the attempt when limited.
- Extend `src/lib/resend-neutrality.test.ts`: assert `reset-request.functions.ts` still has exactly one `return { ok: true }` and never throws on the limiter path.
- Extend `src/lib/resend-flow.e2e.test.ts`: simulate a limiter hit and assert the UI-facing return value is identical to the unlimited path.

### Caveats to surface to the user

- Table-based limiter is project-local, not a hardened platform primitive; an attacker rotating IPs faster than the window can still get through.
- Because we never signal throttling to the client, a legitimate user who somehow trips the limit will see the neutral success panel but won't receive an email — acceptable tradeoff for enumeration safety, matching the existing design.
