import { BundleCard } from "@/components/catalog/bundle-card";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { ShelfHead } from "@/components/ui/shelf-head";
import type { PhaseCoverage } from "@/lib/catalog/coverage";
import type { CoverSpec } from "@/lib/catalog/covers";
import type { Bundle } from "@/lib/catalog/schema";
import styles from "./home.module.css";

export type FeaturedBundle = {
  bundle: Bundle;
  count: number;
  savings: number;
  coverage: PhaseCoverage[];
  /** The covers that stand in the folder: `folderCovers` of the bundle's templates. */
  covers: CoverSpec[];
};

/**
 * `#bundles`: on the desk. The head stands at the left, with the link to every bundle under its
 * lead. From 68em the first featured bundle is a large folder in columns 1 to 6 and the others
 * are the rows of a ledger in columns 7 to 12; narrower, the folder stands over the ledger. Each
 * bundle shows the phases its templates reach.
 */
export function BundlesSection({ items }: { items: FeaturedBundle[] }) {
  const [first, ...others] = items;

  return (
    <Band id="bundles" surface="desk">
      <ShelfHead
        stack
        title="Bundles"
        body="Curated sets for a whole phase or a whole rollout, priced below the same pieces bought one at a time."
        action={
          <Button variant="outline" href="/bundles" arrow>
            All bundles
          </Button>
        }
      />
      {first ? (
        <div className={styles.bundles}>
          <div className={styles.bundleFeature}>
            <BundleCard
              bundle={first.bundle}
              templateCount={first.count}
              savingsCents={first.savings}
              coverage={first.coverage}
              covers={first.covers}
              headingLevel="h3"
              layout="feature"
            />
          </div>
          {others.length > 0 ? (
            <ul className={styles.bundleRows}>
              {others.map(({ bundle, count, savings, coverage, covers }) => (
                <li key={bundle.slug}>
                  <BundleCard
                    bundle={bundle}
                    templateCount={count}
                    savingsCents={savings}
                    coverage={coverage}
                    covers={covers}
                    headingLevel="h3"
                    layout="row"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Band>
  );
}
