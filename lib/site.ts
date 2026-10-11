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

export const NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/bundles", label: "Bundles" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
] as const;
