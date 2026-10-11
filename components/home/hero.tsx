import { HeroLiquid } from "@/components/graphics/hero-liquid/hero-liquid";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./home.module.css";

/**
 * The line break is a space below 1024px and a real break from there (`white-space: pre-line` on
 * `.heroTitle`), so the heading's text is the plain sentence either way.
 */
const HEADLINE = "Don’t start your M365 rollout\nfrom a blank prompt.";

const LEAD =
  "Advanta365 gives you the change management and user adoption toolkit behind real SharePoint Online rollouts. It’s field-tested over 30+ years, built by a Prosci-certified practitioner, and ready to use as is or tailor with AI.";

/**
 * The first screen: chrome ribbons behind the headline, the lead paragraph and two calls to action.
 *
 * The copy sits in the top half of the hero (see `.hero`), above the trunk of the ribbons. The
 * ribbons are the first child because their parent has to be `position: relative; overflow-x: clip`.
 *
 * Nothing here sits in a RevealGroup: the sequence starts the moment the entry overlay lifts, which
 * is also when the ribbons start to draw in. Order: headline words 0..8 on the fine step, the lead on
 * the first coarse step after the last word (6), the actions one step later (7).
 */
export function Hero() {
  const leadIndex = coarseIndexAfter(countWords(HEADLINE));

  return (
    <SectionShell height="full" innerClassName={styles.hero}>
      <HeroLiquid shadeFloor={0.6} />
      <div className={styles.heroCopy}>
        <h1 className={cx("t-display-fluid", styles.heroTitle)}>
          <RevealWords text={HEADLINE} />
        </h1>
        <Reveal
          as="p"
          effect="fade"
          index={leadIndex}
          className={cx("t-body-large", styles.heroLead)}
        >
          {LEAD}
        </Reveal>
        <Reveal as="div" effect="fade-up" index={leadIndex + 1} className={styles.heroActions}>
          <WipeButton href="/catalog">Browse the catalog</WipeButton>
          <WipeButton href="/sample">See a sample</WipeButton>
        </Reveal>
      </div>
    </SectionShell>
  );
}
