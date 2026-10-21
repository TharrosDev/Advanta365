import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { SITE, TOOLKIT } from "@/lib/site";

// The card of the home page, and of every page that has none of its own (the contact and legal
// pages, the 404).
export const alt = `${SITE.name}: ${SITE.summary}. Change management and user adoption content for Microsoft 365 and SharePoint Online.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    label: "For Microsoft 365 and SharePoint Online",
    title: SITE.summary,
    body: `The toolkit behind real rollouts, refined over ${TOOLKIT.experience}: ready to use as is or tailor with AI.`,
  });
}
