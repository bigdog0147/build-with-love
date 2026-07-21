// Guardrail: the resend success surfaces on the forgot-password form
// (src/routes/auth.tsx) and the reset page (src/routes/reset-password.tsx)
// MUST NOT let a caller distinguish "account exists" from "account missing".
// We assert this at the source level so a future edit can't quietly regress
// the neutral disclosure or leak an account-specific signal.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const authSrc = readFileSync(resolve(__dirname, "../routes/auth.tsx"), "utf8");
const resetSrc = readFileSync(
  resolve(__dirname, "../routes/reset-password.tsx"),
  "utf8",
);

const norm = (s: string) => s.replace(/\s+/g, " ").toLowerCase().trim();

// The shared neutral sentence must appear verbatim on BOTH surfaces.
// Anything that differs between the two panels risks becoming an oracle.
const NEUTRAL_SENTENCE =
  "for your privacy, we show the same confirmation whether or not an account exists.";

describe("resend success panels are enumeration-safe", () => {
  it("both surfaces contain the identical neutral disclosure sentence", () => {
    expect(norm(authSrc)).toContain(NEUTRAL_SENTENCE);
    expect(norm(resetSrc)).toContain(NEUTRAL_SENTENCE);
  });

  it("both surfaces open the same way ('if an account matches that address')", () => {
    const opener = "if an account matches that address";
    expect(norm(authSrc)).toContain(opener);
    expect(norm(resetSrc)).toContain(opener);
  });

  it("neither surface uses copy that only makes sense when the account exists", () => {
    const accountExistsSignals = [
      /\baccount (found|exists|located|verified)\b/i,
      /\bwe (found|located|matched) (your|an) account\b/i,
      /\bsuccessfully sent to\b/i, // implies delivery -> account exists
      /\bemail (has been )?delivered\b/i,
      /\bwelcome back\b/i,
    ];
    for (const re of accountExistsSignals) {
      expect(authSrc, `auth.tsx must not contain ${re}`).not.toMatch(re);
      expect(resetSrc, `reset-password.tsx must not contain ${re}`).not.toMatch(re);
    }
  });

  it("neither surface uses copy that only makes sense when the account is missing", () => {
    const accountMissingSignals = [
      /\bno (account|user) (found|exists|matches|with that)\b/i,
      /\baccount (not found|does not exist|doesn't exist)\b/i,
      /\bemail (is )?not (registered|recognized|found)\b/i,
      /\bunknown (email|account|user)\b/i,
      /\bsign ?up instead\b/i,
      /\bcreate an account instead\b/i,
    ];
    for (const re of accountMissingSignals) {
      expect(authSrc, `auth.tsx must not contain ${re}`).not.toMatch(re);
      expect(resetSrc, `reset-password.tsx must not contain ${re}`).not.toMatch(re);
    }
  });

  it("neither surface renders a raw, unmasked email in the success panel", () => {
    // The success panels must reference only the masked hint (contains •),
    // never {email} or {rawEmail}. Approximate by requiring that any
    // JSX interpolation named `email` inside these files is paired with
    // a mask call (maskEmail / saveRecoveryHint / displayedMasked / masked).
    // Concretely: the string "{email}" (unmasked JSX interpolation) must
    // not appear as rendered text.
    expect(authSrc).not.toMatch(/>\s*\{email\}\s*</);
    expect(resetSrc).not.toMatch(/>\s*\{email\}\s*</);
  });

  it("the resend server function returns a constant success shape", () => {
    // Sanity-cross-check the server contract so the UI's neutrality isn't
    // undermined by an error bubbling up with account-specific text.
    const fn = readFileSync(
      resolve(__dirname, "reset-request.functions.ts"),
      "utf8",
    );
    const returns = fn.match(/return\s+\{[^}]*\}/g) ?? [];
    expect(returns).toHaveLength(1);
    expect(returns[0]).toMatch(/ok:\s*true/);
    expect(fn).not.toMatch(/throw\s+error/);
  });
});
