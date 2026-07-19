import type { Metadata } from "next";

/* ────────────────────────────────────────────────────────────────────────
 * Site-wide SEO configuration — single source of truth.
 * ──────────────────────────────────────────────────────────────────────── */

export const SITE_URL = "https://advanta365.com";
export const SITE_NAME = "ADVANTA365";
export const SITE_TAGLINE = "Enterprise Microsoft 365 Adoption, Governance & Rollout";
export const SITE_LOCALE = "en_US";
export const SITE_LANG = "en";

/** Primary OG/Twitter image — branded 1200×630 card served from /public. */
export const OG_IMAGE = {
  url: `${SITE_URL}/og.png`,
  width: 1200,
  height: 630,
  alt: "ADVANTA365 — Microsoft 365, governed and adopted at scale.",
};

/** Brand keywords used as a base; per-page metadata adds specific terms. */
export const BASE_KEYWORDS = [
  "Microsoft 365",
  "Microsoft 365 adoption",
  "Microsoft 365 governance",
  "Microsoft 365 framework",
  "enterprise Microsoft 365",
  "SharePoint Online governance",
  "Microsoft Teams adoption",
  "OneDrive enablement",
  "digital workplace transformation",
  "change management",
  "user adoption",
  "information management",
  "modern work",
  "ADVANTA365",
];

export interface BuildMetadataOptions {
  /** Without the site title template suffix; e.g. "Framework". */
  title: string;
  description: string;
  /** Page path without leading slash. "" for home. */
  path: string;
  /** Additional keywords appended to BASE_KEYWORDS. */
  keywords?: string[];
  /** Override OG image. */
  image?: { url: string; width?: number; height?: number; alt?: string };
  /** OG type — defaults to "website". */
  ogType?: "website" | "article";
  /** Set to true to mark the page noindex (e.g. 404). */
  noindex?: boolean;
}

/** Build a complete `Metadata` object for a page. */
export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const {
    title,
    description,
    path,
    keywords = [],
    image,
    ogType = "website",
    noindex = false,
  } = opts;

  const url = path ? `${SITE_URL}/${path.replace(/^\/+/, "")}` : SITE_URL;
  const og = image
    ? {
        url: image.url,
        width: image.width ?? 1200,
        height: image.height ?? 630,
        alt: image.alt ?? title,
      }
    : OG_IMAGE;

  return {
    title,
    description,
    keywords: Array.from(new Set([...BASE_KEYWORDS, ...keywords])),
    alternates: {
      canonical: path === "" ? "/" : `/${path.replace(/^\/+/, "")}`,
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: ogType,
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: SITE_LOCALE,
      images: [og],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og.url],
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * JSON-LD helpers
 * ──────────────────────────────────────────────────────────────────────── */

/** Organization schema — used in root layout, referenced by `@id` from other graphs. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    legalName: "ADVANTA365",
    description:
      "Enterprise Microsoft 365 adoption, governance, implementation, and enablement framework for large, complex, and regulated organizations.",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.svg`,
      width: 512,
      height: 512,
    },
    image: OG_IMAGE.url,
    knowsAbout: [
      "Microsoft 365",
      "SharePoint Online",
      "Microsoft Teams",
      "OneDrive",
      "Information Management",
      "Change Management",
      "Digital Workplace Transformation",
      "Governance",
      "User Adoption",
    ],
    areaServed: { "@type": "AdministrativeArea", name: "Worldwide" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Sales",
      url: `${SITE_URL}/contact`,
      availableLanguage: ["English"],
    },
    sameAs: [] as string[],
  };
}

/** WebSite schema — declares the site for sitelink searchbox + canonical brand entity. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description:
      "Enterprise Microsoft 365 adoption, governance, implementation, and enablement framework.",
    inLanguage: SITE_LANG,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** WebPage schema — emit one per route. */
export function webPageSchema(opts: {
  path: string;
  name: string;
  description: string;
  breadcrumb?: { name: string; path: string }[];
}) {
  const url = opts.path ? `${SITE_URL}/${opts.path.replace(/^\/+/, "")}` : SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: opts.name,
    description: opts.description,
    inLanguage: SITE_LANG,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE.url },
    breadcrumb: opts.breadcrumb
      ? {
          "@type": "BreadcrumbList",
          itemListElement: opts.breadcrumb.map((b, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: b.name,
            item: b.path ? `${SITE_URL}/${b.path.replace(/^\/+/, "")}` : SITE_URL,
          })),
        }
      : undefined,
  };
}

/** Service schema — used for /framework, /governance, /adoption pages. */
export function serviceSchema(opts: {
  name: string;
  serviceType: string;
  description: string;
  path: string;
}) {
  const url = `${SITE_URL}/${opts.path.replace(/^\/+/, "")}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.serviceType,
    description: opts.description,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "AdministrativeArea", name: "Worldwide" },
    url,
    audience: {
      "@type": "BusinessAudience",
      audienceType:
        "Large enterprises, government departments, and regulated organizations deploying Microsoft 365",
    },
  };
}

/** ItemList schema — for modules, principles, stages. */
export function itemListSchema(opts: {
  name: string;
  path: string;
  items: { name: string; description?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    url: `${SITE_URL}/${opts.path.replace(/^\/+/, "")}`,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      description: it.description,
    })),
  };
}

/** FAQPage schema — built from a Q/A array. */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

/** ContactPage schema — for /contact. */
export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/contact#contactpage`,
    url: `${SITE_URL}/contact`,
    name: "Contact ADVANTA365",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
}

/** Serializes any JSON-LD graph for an inline <script> tag. */
export function jsonLd(graph: unknown): string {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
