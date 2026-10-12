import { expect, test } from "vitest";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { countWord, formatPrice } from "@/lib/format";

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

test("the toolkit price prints with its cents", () => {
  expect(formatPrice(49999)).toBe("$499.99");
});

test("a count up to twelve is written as a word, and in digits beyond", () => {
  expect(countWord(0)).toBe("zero");
  expect(countWord(7)).toBe("seven");
  expect(countWord(12)).toBe("twelve");
  expect(countWord(13)).toBe("13");
  expect(countWord(130)).toBe("130");
});

test("a count that opens a sentence takes a capital", () => {
  expect(countWord(6, "capital")).toBe("Six");
  expect(countWord(59, "capital")).toBe("59");
});

test("the number of free samples reads as the copy writes it", () => {
  expect(countWord(FREE_SAMPLE_COUNT)).toBe("six");
  expect(countWord(FREE_SAMPLE_COUNT, "capital")).toBe("Six");
});
