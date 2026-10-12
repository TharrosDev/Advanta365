import { describe, expect, it } from "vitest";
import type { Draft } from "@/lib/checkout/draft";
import {
  TAX_LINE,
  buildOrder,
  detailRows,
  includedLines,
  orderAmounts,
  orderCode,
  orderMailto,
  orderText,
} from "@/lib/checkout/order";
import { ORDER_CODE, orderSchema } from "@/lib/checkout/schema";
import { formatPrice } from "@/lib/format";
import { OFFER, SITE, TOOLKIT } from "@/lib/site";

// An order's code, its summary, the text that is copied and the email that carries it.

const DRAFT: Draft = {
  details: {
    fullName: "Ada Okafor",
    email: "ada.okafor@example.org",
    organization: "City of Riverbend & District",
    country: "CA",
    region: "ON",
    poNumber: "PO-4471",
    note: "Invoices go to accounts payable.\nNet 30.",
  },
  agreed: true,
  reference: "A365-261012-K7QX2M",
  createdAt: "2026-10-12T15:04:05.000Z",
};

const PRICE = formatPrice(OFFER.priceCents, OFFER.currency);

/** The order of a draft that is known to be finished. */
function orderOf(draft: Draft) {
  const order = buildOrder(draft);
  if (!order) throw new Error("the draft is not an order");
  return order;
}

describe("orderCode", () => {
  const noon = new Date("2026-10-12T12:00:00Z");

  it("is A365, the day in UTC and six characters from the entropy", () => {
    expect(orderCode(noon, [0, 1, 2, 3, 4, 5])).toBe("A365-261012-234567");
    expect(orderCode(noon, [31, 30, 29, 28, 27, 26])).toBe("A365-261012-ZYXWVU");
  });

  it("reads each byte modulo its alphabet, and a missing one as the first character", () => {
    expect(orderCode(noon, [32, 255, 64])).toBe("A365-261012-2Z2222");
    expect(orderCode(noon, new Uint8Array(6))).toBe("A365-261012-222222");
  });

  it("takes the day from UTC, whatever the hour", () => {
    expect(orderCode(new Date("2027-01-02T23:59:59Z"), [0, 0, 0, 0, 0, 0])).toMatch(
      /^A365-270102-/,
    );
  });

  it("is always a code the order's schema accepts, with no character that reads as another", () => {
    for (let seed = 0; seed < 256; seed += 1) {
      const code = orderCode(noon, [seed, seed * 3, seed * 7, seed * 11, seed * 13, seed * 17]);
      expect(code).toMatch(ORDER_CODE);
      expect(code.slice(12)).not.toMatch(/[01IO]/);
    }
  });
});

describe("buildOrder", () => {
  it("makes the order of a finished draft: the offer, its price, the trimmed details", () => {
    const order = buildOrder({ ...DRAFT, details: { ...DRAFT.details, fullName: " Ada Okafor " } });
    expect(order).not.toBeNull();
    expect(orderSchema.safeParse(order).success).toBe(true);
    expect(order?.item).toEqual({
      name: OFFER.name,
      priceCents: OFFER.priceCents,
      currency: OFFER.currency,
    });
    expect(order?.details.fullName).toBe("Ada Okafor");
    expect(order?.reference).toBe(DRAFT.reference);
  });

  it("makes nothing of a draft that is not ready", () => {
    expect(buildOrder({ ...DRAFT, agreed: false })).toBeNull();
    expect(buildOrder({ ...DRAFT, reference: null })).toBeNull();
    expect(buildOrder({ ...DRAFT, createdAt: null })).toBeNull();
    expect(buildOrder({ ...DRAFT, details: { ...DRAFT.details, email: "" } })).toBeNull();
  });
});

describe("the order summary", () => {
  it("lists what the toolkit holds with the counts of TOOLKIT", () => {
    expect(includedLines()).toEqual([
      `${TOOLKIT.playbooks} playbooks`,
      `${TOOLKIT.templates} templates`,
      `${TOOLKIT.fieldGuides} field guides`,
      `${TOOLKIT.jobAids} job aids`,
      `Training for ${TOOLKIT.trainingAudiences} audiences`,
    ]);
  });

  it("prints the price as the site prints it, and says the truth about tax", () => {
    expect(orderAmounts()).toEqual({ price: PRICE, totalBeforeTax: PRICE });
    expect(PRICE).toContain(OFFER.currency);
    expect(TAX_LINE).toBe("Calculated at payment");
  });
});

