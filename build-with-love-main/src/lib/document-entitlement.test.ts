import { describe, expect, it } from "vitest";
import {
  DOCUMENT_CATEGORIES,
  allowsReportChannel,
  checkDocumentEntitlement,
  isDocumentNotifiable,
  planDocumentDelivery,
} from "./document-entitlement";

const INVESTOR = { userId: "investor-1", activeProductIds: ["fund-a"] };
const OTHER = { userId: "investor-2", activeProductIds: ["fund-b"] };
const PROSPECT = { userId: "prospect", activeProductIds: [] };

describe("entitlement by visibility", () => {
  it("gives platform-wide documents to every investor holding a live position", () => {
    const doc = { visibility: "all_investors", is_published: true };
    expect(checkDocumentEntitlement(doc, INVESTOR).entitled).toBe(true);
    expect(checkDocumentEntitlement(doc, OTHER).entitled).toBe(true);
    expect(checkDocumentEntitlement(doc, PROSPECT)).toEqual({
      entitled: false,
      reason: "no_active_holding",
    });
  });

  it("gives personal documents only to their addressee", () => {
    const doc = { visibility: "single_investor", user_id: "investor-1", is_published: true };
    expect(checkDocumentEntitlement(doc, INVESTOR).entitled).toBe(true);
    expect(checkDocumentEntitlement(doc, OTHER)).toEqual({
      entitled: false,
      reason: "not_addressee",
    });
    // An addressee with no holdings still gets their own document.
    expect(
      checkDocumentEntitlement({ ...doc, user_id: "prospect" }, PROSPECT).entitled,
    ).toBe(true);
    expect(
      checkDocumentEntitlement({ visibility: "single_investor", user_id: null }, INVESTOR).entitled,
    ).toBe(false);
  });

  it("gives product collateral only to holders of that product", () => {
    const doc = { visibility: "product_subscribers", product_id: "fund-a", is_published: true };
    expect(checkDocumentEntitlement(doc, INVESTOR).entitled).toBe(true);
    expect(checkDocumentEntitlement(doc, OTHER)).toEqual({
      entitled: false,
      reason: "not_subscribed",
    });
    expect(checkDocumentEntitlement({ ...doc, product_id: null }, INVESTOR)).toEqual({
      entitled: false,
      reason: "missing_product",
    });
  });

  it("refuses unpublished documents and unknown visibility", () => {
    expect(
      checkDocumentEntitlement({ visibility: "all_investors", is_published: false }, INVESTOR),
    ).toEqual({ entitled: false, reason: "not_published" });
    expect(checkDocumentEntitlement({ visibility: "internal" }, INVESTOR)).toEqual({
      entitled: false,
      reason: "unknown_visibility",
    });
  });
});

describe("notifiable categories", () => {
  it("announces reporting categories and stays silent on agreements", () => {
    const flags = Object.fromEntries(DOCUMENT_CATEGORIES.map((c) => [c, isDocumentNotifiable(c)]));
    expect(flags).toEqual({
      prospectus: true,
      factsheet: true,
      term_sheet: true,
      report: true,
      statement: true,
      agreement: false,
    });
  });
});

describe("Reports & statements preference toggles", () => {
  it("treats a missing row or missing key as opted in", () => {
    expect(allowsReportChannel(undefined, "email")).toBe(true);
    expect(allowsReportChannel(null, "inapp")).toBe(true);
    expect(allowsReportChannel({}, "email")).toBe(true);
    expect(allowsReportChannel({ reports_email: null }, "email")).toBe(true);
  });

  it("honours each channel independently", () => {
    const prefs = { reports_email: false, reports_inapp: true };
    expect(allowsReportChannel(prefs, "email")).toBe(false);
    expect(allowsReportChannel(prefs, "inapp")).toBe(true);
  });
});

describe("delivery plan across every document type", () => {
  const cases = DOCUMENT_CATEGORIES.flatMap((category) => [
    { category, visibility: "all_investors" as const, product_id: null, user_id: null },
    { category, visibility: "product_subscribers" as const, product_id: "fund-a", user_id: null },
    { category, visibility: "single_investor" as const, product_id: null, user_id: "investor-1" },
  ]);

  it("includes the entitled investor on both channels for reporting documents", () => {
    for (const doc of cases) {
      const plan = planDocumentDelivery({
        doc: { ...doc, is_published: true },
        investor: INVESTOR,
      });
      const expected = doc.category !== "agreement";
      expect({ ...doc, inapp: plan.inapp, email: plan.email }).toEqual({
        ...doc,
        inapp: expected,
        email: expected,
      });
    }
  });

  it("excludes investors outside the audience regardless of preferences", () => {
    for (const doc of cases.filter((d) => d.visibility !== "all_investors")) {
      const plan = planDocumentDelivery({
        doc: { ...doc, is_published: true },
        investor: OTHER,
        preferences: { reports_email: true, reports_inapp: true },
      });
      expect([plan.entitled, plan.inapp, plan.email]).toEqual([false, false, false]);
    }
  });

  it("drops only the opted-out channel for an entitled investor", () => {
    const doc = { category: "report", visibility: "all_investors", is_published: true };
    expect(
      planDocumentDelivery({
        doc,
        investor: INVESTOR,
        preferences: { reports_email: false, reports_inapp: true },
      }),
    ).toMatchObject({ entitled: true, inapp: true, email: false });
    expect(
      planDocumentDelivery({
        doc,
        investor: INVESTOR,
        preferences: { reports_email: true, reports_inapp: false },
      }),
    ).toMatchObject({ entitled: true, inapp: false, email: true });
    expect(
      planDocumentDelivery({
        doc,
        investor: INVESTOR,
        preferences: { reports_email: false, reports_inapp: false },
      }),
    ).toMatchObject({ entitled: true, inapp: false, email: false });
  });

  it("never announces an agreement even with both channels on", () => {
    for (const visibility of ["all_investors", "product_subscribers", "single_investor"]) {
      const plan = planDocumentDelivery({
        doc: {
          category: "agreement",
          visibility,
          product_id: "fund-a",
          user_id: "investor-1",
          is_published: true,
        },
        investor: INVESTOR,
        preferences: { reports_email: true, reports_inapp: true },
      });
      expect([plan.entitled, plan.notifiable, plan.inapp, plan.email]).toEqual([
        true,
        false,
        false,
        false,
      ]);
    }
  });
});
