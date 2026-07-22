// Visual regression wrapper: shells out to the Python Playwright capture
// script and asserts every resend-button snapshot matches its baseline.
//
// The script is the source of truth for what's captured and how. This test
// only enforces that it exits 0 in `check` mode. It's SKIPPED automatically
// when the dev server or Python/Playwright aren't reachable so unit-only
// runs (CI without a preview server) still pass.
//
// Update baselines intentionally with:
//   python3 tests/visual/capture-resend-buttons.py --mode update
// Review the resulting PNGs under tests/visual/baselines/ before committing.

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SCRIPT = resolve(__dirname, "../../tests/visual/capture-resend-buttons.py");
const BASELINE_DIR = resolve(__dirname, "../../tests/visual/baselines");

async function serverReachable(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:8080/reset-password", {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function pythonAvailable(): boolean {
  const r = spawnSync("python3", ["-c", "import playwright"], { encoding: "utf8" });
  return r.status === 0;
}

describe("visual regression: resend cooldown buttons", () => {
  it("captured baselines exist for every state", () => {
    const required = [
      "auth_forgot__idle.png",
      "auth_forgot__ready.png",
      "reset_invalid__fresh.png",
      "reset_invalid__mid.png",
      "reset_invalid__final.png",
    ];
    for (const name of required) {
      expect(
        existsSync(resolve(BASELINE_DIR, name)),
        `missing baseline ${name} — run: python3 tests/visual/capture-resend-buttons.py --mode update`,
      ).toBe(true);
    }
  });

  it("current renders match the committed baselines", async () => {
    if (!(await serverReachable())) {
      console.warn("[visual-regression] dev server not reachable — skipping");
      return;
    }
    if (!pythonAvailable()) {
      console.warn("[visual-regression] python3 + playwright unavailable — skipping");
      return;
    }
    const result = spawnSync("python3", [SCRIPT, "--mode", "check"], {
      encoding: "utf8",
      timeout: 180_000,
    });
    // Always surface the script output so a regression is easy to read in CI.
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    expect(
      result.status,
      "one or more resend-button snapshots differ from baseline — see diff PNGs under /tmp/browser/vr/",
    ).toBe(0);
  }, 200_000);
});
