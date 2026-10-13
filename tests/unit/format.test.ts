import { expect, test } from "vitest";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { countWord, formatBytes, formatLength, formatPrice, formatPriceParts } from "@/lib/format";
import { OFFER } from "@/lib/site";

const NB = " ";

test("whole-dollar prices have no decimals", () => {
  expect(formatPrice(4900, "CAD")).toBe(`$49${NB}CAD`);
});

test("prices with cents show two decimals", () => {
  expect(formatPrice(4950, "CAD")).toBe(`$49.50${NB}CAD`);
});

test("large prices use a thousands separator", () => {
  expect(formatPrice(120000, "CAD")).toBe(`$1,200${NB}CAD`);
});

test("zero is formatted", () => {
  expect(formatPrice(0, "CAD")).toBe(`$0${NB}CAD`);
});

test("the toolkit price prints with its cents and its currency code", () => {
  expect(formatPrice(OFFER.priceCents, OFFER.currency)).toBe(`$1,499.99${NB}CAD`);
});

test("the code follows the currency passed in, and the symbol stays a bare dollar sign", () => {
  expect(formatPrice(49999, "USD")).toBe(`$499.99${NB}USD`);
});

test("a price splits into its amount and its code", () => {
  expect(formatPriceParts(149999, "CAD")).toEqual({ amount: "$1,499.99", currency: "CAD" });
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

test("a deck's length is counted in slides", () => {
  expect(formatLength(16, "pptx")).toBe("16 slides");
  expect(formatLength(1, "pptx")).toBe("1 slide");
});

test("every other format's length is counted in pages", () => {
  expect(formatLength(22, "docx")).toBe("22 pages");
  expect(formatLength(1, "pdf")).toBe("1 page");
});

test("file sizes read in KB below a megabyte, rounded up and never below 1 KB", () => {
  expect(formatBytes(1)).toBe("1 KB");
  expect(formatBytes(512)).toBe("1 KB");
  expect(formatBytes(24_576)).toBe("24 KB");
  expect(formatBytes(24_577)).toBe("25 KB");
});

test("file sizes read in MB from a megabyte, with one decimal under 10 MB", () => {
  expect(formatBytes(1_048_576)).toBe("1 MB");
  expect(formatBytes(2_400_000)).toBe("2.3 MB");
  expect(formatBytes(15_728_640)).toBe("15 MB");
});
