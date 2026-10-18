import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PageShift } from "@/components/ui/page-shift";
import type { Phase, Template } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { PURCHASE_LINK, TOOLKIT } from "@/lib/site";
import { HeroHeadline } from "./hero-headline";
import { HeroStage } from "./hero-stage";
import styles from "./home.module.css";
import { ProofStrip } from "./proof-strip";

/**
 * The headline in two parts: the second stands on the highlighter. Together they are the h1. The
 * last word of it turns on a split-flap board through `BLANKS`, with a control under it that
 * pauses it (`HeroHeadline`); the first of them is the one that stands at load and the one the
 * heading is read with.
 */
const HEADLINE = "Don’t start your M365 rollout from a";
const BLANKS = ["prompt", "page", "project", "document", "plan", "design", "idea"] as const;

const LEAD = `The change management and user adoption toolkit behind real SharePoint Online rollouts: field-tested over ${TOOLKIT.experience}, built by a Prosci-certified practitioner, ready to use as is or tailor with AI.`;

/** The buttons follow the lead by 80ms: the stagger step is 70ms, so their turn is 8/7 of one. */
const ACTIONS_TURN = 8 / 7;

/**
 * The first screen: a paper band about as tall as the window. Centred, top to bottom: the headline
 * and the lead and the two buttons; the stage, the six free samples (`samples`, with `phases` for
 * the numeral on each cover) as a hand of finished documents (`HeroStage`); and the proof strip as
 * the band's foot. From 68em all of it fits the window, down to a window 720px tall. The headline
 * never moves, but its last word turns every few seconds, letter by letter (`SplitFlap`), until
 * the small control under it pauses it; the lead and the buttons drift in at load. The lead never breaks inside a
 * hyphenated word.
 */
export function Hero({
  samples,
  phases,
}: {
  samples: readonly Template[];
  phases: readonly Phase[];
}) {
  return (
    <Band surface="paper" pad="none" className={styles.hero} innerClassName={styles.heroInner}>
      <PageShift>
        <div className={styles.heroText}>
          <div className={styles.heroWords}>
            <HeroHeadline headline={HEADLINE} blanks={BLANKS} />
            <Appear as="p" when="load" order={0} className={cx("type-lead", styles.heroLead)}>
              <KeepCompounds text={LEAD} />
            </Appear>
          </div>
          <Appear when="load" order={ACTIONS_TURN} className={styles.heroActions}>
            <Button variant="mark" size="lg" href={PURCHASE_LINK.href}>
              Get the toolkit
            </Button>
            <Button variant="outline" size="lg" href="/catalog?free=1">
              See the free samples
            </Button>
          </Appear>
        </div>
      </PageShift>
      <HeroStage samples={samples} phases={phases} />
      <ProofStrip />
    </Band>
  );
}
