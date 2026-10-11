import { BundleCard } from "@/components/catalog/bundle-card";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import type { Bundle } from "@/lib/catalog/schema";
import styles from "./home.module.css";

export type FeaturedBundle = { bundle: Bundle; count: number; savings: number };

/**
 * `#bundles`: the intro pinned to the top of the viewport-high block and the featured bundles
 * pinned to its bottom (from 768px), the way the reference spreads its second section.
 *
 * Reveal order: label 0, title word 1, body coarse 2 in one group; the cards 0..n-1 and then the
 * "All bundles" link in a second group.
 */
export function BundlesSection({ items }: { items: FeaturedBundle[] }) {
  return (
    <SectionShell id="bundles" height="full" innerClassName={styles.bundles}>
      <RevealGroup className={styles.bundlesIntro}>
        <SectionIntro
          label="Bundles"
          title="Bundles"
          body="Curated sets for a whole phase or a whole rollout, priced below the templates bought one at a time."
        />
      </RevealGroup>
      <RevealGroup className={styles.bundlesBlock}>
        {items.length > 0 ? (
          <ul className={styles.bundlesGrid}>
            {items.map(({ bundle, count, savings }, index) => (
              <Reveal key={bundle.slug} as="li" effect="fade-up" index={index}>
                <BundleCard
                  bundle={bundle}
                  templateCount={count}
                  savingsCents={savings}
                  headingLevel="h3"
                />
              </Reveal>
            ))}
          </ul>
        ) : null}
        <Reveal as="div" effect="fade-up" index={items.length} className={styles.sectionAction}>
          <WipeButton href="/bundles" arrow="right">
            All bundles
          </WipeButton>
        </Reveal>
      </RevealGroup>
    </SectionShell>
  );
}
