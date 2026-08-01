import { describe, expect, it } from "vitest";
import {
  TEMPLATE_LIMITS,
  assertValidTemplateDraft,
  findHtmlStructureIssues,
  validateTemplateDraft,
} from "./email-template-validation";

const valid = {
  subject: "Your verification is {{status_label}}",
  html: "<div><p>Hello {{name}},</p><p>Thanks.</p></div>",
  text: "Hello {{name}}, thanks.",
};

const messages = (draft: typeof valid) =>
  validateTemplateDraft(draft).map((i) => i.message).join(" | ");

describe("validateTemplateDraft", () => {
  it("accepts a well-formed draft", () => {
    expect(validateTemplateDraft(valid)).toEqual([]);
  });

  it("rejects empty fields", () => {
    const issues = validateTemplateDraft({ subject: " ", html: "", text: "" });
    expect(issues).toHaveLength(3);
  });

  it("rejects an oversized subject", () => {
    expect(
      messages({ ...valid, subject: "a".repeat(TEMPLATE_LIMITS.subject + 1) }),
    ).toMatch(/subject line is too long/);
  });

  it("rejects an oversized HTML body", () => {
    const html = `<p>{{name}}${"x".repeat(TEMPLATE_LIMITS.html)}</p>`;
    expect(messages({ ...valid, html })).toMatch(/HTML body is too large/);
  });

  it("rejects an oversized text body", () => {
    const text = `{{name}}${"x".repeat(TEMPLATE_LIMITS.text)}`;
    expect(messages({ ...valid, text })).toMatch(/plain-text body is too large/);
  });

  it("requires the name placeholder in both bodies", () => {
    expect(messages({ ...valid, html: "<p>Hello.</p>" })).toMatch(/HTML body must include the \{\{name\}\}/);
    expect(messages({ ...valid, text: "Hello." })).toMatch(/plain-text body must include the \{\{name\}\}/);
  });

  it("rejects unknown placeholders", () => {
    expect(messages({ ...valid, subject: "Hi {{nope}}" })).toMatch(/Unknown placeholder \{\{nope\}\}/);
  });

  it("rejects unbalanced HTML", () => {
    expect(messages({ ...valid, html: "<div><p>{{name}}</div>" })).toMatch(/closed by|never closed/);
  });
});

describe("findHtmlStructureIssues", () => {
  it("allows void and self-closing elements", () => {
    expect(findHtmlStructureIssues('<p>a<br><img src="x" /></p>')).toEqual([]);
  });

  it("flags mismatched angle brackets", () => {
    expect(findHtmlStructureIssues("<p>hello</p")).toContainEqual(
      expect.stringMatching(/unclosed HTML tag/),
    );
  });

  it("flags an unclosed tag", () => {
    expect(findHtmlStructureIssues("<div><p>hi</p>")).toContainEqual(
      expect.stringMatching(/<div> is never closed/),
    );
  });

  it("flags a stray closing tag", () => {
    expect(findHtmlStructureIssues("</span>")).toContainEqual(
      expect.stringMatching(/no matching opening tag/),
    );
  });

  it("blocks scripts, iframes, handlers and javascript urls", () => {
    expect(findHtmlStructureIssues("<script>alert(1)</script>")).toContainEqual(
      expect.stringMatching(/<script> is not allowed/),
    );
    expect(findHtmlStructureIssues('<iframe src="x"></iframe>')).toContainEqual(
      expect.stringMatching(/<iframe> is not allowed/),
    );
    expect(findHtmlStructureIssues('<p onclick="x()">a</p>')).toContainEqual(
      expect.stringMatching(/event handler/),
    );
    expect(findHtmlStructureIssues('<a href="javascript:alert(1)">a</a>')).toContainEqual(
      expect.stringMatching(/javascript: URLs/),
    );
  });

  it("ignores comments", () => {
    expect(findHtmlStructureIssues("<!-- <div> --><p>a</p>")).toEqual([]);
  });
});

describe("assertValidTemplateDraft", () => {
  it("returns trimmed content when valid", () => {
    expect(assertValidTemplateDraft({ ...valid, subject: "  Hi {{name}}  " }).subject).toBe(
      "Hi {{name}}",
    );
  });

  it("throws a combined message when invalid", () => {
    expect(() => assertValidTemplateDraft({ subject: "", html: "", text: "" })).toThrow(
      /cannot be empty/,
    );
  });
});
