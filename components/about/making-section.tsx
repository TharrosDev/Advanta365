import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Tally } from "@/components/ui/tally";
import type { Phase } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { TOOLKIT } from "@/lib/site";
import { PhaseLine } from "./phase-line";
import { SectionHead } from "./section-head";
import styles from "./making-section.module.css";

const TITLE = `Refined across ${TOOLKIT.experience} of client rollouts.`;

// Who built it: the certification describes the practitioner and never the product.
const BUILT_BY = "Built by a Prosci-certified practitioner.";

const PASSES =
  "The toolkit is what was built, delivered, revised and re-delivered with real clients.";

/**
 * The four passes the content went through, as the owner words them. Each row is its own verb and a
 * sentence of what that pass was; no figure from a real rollout is quoted, because none is on hand.
 */
const STEPS = [
  {
    verb: "Built",
    body: "Written from the work every Microsoft 365 or SharePoint Online rollout needs: the business case, the strategy, the stakeholder map, the comms plan, the champion network, the training and the cutover playbook.",
  },
  {
    verb: "Delivered",
    body: "Used with real clients on real rollouts, in front of real users, sponsors and skeptical records managers.",
  },
  {
    verb: "Revised",
    body: "Changed wherever a rollout showed that it needed changing.",
  },
  {
    verb: "Re-delivered",
    body: "Taken into the next rollout, and the next.",
  },
] as const;

/**
 * `#made`: how the toolkit was made, on paper. The head (label, statement, who built it and the
 * four passes in one sentence) stands in columns 1 to 4 from 68em and stays under the bar while the
 * ledger scrolls past it in columns 6 to 12. The ledger has one row to a pass: the verb in the
 * document's face, a four-block tally that fills one more block with each pass, and a sentence.
 * Under both, across the page, stand the eleven phases (`PhaseLine`). No metric of any kind is
 * printed.
 */
export function MakingSection({ phases }: { phases: readonly Phase[] }) {
  return (
    <Band id="made" surface="paper" aria-labelledby="made-title">
      <div className={styles.grid}>
        {/* The slot is as tall as the ledger, so the head stays under the bar only that far. */}
        <div className={styles.slot}>
          <SectionHead
            id="made-title"
            label="How it was made"
            title={TITLE}
            size="page"
            className={styles.head}
          >
            <p>{BUILT_BY}</p>
            <p>
              <KeepCompounds text={PASSES} />
            </p>
          </SectionHead>
        </div>

        <BandedList as="ol" className={styles.steps}>
          {STEPS.map((step, index) => (
            <BandedRow key={step.verb} className={styles.step}>
              <h3 className={cx("type-section", styles.verb)}>
                <KeepCompounds text={step.verb} />
              </h3>
              <span className={styles.passes}>
                <Tally total={STEPS.length} filled={index + 1} size="sm" animate />
              </span>
              <Appear as="p" className={cx("type-copy", styles.body)}>
                {step.body}
              </Appear>
            </BandedRow>
          ))}
        </BandedList>

        <PhaseLine phases={phases} className={styles.phases} />
      </div>
    </Band>
  );
}
