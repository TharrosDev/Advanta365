import { NAV } from "@/lib/site";

export type NavLink = { href: string; label: string };

/** A rollout phase as the navigation needs it: where it lives and what it is called. */
export type PhaseLink = { slug: string; name: string };

/** Which phase each template belongs to: template slug to phase slug. */
export type TemplatePhases = Readonly<Record<string, string>>;

/** The site's primary destinations, in order: Catalog, Bundles, Pricing, About, Contact. */
export const PRIMARY_LINKS: readonly NavLink[] = [...NAV, { href: "/contact", label: "Contact" }];

/**
 * The `aria-current` value of a navigation link: `page` when the page shown is the link's own,
 * `true` when the page lies under it (a bundle page under Bundles), otherwise none.
 */
export function linkCurrent(pathname: string, href: string): "page" | "true" | undefined {
  if (pathname === href) return "page";
  if (pathname.startsWith(`${href}/`)) return "true";
  return undefined;
}

/**
 * The one phase a catalog address filters on: its `phase` values (repeated keys, comma lists, as
 * the catalog reads them), when they name exactly one known phase. None, several or only unknown
 * ones give nothing.
 */
export function singleCatalogPhase(
  values: readonly string[],
  phaseSlugs: readonly string[],
): string | undefined {
  const known = new Set(
    values.flatMap((value) => value.split(",")).filter((slug) => phaseSlugs.includes(slug)),
  );
  return known.size === 1 ? [...known][0] : undefined;
}

/**
 * The phase the page shown belongs to, and how: `page` on the phase's own page, `true` on the page
 * of a template in that phase, and `true` on the catalog while it is filtered on that one phase
 * (`catalogPhase`, from `singleCatalogPhase`). Any other page belongs to no phase.
 */
export function currentPhase(
  pathname: string,
  templatePhases: TemplatePhases,
  catalogPhase?: string,
): { slug: string; kind: "page" | "true" } | undefined {
  if (pathname === "/catalog") {
    return catalogPhase ? { slug: catalogPhase, kind: "true" } : undefined;
  }
  const [, section, slug, ...deeper] = pathname.split("/");
  if (!slug || deeper.length > 0) return undefined;
  if (section === "phases") return { slug, kind: "page" };
  if (section === "templates" && Object.hasOwn(templatePhases, slug)) {
    const phase = templatePhases[slug];
    return phase ? { slug: phase, kind: "true" } : undefined;
  }
  return undefined;
}
