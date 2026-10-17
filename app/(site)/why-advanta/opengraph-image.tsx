import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { SITE, TOOLKIT } from "@/lib/site";

export const alt = `Why ${SITE.name}: change content that has met real users, refined across client rollouts over ${TOOLKIT.experience}.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    label: "Why Advanta",
    title: "Change content that has met real users.",
    body: "It gets you 90 percent of the way there. AI or a practitioner finishes the last 10 percent.",
  });
}
