import { describe, expect, it } from "vitest";
import type { RaiseConfirmationInput } from "./raise-confirmation";
import {
  RAISE_CONFIRMATION_TOKEN_VERSION,
  signRaiseConfirmationToken,
  verifyRaiseConfirmationToken,
} from "./raise-confirmation-token";

const SECRET = "confirmation-secret-value";
const now = new Date("2026-08-07T12:00:00.000Z");

const confirmation: RaiseConfirmationInput = {
  kind: "commitment-accepted",
  reference: "cmt-1",
  roundName: "Gigafactory 3X — Series C",
  currency: "USD",
  investorName: "Client",
  amount: 500000,
  decidedAt: now.toISOString(),
  actor: "Capital markets desk",
  headline: "Commitment accepted",
  detail: "Your commitment has been accepted and deployed.",
};

const args = { confirmation, userId: "user-1", secret: SECRET, now };

describe("raise confirmation tokens", () => {
  it("round-trips the confirmation payload", async () => {
    const token = await signRaiseConfirmationToken(args);
    const result = await verifyRaiseConfirmationToken(token, SECRET, now);
    expect(result).toEqual({
      ok: true,
      payload: {
        v: RAISE_CONFIRMATION_TOKEN_VERSION,
        u: "user-1",
        e: Math.floor(now.getTime() / 1000) + 30 * 24 * 60 * 60,
        c: confirmation,
      },
    });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signRaiseConfirmationToken({ ...args, secret: "other-secret" });
    expect(await verifyRaiseConfirmationToken(token, SECRET, now)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("rejects an edited payload", async () => {
    const token = await signRaiseConfirmationToken(args);
    const [body, sig] = token.split(".");
    const forged = `${body!.slice(0, -2)}AA.${sig}`;
    expect((await verifyRaiseConfirmationToken(forged, SECRET, now)).ok).toBe(false);
  });

  it("expires after its window", async () => {
    const token = await signRaiseConfirmationToken({ ...args, ttlSeconds: 3600 });
    const later = new Date(now.getTime() + 3601_000);
    expect(await verifyRaiseConfirmationToken(token, SECRET, later)).toEqual({
      ok: false,
      reason: "expired",
    });
    expect((await verifyRaiseConfirmationToken(token, SECRET, new Date(now.getTime() + 3500_000))).ok).toBe(true);
  });

  it("rejects nonsense and a missing secret", async () => {
    expect(await verifyRaiseConfirmationToken("nonsense", SECRET, now)).toEqual({
      ok: false,
      reason: "malformed",
    });
    expect(
      await verifyRaiseConfirmationToken(await signRaiseConfirmationToken(args), "", now),
    ).toEqual({ ok: false, reason: "no_secret" });
  });

  it("refuses to sign without a secret", async () => {
    await expect(signRaiseConfirmationToken({ ...args, secret: "" })).rejects.toThrow();
  });

  it("enforces a minimum lifetime", async () => {
    const token = await signRaiseConfirmationToken({ ...args, ttlSeconds: 1 });
    const result = await verifyRaiseConfirmationToken(token, SECRET, now);
    expect(result.ok && result.payload.e - Math.floor(now.getTime() / 1000)).toBe(60);
  });
});
