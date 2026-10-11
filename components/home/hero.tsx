import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PageShift } from "@/components/ui/page-shift";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/** The headline in two parts: the second stands on the highlighter. Together they are the h1. */
const HEADLINE = "Don’t start your M365 rollout from a";
const HEADLINE_MARKED = "blank prompt.";

const LEAD =
  "Advanta365 gives you the change management and user adoption toolkit behind real SharePoint Online rollouts. It’s field-tested over 30+ years, built by a Prosci-certified practitioner, and ready to use as is or tailor with AI.";

/** The buttons follow the lead by 80ms: the stagger step is 70ms, so their turn is 8/7 of one. */
const ACTIONS_TURN = 8 / 7;

/**
 * The first screen: the tank. On paper, with the hero ink behind it. From 68em the text stands in
 * columns 1 to 7, centred in a band about as tall as the window, and columns 8 to 12 are left
 * empty as open water, which is where the ink falls. Narrower, the open water is a block under the
 * buttons, so no drop ever crosses the words. The headline, the lead and the buttons are one calm
 * rectangle for the ink. The headline never animates; the lead and the buttons drift in at load.
 * Nothing else here moves but the ink. The lead never breaks inside a hyphenated word.
 */
export function Hero() {
  return (
    <Band
      surface="paper"
      pad="none"
      className={styles.hero}
      innerClassName={styles.heroGrid}
      backdrop={
        <InkBackdrop scene="hero" still={{ wide: "hero-wide", tall: "hero-tall" }} edges="bottom" />
      }
    >
      <PageShift>
        <div className={styles.heroText} data-ink-calm="text">
          <h1 className={cx("type-hero", styles.heroTitle)}>
            {HEADLINE} <span data-mark="">{HEADLINE_MARKED}</span>
          </h1>
          <Appear as="p" when="load" order={0} className={cx("type-lead", styles.heroLead)}>
            <KeepCompounds text={LEAD} />
          </Appear>
          <Appear when="load" order={ACTIONS_TURN} className={styles.heroActions}>
            <Button variant="mark" size="lg" href="/catalog">
              Browse the catalog
            </Button>
            <Button variant="outline" size="lg" href="/sample">
              See a sample
            </Button>
          </Appear>
        </div>
      </PageShift>
      <div data-ink-anchor="open" aria-hidden="true" className={styles.heroOpen} />
    </Band>
  );
}
