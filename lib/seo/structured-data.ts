import { APP_LABELS, AUDIENCE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import { phaseHref } from "@/lib/catalog/search-params";
import type { Phase, Template } from "@/lib/catalog/schema";
import { FILE_TYPES } from "@/lib/files/types";
import { LEGAL } from "@/lib/legal/facts";
import { OFFER, PURCHASE_LINK, SITE, TOOLKIT } from "@/lib/site";
import { absoluteUrl, SITE_ORIGIN } from "./origin";

/**
 * The structured data of the site: schema.org entities written as JSON-LD, which search engines read
 * for rich results and AI answer engines read to know what the site sells, who sells it and what is
 * on each page. Every statement here is one the pages make in plain words; nothing is added (no
 * rating, no review, no claim the copy does not make).
 *
 * The entities that are the same on every page (the company, the brand, the site) have fixed `@id`s,
 * so a page's own graph points at them instead of repeating them.
 */

export type JsonLdNode = { [key: string]: unknown };

export const IDS = {
  organization: `${SITE_ORIGIN}/#organization`,
  brand: `${SITE_ORIGIN}/#brand`,
  website: `${SITE_ORIGIN}/#website`,
  product: `${absoluteUrl(PURCHASE_LINK.href)}#toolkit`,
} as const;

/** The site's logo as a square image, for the company and the brand. */
const LOGO = {
  "@type": "ImageObject",
  url: absoluteUrl("/icons/icon-512.png"),
  width: 512,
  height: 512,
  caption: SITE.name,
};

/** The card a shared link to the home page shows, which also pictures the toolkit. */
const SHARE_IMAGE = absoluteUrl("/opengraph-image");

/** The subjects the content covers, for `knowsAbout` and `about`. */
const TOPICS = [
  "Change management",
  "User adoption",
  "Microsoft 365",
  "SharePoint Online",
  "Microsoft Teams",
  "OneDrive",
  "Microsoft Copilot",
  "Information management",
  "Training and job aids",
];

/** One graph for a page: the context once, and the entities that describe it. */
export function graph(...nodes: JsonLdNode[]): JsonLdNode {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * JSON-LD as the text of a `<script>`: `<`, `>` and `&` are escaped so that no string in the data
 * (a title, a summary) can close the element or start markup.
 */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** EchoFive, the company the product belongs to and the one that sells it. */
export function organization(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": IDS.organization,
    name: SITE.parent,
    url: absoluteUrl("/"),
    description: SITE.description,
    slogan: SITE.summary,
    email: SITE.contactEmail,
    logo: LOGO,
    image: LOGO,
    brand: { "@id": IDS.brand },
    address: { "@type": "PostalAddress", addressCountry: "CA" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: SITE.contactEmail,
        availableLanguage: ["English"],
        url: absoluteUrl("/contact"),
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE.contactEmail,
        availableLanguage: ["English"],
        url: absoluteUrl("/contact"),
      },
    ],
    knowsAbout: TOPICS,
  };
}

/** Advanta365, the brand the toolkit is sold under. */
export function brand(): JsonLdNode {
  return {
    "@type": "Brand",
    "@id": IDS.brand,
    name: SITE.name,
    slogan: SITE.summary,
    description: SITE.description,
    url: absoluteUrl("/"),
    logo: LOGO,
  };
}

