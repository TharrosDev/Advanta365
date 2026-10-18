import type { ReactNode } from "react";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Sentences } from "@/components/ui/sentences";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { OFFER, TOOLKIT } from "@/lib/site";
import styles from "./reasons-band.module.css";

const TITLE = "Proven, yours,\nand 90\u00a0percent done.";

type Reason = {
  key: string;
  figure: string;
  caption: string;
  /** Drawn under the caption: what the figure counts, as blocks. */
  tally?: ReactNode;
  title: string;
  body: string;
  /** The alternative this reason beats. */
  instead: string;
};

/**
 * The three reasons, each one set against the alternative it beats (PRODUCT.md, Positioning): AI
 * output is plausible but unproven, a consultant's playbook is proven but rented, and the toolkit
 * starts the buyer 90 percent of the way there. The price is read from `OFFER`.
 */
const REASONS: readonly Reason[] = [
  {
    key: "proven",
    figure: TOOLKIT.experience,
    caption: "of client rollouts",
    tally: (
      <Tally
        total={4}
        filled={4}
        size="sm"
        animate
        label="Four passes: built, delivered, revised and re-delivered."
      />
    ),
    title: "Proven, not plausible.",
    body: "Built, delivered, revised and re-delivered with real clients by a Prosci-certified practitioner. AI drafts what sounds right; this is what held up with real users.",
    instead: "A blank AI prompt",
  },
  {
    key: "yours",
    figure: formatPrice(OFFER.priceCents, OFFER.currency),
    caption: "one purchase, not a fee per rollout",
    title: "Yours, not rented.",
    body: "A consultant’s playbook leaves when the consultant does. These files stay with you, to adapt and reuse on every wave.",
    instead: "A consultant’s playbook",
  },
  {
    key: "done",
    figure: "90%",
    caption: "of the work, before you start",
    tally: (
      <Tally
        total={10}
        filled={9}
        marked={10}
        size="sm"
        animate
        label="Ten blocks: nine are built into the toolkit and the tenth is yours to finish."
      />
    ),
    title: "Ready, not blank.",
    body: "Every phase, from the business case to making it stick. You tailor the last 10 percent, by hand or with your AI tools.",
    instead: "A blank page",
  },
];

/**
 * `#why`: the one black band of the page and the answer to its question. The label and the
 * statement, then the three reasons. Each reason is a column: a figure in Besley with a line under
 * it (and, for the four passes and the 90 percent, a small tally), the reason as an `h3`, one
 * sentence, and at its foot the alternative it beats. Stacked below 68em, with a hairline between
 * reasons; from 68em three columns on four shared rows (`subgrid`), so the headings, the sentences
 * and the feet line up across the page.
 */
export function ReasonsBand() {
  return (
    <Band id="why" surface="ink" pad="roomy" aria-labelledby="why-title">
      <Eyebrow>Why Advanta</Eyebrow>
      <h2 id="why-title" className={cx("type-statement", styles.statement)}>
        <Sentences text={TITLE} move />
      </h2>

      <ol className={styles.reasons}>
        {REASONS.map((reason, index) => (
          <Appear as="li" key={reason.key} order={index} className={styles.reason}>
            <div className={styles.proof}>
              <p className={cx("type-amount", styles.figure)}>
                <KeepCompounds text={reason.figure} />
              </p>
              <p className={cx("type-copy", styles.caption)}>{reason.caption}</p>
              {reason.tally ? <div className={styles.tally}>{reason.tally}</div> : null}
            </div>
            <h3 className={cx("type-section", styles.title)}>{reason.title}</h3>
            <p className={cx("type-copy", styles.body)}>{reason.body}</p>
            <p className={styles.instead}>
              <span className={cx("type-eyebrow", styles.insteadLabel)}>Instead of</span>
              <span className={cx("type-copy", styles.insteadValue)}>{reason.instead}</span>
            </p>
          </Appear>
        ))}
      </ol>
    </Band>
  );
}
