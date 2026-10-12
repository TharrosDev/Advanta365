import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PaymentStep } from "@/components/checkout/payment-step";
import { buildOrder, orderMailto } from "@/lib/checkout/order";
import {
  PAYMENT_FAILED,
  getPaymentProvider,
  startPayment,
  type PaymentProvider,
  type PaymentStart,
} from "@/lib/checkout/provider";
import type { Order } from "@/lib/checkout/schema";

// The seam a payment provider plugs into: none is connected today, and a fake one shows what the
// checkout does with each answer a real one could give.

const ORIGIN = "https://advanta365.example";

function finishedOrder(): Order {
  const order = buildOrder({
    details: {
      fullName: "Ada Okafor",
      email: "ada.okafor@example.org",
      organization: "City of Riverbend",
      country: "CA",
      region: "ON",
      poNumber: "",
      note: "",
    },
    agreed: true,
    reference: "A365-261012-K7QX2M",
    createdAt: "2026-10-12T15:04:05.000Z",
  });
  if (!order) throw new Error("the draft is not an order");
  return order;
}

const ORDER = finishedOrder();

/** A provider that answers `start` with whatever it is given, and notes what it was handed. */
function fakeProvider(answer: PaymentStart | Error, extra: Pick<PaymentProvider, "Embedded"> = {}) {
  const start = vi.fn(async (order: Order): Promise<PaymentStart> => {
    if (answer instanceof Error) throw answer;
    // A real provider would send `order` to the site's own server here.
    void order;
    return answer;
  });
  const provider: PaymentProvider = {
    id: "fake",
    label: "Pay with the fake provider",
    start,
    ...extra,
  };
  return Object.assign(provider, { start });
}

const Element = () => createElement("div", { "data-fake-element": "" }, "card fields live here");

describe("getPaymentProvider", () => {
  it("answers null: no provider is connected yet", () => {
    expect(getPaymentProvider()).toBeNull();
  });
});

describe("startPayment", () => {
  it("hands the provider the checked order, and nothing else", async () => {
    const provider = fakeProvider({ kind: "redirect", redirectUrl: "https://pay.example/s/1" });
    await startPayment(provider, ORDER, ORIGIN);
    expect(provider.start).toHaveBeenCalledTimes(1);
    expect(provider.start).toHaveBeenCalledWith(ORDER);
  });

  it("follows a hosted payment page over https", async () => {
    const provider = fakeProvider({ kind: "redirect", redirectUrl: "https://pay.example/s/1" });
    expect(await startPayment(provider, ORDER, ORIGIN)).toEqual({
      status: "redirect",
      url: "https://pay.example/s/1",
    });
  });

  it("follows an address on the site itself, written as a path", async () => {
    const provider = fakeProvider({ kind: "redirect", redirectUrl: "/purchase/thanks" });
    expect(await startPayment(provider, ORDER, ORIGIN)).toEqual({
      status: "redirect",
      url: `${ORIGIN}/purchase/thanks`,
    });
  });

  it.each(["http://pay.example/s/1", "javascript:alert(1)", "data:text/html,x", "http://"])(
    "does not follow %s",
    async (redirectUrl) => {
      const provider = fakeProvider({ kind: "redirect", redirectUrl });
      expect(await startPayment(provider, ORDER, ORIGIN)).toEqual({
        status: "failed",
        message: PAYMENT_FAILED,
      });
    },
  );

  it("passes on the secret of an embedded payment when the provider can draw it", async () => {
    const provider = fakeProvider(
      { kind: "embedded", clientSecret: "secret_123" },
      { Embedded: Element },
    );
    expect(await startPayment(provider, ORDER, ORIGIN)).toEqual({
      status: "embedded",
      clientSecret: "secret_123",
    });
  });

  it("fails an embedded payment with no element to draw it, or with an empty secret", async () => {
    const bare = fakeProvider({ kind: "embedded", clientSecret: "secret_123" });
    expect((await startPayment(bare, ORDER, ORIGIN)).status).toBe("failed");
    const empty = fakeProvider({ kind: "embedded", clientSecret: "" }, { Embedded: Element });
    expect((await startPayment(empty, ORDER, ORIGIN)).status).toBe("failed");
  });

  it("turns a provider that rejects into a failure, in the site's own words", async () => {
    const provider = fakeProvider(new Error("card_declined: sk_live_secret in a stack trace"));
    const outcome = await startPayment(provider, ORDER, ORIGIN);
    expect(outcome).toEqual({ status: "failed", message: PAYMENT_FAILED });
    expect(JSON.stringify(outcome)).not.toContain("sk_live");
  });

  it("does not start a payment for an order that is not one", async () => {
    const provider = fakeProvider({ kind: "redirect", redirectUrl: "https://pay.example/s/1" });
    for (const broken of [
      { ...ORDER, agreedToTerms: false },
      { ...ORDER, item: { ...ORDER.item, priceCents: 1 } },
      { ...ORDER, details: { ...ORDER.details, email: "nope" } },
    ]) {
      expect((await startPayment(provider, broken as Order, ORIGIN)).status).toBe("failed");
    }
    expect(provider.start).not.toHaveBeenCalled();
  });
});

describe("the Payment step", () => {
  const noop = () => undefined;
  const render = (provider: PaymentProvider | null) =>
    renderToStaticMarkup(
      createElement(PaymentStep, { order: ORDER, provider, onBack: noop, onStartOver: noop }),
    );
  const mailto = orderMailto(ORDER).replaceAll("&", "&amp;");

  it("with no provider says so, shows the order and offers it by email and to copy", () => {
    const markup = render(null);
    expect(markup).toContain("Online payment is not connected yet.");
    expect(markup).toContain("Nothing has been charged");
    expect(markup).toContain(ORDER.reference);
    expect(markup).toContain("ada.okafor@example.org");
    expect(markup).toContain(`href="${mailto}"`);
    expect(markup).toContain("Send this order by email");
    expect(markup).toContain("Copy order details");
    expect(markup).not.toContain("data-pay");
  });

  it("with a provider shows its pay button, and keeps the order by email on offer", () => {
    const markup = render(fakeProvider({ kind: "redirect", redirectUrl: "https://pay.example" }));
    expect(markup).toMatch(/<button[^>]*data-pay="fake"[^>]*>Pay with the fake provider/);
    expect(markup).not.toContain("Online payment is not connected yet.");
    expect(markup).toContain(ORDER.reference);
    expect(markup).toContain(`href="${mailto}"`);
  });

  it("draws no field for a card, with or without a provider", () => {
    for (const provider of [null, fakeProvider({ kind: "embedded", clientSecret: "s" })]) {
      const markup = render(provider);
      expect(markup).not.toMatch(/<input\b/);
      expect(markup).not.toMatch(/cc-|card-number|cardnumber/i);
    }
  });
});
