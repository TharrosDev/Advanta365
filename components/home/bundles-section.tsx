import { BundleCard } from "@/components/catalog/bundle-card";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { ShelfHead } from "@/components/ui/shelf-head";
import type { PhaseCoverage } from "@/lib/catalog/coverage";
import type { Bundle } from "@/lib/catalog/schema";
import styles from "./home.module.css";

export type FeaturedBundle = {
  bundle: Bundle;
  count: number;
  savings: number;
  coverage: PhaseCoverage[];
};

/**
 * `#bundles`: a second shelf on paper. The header has no eyebrow, because it would only repeat the
 * title, and carries the link to every bundle. The featured bundles stand below it as folders, each
 * with the phases its templates reach: three across from 68em, two from 40em, one below.
 */
export function BundlesSection({ items }: { items: FeaturedBundle[] }) {
  return (
    <Band id="bundles" surface="paper">
      <ShelfHead
        title="Bundles"
        body="Curated sets for a whole phase or a whole rollout, priced below the same pieces bought one at a time."
        action={
          <Button variant="outline" href="/bundles" arrow>
            All bundles
          </Button>
        }
      />
      {items.length > 0 ? (
        <ul className={styles.cardGrid}>
          {items.map(({ bundle, count, savings, coverage }) => (
            <li key={bundle.slug} className={styles.cardItem}>
              <BundleCard
                bundle={bundle}
                templateCount={count}
                savingsCents={savings}
                coverage={coverage}
                headingLevel="h3"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </Band>
  );
}
