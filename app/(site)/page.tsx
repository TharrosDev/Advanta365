import { BuiltForBand } from "@/components/home/built-for-band";
import { BundlesSection } from "@/components/home/bundles-section";
import { FeaturedSection } from "@/components/home/featured-section";
import { Hero } from "@/components/home/hero";
import { PhasesSection } from "@/components/home/phases-section";
import { PracticeSection } from "@/components/home/practice-section";
import { ValuesSection } from "@/components/home/values-section";
import { EntryOverlay } from "@/components/entry/entry-overlay";
import { SwirlBand } from "@/components/graphics/metallic-swirl/swirl-band";
import { ThemeScroll } from "@/components/motion/theme-scroll";
import { PageShell } from "@/components/ui/page-shell";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles, getPhases, getTemplates } from "@/lib/catalog/repository";

export default async function Home() {
  const [phases, templates, bundles] = await Promise.all([
    getPhases(),
    getTemplates(),
    getBundles(),
  ]);
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  const featuredTemplates = templates.filter((template) => template.featured).slice(0, 6);
  const featuredBundles = await Promise.all(
    bundles
      .filter((bundle) => bundle.featured)
      .slice(0, 3)
      .map(async (bundle) => {
        const contents = await getBundleTemplates(bundle);
        return { bundle, count: contents.length, savings: bundleSavingsCents(bundle, contents) };
      }),
  );

  return (
    <>
      <PageShell bleed>
        <Hero />
        {/* The four sections between the hero and Values share one sticky swirl backdrop. */}
        <SwirlBand stops={["phases", "bundles", "featured", "practice"]}>
          <PhasesSection phases={phases} />
          <BundlesSection items={featuredBundles} />
          <FeaturedSection templates={featuredTemplates} phaseNames={phaseNames} />
          <PracticeSection />
        </SwirlBand>
        <ValuesSection />
        <BuiltForBand />
      </PageShell>
      {/* Turns the whole page dark once #practice passes the middle of the viewport. */}
      <ThemeScroll targetId="practice" />
      {/* Hard load of "/" only: on the client it renders nothing without the entry attribute. */}
      <EntryOverlay />
    </>
  );
}
