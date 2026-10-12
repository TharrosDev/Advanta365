/**
 * Number formats for prices, one per currency and per shape, made when first needed. The locale is
 * Canadian English and the symbol the narrow one, so every dollar currency prints a bare "$": the
 * currency is said by its code after the amount (see `formatPriceParts`), never by the symbol.
 */
const priceFormats = new Map<string, Intl.NumberFormat>();

function priceFormat(currency: string, whole: boolean): Intl.NumberFormat {
  const key = `${currency}:${whole}`;
  let format = priceFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      ...(whole ? { maximumFractionDigits: 0 } : {}),
    });
    priceFormats.set(key, format);
  }
  return format;
}

const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

/**
 * A count as running copy writes it: a word up to twelve ("six"), digits beyond. `"capital"` is
 * for the first word of a sentence ("Six").
 */
export function countWord(count: number, form: "lower" | "capital" = "lower"): string {
  const word = COUNT_WORDS[count] ?? String(count);
  return form === "capital" ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/**
 * A price as its amount and its currency code, for a place that sets the code smaller than the
 * amount: integer cents become "$1,499.99" and "CAD". Whole amounts drop ".00" ("$49").
 */
export function formatPriceParts(
  cents: number,
  currency: string,
): { amount: string; currency: string } {
  return { amount: priceFormat(currency, cents % 100 === 0).format(cents / 100), currency };
}

/**
 * Integer cents as a price that cannot be misread: the amount, then the currency code, joined by a
 * no-break space so the code never lands alone on the next line ("$1,499.99 CAD"). The currency is
 * always passed in (`OFFER.currency`), never assumed.
 */
export function formatPrice(cents: number, currency: string): string {
  const parts = formatPriceParts(cents, currency);
  return `${parts.amount} ${parts.currency}`;
}

/**
 * A template's length in the unit of its format: a deck counts slides ("16 slides"), every other
 * format counts pages ("1 page"). The data keeps one number, `pageCount`, for both.
 */
export function formatLength(count: number, format: string): string {
  const unit = format === "pptx" ? "slide" : "page";
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}
