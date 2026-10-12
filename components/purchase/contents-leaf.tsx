import { Appear } from "@/components/ui/appear";
import { BandedList } from "@/components/ui/banded-list";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { Note } from "@/components/ui/note";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import { SITE, TOOLKIT } from "@/lib/site";
import styles from "./contents-leaf.module.css";

/**
 * The number of audiences the toolkit trains. `TOOLKIT` writes it as a word; this table stops
 * compiling when that word changes, so the figure cannot drift from the sentence beside it.
 */
const AUDIENCES = { three: 3 } as const satisfies Record<typeof TOOLKIT.trainingAudiences, number>;

/** A part of the toolkit: what it is, how many of it there are, and a line to say what they are. */
type Part = { label: string; count: number; words: string };

/**
 * What the full toolkit holds, with the counts read from `TOOLKIT`. This is not a count of the
 * catalog, which lists sample content.
 */
const PARTS: readonly Part[] = [
  { label: "Playbooks", count: TOOLKIT.playbooks, words: "Covering every phase of the rollout." },
  {
    label: "Templates",
    count: TOOLKIT.templates,
    words: "Ready to use: emails, plans, checklists, worksheets and workshop kits.",
  },
  {
    label: "Field guides",
    count: TOOLKIT.fieldGuides,
    words: "For change practitioners and IM partners.",
  },
  { label: "Job aids", count: TOOLKIT.jobAids, words: "To go with the training." },
  {
    label: "Training",
    count: AUDIENCES[TOOLKIT.trainingAudiences],
    words: `For ${TOOLKIT.trainingAudiences} audiences: end users, Site Owners and IM Representatives, with facilitator guides and learning guides.`,
  },
];

/**
 * The contents of the toolkit as one loose leaf of paper, laid beside the folder it comes in: a
 * sheet with a folded corner and the light under the pointer, headed by the `h2` "What is inside".
 * Under the heading, a ruled ledger (a `dl`) of five parts. Each opens with its count as a large
 * figure, printed as it is and never counted up, with a highlighter stroke drawn under it (always
 * under the ink of the digits); the last is the number of audiences the training is for. Each
 * row's term carries an ink tick. Under the ledger the sheet's foot: the Checkout button, which is
 * not built yet (it looks disabled and says so, and stays in the tab order so a keyboard reaches
 * its words), the address to write to until it is, and the note that the catalog is sample content.
 *
 * The leaf is opaque paper, so its words need no calm zone for the ink behind the stage. Every
 * measure follows the sheet's own width (`cqi`), so the leaf is one object from a phone to its
 * 34rem. The entrance is the sheet settling, the rows after it, each figure's stroke last; the
 * wrapper around the sheet is its scope for the light, so the sheet does not flicker where it has
 * lifted away from the pointer. Hook: `data-count` on each figure.
 */
export function ContentsLeaf({ className }: { className?: string }) {
  return (
    <div data-lit-scope="" className={cx(styles.scope, className)}>
      <PaperSheet size="lg" depth={2} lit className={styles.sheet}>
        <span aria-hidden="true" className={styles.flap} />
        <div className={styles.page}>
          <Eyebrow>Contents</Eyebrow>
          <h2 className={cx("type-page", styles.title)}>What is inside</h2>

          <BandedList as="dl" className={styles.ledger}>
            {PARTS.map((part, index) => (
              <Appear
                as="div"
                key={part.label}
                when="load"
                order={index + 2}
                className={styles.row}
              >
                <dt className={cx("type-eyebrow", styles.term)}>
                  <Icon name="tick" size={16} />
                  {part.label}
                </dt>
                <dd className={styles.figure}>
                  <span data-count="" className={styles.count}>
                    <Appear
                      as="span"
                      move="grow"
                      when="load"
                      order={index + 4}
                      aria-hidden="true"
                      className={styles.stroke}
                    />
                    {part.count}
                  </span>
                </dd>
                <dd className={cx("type-note", styles.words)}>{part.words}</dd>
              </Appear>
            ))}
          </BandedList>

          <Appear when="load" order={PARTS.length + 2} className={styles.foot}>
            <Button size="lg" fullWidth aria-disabled="true">
              Checkout coming soon
            </Button>
            <p className={cx("type-copy", styles.contact)}>
              Questions, or want to buy by purchase order? Write to{" "}
              <TextLink href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</TextLink>.
            </p>
            <Note>
              Beta preview: the catalog on this site shows sample content, not the whole toolkit.
            </Note>
          </Appear>
        </div>
      </PaperSheet>
    </div>
  );
}
