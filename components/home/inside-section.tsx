import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeLink } from "@/components/ui/wipe-link";
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
 * `#inside`: a label strip, a sticky intro on the left (from 1024px) and the six parts of the toolkit
 * as ruled cards on the right. The worked example is the one card that is a link (to `/sample`).
 * Under the cards, one link per catalog phase to `/phases/{slug}`; a link's accessible name is
 * exactly the phase name.
 *
 * Reveal order: label 0 (its own group); intro words 1..2 on the fine step and the body on coarse 3;
 * cards 0..5 in a group of their own; the phase links in a third group, caption 0 and then the links
 * from 1 on the fine step.
 */
export function InsideSection({ phases }: { phases: Phase[] }) {
  return (
    <SectionShell id="inside" height="full" innerClassName={styles.inside}>
      <RevealGroup>
        <Reveal as="div" effect="fade" index={0}>
          <SectionLabel>What’s inside</SectionLabel>
        </Reveal>
      </RevealGroup>
      <RevealGroup className={styles.insideIntro}>
        <SectionIntro
          title="What’s inside"
          body="The change management and user adoption toolkit behind real SharePoint Online rollouts, ready to adapt by hand or with AI."
          wordOffset={1}
        />
      </RevealGroup>
      <div className={styles.insideGrid}>
        <div className={styles.insideColumn}>
          <RevealGroup as="ul" className={styles.insideList}>
            {ITEMS.map((item, index) => (
              <Reveal key={item.title} as="li" effect="fade-up" index={index}>
                <DetailCard
                  title={item.title}
                  href={item.href}
                  body={item.body}
                  bodyClassName={styles.cardBody}
                />
              </Reveal>
            ))}
          </RevealGroup>
          <RevealGroup
            as="nav"
            aria-label={PHASES_LABEL}
            className={cx("ruled", styles.insidePhases)}
          >
            {/* Hidden from assistive technology: the nav already carries these words as its name. */}
            <Reveal
              as="p"
              effect="fade"
              index={0}
              className="t-label-medium c-fg-60"
              aria-hidden="true"
            >
              {PHASES_LABEL}
            </Reveal>
            <ul className={cx("t-body-large", styles.insidePhaseList)}>
              {phases.map((phase, index) => (
                <Reveal
                  key={phase.slug}
                  as="li"
                  effect="fade-up"
                  step="fine"
                  index={index + 1}
                  className={styles.insidePhaseItem}
                >
                  <WipeLink variant="underline" href={`/phases/${phase.slug}`}>
                    {phase.name}
                  </WipeLink>
                </Reveal>
              ))}
            </ul>
          </RevealGroup>
        </div>
      </div>
    </SectionShell>
  );
}
