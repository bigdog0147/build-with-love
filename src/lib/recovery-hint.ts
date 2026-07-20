// Persist a masked email hint through the password-reset flow so it stays
// consistent across refreshes and navigation (request → email → reset page →
// expired link → resend). Only the masked form is ever stored; the raw email
// is not persisted anywhere on the client.

const KEY = "gf3:recovery-hint";

export function maskEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  const at = email.indexOf("@");
  if (at < 1 || at === email.length - 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const maskPart = (s: string) => {
    if (s.length <= 2) return s[0] + "•";
    if (s.length <= 4) return s[0] + "•••" + s[s.length - 1];
    return s[0] + "•".repeat(Math.min(6, s.length - 2)) + s[s.length - 1];
  };
  const dot = domain.lastIndexOf(".");
  const maskedDomain =
    dot > 0 ? maskPart(domain.slice(0, dot)) + domain.slice(dot) : maskPart(domain);
  return maskPart(local) + "@" + maskedDomain;
}

type Stored = { masked: string; savedAt: number };

// Keep the hint around for up to 24h — long enough that a user coming back
// from their inbox on a new tab still sees a consistent hint, short enough
// that a shared machine doesn't leak it forever.
const TTL_MS = 24 * 60 * 60 * 1000;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    // sessionStorage keeps it tab-scoped; fall back to localStorage so a
    // click from an email opens in a new tab and still sees the hint.
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveRecoveryHint(rawEmail: string): string | null {
  const s = storage();
  if (!s) return null;
  const trimmed = rawEmail.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  const masked = maskEmail(trimmed);
  const payload: Stored = { masked, savedAt: Date.now() };
  try {
    s.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  return masked;
}

export function readRecoveryHint(): string | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (!parsed?.masked || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      s.removeItem(KEY);
      return null;
    }
    return parsed.masked;
  } catch {
    return null;
  }
}

export function clearRecoveryHint(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
