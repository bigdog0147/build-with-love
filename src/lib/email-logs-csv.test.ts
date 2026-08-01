import { describe, expect, it } from "vitest";
import { buildEmailLogsCsv, emailLogsCsvFilename } from "./email-logs-csv";
import type { EmailLogRow } from "./email-logs.functions";

const row = (over: Partial<EmailLogRow> = {}): EmailLogRow => ({
  timestamp: "2026-08-01T10:00:00.000Z",
  recipient: "a@example.com",
  eventType: "sent",
  status: null,
  messageId: "msg-1",
  eventId: "evt-1",
  deliveryId: "dlv-1",
  tags: [],
  rawJson: '{"event_type":"sent"}',
  ...over,
});


describe("buildEmailLogsCsv", () => {
  it("writes a header row and one line per event", () => {
    const csv = buildEmailLogsCsv([row(), row({ recipient: "b@example.com" })]);
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe(
      '"timestamp","recipient","event_type","status","message_id","event_id","delivery_id","tags","raw_json"',
    );
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain('"b@example.com"');
  });

  it("includes the webhook event id and delivery reference", () => {
    const csv = buildEmailLogsCsv([row({ eventId: "evt-9", deliveryId: "run-9" })]);
    expect(csv).toContain('"evt-9","run-9"');
  });

  it("escapes quotes, commas and newlines", () => {
    const csv = buildEmailLogsCsv([
      row({ status: 'rejected: "bad, address"\nretry' }),
    ]);
    expect(csv).toContain('"rejected: ""bad, address""\nretry"');
  });

  it("neutralises spreadsheet formula injection", () => {
    const csv = buildEmailLogsCsv([row({ recipient: "=HYPERLINK(1)" })]);
    expect(csv).toContain(`"'=HYPERLINK(1)"`);
  });

  it("renders null status and message id as empty cells", () => {
    const csv = buildEmailLogsCsv([
      row({ status: null, messageId: null, eventId: null, deliveryId: null }),
    ]);
    expect(csv.trimEnd().split("\r\n")[1]).toContain('"sent","","","","",""');
  });


  it("joins tags", () => {
    const csv = buildEmailLogsCsv([row({ tags: ["otp", "admin"] })]);
    expect(csv).toContain('"otp admin"');
  });

  it("handles an empty result set", () => {
    expect(buildEmailLogsCsv([]).trimEnd().split("\r\n")).toHaveLength(1);
  });
});

describe("emailLogsCsvFilename", () => {
  it("includes active filters and sanitises the recipient", () => {
    const name = emailLogsCsvFilename({
      recipient: "a b@example.com",
      eventType: "bounced",
      days: 30,
    });
    expect(name).toMatch(/^gf3x-email-logs_bounced_a_b_example\.com_30d_.*\.csv$/);
  });

  it("omits absent filters", () => {
    expect(emailLogsCsvFilename({ days: 7 })).toMatch(/^gf3x-email-logs_7d_.*\.csv$/);
  });
});
