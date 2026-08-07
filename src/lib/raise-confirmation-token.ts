/**
 * Signed, time-limited tokens that carry a capital raising confirmation
 * document inside a decision-email link.
 *
 * Lovable's email API does not support file attachments, so each decision email
 * instead carries a link that renders — and downloads — the very same
 * confirmation document the portal generates. The document content travels
 * inside the signed token, so redeeming it needs no database read and no
 * session: the signature proves the desk minted this exact document for this
 * exact investor, and the expiry bounds how long the link stays usable.
 *
 * Pure and isomorphic (Web Crypto only) so it can be unit-tested directly; the
 * secret is only ever supplied by server code.
 */
import type { RaiseConfirmationInput } from "./raise-confirmation";

/** Bump when the payload shape changes — old links then stop verifying. */
export const RAISE_CONFIRMATION_TOKEN_VERSION = 1;

/** How long an emailed confirmation link stays usable. */
export const RAISE_CONFIRMATION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type RaiseConfirmationTokenPayload = {
  /** Token version. */
  v: number;
  /** User the link was issued to. */
  u: string;
  /** Expiry, seconds since epoch. */
  e: number;
  /** The confirmation document content. */
  c: RaiseConfirmationInput;
};

export type RaiseConfirmationFailure =
  | "malformed"
  | "bad_signature"
  | "expired"
  | "wrong_version"
  | "no_secret";

export type RaiseConfirmationVerifyResult =
  | { ok: true; payload: RaiseConfirmationTokenPayload }
  | { ok: false; reason: RaiseConfirmationFailure };

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

/** Constant-time compare so signature checks leak no timing information. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mints `<payload>.<signature>` for one investor and one confirmation. */
export async function signRaiseConfirmationToken(args: {
  confirmation: RaiseConfirmationInput;
  userId: string;
  secret: string;
  ttlSeconds?: number;
  now?: Date;
}): Promise<string> {
  if (!args.secret) throw new Error("Confirmation link secret is not configured.");
  const issued = args.now ?? new Date();
  const payload: RaiseConfirmationTokenPayload = {
    v: RAISE_CONFIRMATION_TOKEN_VERSION,
    u: args.userId,
    e:
      Math.floor(issued.getTime() / 1000) +
      Math.max(60, args.ttlSeconds ?? RAISE_CONFIRMATION_TTL_SECONDS),
    c: args.confirmation,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(args.secret, body)}`;
}

/** Verifies signature, version, expiry and payload shape. Never throws. */
export async function verifyRaiseConfirmationToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): Promise<RaiseConfirmationVerifyResult> {
  if (!secret) return { ok: false, reason: "no_secret" };
  const parts = String(token ?? "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [body, signature] = parts as [string, string];

  const expected = await hmac(secret, body);
  if (!safeEqual(signature, expected)) return { ok: false, reason: "bad_signature" };

  const decoded = fromBase64Url(body);
  if (!decoded) return { ok: false, reason: "malformed" };

  let payload: RaiseConfirmationTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(decoded)) as RaiseConfirmationTokenPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload?.u !== "string" || !payload.u) return { ok: false, reason: "malformed" };
  const c = payload?.c;
  if (
    !c ||
    typeof c !== "object" ||
    typeof c.kind !== "string" ||
    typeof c.roundName !== "string" ||
    typeof c.headline !== "string" ||
    typeof c.reference !== "string"
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (payload.v !== RAISE_CONFIRMATION_TOKEN_VERSION) return { ok: false, reason: "wrong_version" };
  if (typeof payload.e !== "number" || payload.e * 1000 <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}

/** Human-readable explanation shown when a link cannot be redeemed. */
export const RAISE_CONFIRMATION_MESSAGES: Record<RaiseConfirmationFailure, string> = {
  malformed: "This confirmation link is not valid. Open the round in your portal to download it.",
  bad_signature: "This confirmation link has been altered and cannot be trusted.",
  expired:
    "This confirmation link has expired. Sign in to the capital raising portal to download the document.",
  wrong_version: "This confirmation link is no longer supported. Please use your portal.",
  no_secret: "Secure confirmation links are not configured on this environment.",
};
