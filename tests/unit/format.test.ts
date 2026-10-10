import { expect, test } from "vitest";
import { formatPrice } from "@/lib/format";

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
