import type { Metadata } from "next";
import { BundleCard } from "@/components/catalog/bundle-card";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles, getPhases } from "@/lib/catalog/repository";
import styles from "./page.module.css";

// The page lead and the metadata description are the same two sentences.
const LEAD =
  "Curated sets for a whole phase or a whole rollout. Each bundle costs less than the same pieces bought one at a time.";

export const metadata: Metadata = {
  title: "Bundles",
  description: LEAD,
};

/**
 * Every bundle as a row of a ledger, featured ones first, starting 42px under the lead: its folder
 * at the left, then the title, the summary and which of the rollout phases its templates reach, and
 * the price with the saving.
 */
export default async function BundlesPage() {
  const [bundles, phases] = await Promise.all([getBundles(), getPhases()]);
  const cards = await Promise.all(
    [...bundles]
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .map(async (bundle) => {
        const contents = await getBundleTemplates(bundle);
        return {
          bundle,
          count: contents.length,
          savings: bundleSavingsCents(bundle, contents),
          coverage: phaseCoverage(phases, contents),
        };
      }),
  );

  return (
    <>
      <TitleBlock title="Bundles" lead={LEAD} ink flush />
      <Band as="div" surface="paper" pad="tight">
        <ul className={styles.rows}>
          {cards.map(({ bundle, count, savings, coverage }) => (
            <li key={bundle.slug}>
              <BundleCard
                bundle={bundle}
                templateCount={count}
                savingsCents={savings}
                coverage={coverage}
                headingLevel="h2"
              />
            </li>
          ))}
        </ul>
      </Band>
    </>
  );
}
