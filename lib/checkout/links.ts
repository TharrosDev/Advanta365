import { LEGAL_LINKS } from "@/lib/site";

type LegalLink = (typeof LEGAL_LINKS)[number];

/**
 * One of the site's legal pages, by its address, as `LEGAL_LINKS` lists it. The address is checked
 * by the compiler, so a page that is renamed there stops this from compiling here.
 */
export function legalLink<Href extends LegalLink["href"]>(
  href: Href,
): Extract<LegalLink, { href: Href }> {
  const found = LEGAL_LINKS.find(
    (link): link is Extract<LegalLink, { href: Href }> => link.href === href,
  );
  if (!found) throw new Error(`No legal page at ${href}`);
  return found;
}
