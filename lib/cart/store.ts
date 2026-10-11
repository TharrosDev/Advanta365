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
