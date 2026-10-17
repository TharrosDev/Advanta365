import { Appear } from "@/components/ui/appear";
import { Tally } from "@/components/ui/tally";
import { TextLink } from "@/components/ui/text-link";
import { numberedPhases } from "@/lib/catalog/coverage";
import type { Phase } from "@/lib/catalog/schema";
import { phaseHref } from "@/lib/catalog/search-params";
import { cssVars, cx } from "@/lib/cx";
import { TOOLKIT } from "@/lib/site";
import styles from "./phase-line.module.css";

const TITLE = "The whole rollout, in eleven phases";

const BODY = `From defining the change to making it stick, plus training for ${TOOLKIT.trainingAudiences} audiences, a worked example and Copilot readiness material.`;

/**
 * The accessible name of the step links and the only name this page gives them: the footer owns
 * "Rollout phases", and the home and sample pages use these words for the same links.
 */
const PHASES_LABEL = "Browse the sample catalog by phase";

/**
 * The eleven numbered phases in rollout order, under a heading and a sentence, then the two
 * sections that are not steps (Start here, Used at every step) in one line under them. Where the
 * line is 72rem wide or more (its own width, a container query) it is a tally of eleven inked blocks, each with its numeral, and the phases' short labels
 * stand under the blocks on the same grid with the same 7px gap, so a label is under its own
 * block. Narrower, the tally is not drawn: the steps are a list of 44px rows with their plain
 * names, each with its numeral in a small deep-desk tile at its left, one column on a phone and
 * two from 40em. The tally is decoration; the links are the whole of the content, and each one's
 * accessible name is exactly the step's plain name.
 */
export function PhaseLine({ phases, className }: { phases: readonly Phase[]; className?: string }) {
  const steps = numberedPhases(phases);
  const others = phases.filter((phase) => phase.number === undefined);

  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.head}>
        <h3 className="type-section">{TITLE}</h3>
        <p className={cx("type-copy", styles.body)}>{BODY}</p>
      </div>

      <nav aria-label={PHASES_LABEL} className={styles.line}>
        <Tally
          total={steps.length}
          filled={steps.length}
          numerals
          size="lg"
          animate
          className={styles.tally}
        />
        <ol className={styles.names} style={cssVars({ "--count": steps.length })}>
          {steps.map((phase, index) => (
            <Appear as="li" key={phase.slug} order={index} className={styles.name}>
              <span className={styles.numeral} aria-hidden="true">
                {phase.number}
              </span>
              <TextLink href={phaseHref(phase.slug)} className={cx("type-item", styles.link)}>
                <span className={styles.plain}>{phase.name}</span>
                <span className={styles.short} aria-hidden="true">
                  {phase.label}
                </span>
              </TextLink>
            </Appear>
          ))}
        </ol>
        {others.length > 0 ? (
          <p className={cx("type-copy", styles.others)}>
            Plus{" "}
            {others.map((phase, index) => (
              <span key={phase.slug}>
                {index > 0 ? " and " : null}
                <TextLink href={phaseHref(phase.slug)}>{phase.name}</TextLink>
              </span>
            ))}
            .
          </p>
        ) : null}
      </nav>
    </div>
  );
}
