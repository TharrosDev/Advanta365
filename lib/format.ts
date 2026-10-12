const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const withCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Formats integer cents as US dollars, dropping ".00" on whole amounts. */
export function formatPrice(cents: number): string {
  return (cents % 100 === 0 ? wholeDollars : withCents).format(cents / 100);
}

/**
 * A template's length in the unit of its format: a deck counts slides ("16 slides"), every other
 * format counts pages ("1 page"). The data keeps one number, `pageCount`, for both.
 */
export function formatLength(count: number, format: string): string {
  const unit = format === "pptx" ? "slide" : "page";
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}
