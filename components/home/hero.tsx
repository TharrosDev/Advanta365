import { HeroLiquid } from "@/components/graphics/hero-liquid/hero-liquid";
import { RevealWords } from "@/components/motion/reveal";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./home.module.css";

/**
 * The first screen: chrome ribbons behind a two-line headline and one call to action.
 *
 * Nothing here sits in a RevealGroup: the headline words (rise, 50ms apart) start the moment the
 * entry overlay lifts, which is also when the ribbons start to draw in. The ribbons are the first
 * child because their parent has to be `position: relative; overflow-x: clip` (see `.hero`).
 */
export function Hero() {
  return (
    <SectionShell height="full" innerClassName={styles.hero}>
      <HeroLiquid shadeFloor={0.6} />
      <h1 className={cx("t-display-fluid", styles.heroTitle)}>
        <RevealWords text={SITE.tagline} />
      </h1>
      <WipeButton href="/catalog" className={styles.heroCta}>
        Browse the catalog
      </WipeButton>
    </SectionShell>
  );
}
