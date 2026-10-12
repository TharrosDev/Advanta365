/**
 * What the full toolkit holds. The counts match the source folder and are the only place they are
 * written: every page reads them from here.
 */
export const TOOLKIT = {
  playbooks: 59,
  templates: 130,
  fieldGuides: 4,
  jobAids: 58,
  trainingAudiences: "three",
  experience: "30+ years",
} as const;

export const SITE = {
  name: "Advanta365",
  /** The company the product belongs to: "Advanta365 is a product of EchoFive." */
  parent: "EchoFive",
  tagline: "Don’t start from a blank prompt.",
  description: `The change management and user adoption toolkit behind real SharePoint Online rollouts: ${TOOLKIT.playbooks} playbooks, ${TOOLKIT.templates} templates, ${TOOLKIT.fieldGuides} field guides and full training for ${TOOLKIT.trainingAudiences} audiences, ready to adapt by hand or with AI.`,
  contactEmail: "hello@advanta365.com",
} as const;

/**
 * The one thing the site sells. The price is written here once, as integer cents in Canadian
 * dollars, and printed everywhere with `formatPrice`.
 */
export const OFFER = {
  name: "The complete toolkit",
  priceCents: 149999,
  currency: "CAD",
} as const;

/** The one place to buy: its link leads the primary navigation and has its own place in the bar. */
export const PURCHASE_LINK = { href: "/purchase", label: "Purchase" } as const;

/** The pages that describe the product, after the purchase link. */
export const NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/why-advanta", label: "Why Advanta" },
] as const;

/** The page to write to us from. The footer and the menu link to it; the bar does not. */
export const CONTACT_LINK = { href: "/contact", label: "Contact" } as const;

/** The pages a site that sells owes its visitors, in the order the footer lists them. */
export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Refunds" },
  { href: "/accessibility", label: "Accessibility" },
] as const;
