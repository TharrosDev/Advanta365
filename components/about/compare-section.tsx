import type { ReactNode } from "react";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { Tag } from "@/components/ui/tag";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { OFFER, TOOLKIT } from "@/lib/site";
import { SectionHead } from "./section-head";
import styles from "./compare-section.module.css";

const TITLE = "Three ways to start.\nOne starts 90 percent of the way there.";

const CRITERIA = ["Starting point", "Field-tested?", "Cost", "Who owns the result"] as const;

/** The line over the toolkit's button: what the other two sheets cannot say of themselves. */
const FOOT = "Built to be fed into AI tools.";

/** A cost as a figure, what it is per, and whether it is the owner's estimate. */
function Cost({ figure, per, estimate }: { figure: string; per: string; estimate?: boolean }) {
  return (
    <>
      <span className={cx("type-item", styles.figure)}>
        <KeepCompounds text={figure} />
      </span>
      <span className={styles.per}>
        {per}
        {estimate ? <Tag className={styles.estimate}>Estimate</Tag> : null}
      </span>
    </>
  );
}

type Option = {
  key: string;
  name: string;
  /** One cell for each of `CRITERIA`, in order. */
  cells: readonly ReactNode[];
  /** The toolkit's sheet: a depth above the others, in the wash, the highlighter on its head. */
  ours?: boolean;
};

/**
 * What each way to start is, in the words of PRODUCT.md: AI output is plausible but unproven, a
 * consultant's playbook is proven but rented, and the toolkit is files the buyer keeps and adapts.
 * The costs of the two alternatives are the owner's estimates and are marked as estimates; the
 * toolkit's cost is its price, read from `OFFER`, the only place the price is written. No licence
 * term is promised: none is decided.
 */
const OPTIONS: readonly Option[] = [
  {
    key: "ai",
    name: "Build it yourself with AI",
    cells: [
      "A blank prompt",
      "No. Plausible, but unproven",
      <Cost
        key="cost"
        figure="8 to 14 person-months"
        per="to build internally. Low in dollars, high in staff time."
        estimate
      />,
      "You build it",
    ],
  },
  {
    key: "consultant",
    name: "Hire a consultant",
    cells: [
      "The consultant’s own playbook",
      "Yes, proven. But you rent it",
      <Cost key="cost" figure="$150K to $400K" per="per rollout." estimate />,
      "You rent the playbook",
    ],
  },
  {
    key: "toolkit",
    name: OFFER.name,
    ours: true,
    cells: [
      `${TOOLKIT.playbooks} playbooks, ${TOOLKIT.templates} templates, ${TOOLKIT.fieldGuides} field guides and training for ${TOOLKIT.trainingAudiences} audiences`,
      "Yes. Refined across real rollouts",
      <Cost key="cost" figure={formatPrice(OFFER.priceCents)} per="one purchase." />,
      "You keep the files and adapt them",
    ],
  },
];

/** Under the sheets: the alternatives' costs are estimates, and the toolkit's is its price. */
const NOTE =
  "The costs of the two alternatives are our estimates, not market data. The toolkit’s cost is its price.";

/**
 * `#compare`: the three ways to start, as three sheets of paper, linked from the home page. Each
 * sheet is headed by the option's name and is a `dl`: one row to a criterion, the criterion over
 * its answer. From 68em the sheets stand side by side and share the rows of one grid (`subgrid`),
 * so a criterion lines up across all three; the toolkit's sheet is the last, in the wash with the
 * highlighter on its head, a depth above the others and pointer-lit, and is one row taller for its
 * line and button. Below 68em the sheets lie one under another in the same order. The costs of
 * the alternatives are marked as the owner's estimates, here and in the note under the sheets.
 */
export function CompareSection() {
  return (
    <Band id="compare" surface="paper" aria-labelledby="compare-title">
      <SectionHead id="compare-title" label="Your alternatives" title={TITLE} />

      <div className={styles.sheets}>
        {OPTIONS.map((option, index) => (
          <Appear
            key={option.key}
            move="settle"
            order={index}
            className={styles.slot}
            // The slot is the lit sheet's scope: it stands where the sheet rests, so the sheet that
            // has lifted does not drop and lift again under a pointer at its lower edge.
            data-lit-scope={option.ours ? "" : undefined}
          >
            <PaperSheet
              role="group"
              aria-labelledby={`compare-${option.key}`}
              depth={option.ours ? 3 : 2}
              lit={option.ours}
              className={cx(styles.sheet, option.ours && styles.ours)}
            >
              <h3 id={`compare-${option.key}`} className={cx("type-section", styles.head)}>
                {option.name}
              </h3>
              <dl className={styles.facts}>
                {CRITERIA.map((criterion, row) => (
                  <div key={criterion} className={styles.fact}>
                    <dt className={cx("type-eyebrow", styles.criterion)}>{criterion}</dt>
                    <dd className={cx("type-copy", styles.answer)}>{option.cells[row]}</dd>
                  </div>
                ))}
              </dl>
              {option.ours ? (
                <div className={styles.foot}>
                  <p className={cx("type-copy", styles.footLine)}>
                    <Icon name="tick" className={styles.tick} />
                    {FOOT}
                  </p>
                  <Button href="/purchase" arrow>
                    See the complete toolkit
                  </Button>
                </div>
              ) : null}
            </PaperSheet>
          </Appear>
        ))}
      </div>

      <p className={cx("type-note", styles.note)}>{NOTE}</p>
    </Band>
  );
}
