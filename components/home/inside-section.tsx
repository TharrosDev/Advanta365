import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { CountUp } from "@/components/ui/count-up";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { TransitionLink } from "@/components/ui/transition-link";
import type { Phase } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { TOOLKIT } from "@/lib/site";
import { Specimen, type SpecimenContent } from "./hero-sheet";
import styles from "./home.module.css";
import { LineDrawing, type LineDrawingName } from "./value-tiles";

/**
 * A part of the toolkit. A row opens either with its count, set as a figure, or with a drawing.
 * The heading reads the count and the title together ("59 playbooks").
 */
type Item = { title: string; body: string; href?: string } & (
  { count: number; drawing?: undefined } | { count?: undefined; drawing: LineDrawingName }
);

/**
 * What the full toolkit holds, with the counts read from `TOOLKIT`. This is not a count of the
 * catalog, which lists sample content.
 */
const ITEMS: readonly Item[] = [
  {
    count: TOOLKIT.playbooks,
    title: "playbooks",
    body: "Covering every phase: make the case, plan, design, prepare, communicate, execute, sustain.",
  },
  {
    count: TOOLKIT.templates,
    title: "ready-to-use templates",
    body: "Emails, plans, checklists, worksheets, workshop kits.",
  },
  {
    count: TOOLKIT.fieldGuides,
    title: "field guides",
    body: "For change practitioners and IM partners.",
  },
  {
    drawing: "audiences",
    title: `Training for ${TOOLKIT.trainingAudiences} audiences`,
    body: `End users, Site Owners and IM Representatives, with facilitator guides, learning guides and ${TOOLKIT.jobAids} job aids.`,
  },
  {
    drawing: "example",
    title: "A complete worked example",
    body: "A full CM strategy for a 10,000-person organization.",
    href: "/sample",
  },
  {
    drawing: "copilot",
    title: "Copilot-ready",
    body: "Readiness, rollout and impact-assessment guides for Microsoft 365 Copilot.",
  },
];

/**
 * The caption over the phase links and the accessible name of their `<nav>`. It names the sample
 * catalog because the links sit right under the toolkit counts, which the catalog does not list.
 */
const PHASES_LABEL = "Browse the sample catalog by phase";

/**
 * `#inside`: on paper. The margin (columns 1 to 4, sticky under the bar from 68em) holds the
 * heading, its sentence and, from 68em, the specimen: one real template as the top sheet of a
 * stack. The content (columns 6 to 12) is the manifest, a ledger of six tall rows: the first three
 * open with their count as a large figure that counts up when it is seen, the last three with a
 * line drawing; neither a title nor a description breaks inside a hyphenated word
 * ("10,000-person"). The worked example is the one row that is a link, to `/sample`: its title is
 * the anchor and is stretched over the row. Under the ledger, the seven phases as large index tabs;
 * a tab's accessible name is exactly the phase name.
 */
export function InsideSection({
  phases,
  specimen,
}: {
  phases: readonly Phase[];
  specimen?: SpecimenContent;
}) {
  return (
    <Band id="inside" surface="paper" innerClassName={styles.inside}>
      <div className={styles.insideMargin}>
        <h2 className="type-page">What’s inside</h2>
        <p className={cx("type-ui", styles.insideBody)}>
          The change management and user adoption toolkit behind real SharePoint Online rollouts,
          ready to adapt by hand or with AI.
        </p>
        {specimen ? <Specimen specimen={specimen} className={styles.insideSpecimen} /> : null}
      </div>
      <div className={styles.insideContent}>
        <BandedList>
          {ITEMS.map(({ title, body, href, count, drawing }) => (
            <BandedRow key={title} className={cx(styles.manifestRow, href && styles.manifestLink)}>
              <h3
                className={cx(
                  "type-item",
                  styles.manifestTitle,
                  drawing && styles.manifestTitleDrawn,
                )}
              >
                <span className={styles.manifestLead}>
                  {drawing ? (
                    <LineDrawing name={drawing} className={styles.manifestDrawing} />
                  ) : (
                    <CountUp value={count} className={styles.manifestCount} />
                  )}
                </span>
                {drawing ? null : " "}
                {href ? (
                  <TransitionLink href={href} className={styles.manifestAnchor}>
                    <KeepCompounds text={title} />
                  </TransitionLink>
                ) : (
                  <span>
                    <KeepCompounds text={title} />
                  </span>
                )}
              </h3>
              <p className={cx("type-copy", styles.manifestBody)}>
                <KeepCompounds text={body} />
              </p>
              {href ? <Icon name="arrow" className={styles.manifestArrow} /> : null}
            </BandedRow>
          ))}
        </BandedList>
        <nav aria-label={PHASES_LABEL} className={styles.insidePhases}>
          {/* Hidden from assistive technology: the nav already carries these words as its name. */}
          <div aria-hidden="true">
            <Eyebrow className={styles.insidePhasesLabel}>{PHASES_LABEL}</Eyebrow>
          </div>
          <PhaseTabs phases={phases} size="large" />
        </nav>
      </div>
    </Band>
  );
}
