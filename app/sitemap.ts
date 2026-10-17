import type { MetadataRoute } from "next";
import { getPhases } from "@/lib/catalog/repository";
import { phaseHref } from "@/lib/catalog/search-params";
import { LEGAL, LEGAL_DOCUMENTS } from "@/lib/legal";
import { absoluteUrl } from "@/lib/seo/origin";
import { CONTACT_LINK, NAV, PURCHASE_LINK } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

/**
 * `/sitemap.xml`: every page the site wants found, at its canonical address and nothing else. A
 * filtered catalog, a pop-up (`view`), a checkout step, the licence link, the file addresses and the
 * redirected old addresses are left out: each names another page as canonical or is not to be
 * indexed. The home page names the card its shared link shows; the other pages' cards carry a
 * build hash in their addresses, and their pages name them.
 *
 * Only the legal pages carry a date, the day they last changed (`LEGAL.effectiveDate`): no other page
 * records one, and a made-up date would teach search engines to ignore them all.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const phases = await getPhases();

  const page = (path: string, priority: number, changeFrequency: Entry["changeFrequency"]) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  });

  return [
    { ...page("/", 1, "weekly"), images: [absoluteUrl("/opengraph-image")] },
    page(PURCHASE_LINK.href, 0.9, "monthly"),
    ...NAV.map(({ href }) => page(href, 0.8, "weekly")),
    ...phases.map((phase) => page(phaseHref(phase.slug), 0.7, "monthly")),
    page("/sample", 0.6, "monthly"),
    page(CONTACT_LINK.href, 0.5, "yearly"),
    ...LEGAL_DOCUMENTS.map((document) => ({
      ...page(document.href, 0.3, "yearly"),
      lastModified: LEGAL.effectiveDate,
    })),
  ];
}
