import type { Metadata } from "next";
import { NextSteps } from "@/components/company/next-steps";
import { StatementSection } from "@/components/company/statement-section";
import { WorkedExample } from "@/components/company/worked-example";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Note } from "@/components/ui/note";
import { RowLink } from "@/components/ui/row-link";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
import { getPhases } from "@/lib/catalog/repository";
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
 * The caption over the phase links and the accessible name of their `<nav>`. The links go to the
 * sample catalog's phase pages; the label makes no claim about how the example is organized.
 */
const PHASES_LABEL = "Browse the sample catalog by phase";

const NEXT = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/about#contact", label: "Get in touch" },
];

/**
 * `/sample`: what the worked example is, without the file itself (it cannot be downloaded in this
 * beta, and a note under the lead says so).
 *
 * Layout: the title block with ink and the example as a thick document in its aside; a statement
 * section on the desk; the catalog phases on paper as a ledger, each row the one link to its phase
 * page, with a seven-block tally that marks where the phase falls; a closing paper band with two
 * links to the next places.
 */
export default async function SamplePage() {
  const phases = await getPhases();

  return (
    <>
      <TitleBlock
        form="wide"
        ink
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
          margin={
            // The nav carries the name; the visible label only repeats it.
            <div aria-hidden="true">
              <Eyebrow>{PHASES_LABEL}</Eyebrow>
            </div>
          }
        >
          <nav aria-label={PHASES_LABEL}>
            <BandedList>
              {phases.map((phase, index) => (
                <BandedRow key={phase.slug}>
                  <RowLink
                    size="lg"
                    href={`/phases/${phase.slug}`}
                    label={phase.name}
                    caption={`Phase ${index + 1} of ${phases.length}`}
                    lead={
                      <span className={styles.numeral} aria-hidden="true">
                        {index + 1}
                      </span>
                    }
                    trailing={
                      <span className={styles.tally}>
                        <Tally total={phases.length} filled={index} marked={index + 1} size="sm" />
                      </span>
                    }
                  />
                </BandedRow>
              ))}
            </BandedList>
          </nav>
        </Split>
      </Band>

      <NextSteps title="Find the template for the step you are on" links={NEXT} />
    </>
  );
}
