import type { Metadata } from "next";
import { NextSteps } from "@/components/company/next-steps";
import { StatementSection } from "@/components/company/statement-section";
import { WorkedExample } from "@/components/company/worked-example";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Eyebrow } from "@/components/ui/eyebrow";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Note } from "@/components/ui/note";
import { RowLink } from "@/components/ui/row-link";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
import { TextLink } from "@/components/ui/text-link";
import { numberedPhases } from "@/lib/catalog/coverage";
import { getPhases, getWorkedExampleContents } from "@/lib/catalog/repository";
import { phaseHref } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sample",
  description:
    "A fully worked change management strategy for a 10,000-person organization shows how the pieces fit together.",
};

const STATEMENT = "See how the pieces fit before you buy the toolkit.";

const COPY = [
  "Every SharePoint Online rollout needs the same core pieces: a business case, a CM strategy, a stakeholder map, a comms plan, kickoff emails, champion networks, training, a cutover playbook, hypercare and sustainment.",
  "The worked example shows how the pieces fit together for one fictional organization.",
];

const CONTENTS_TITLE = "Contents";

/**
 * Under the contents' heading while they are placeholders. TODO(owner): the sections are stand-ins
 * until the example's file is published (see content/worked-example.ts).
 */
const CONTENTS_PLACEHOLDER =
  "Beta note: placeholder contents. The real table of contents comes with the example’s file. Until then each section names a piece of the rollout. Free samples and phases are links; the other templates come with the toolkit.";

/**
 * The caption over the step links and the accessible name of their `<nav>`. The links go to the
 * sample catalog's step pages; the label makes no claim about how the example is organized.
 */
const PHASES_LABEL = "Browse the sample catalog by phase";

const NEXT = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/contact", label: "Get in touch" },
];

/**
 * `/sample`: what the worked example is, without the file itself (it cannot be downloaded in this
 * beta, and a note under the lead says so), and its table of contents.
 *
 * Layout: the title block with ink and the example as a thick document in its aside; a statement
 * section on the desk; the contents on paper as a numbered ledger, each section's title in the
 * document's face with the catalog's name for that piece beside it, a link unless it is a locked
 * template (marked as placeholders while the content file says they are); the toolkit's sections on the desk as a ledger, each row
 * the one link to its page, a numbered phase with an eleven-block tally that marks where it falls; a
 * closing paper band with two links to the next places.
 */
export default async function SamplePage() {
  const [phases, { placeholder, sections }] = await Promise.all([
    getPhases(),
    getWorkedExampleContents(),
  ]);
  const steps = numberedPhases(phases);

  return (
    <>
      <TitleBlock
        form="wide"
        title="A complete worked example"
        lead="A full change management strategy for the fictional Meridian Group, an organization of about 10,000 employees, shows how the pieces of the toolkit fit together."
        aside={<WorkedExample name="Meridian Group" />}
      >
        <Note>Beta note: the sample file is not available to download yet.</Note>
      </TitleBlock>

      <StatementSection
        surface="desk"
        label="Shown, not just told"
        statement={STATEMENT}
        copy={COPY}
      />

      <Band surface="paper">
        <Split
          contentClassName={styles.measure}
          margin={
            <h2 id="contents-title" className="type-section">
              {CONTENTS_TITLE}
            </h2>
          }
        >
          {placeholder ? (
            <Note className={styles.placeholderNote}>{CONTENTS_PLACEHOLDER}</Note>
          ) : null}
          <BandedList as="ol" aria-labelledby="contents-title">
            {sections.map((section, index) => (
              <BandedRow key={section.title} className={styles.section}>
                <span className={styles.numeral} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.sectionText}>
                  <p className="type-item">{section.title}</p>
                  {placeholder ? (
                    <p className={cx("type-note", styles.placeholder)}>Placeholder</p>
                  ) : null}
                </div>
                {section.link ? (
                  <p className={cx("type-ui", styles.see)}>
                    <span className={styles.seeKind}>{section.link.kind}: </span>
                    {section.link.href ? (
                      <TextLink href={section.link.href} className={styles.seeLink}>
                        <KeepCompounds text={section.link.label} />
                      </TextLink>
                    ) : (
                      <KeepCompounds text={section.link.label} />
                    )}
                  </p>
                ) : null}
              </BandedRow>
            ))}
          </BandedList>
        </Split>
      </Band>

      <Band surface="desk">
        <Split
          contentClassName={styles.measure}
          margin={
            // The nav carries the name; the visible label only repeats it.
            <div aria-hidden="true">
              <Eyebrow>{PHASES_LABEL}</Eyebrow>
            </div>
          }
        >
          <nav aria-label={PHASES_LABEL}>
            <BandedList>
              {phases.map((phase) => (
                <BandedRow key={phase.slug}>
                  <RowLink
                    size="lg"
                    href={phaseHref(phase.slug)}
                    label={phase.name}
                    caption={
                      phase.number === undefined
                        ? phase.order < (steps[0]?.order ?? 0)
                          ? "Before phase 1"
                          : `Alongside phases 1 to ${steps.length}`
                        : `Phase ${phase.number} of ${steps.length}`
                    }
                    lead={
                      <span className={styles.numeral} aria-hidden="true">
                        {phase.number}
                      </span>
                    }
                    trailing={
                      phase.number === undefined ? undefined : (
                        <span className={styles.tally}>
                          <Tally
                            total={steps.length}
                            filled={phase.number - 1}
                            marked={phase.number}
                            size="sm"
                          />
                        </span>
                      )
                    }
                  />
                </BandedRow>
              ))}
            </BandedList>
          </nav>
        </Split>
      </Band>

      <NextSteps title="See what the toolkit holds for the phase you are on" links={NEXT} />
    </>
  );
}
