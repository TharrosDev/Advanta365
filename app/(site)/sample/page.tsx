import type { Metadata } from "next";
import { PageTitle } from "@/components/layout/page-title";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { ActionRow } from "@/components/ui/action-row";
import { PageShell } from "@/components/ui/page-shell";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { getPhases } from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sample",
  description:
    "A fully worked change management strategy for a 10,000-person organization shows how the pieces fit together.",
};

const STATEMENT = "See how the pieces fit before you buy one.";

const COPY = [
  "Every SharePoint Online rollout needs the same core pieces: a business case, a CM strategy, a stakeholder map, a comms plan, kickoff emails, champion networks, training, a cutover playbook, hypercare and sustainment.",
  "The worked example shows how the pieces fit together for one fictional organization.",
];

/**
 * The caption strip over the phase links and the accessible name of their `<nav>`. The links go to
 * the sample catalog's phase pages; the label makes no claim about how the example is organized.
 */
const PHASES_LABEL = "Browse the sample catalog by phase";

/**
 * `/sample`: what the worked example is, without the file itself (it cannot be downloaded in this
 * beta, and the title block says so under the lead).
 *
 * Layout: the title block; a statement beside two paragraphs (two columns from 1024px); the catalog
 * phases as a full-width ruled index, each row the one link to its phase page; two rows to the next
 * places.
 *
 * Reveal order. Statement section: label 0, the statement's words from 1 on the fine step, the
 * paragraphs on the first coarse steps after the last word. The phase rows fade up on the fine step
 * in a group of their own, like the rows of the menu.
 */
export default async function SamplePage() {
  const phases = await getPhases();
  const firstParagraph = coarseIndexAfter(1 + countWords(STATEMENT));

  return (
    <PageShell>
      <PageTitle
        title="A complete worked example"
        lead="A full change management strategy for the fictional Meridian Group, an organization of about 10,000 employees, shows how the pieces of the toolkit fit together."
      >
        <p className={cx("t-body-medium", "c-fg-60", "ruled", styles.note)}>
          Beta note: the sample file is not available to download yet.
        </p>
      </PageTitle>

      <SectionShell>
        <RevealGroup className={styles.shown}>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>Shown, not just told</SectionLabel>
          </Reveal>
          <div className={styles.columns}>
            <h2 className={styles.statement}>
              <RevealWords text={STATEMENT} offset={1} />
            </h2>
            <div className={styles.copy}>
              {COPY.map((paragraph, index) => (
                <Reveal
                  key={paragraph}
                  as="p"
                  effect="fade"
                  index={firstParagraph + index}
                  className="t-body-large c-fg-80"
                >
                  {paragraph}
                </Reveal>
              ))}
            </div>
          </div>
        </RevealGroup>
      </SectionShell>

      <SectionShell innerClassName={styles.phases}>
        <RevealGroup>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>{PHASES_LABEL}</SectionLabel>
          </Reveal>
        </RevealGroup>
        <nav aria-label={PHASES_LABEL}>
          <RevealGroup as="ul" className={styles.phaseList}>
            {phases.map((phase, index) => (
              <Reveal key={phase.slug} as="li" effect="fade-up" step="fine" index={index}>
                <ActionRow
                  fill
                  size="lg"
                  arrow="right"
                  href={`/phases/${phase.slug}`}
                  label={phase.name}
                  caption={`Phase ${index + 1} of ${phases.length}`}
                  rule={index === phases.length - 1 ? "both" : "top"}
                />
              </Reveal>
            ))}
          </RevealGroup>
        </nav>
      </SectionShell>

      <SectionShell innerClassName={styles.closing}>
        <RevealGroup>
          <SectionIntro center label="Next" title="Find the template for the step you are on" />
        </RevealGroup>
        <RevealGroup as="ul" className={styles.next}>
          <Reveal as="li" effect="fade-up" index={0}>
            <ActionRow fill padded arrow="right" href="/catalog" label="Browse the catalog" />
          </Reveal>
          <Reveal as="li" effect="fade-up" index={1}>
            <ActionRow fill padded arrow="right" rule="both" href="/contact" label="Get in touch" />
          </Reveal>
        </RevealGroup>
      </SectionShell>
    </PageShell>
  );
}