describe("detailRows", () => {
  it("gives every field in the order of the form, places by name", () => {
    expect(detailRows(orderOf(DRAFT).details)).toEqual([
      { field: "fullName", label: "Full name", value: "Ada Okafor" },
      { field: "email", label: "Work email", value: "ada.okafor@example.org" },
      { field: "organization", label: "Organization", value: "City of Riverbend & District" },
      { field: "country", label: "Country", value: "Canada" },
      { field: "region", label: "Province or territory", value: "Ontario" },
      { field: "poNumber", label: "PO or reference number", value: "PO-4471" },
      { field: "note", label: "Note", value: "Invoices go to accounts payable.\nNet 30." },
    ]);
  });

  it("names the region as its country does, and leaves what was left out empty", () => {
    const abroad = orderOf({
      ...DRAFT,
      details: { ...DRAFT.details, country: "FR", region: "", poNumber: "", note: "" },
    });
    const rows = detailRows(abroad.details);
    expect(rows.find((row) => row.field === "region")).toEqual({
      field: "region",
      label: "Region",
      value: "",
    });
    expect(rows.find((row) => row.field === "poNumber")?.value).toBe("");
  });
});

describe("orderText", () => {
  const order = orderOf(DRAFT);
  const text = orderText(order);

  it("opens with the site, the order's code and its day", () => {
    const lines = text.split("\n");
    expect(lines[0]).toBe(`${SITE.name} order A365-261012-K7QX2M`);
    expect(lines[1]).toBe("Date: 2026-10-12");
  });

  it("states the offer, its price, the tax line and the total before tax", () => {
    expect(text).toContain(`${OFFER.name}: ${PRICE}`);
    expect(text).toContain("Tax: calculated at payment");
    expect(text).toContain(`Total before tax: ${PRICE}`);
    expect(text).toContain(`${TOOLKIT.playbooks} playbooks, ${TOOLKIT.templates} templates`);
  });

  it("carries every detail that was given, and the agreement", () => {
    for (const line of [
      "Full name: Ada Okafor",
      "Work email: ada.okafor@example.org",
      "Organization: City of Riverbend & District",
      "Country: Canada",
      "Province or territory: Ontario",
      "PO or reference number: PO-4471",
      "Terms and Refund policy: agreed",
    ]) {
      expect(text.split("\n")).toContain(line);
    }
  });

  it("leaves out what was not given", () => {
    const bare = orderOf({ ...DRAFT, details: { ...DRAFT.details, poNumber: "", note: "" } });
    expect(orderText(bare)).not.toContain("PO or reference number");
    expect(orderText(bare)).not.toContain("Note:");
  });
});

describe("orderMailto", () => {
  const order = orderOf(DRAFT);
  const href = orderMailto(order);
  const [address = "", query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  it("is addressed to the site and to nobody else", () => {
    expect(address).toBe(`mailto:${SITE.contactEmail}`);
    expect([...params.keys()]).toEqual(["subject", "body"]);
  });

  it("names the order and the offer in its subject", () => {
    expect(params.get("subject")).toBe(`Order A365-261012-K7QX2M: ${OFFER.name}`);
  });

  it("carries the order's text, with the line ends of a message, and asks for an invoice", () => {
    const body = params.get("body") ?? "";
    expect(body.replaceAll("\r\n", "\n")).toBe(
      `${orderText(order)}\n\nPlease send an invoice for this order.\n`,
    );
    expect(body).not.toMatch(/[^\r]\n/);
  });

  it("encodes what an address cannot hold as it is", () => {
    expect(query).toContain("Riverbend%20%26%20District");
    expect(query).not.toMatch(/[ +\r\n]/);
    expect(query.split("&")).toHaveLength(2);
  });
});
