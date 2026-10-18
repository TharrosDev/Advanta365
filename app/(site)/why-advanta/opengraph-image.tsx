import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { SITE, TOOLKIT } from "@/lib/site";

export const alt = `Why ${SITE.name}: proven rollout experience at a template price, refined across client rollouts over ${TOOLKIT.experience}.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    label: "Why Advanta",
    title: "Proven rollout experience, at a template price.",
    body: "Field-tested in real rollouts, yours to keep, and 90 percent done before you start.",
  });
}
