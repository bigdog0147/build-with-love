import { describe, expect, it } from "vitest";
import {
  indexOverrides,
  raisePrefSummary,
  resolveRaisePrefs,
} from "./raise-round-preferences";

describe("resolveRaisePrefs", () => {
  it("defaults to both channels on with no prefs", () => {
    expect(resolveRaisePrefs(null, null)).toEqual({ email: true, inapp: true, overridden: false });
  });

  it("honours global opt-out", () => {
    expect(resolveRaisePrefs({ raise_email: false, raise_inapp: true }, null)).toMatchObject({
      email: false,
      inapp: true,
    });
  });

  it("lets a round override mute a channel", () => {
    expect(resolveRaisePrefs({}, { email_enabled: false, inapp_enabled: true })).toEqual({
      email: false,
      inapp: true,
      overridden: true,
    });
  });

  it("cannot re-enable a globally disabled channel", () => {
    expect(resolveRaisePrefs({ raise_email: false }, { email_enabled: true, inapp_enabled: true })).toMatchObject({
      email: false,
      inapp: true,
    });
  });

  it("mutes everything when both override flags are off", () => {
    expect(resolveRaisePrefs({}, { email_enabled: false, inapp_enabled: false })).toMatchObject({
      email: false,
      inapp: false,
    });
  });
});

describe("indexOverrides", () => {
  it("keys rows by round id and tolerates empties", () => {
    expect(indexOverrides(null)).toEqual({});
    const map = indexOverrides([{ round_id: "r1", email_enabled: false, inapp_enabled: true }]);
    expect(map["r1"]?.email_enabled).toBe(false);
  });
});

describe("raisePrefSummary", () => {
  it("describes each combination", () => {
    expect(raisePrefSummary({ email: true, inapp: true, overridden: false })).toBe("Email + in-app alerts on");
    expect(raisePrefSummary({ email: true, inapp: false, overridden: true })).toBe("Email alerts only");
    expect(raisePrefSummary({ email: false, inapp: true, overridden: true })).toBe("In-app alerts only");
    expect(raisePrefSummary({ email: false, inapp: false, overridden: true })).toBe("All alerts muted");
  });
});
