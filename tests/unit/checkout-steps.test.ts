import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT, readDraft, writeDraft, type Draft } from "@/lib/checkout/draft";
import { EMPTY_DETAILS } from "@/lib/checkout/schema";
import {
  CHECKOUT_PARAM,
  CHECKOUT_STEPS,
  STEP_LABELS,
  checkoutHref,
  furthestStep,
  parseCheckoutStep,
  resolveStep,
  stepAnnouncement,
  stepNumber,
  stepState,
} from "@/lib/checkout/steps";

// The steps of the checkout: what an address may ask for, how far an order has come, and the draft
// that is kept in the tab between them.

const DETAILS = {
  fullName: "Ada Okafor",
  email: "ada.okafor@example.org",
  organization: "City of Riverbend",
  country: "CA",
  region: "ON",
  poNumber: "",
  note: "",
};

const ENTERED: Draft = { ...EMPTY_DRAFT, details: DETAILS };
const CONFIRMED: Draft = {
  details: DETAILS,
  agreed: true,
  reference: "A365-261012-K7QX2M",
  createdAt: "2026-10-12T15:04:05.000Z",
};

describe("the address of a step", () => {
  it("names the step and nothing else", () => {
    expect(CHECKOUT_PARAM).toBe("checkout");
    expect(checkoutHref("details")).toBe("/purchase?checkout=details");
    expect(checkoutHref("review")).toBe("/purchase?checkout=review");
    expect(checkoutHref("payment")).toBe("/purchase?checkout=payment");
    expect(checkoutHref()).toBe("/purchase");
  });

  it("is read back as its step, in any case", () => {
    for (const step of CHECKOUT_STEPS) {
      expect(parseCheckoutStep(step)).toBe(step);
      expect(parseCheckoutStep(step.toUpperCase())).toBe(step);
      expect(
        parseCheckoutStep(new URL(checkoutHref(step), "http://x").searchParams.get("checkout")),
      ).toBe(step);
    }
  });

  it("takes the first of a repeated value", () => {
    expect(parseCheckoutStep(["review", "payment"])).toBe("review");
    expect(parseCheckoutStep(["junk", "review"])).toBeUndefined();
    expect(parseCheckoutStep([])).toBeUndefined();
  });

  it.each(["", "1", "pay", "details ", "../x", "ada@example.org"])(
    "opens nothing for %j",
    (value) => {
      expect(parseCheckoutStep(value)).toBeUndefined();
    },
  );

  it("opens nothing without the parameter", () => {
    expect(parseCheckoutStep(undefined)).toBeUndefined();
    expect(parseCheckoutStep(null)).toBeUndefined();
  });
});

describe("how far an order has come", () => {
  it("stands on the details until they are complete", () => {
    expect(furthestStep(EMPTY_DRAFT)).toBe("details");
    expect(furthestStep({ ...CONFIRMED, details: { ...DETAILS, email: "nope" } })).toBe("details");
    expect(furthestStep({ ...CONFIRMED, details: { ...DETAILS, region: "" } })).toBe("details");
  });

  it("stands on the review until the buyer has agreed and the order has its code", () => {
    expect(furthestStep(ENTERED)).toBe("review");
    expect(furthestStep({ ...CONFIRMED, agreed: false })).toBe("review");
    expect(furthestStep({ ...CONFIRMED, reference: null })).toBe("review");
    expect(furthestStep({ ...CONFIRMED, createdAt: null })).toBe("review");
  });

  it("reaches the payment once the review is confirmed", () => {
    expect(furthestStep(CONFIRMED)).toBe("payment");
  });
});

describe("resolveStep", () => {
  it("never shows a step the order has not reached", () => {
    expect(resolveStep("payment", EMPTY_DRAFT)).toBe("details");
    expect(resolveStep("review", EMPTY_DRAFT)).toBe("details");
    expect(resolveStep("payment", ENTERED)).toBe("review");
  });

  it("shows the step that was asked for when the order has come that far", () => {
    expect(resolveStep("details", EMPTY_DRAFT)).toBe("details");
    expect(resolveStep("review", ENTERED)).toBe("review");
    expect(resolveStep("payment", CONFIRMED)).toBe("payment");
  });

  it("always lets the visitor go back", () => {
    expect(resolveStep("details", CONFIRMED)).toBe("details");
    expect(resolveStep("review", CONFIRMED)).toBe("review");
  });
});

describe("the row of steps", () => {
  it("numbers and names them", () => {
    expect(CHECKOUT_STEPS.map(stepNumber)).toEqual([1, 2, 3]);
    expect(CHECKOUT_STEPS.map((step) => STEP_LABELS[step])).toEqual([
      "Your details",
      "Review",
      "Payment",
    ]);
  });

  it("says where each stands for the one in view", () => {
    expect(CHECKOUT_STEPS.map((step) => stepState(step, "details"))).toEqual([
      "current",
      "ahead",
      "ahead",
    ]);
    expect(CHECKOUT_STEPS.map((step) => stepState(step, "review"))).toEqual([
      "done",
      "current",
      "ahead",
    ]);
    expect(CHECKOUT_STEPS.map((step) => stepState(step, "payment"))).toEqual([
      "done",
      "done",
      "current",
    ]);
  });

  it("announces a step by its place and its name", () => {
    expect(stepAnnouncement("details")).toBe("Step 1 of 3: Your details");
    expect(stepAnnouncement("review")).toBe("Step 2 of 3: Review");
    expect(stepAnnouncement("payment")).toBe("Step 3 of 3: Payment");
  });
});

describe("the draft kept in the tab", () => {
  it("comes back as it was written", () => {
    expect(readDraft(writeDraft(CONFIRMED))).toEqual(CONFIRMED);
    expect(readDraft(writeDraft(ENTERED))).toEqual(ENTERED);
  });

  it("is empty when nothing is stored, or what is stored is not a draft", () => {
    for (const raw of [null, undefined, "", "not json", "[]", "42", '"text"', "null"]) {
      expect(readDraft(raw)).toEqual(EMPTY_DRAFT);
    }
  });

  it("keeps the fields it knows and drops everything else", () => {
    const draft = readDraft(
      JSON.stringify({
        details: { fullName: "Ada", email: 7, cardNumber: "4242", note: "x".repeat(2001) },
        agreed: "yes",
        extra: true,
      }),
    );
    expect(draft).toEqual({ ...EMPTY_DRAFT, details: { ...EMPTY_DETAILS, fullName: "Ada" } });
    expect(JSON.stringify(draft)).not.toContain("4242");
  });

  it("does not believe a code that is not one, or a code without its moment", () => {
    expect(readDraft(JSON.stringify({ ...CONFIRMED, reference: "A365-1" })).reference).toBeNull();
    expect(readDraft(JSON.stringify({ ...CONFIRMED, createdAt: "soon" }))).toMatchObject({
      reference: null,
      createdAt: null,
    });
    expect(readDraft(JSON.stringify({ ...CONFIRMED, reference: null }))).toMatchObject({
      reference: null,
      createdAt: null,
    });
  });

  it("holds nothing but the order: no key for a card or a password", () => {
    expect(Object.keys(JSON.parse(writeDraft(CONFIRMED)) as object).sort()).toEqual(
      ["agreed", "createdAt", "details", "reference"].sort(),
    );
  });
});
