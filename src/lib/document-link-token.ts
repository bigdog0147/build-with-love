/**
 * Signed, time-limited document access tokens.
 *
 * A document-published email links straight to the file, so the link itself has
 * to carry the entitlement: who it was issued to, for which document, and until
 * when — signed with a server-only secret so it cannot be forged or edited. The
 * token proves *who the link was minted for*; the endpoint that redeems it still
 * re-checks entitlement in the database, so revoked access stops working
 * immediately even while the token is inside its window.
 *
 * Pure and isomorphic (Web Crypto only) so it can be unit-tested directly; the
 * secret is only ever supplied by server code.
 */

/** Bump when the payload shape changes — old tokens then stop verifying. */
export const DOCUMENT_TOKEN_VERSION = 1;

/** How long an emailed document link stays usable. */
export const DOCUMENT_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export type DocumentTokenPayload = {
  /** Token version. */
  v: number;
  /** Document id. */
  d: string;
  /** User the link was issued to. */
  u: string;
  /** Expiry, seconds since epoch. */
  e: number;
};

export type VerifyFailure =
  | "malformed"
  | "bad_signature"
  | "expired"
  | "wrong_version"
  | "no_secret";

export type VerifyResult =
  | { ok: true; payload: DocumentTokenPayload }
  | { ok: false; reason: VerifyFailure };

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

/** Constant-time string compare so signature checks leak no timing information. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mints `<payload>.<signature>` for one investor and one document. */
export async function signDocumentToken(args: {
  documentId: string;
  userId: string;
  secret: string;
  ttlSeconds?: number;
  now?: Date;
}): Promise<string> {
  if (!args.secret) throw new Error("Document link secret is not configured.");
  const issued = args.now ?? new Date();
  const payload: DocumentTokenPayload = {
    v: DOCUMENT_TOKEN_VERSION,
    d: args.documentId,
    u: args.userId,
    e:
      Math.floor(issued.getTime() / 1000) +
      Math.max(60, args.ttlSeconds ?? DOCUMENT_TOKEN_TTL_SECONDS),
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(args.secret, body)}`;
}

/** Verifies signature, version and expiry. Never throws. */
export async function verifyDocumentToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): Promise<VerifyResult> {
  if (!secret) return { ok: false, reason: "no_secret" };
  const parts = String(token ?? "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [body, signature] = parts as [string, string];

  const expected = await hmac(secret, body);
  if (!safeEqual(signature, expected)) return { ok: false, reason: "bad_signature" };

  const decoded = fromBase64Url(body);
  if (!decoded) return { ok: false, reason: "malformed" };

  let payload: DocumentTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(decoded)) as DocumentTokenPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload?.d !== "string" || typeof payload?.u !== "string" || !payload.d || !payload.u) {
    return { ok: false, reason: "malformed" };
  }
  if (payload.v !== DOCUMENT_TOKEN_VERSION) return { ok: false, reason: "wrong_version" };
  if (typeof payload.e !== "number" || payload.e * 1000 <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}

/** Human-readable explanation shown on the redemption page. */
export const VERIFY_MESSAGES: Record<VerifyFailure, string> = {
  malformed: "This download link is not valid. Open the document from your library instead.",
  bad_signature: "This download link has been altered and cannot be trusted.",
  expired: "This download link has expired. Sign in to your library to download the document.",
  wrong_version: "This download link is no longer supported. Please use your document library.",
  no_secret: "Secure document links are not configured on this environment.",
};
