import { NAV, PURCHASE_LINK } from "@/lib/site";

export type NavLink = { href: string; label: string };

/** A rollout phase as the navigation needs it: where it lives and what it is called. */
export type PhaseLink = { slug: string; name: string };

/** Which phase each template belongs to: template slug to phase slug. */
export type TemplatePhases = Readonly<Record<string, string>>;

/** The site's primary destinations, in order: Purchase, Catalog, About. */
export const PRIMARY_LINKS: readonly NavLink[] = [PURCHASE_LINK, ...NAV];

/**
 * The `aria-current` value of a navigation link: `page` when the page shown is the link's own,
 * `true` when the page lies under it (`/catalog/x` under Catalog), otherwise none.
 */
export function linkCurrent(pathname: string, href: string): "page" | "true" | undefined {
  if (pathname === href) return "page";
  if (pathname.startsWith(`${href}/`)) return "true";
  return undefined;
}

/**
 * The phase the page shown belongs to, and how: `page` on the phase's own page, `true` on the page
 * of a template in that phase. Any other page belongs to no phase.
 */
export function currentPhase(
  pathname: string,
  templatePhases: TemplatePhases,
): { slug: string; kind: "page" | "true" } | undefined {
  const [, section, slug, ...deeper] = pathname.split("/");
  if (!slug || deeper.length > 0) return undefined;
  if (section === "phases") return { slug, kind: "page" };
  if (section === "templates" && Object.hasOwn(templatePhases, slug)) {
    const phase = templatePhases[slug];
    return phase ? { slug: phase, kind: "true" } : undefined;
  }
  return undefined;
}
