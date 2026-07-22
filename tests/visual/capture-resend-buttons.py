#!/usr/bin/env python3
"""Visual regression capture for the resend cooldown UI.

Captures element-level PNG snapshots of the resend / reset-link buttons on
BOTH surfaces so a future style change (padding, gold gradient, glow shadow,
progress-fill width, disabled opacity) is caught before it ships.

Surfaces & states captured:
  auth_forgot__idle      — /auth "Send reset link" button, empty email  (disabled)
  auth_forgot__ready     — same button with a valid email typed         (enabled)
  reset_invalid__fresh   — /reset-password invalid-link resend button, no cooldown
  reset_invalid__mid     — same button, ~30s remaining (progress fill ~50%)
  reset_invalid__final   — same button, ~4s remaining (final-countdown state)

Usage:
  python3 tests/visual/capture-resend-buttons.py --mode update   # write baselines
  python3 tests/visual/capture-resend-buttons.py --mode check    # diff vs baseline

Exit code 0 = all snapshots within threshold, 1 = regression detected.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Awaitable, Callable

from PIL import Image, ImageChops
from playwright.async_api import Page, async_playwright

ROOT = Path(__file__).resolve().parent
BASELINE_DIR = ROOT / "baselines"
DIFF_DIR = Path("/tmp/browser/vr")
BASELINE_DIR.mkdir(parents=True, exist_ok=True)
DIFF_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://localhost:8080"
# Pixel-diff tolerance. Small AA/subpixel drift is acceptable; a real style
# regression (gradient direction, padding, glow color) blows well past this.
MAX_DIFF_RATIO = 0.02  # <=2% of pixels may differ


@dataclass
class Snapshot:
    name: str
    setup: Callable[[Page], Awaitable[None]]
    selector: str


async def goto_forgot_form(page: Page) -> None:
    # `networkidle` + hydration delay: TanStack Start hydrates the auth panel
    # after first paint, and clicking before hydration silently no-ops.
    await page.goto(f"{BASE_URL}/auth", wait_until="networkidle")
    await page.wait_for_timeout(1200)
    # /auth boots in sign-up mode. Flip to sign-in, then into forgot mode.
    await page.locator('button:has-text("Sign in")').last.click()
    await page.get_by_role("button", name="Forgot password?").click()
    await page.get_by_role("heading", name="Reset your password").wait_for()


async def setup_auth_forgot_idle(page: Page) -> None:
    await goto_forgot_form(page)
    # Ensure email field is empty → submit button disabled.
    await page.get_by_placeholder("you@company.com").fill("")


async def setup_auth_forgot_ready(page: Page) -> None:
    await goto_forgot_form(page)
    await page.get_by_placeholder("you@company.com").fill("jane.doe@example.com")


async def prime_reset_cooldown(page: Page, seconds_ago: int | None) -> None:
    # Seed the resend timestamp BEFORE the reset-password route mounts so its
    # cooldown effect reads the persisted value on first render.
    await page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
    if seconds_ago is None:
        await page.evaluate(
            "() => window.localStorage.removeItem('gf3:reset-resend-last')"
        )
    else:
        await page.evaluate(
            f"() => window.localStorage.setItem('gf3:reset-resend-last',"
            f" String(Date.now() - {seconds_ago * 1000}))"
        )
    # Also seed the masked hint so the badge is present in the invalid-link
    # panel and its layout is included in the snapshot.
    await page.evaluate(
        "() => window.localStorage.setItem('gf3:recovery-hint',"
        " JSON.stringify({ masked: 'j••••e@e••••e.com', savedAt: Date.now() }))"
    )
    # Navigate WITHOUT a recovery hash → the route falls into the invalid-link
    # branch and renders the resend form we want to snapshot.
    await page.goto(f"{BASE_URL}/reset-password", wait_until="networkidle")
    await page.wait_for_timeout(1200)  # hydration + auth-state settle
    # Wait for the invalid-link resend form's submit button (any label variant).
    await page.locator(
        'form:has(input[type="email"]) button[type="submit"]'
    ).first.wait_for()
    # Type a valid email so the button isn't disabled purely on validation.
    await page.get_by_placeholder("you@company.com").fill("jane.doe@example.com")


async def setup_reset_fresh(page: Page) -> None:
    await prime_reset_cooldown(page, seconds_ago=None)


async def setup_reset_mid(page: Page) -> None:
    # 30s ago → ~30s remaining, progress fill ~50%.
    await prime_reset_cooldown(page, seconds_ago=30)


async def setup_reset_final(page: Page) -> None:
    # 56s ago → ~4s remaining, final-countdown state.
    await prime_reset_cooldown(page, seconds_ago=56)


SNAPSHOTS: list[Snapshot] = [
    Snapshot("auth_forgot__idle",   setup_auth_forgot_idle,  'button[type="submit"]:has-text("Send reset link")'),
    Snapshot("auth_forgot__ready",  setup_auth_forgot_ready, 'button[type="submit"]:has-text("Send reset link")'),
    Snapshot("reset_invalid__fresh", setup_reset_fresh, 'form:has(input[type="email"]) button[type="submit"]'),
    Snapshot("reset_invalid__mid",   setup_reset_mid,   'form:has(input[type="email"]) button[type="submit"]'),
    Snapshot("reset_invalid__final", setup_reset_final, 'form:has(input[type="email"]) button[type="submit"]'),
]


def diff_ratio(a: Image.Image, b: Image.Image) -> float:
    if a.size != b.size:
        return 1.0
    diff = ImageChops.difference(a.convert("RGBA"), b.convert("RGBA"))
    bbox = diff.getbbox()
    if not bbox:
        return 0.0
    # Count pixels whose max-channel delta exceeds a small AA threshold (12/255).
    changed = 0
    total = a.size[0] * a.size[1]
    for px in diff.getdata():
        if max(px[:3]) > 12:
            changed += 1
    return changed / total


async def capture(mode: str) -> int:
    failures: list[str] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            device_scale_factor=1,
            reduced_motion="reduce",  # freeze CSS animations for stable pixels
        )
        # Halt the cooldown ticker so the button caption reads the same second
        # every time this test runs. `Date.now()` is left untouched — we're only
        # freezing the requestAnimationFrame / setInterval clock the component
        # uses to redraw. The initial computed cooldown value still reflects
        # our seeded timestamp.
        await context.add_init_script(
            "window.setInterval = () => 0; window.requestAnimationFrame = () => 0;"
        )
        page = await context.new_page()

        for snap in SNAPSHOTS:
            await snap.setup(page)
            locator = page.locator(snap.selector).first
            await locator.wait_for(state="visible")
            # Give layout one frame to settle after the setup script.
            await page.wait_for_timeout(150)
            png_bytes = await locator.screenshot()
            baseline_path = BASELINE_DIR / f"{snap.name}.png"
            actual_path = DIFF_DIR / f"{snap.name}.actual.png"
            actual_path.write_bytes(png_bytes)

            if mode == "update" or not baseline_path.exists():
                baseline_path.write_bytes(png_bytes)
                print(f"[update] wrote baseline {baseline_path.name}")
                continue

            baseline = Image.open(baseline_path)
            actual = Image.open(actual_path)
            ratio = diff_ratio(baseline, actual)
            status = "ok" if ratio <= MAX_DIFF_RATIO else "REGRESSION"
            print(f"[{status}] {snap.name}: {ratio*100:.2f}% pixels differ"
                  f" (threshold {MAX_DIFF_RATIO*100:.1f}%)")
            if ratio > MAX_DIFF_RATIO:
                # Save a highlighted diff for inspection.
                diff_img = ImageChops.difference(
                    baseline.convert("RGBA"), actual.convert("RGBA")
                )
                (DIFF_DIR / f"{snap.name}.diff.png").write_bytes(b"")
                diff_img.save(DIFF_DIR / f"{snap.name}.diff.png")
                failures.append(snap.name)

        await browser.close()

    if failures:
        print(f"\n{len(failures)} snapshot(s) regressed: {', '.join(failures)}")
        print(f"See diffs under {DIFF_DIR}/")
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["update", "check"], default="check")
    args = parser.parse_args()
    return asyncio.run(capture(args.mode))


if __name__ == "__main__":
    sys.exit(main())
