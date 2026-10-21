import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/** The title of the home page, and of any page that names none: the name and what the site is. */
export const DEFAULT_TITLE = `${SITE.name} · ${SITE.summary}`;

/** The home page's card, the one every page without a card of its own shows. */
const DEFAULT_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name}: ${SITE.summary}. Change management and user adoption content for Microsoft 365 and SharePoint Online.`,
  type: "image/png",
};

/** The language and region of every page, as Open Graph writes it. */
export const OG_LOCALE = "en_CA";

/**
 * What the site is about, in the words buyers search with. Search engines give the keywords tag
 * little weight; it is kept for the smaller engines and the AI tools that still read it.
 */
export const KEYWORDS = [
  "Microsoft 365 change management",
  "SharePoint Online change management",
  "Microsoft 365 user adoption",
  "SharePoint adoption toolkit",
  "change management templates",
  "change management playbooks",
  "Microsoft 365 rollout",
  "SharePoint migration communications plan",
  "Microsoft 365 training materials",
  "Copilot readiness",
  "Teams adoption",
  "OneDrive adoption",
  "champion network",
  "stakeholder analysis template",
  "change impact assessment",
  "cutover playbook",
  "hypercare plan",
  "M365 governance",
  "information management",
  "Canadian public sector",
] as const;

/**
 * The plain-text editions of the site for AI tools (`/llms.txt` and `/llms-full.txt`), linked from
 * the head of every page as alternates, so a crawler that reads one page finds them.
 */
export const LLMS_ALTERNATES = {
  "text/plain": [
    { url: "/llms.txt", title: `${SITE.name} for AI tools` },
    { url: "/llms-full.txt", title: `${SITE.name} in full, for AI tools` },
  ],
};

type PageMetadataInput = {
  /** The page's own address: its canonical link and the address its shared link names. */
  path: string;
  /** The page's title, which the layout's template finishes with the site's name. */
  title?: string;
  /** One or two sentences for search results and shared links. */
  description: string;
  /** The route has an `opengraph-image` file of its own. */
  ownCard?: boolean;
};

/**
 * The metadata every indexable page sets: its title and description, its one canonical address,
 * and the Open Graph and X card that a shared link shows. Next merges each key over the layout's
 * shallowly, so the cards are written out whole here rather than leaning on the layout's.
 *
 * A page's Open Graph block replaces the layout's whole, and with it the home page's card
 * (`app/opengraph-image.tsx`), so a page without a card of its own names that card here. A page with
 * an `opengraph-image` file beside it passes `ownCard`: an image named here would win over the file.
 */
export function pageMetadata({
  path,
  title,
  description,
  ownCard = false,
}: PageMetadataInput): Metadata {
  const shared = title ? `${title} · ${SITE.name}` : DEFAULT_TITLE;
  const images = ownCard ? {} : { images: [DEFAULT_IMAGE] };
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path, types: LLMS_ALTERNATES },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: OG_LOCALE,
      url: path,
      title: shared,
      description,
      ...images,
    },
    twitter: { card: "summary_large_image", title: shared, description, ...images },
  };
}
