import { Appear } from "@/components/ui/appear";
import { Tally } from "@/components/ui/tally";
import { TextLink } from "@/components/ui/text-link";
import type { Phase } from "@/lib/catalog/schema";
import { cssVars, cx } from "@/lib/cx";
import { TOOLKIT } from "@/lib/site";
import styles from "./phase-line.module.css";

const TITLE = "The whole rollout, in seven phases";

const BODY = `From making the case through sustainment, plus training for ${TOOLKIT.trainingAudiences} audiences, a worked example and Copilot readiness material.`;

/**
 * The accessible name of the phase links and the only name this page gives them: the footer owns
 * "Rollout phases", and the home and sample pages use these words for the same links.
 */
const PHASES_LABEL = "Browse the sample catalog by phase";

/**
 * The seven phases in rollout order, under a heading and a sentence. From 68em the line is a tally
 * of seven inked blocks, each with its numeral, and the phase names stand under the blocks on the
 * same seven-column grid with the same 7px gap, so a name is under its own block. Below 68em the
 * tally is not drawn: the names are a list of 44px rows, each with its numeral in a small deep-desk
 * tile at its left, one column on a phone and two from 40em. The tally is decoration; the links are
 * the whole of the content, and each one's name is exactly the phase's name.
 */
export function PhaseLine({ phases, className }: { phases: readonly Phase[]; className?: string }) {
  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.head}>
        <h3 className="type-section">{TITLE}</h3>
        <p className={cx("type-copy", styles.body)}>{BODY}</p>
      </div>

      <div className={styles.line}>
        <Tally
          total={phases.length}
          filled={phases.length}
          numerals
          size="lg"
          animate
          className={styles.tally}
        />
        <nav aria-label={PHASES_LABEL}>
          <ol className={styles.names} style={cssVars({ "--count": phases.length })}>
            {phases.map((phase, index) => (
              <Appear as="li" key={phase.slug} order={index} className={styles.name}>
                <span className={styles.numeral} aria-hidden="true">
                  {index + 1}
                </span>
                <TextLink href={`/phases/${phase.slug}`} className={cx("type-item", styles.link)}>
                  {phase.name}
                </TextLink>
              </Appear>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
