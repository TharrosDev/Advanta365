import { expect, test } from "vitest";
import { formatLength, formatPrice } from "@/lib/format";

test("whole-dollar prices have no decimals", () => {
  expect(formatPrice(4900)).toBe("$49");
});

test("prices with cents show two decimals", () => {
  expect(formatPrice(4950)).toBe("$49.50");
});

test("large prices use a thousands separator", () => {
  expect(formatPrice(120000)).toBe("$1,200");
});

test("zero is formatted", () => {
  expect(formatPrice(0)).toBe("$0");
});

test("a deck's length is counted in slides", () => {
  expect(formatLength(16, "pptx")).toBe("16 slides");
  expect(formatLength(1, "pptx")).toBe("1 slide");
});

test("every other format's length is counted in pages", () => {
  expect(formatLength(22, "docx")).toBe("22 pages");
  expect(formatLength(1, "pdf")).toBe("1 page");
});
