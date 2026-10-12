import { describe, expect, it } from "vitest";
import { COUNTRIES, countryName, regionLabel, regionName, regionsOf } from "@/lib/checkout/places";
import {
  DETAIL_FIELDS,
  DETAIL_LIMITS,
  EMPTY_DETAILS,
  ORDER_CODE,
  detailsSchema,
  orderSchema,
  parseDetails,
  type DetailsDraft,
} from "@/lib/checkout/schema";
import { OFFER } from "@/lib/site";

// The shapes of the checkout: what the form accepts as the buyer's details, what it says about
// each field that is wrong, and what an order must be before a payment provider is handed it.

const VALID: DetailsDraft = {
  fullName: "Ada Okafor",
  email: "ada.okafor@example.org",
  organization: "City of Riverbend",
  country: "CA",
  region: "ON",
  poNumber: "",
  note: "",
};

describe("the places of the form", () => {
  it("lists Canada first, then every other country once, in alphabetical order", () => {
    expect(COUNTRIES[0]).toEqual(["CA", "Canada"]);
    expect(COUNTRIES.length).toBeGreaterThan(180);
    const codes = COUNTRIES.map(([code]) => code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
    const names = COUNTRIES.slice(1).map(([, name]) => name);
    expect([...names].sort((a, b) => a.localeCompare(b, "en"))).toEqual(names);
    expect(names).toContain("United States");
  });

  it("lists the regions of Canada and of the United States, and of no other country", () => {
    expect(regionsOf("CA")).toHaveLength(13);
    expect(regionsOf("US")).toHaveLength(51);
    expect(regionsOf("FR")).toBeUndefined();
    expect(regionsOf("")).toBeUndefined();
  });

  it("names a region for its country", () => {
    expect(regionLabel("CA")).toBe("Province or territory");
    expect(regionLabel("US")).toBe("State");
    expect(regionLabel("FR")).toBe("Region");
    expect(regionName("CA", "QC")).toBe("Quebec");
    expect(regionName("US", "CA")).toBe("California");
    expect(regionName("FR", "Bretagne")).toBe("Bretagne");
    expect(countryName("CA")).toBe("Canada");
    expect(countryName("ZZ")).toBe("ZZ");
  });
});

describe("parseDetails", () => {
  it("accepts complete details and trims them", () => {
    const result = parseDetails({
      ...VALID,
      fullName: "  Ada Okafor ",
      email: " ada@example.org ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.details.fullName).toBe("Ada Okafor");
    expect(result.details.email).toBe("ada@example.org");
    expect(result.errors).toEqual({});
  });

  it("asks for every needed field of an empty form, and for nothing that is optional", () => {
    const result = parseDetails(EMPTY_DETAILS);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({
      fullName: "Enter your full name",
      email: "Enter your work email",
      organization: "Enter the name of your organization",
      country: "Choose a country",
    });
  });

  it("counts a field of spaces as empty", () => {
    expect(parseDetails({ ...VALID, organization: "   " }).errors).toEqual({
      organization: "Enter the name of your organization",
    });
  });

  it.each(["ada", "ada@", "@example.org", "ada@example", "ada okafor@example.org", "a@b@c.org"])(
    "does not take %s for an email address",
    (email) => {
      expect(parseDetails({ ...VALID, email }).errors).toEqual({
        email: "Enter an email address like name@organization.ca",
      });
    },
  );

  it("needs a listed region for Canada and for the United States", () => {
    expect(parseDetails({ ...VALID, region: "" }).errors).toEqual({
      region: "Choose a province or territory",
    });
    // A state is not a province: the region is judged for its own country.
    expect(parseDetails({ ...VALID, region: "TX" }).errors).toEqual({
      region: "Choose a province or territory",
    });
    expect(parseDetails({ ...VALID, country: "US", region: "" }).errors).toEqual({
      region: "Choose a state",
    });
    expect(parseDetails({ ...VALID, country: "US", region: "TX" }).ok).toBe(true);
  });

  it("takes any region, or none, for a country without a list", () => {
    expect(parseDetails({ ...VALID, country: "FR", region: "" }).ok).toBe(true);
    expect(parseDetails({ ...VALID, country: "FR", region: "Bretagne" }).ok).toBe(true);
  });

  it("reports the region with the other problems, not after them", () => {
    expect(parseDetails({ ...VALID, fullName: "", region: "" }).errors).toEqual({
      fullName: "Enter your full name",
      region: "Choose a province or territory",
    });
  });

  it("does not take a country the list does not hold", () => {
    expect(parseDetails({ ...VALID, country: "ZZ", region: "" }).errors).toEqual({
      country: "Choose a country",
    });
  });

  it("holds every typed field to its limit", () => {
    for (const field of ["fullName", "organization", "poNumber", "note"] as const) {
      const limit = DETAIL_LIMITS[field];
      expect(parseDetails({ ...VALID, [field]: "x".repeat(limit) }).ok, field).toBe(true);
      expect(parseDetails({ ...VALID, [field]: "x".repeat(limit + 1) }).errors, field).toEqual({
        [field]: `Keep this to ${limit} characters or fewer`,
      });
    }
  });

  it("gives one message per field: the first that applies", () => {
    const { errors } = parseDetails({ ...VALID, email: "" });
    expect(errors.email).toBe("Enter your work email");
  });

  it("has a field for every key of an empty form, in the order the form asks", () => {
    expect(Object.keys(EMPTY_DETAILS)).toEqual([...DETAIL_FIELDS]);
  });
});

describe("the order", () => {
  const order = {
    reference: "A365-261012-K7QX2M",
    createdAt: "2026-10-12T15:04:05.000Z",
    item: { name: OFFER.name, priceCents: OFFER.priceCents, currency: OFFER.currency },
    details: detailsSchema.parse(VALID),
    agreedToTerms: true,
  };

  it("is the one offer at its price, for checked details, agreed to", () => {
    expect(orderSchema.safeParse(order).success).toBe(true);
  });

  it("cannot carry another price, another item or another currency", () => {
    for (const item of [
      { ...order.item, priceCents: 1 },
      { ...order.item, name: "Something else" },
      { ...order.item, currency: "USD" },
    ]) {
      expect(orderSchema.safeParse({ ...order, item }).success).toBe(false);
    }
  });

  it("is not an order until the buyer has agreed", () => {
    expect(orderSchema.safeParse({ ...order, agreedToTerms: false }).success).toBe(false);
  });

  it("needs its own code, a moment and complete details", () => {
    expect(orderSchema.safeParse({ ...order, reference: "1234" }).success).toBe(false);
    expect(orderSchema.safeParse({ ...order, createdAt: "yesterday" }).success).toBe(false);
    expect(
      orderSchema.safeParse({ ...order, details: { ...order.details, region: "" } }).success,
    ).toBe(false);
  });

  it("has no field for a card, an account or anything else a provider collects", () => {
    expect(Object.keys(orderSchema.shape).sort()).toEqual(
      ["agreedToTerms", "createdAt", "details", "item", "reference"].sort(),
    );
    expect(ORDER_CODE.test(order.reference)).toBe(true);
  });
});
