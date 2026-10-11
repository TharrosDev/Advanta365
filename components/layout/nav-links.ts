import { NAV } from "@/lib/site";

export type NavLink = { href: string; label: string };

/** The site's primary destinations, in order: Catalog, Bundles, Pricing, About, Contact. */
export const PRIMARY_LINKS: readonly NavLink[] = [...NAV, { href: "/contact", label: "Contact" }];
