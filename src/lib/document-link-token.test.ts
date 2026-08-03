import { describe, expect, it } from "vitest";
import {
  DOCUMENT_TOKEN_TTL_SECONDS,
  signDocumentToken,
  verifyDocumentToken,
} from "./document-link-token";

const SECRET = "test-secret-value-0123456789";
const now = new Date("2026-08-01T00:00:00.000Z");
const args = { documentId: "doc-1", userId: "user-1", secret: SECRET, now };

describe("document link tokens", () => {
  it("round-trips the document and recipient", async () => {
    const token = await signDocumentToken(args);
    const result = await verifyDocumentToken(token, SECRET, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.d).toBe("doc-1");
      expect(result.payload.u).toBe("user-1");
    }
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signDocumentToken({ ...args, secret: "other-secret-value" });
    expect(await verifyDocumentToken(token, SECRET, now)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("rejects a tampered recipient", async () => {
    const token = await signDocumentToken(args);
    const [body, signature] = token.split(".");
    const forged = `${btoa(JSON.stringify({ v: 1, d: "doc-1", u: "attacker", e: 9e9 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")}.${signature}`;
    expect(body).toBeTruthy();
    expect((await verifyDocumentToken(forged, SECRET, now)).ok).toBe(false);
  });

  it("expires once the window has passed", async () => {
    const token = await signDocumentToken({ ...args, ttlSeconds: 3600 });
    const later = new Date(now.getTime() + 3601_000);
    expect(await verifyDocumentToken(token, SECRET, later)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("stays valid for the default window", async () => {
    const token = await signDocumentToken(args);
    const almost = new Date(now.getTime() + (DOCUMENT_TOKEN_TTL_SECONDS - 60) * 1000);
    expect((await verifyDocumentToken(token, SECRET, almost)).ok).toBe(true);
  });

  it("rejects malformed input and a missing secret", async () => {
    expect(await verifyDocumentToken("nonsense", SECRET, now)).toEqual({
      ok: false,
      reason: "malformed",
    });
    expect(await verifyDocumentToken(await signDocumentToken(args), "", now)).toEqual({
      ok: false,
      reason: "no_secret",
    });
  });
});
