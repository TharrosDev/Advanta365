import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { countWord } from "@/lib/format";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { SITE } from "@/lib/site";

export const alt = `The ${SITE.name} catalog: change management templates for every phase of a Microsoft 365 rollout.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    label: "Catalog",
    title: "Templates for every phase of a Microsoft 365 rollout.",
    body: `Browse by phase, type, app and audience. ${countWord(FREE_SAMPLE_COUNT, "capital")} are free samples.`,
  });
}
