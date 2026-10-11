import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { cx } from "@/lib/cx";
import { HeroSheet, type HeroSpecimen } from "./hero-sheet";
import styles from "./home.module.css";

const HEADLINE = "Don’t start your M365 rollout from a blank prompt.";

const LEAD =
  "Advanta365 gives you the change management and user adoption toolkit behind real SharePoint Online rollouts. It’s field-tested over 30+ years, built by a Prosci-certified practitioner, and ready to use as is or tailor with AI.";

/**
 * The first screen, on the desk. Text in columns 1 to 7 from 68em: the headline, the lead and the
 * two calls to action (stacked, full width, below 40em). The hero sheet stands in columns 8 to 12,
 * top-aligned, and sits under the text on narrower screens. Natural height; nothing sits behind the
 * text and nothing on this screen moves except the sheet's own tally and caret. The lead never
 * breaks inside a hyphenated word ("field-tested").
 */
export function Hero({ specimen }: { specimen?: HeroSpecimen }) {
  return (
    <Band surface="desk" pad="none" className={styles.hero} innerClassName={styles.heroGrid}>
      <div className={styles.heroText}>
        <h1 className={cx("type-banner", styles.heroTitle)}>{HEADLINE}</h1>
        <p className={cx("type-lead", styles.heroLead)}>
          <KeepCompounds text={LEAD} />
        </p>
        <div className={styles.heroActions}>
          <Button variant="mark" size="lg" href="/catalog">
            Browse the catalog
          </Button>
          <Button variant="outline" size="lg" href="/sample">
            See a sample
          </Button>
        </div>
      </div>
      {specimen ? (
        <div className={styles.heroSheet}>
          <HeroSheet specimen={specimen} />
        </div>
      ) : null}
    </Band>
  );
}
