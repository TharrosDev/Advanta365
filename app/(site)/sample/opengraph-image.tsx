import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { SITE } from "@/lib/site";

export const alt = `A complete worked example from ${SITE.name}: a change management strategy for a fictional 10,000-person organization.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    label: "Worked example",
    title: "A complete change management strategy.",
    body: "For the fictional Meridian Group, about 10,000 employees: how the pieces of a rollout fit together.",
  });
}
