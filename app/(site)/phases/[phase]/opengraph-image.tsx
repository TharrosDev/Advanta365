import { numberedPhases } from "@/lib/catalog/coverage";
import { getPhase, getPhases } from "@/lib/catalog/repository";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { SITE } from "@/lib/site";

export const alt = `A phase of a Microsoft 365 rollout in the ${SITE.name} change management toolkit.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await getPhases()).map((phase) => ({ phase: phase.slug }));
}

/**
 * A section's card: its name and summary, and for a numbered phase its numeral and its place among
 * the phases. A slug that names no section draws the toolkit's own card.
 */
export default async function Image({ params }: { params: Promise<{ phase: string }> }) {
  const [phase, phases] = await Promise.all([getPhase((await params).phase), getPhases()]);
  const total = numberedPhases(phases).length;
  if (!phase) {
    return ogCard({ label: "The toolkit", title: SITE.tagline });
  }
  const first = numberedPhases(phases)[0];
  return ogCard({
    label:
      phase.number === undefined
        ? phase.order < (first?.order ?? 0)
          ? "Before phase 1"
          : `Alongside phases 1 to ${total}`
        : `Phase ${phase.number} of ${total}`,
    title: phase.name,
    body: phase.summary,
    ...(phase.number === undefined ? {} : { aside: String(phase.number) }),
  });
}
