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
