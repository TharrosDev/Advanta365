export const CART_STORAGE_KEY = "advanta365.cart.v1";

// Digital goods: a line is either in the cart or not, so there are no quantities.
export type CartLine = { kind: "template" | "bundle"; slug: string };

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const { kind, slug } = value as Record<string, unknown>;
  return (kind === "template" || kind === "bundle") && typeof slug === "string" && slug !== "";
}

const sameLine = (a: CartLine, b: CartLine) => a.kind === b.kind && a.slug === b.slug;

/** Reads a stored cart. Anything that is not a valid cart yields an empty one. */
export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(isCartLine)
    .reduce<CartLine[]>((lines, { kind, slug }) => addLine(lines, { kind, slug }), []);
}

export function hasLine(lines: CartLine[], line: CartLine): boolean {
  return lines.some((existing) => sameLine(existing, line));
}

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  return hasLine(lines, line) ? lines : [...lines, line];
}

export function removeLine(lines: CartLine[], line: CartLine): CartLine[] {
  return lines.filter((existing) => !sameLine(existing, line));
}

/** Drops lines whose template or bundle is missing from the catalog. */
export function pruneLines(
  lines: CartLine[],
  known: { templates: Set<string>; bundles: Set<string> },
): CartLine[] {
  return lines.filter((line) =>
    (line.kind === "template" ? known.templates : known.bundles).has(line.slug),
  );
}

/** Which templates each bundle holds: bundle slug to template slugs. */
export type BundleContents = Readonly<Record<string, readonly string[]>>;

/**
 * The bundle in the cart that already holds a template, if any: the first such bundle in cart
 * order. The template itself need not be in the cart, so a template page can ask before it is added.
 */
export function bundleHolding(
  lines: CartLine[],
  templateSlug: string,
  contents: BundleContents,
): string | undefined {
  const line = lines.find(
    (l) =>
      l.kind === "bundle" &&
      Object.hasOwn(contents, l.slug) &&
      contents[l.slug]?.includes(templateSlug),
  );
  return line?.slug;
}

/**
 * The template lines that a bundle in the same cart already holds, as template slug to bundle
 * slug. Those lines are not charged: the bundle's price covers them.
 */
export function coveredLines(lines: CartLine[], contents: BundleContents): Map<string, string> {
  const covered = new Map<string, string>();
  for (const line of lines) {
    if (line.kind !== "template") continue;
    const bundle = bundleHolding(lines, line.slug, contents);
    if (bundle) covered.set(line.slug, bundle);
  }
  return covered;
}

/**
 * What the cart costs: the sum of its line prices, leaving out templates a bundle in the cart holds.
 * A line whose price is unknown (an item that left the catalog) counts as nothing.
 */
export function cartSubtotalCents(
  lines: CartLine[],
  priceOf: (line: CartLine) => number | undefined,
  contents: BundleContents,
): number {
  const covered = coveredLines(lines, contents);
  return lines.reduce(
    (sum, line) =>
      line.kind === "template" && covered.has(line.slug) ? sum : sum + (priceOf(line) ?? 0),
    0,
  );
}
