import { describe, expect, it } from "vitest";
import {
  buildRaiseEventLink,
  isRaiseEventTargeted,
  parseRaiseEventTarget,
  raiseEventElementId,
  raiseEventExists,
  raiseEventSearch,
} from "./raise-history-links";
import type { RaiseHistoryEvent } from "./raise-history";

const event = (key: string): RaiseHistoryEvent => ({
  key,
  at: null,
  label: key,
  detail: "",
  actor: "System",
  tone: "neutral",
});

describe("raiseEventElementId", () => {
  it("builds a hash-safe id", () => {
    expect(raiseEventElementId("abc-123", "commitment_funded")).toBe(
      "raise-event-abc-123-commitment_funded",
    );
  });

  it("slugifies unsafe characters", () => {
    expect(raiseEventElementId("round #1", "desk decision!")).toBe("raise-event-round-1-desk-decision");
  });
});

describe("buildRaiseEventLink", () => {
  it("returns an absolute url with origin", () => {
    expect(buildRaiseEventLink({ origin: "https://www.gf3x.space", roundId: "r1", eventKey: "e1" })).toBe(
      "https://www.gf3x.space/capital-raising?round=r1&event=e1#raise-event-r1-e1",
    );
  });

  it("trims trailing slashes from the origin", () => {
    expect(buildRaiseEventLink({ origin: "https://x.dev/", roundId: "r1", eventKey: "e1" })).toContain(
      "https://x.dev/capital-raising",
    );
  });

  it("falls back to a relative path", () => {
    expect(buildRaiseEventLink({ roundId: "r1", eventKey: "e1" })).toBe(
      "/capital-raising?round=r1&event=e1#raise-event-r1-e1",
    );
  });

  it("encodes params", () => {
    expect(buildRaiseEventLink({ roundId: "a b", eventKey: "c&d" })).toContain("round=a+b&event=c%26d");
  });
});

describe("raiseEventSearch", () => {
  it("shapes router search params", () => {
    expect(raiseEventSearch("r1", "e1")).toEqual({ round: "r1", event: "e1" });
  });
});

describe("parseRaiseEventTarget", () => {
  it("returns the target when both params are present", () => {
    expect(parseRaiseEventTarget({ round: "r1", event: "e1" })).toEqual({
      roundId: "r1",
      eventKey: "e1",
    });
  });

  it("trims whitespace", () => {
    expect(parseRaiseEventTarget({ round: " r1 ", event: " e1 " })?.roundId).toBe("r1");
  });

  it("returns null when a param is missing or blank", () => {
    expect(parseRaiseEventTarget({ round: "r1" })).toBeNull();
    expect(parseRaiseEventTarget({ event: "e1" })).toBeNull();
    expect(parseRaiseEventTarget({ round: "", event: "" })).toBeNull();
  });
});

describe("isRaiseEventTargeted", () => {
  it("matches only the exact round and event", () => {
    const target = { roundId: "r1", eventKey: "e1" };
    expect(isRaiseEventTargeted(target, "r1", "e1")).toBe(true);
    expect(isRaiseEventTargeted(target, "r2", "e1")).toBe(false);
    expect(isRaiseEventTargeted(null, "r1", "e1")).toBe(false);
  });
});

describe("raiseEventExists", () => {
  it("detects known and unknown keys", () => {
    const events = [event("a"), event("b")];
    expect(raiseEventExists(events, "b")).toBe(true);
    expect(raiseEventExists(events, "z")).toBe(false);
  });
});
