import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { Split } from "@/components/ui/split";
import { TransitionLink } from "@/components/ui/transition-link";
import type { Phase } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { TOOLKIT } from "@/lib/site";
import styles from "./home.module.css";

type Item = { title: string; body: string; href?: string };

/**
 * What the full toolkit holds, with the counts read from `TOOLKIT`. This is not a count of the
 * catalog, which lists sample content for now.
 */
const ITEMS: readonly Item[] = [
  {
    title: `${TOOLKIT.playbooks} playbooks`,
    body: "Covering every phase: make the case, plan, design, prepare, communicate, execute, sustain.",
  },
  {
    title: `${TOOLKIT.templates} ready-to-use templates`,
    body: "Emails, plans, checklists, worksheets, workshop kits.",
  },
  {
    title: `${TOOLKIT.fieldGuides} field guides`,
    body: "For change practitioners and IM partners.",
  },
  {
    title: `Training for ${TOOLKIT.trainingAudiences} audiences`,
    body: `End users, Site Owners and IM Representatives, with facilitator guides, learning guides and ${TOOLKIT.jobAids} job aids.`,
  },
  {
    title: "A complete worked example",
    body: "A full CM strategy for a 10,000-person organization.",
    href: "/sample",
  },
  {
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
 * `#inside`: the margin split on the desk. The heading and its sentence stay in the margin (sticky
 * under the bar from 68em); the six parts of the toolkit are a banded list in the content column,
 * each row a title with its description beside it; neither breaks inside a hyphenated word
 * ("10,000-person"). The worked example is the one row that is a link, to `/sample`: its title is
 * the anchor and is stretched over the row. Under the list, the seven phases as large index tabs; a
 * tab's accessible name is exactly the phase name.
 */
export function InsideSection({ phases }: { phases: readonly Phase[] }) {
  return (
    <Band id="inside" surface="desk">
      <Split
        sticky
        margin={
          <>
            <h2 className="type-section">What’s inside</h2>
            <p className={cx("type-ui", styles.insideBody)}>
              The change management and user adoption toolkit behind real SharePoint Online
              rollouts, ready to adapt by hand or with AI.
            </p>
          </>
        }
      >
        <BandedList>
          {ITEMS.map(({ title, body, href }) => (
            <BandedRow key={title} className={cx(styles.manifestRow, href && styles.manifestLink)}>
              <h3 className={cx("type-item", styles.manifestTitle)}>
                {href ? (
                  <TransitionLink href={href} className={styles.manifestAnchor}>
                    <KeepCompounds text={title} />
                  </TransitionLink>
                ) : (
                  <KeepCompounds text={title} />
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
      </Split>
    </Band>
  );
}