/** The site, with the catalog's search as the way to search it. */
export function website(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": IDS.website,
    name: SITE.name,
    alternateName: `${SITE.name} by ${SITE.parent}`,
    url: absoluteUrl("/"),
    description: SITE.description,
    inLanguage: "en-CA",
    publisher: { "@id": IDS.organization },
    copyrightHolder: { "@id": IDS.organization },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/catalog")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** The entities every page shares: the company, the brand and the site. */
export function siteGraph(): JsonLdNode {
  return graph(organization(), brand(), website());
}

/** The price as schema.org writes it: a plain decimal, without a symbol ("1499.99"). */
export function offerPrice(): string {
  return (OFFER.priceCents / 100).toFixed(2);
}

/**
 * The one thing the site sells: the complete toolkit, at its one price in Canadian dollars. Its
 * counts are those of the full toolkit (`TOOLKIT`), never of the catalog, which lists sample content.
 */
export function product(phases: readonly Phase[]): JsonLdNode {
  const numbered = phases.filter((phase) => phase.number !== undefined);
  return {
    "@type": "Product",
    "@id": IDS.product,
    name: `${SITE.name}: ${OFFER.name.toLowerCase()}`,
    alternateName: `${SITE.name} change management toolkit`,
    description: SITE.description,
    slogan: SITE.summary,
    url: absoluteUrl(PURCHASE_LINK.href),
    image: SHARE_IMAGE,
    brand: { "@id": IDS.brand },
    manufacturer: { "@id": IDS.organization },
    sku: "advanta365-complete-toolkit",
    category: "Change management and user adoption toolkit",
    keywords:
      "Microsoft 365 change management, SharePoint Online adoption, change management templates, training, job aids, Copilot readiness",
    audience: {
      "@type": "BusinessAudience",
      audienceType:
        "Change management leads and practitioners; IT and M365 project managers; IM and records leads; CIOs and sponsors; public sector and Crown corporations",
    },
    additionalProperty: [
      property("Playbooks", TOOLKIT.playbooks),
      property("Templates", TOOLKIT.templates),
      property("Field guides", TOOLKIT.fieldGuides),
      property("Job aids", TOOLKIT.jobAids),
      property("Training audiences", "End users, Site Owners and IM Representatives"),
      property("Rollout phases", numbered.length),
      property("File formats", Object.values(FORMAT_LABELS).join(", ")),
      property("Microsoft 365 apps covered", "SharePoint, Teams, OneDrive, Outlook and Copilot"),
      property("Practitioner experience", TOOLKIT.experience),
      property("Language", "English"),
    ],
    offers: {
      "@type": "Offer",
      url: absoluteUrl(PURCHASE_LINK.href),
      price: offerPrice(),
      priceCurrency: OFFER.currency,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": IDS.organization },
      eligibleRegion: { "@type": "Place", name: "Worldwide" },
      businessFunction: "http://purl.org/goodrelations/v1#Sell",
    },
  };
}

function property(name: string, value: string | number): JsonLdNode {
  return { "@type": "PropertyValue", name, value };
}

type Crumb = { name: string; path: string };

/** The trail from the home page to a page, the page itself last. */
export function breadcrumbs(path: string, trail: readonly Crumb[]): JsonLdNode {
  const items = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type WebPageInput = {
  path: string;
  name: string;
  description: string;
  /** The schema.org type of the page: `WebPage` unless the page is one of its kinds. */
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "CheckoutPage";
  /** The pages above it, without the home page, the page itself last. */
  trail?: readonly Crumb[];
  /** Further properties of the page (`about`, `mainEntity`, dates). */
  extra?: JsonLdNode;
};

/** A page of the site, part of the site, with its breadcrumb trail when it has one. */
export function webPage({
  path,
  name,
  description,
  type = "WebPage",
  trail,
  extra,
}: WebPageInput): JsonLdNode[] {
  const url = absoluteUrl(path);
  const page: JsonLdNode = {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-CA",
    isPartOf: { "@id": IDS.website },
    publisher: { "@id": IDS.organization },
    ...(trail ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...extra,
  };
  return trail ? [page, breadcrumbs(path, trail)] : [page];
}

/** The address a template opens at: the catalog's pop-up, which only a free sample has. */
function templateUrl(template: Template): string | undefined {
  return template.free ? `${absoluteUrl("/catalog")}?view=${template.slug}` : undefined;
}

/** A template as a document of the toolkit: what it is, who it is for, the kind of file it is. */
export function templateWork(template: Template, phase: Phase | undefined): JsonLdNode {
  const url = templateUrl(template);
  return {
    "@type": "CreativeWork",
    name: template.title,
    description: template.summary,
    ...(url ? { url } : {}),
    encodingFormat: FILE_TYPES[template.format],
    isAccessibleForFree: template.free,
    audience: template.audiences.map((audience) => ({
      "@type": "Audience",
      audienceType: AUDIENCE_LABELS[audience],
    })),
    about: template.apps.map((app) => ({ "@type": "Thing", name: APP_LABELS[app] })),
    ...(phase ? { keywords: `${phase.name}, ${FORMAT_LABELS[template.format]}` } : {}),
    publisher: { "@id": IDS.organization },
    inLanguage: "en",
  };
}

/** A list of templates in the order they are shown. */
export function templateList(
  name: string,
  templates: readonly Template[],
  phases: readonly Phase[],
): JsonLdNode {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: templates.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: templates.map((template, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: templateWork(
        template,
        phases.find((phase) => phase.slug === template.phase),
      ),
    })),
  };
}

/** The toolkit's sections in folder order, each with its page. */
export function phaseList(phases: readonly Phase[]): JsonLdNode {
  return {
    "@type": "ItemList",
    name: "The phases of a Microsoft 365 rollout, as the toolkit's folders follow them",
    numberOfItems: phases.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: phases.map((phase, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: phase.number === undefined ? phase.name : `Phase ${phase.number}: ${phase.name}`,
      description: phase.summary,
      url: absoluteUrl(phaseHref(phase.slug)),
    })),
  };
}

/** The date the four legal pages last changed, for `dateModified` and `lastReviewed`. */
export const LEGAL_DATE = LEGAL.effectiveDate;

/** A legal page: the document, the day it last changed and the company it speaks for. */
export function legalPageGraph(document: {
  href: string;
  title: string;
  description: string;
}): JsonLdNode {
  return graph(
    ...webPage({
      path: document.href,
      name: document.title,
      description: document.description,
      trail: [{ name: document.title, path: document.href }],
      extra: {
        datePublished: LEGAL_DATE,
        dateModified: LEGAL_DATE,
        lastReviewed: LEGAL_DATE,
        about: { "@id": IDS.organization },
      },
    }),
  );
}
