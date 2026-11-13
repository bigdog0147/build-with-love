/**
 * Shared authorization for scheduled-job endpoints under /api/public/*.
 *
 * These endpoints are reachable without site auth, so they are gated on a
 * server-only shared secret (CRON_SECRET). The Supabase publishable/anon key
 * must never be used here: it ships in the browser bundle and is public.
 */
function readSecret(): string {
  return process.env["CRON_SECRET"] ?? "";
}

function presentedToken(request: Request): string {
  return (
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  ).trim();
}

export function isAuthorizedCronRequest(request: Request): boolean {
  const expected = readSecret().trim();
  if (!expected) return false;
  const presented = presentedToken(request);
  if (presented.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
