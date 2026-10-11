import type { ReactNode } from "react";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./statement-section.module.css";

/**
 * A section that makes one statement: the label strip, then the statement (the section's `<h2>`)
 * with its copy. One column on a phone; statement on the left and copy on the right from 1024px.
 * Without copy the statement runs to its own measure. `children` follow under the intro and bring
 * their own reveal groups.
 *
 * A line break in `statement` separates two sentences (see `StatementWords`).
 *
 * Reveal order, in one group: label 0, the statement's words from 1 on the fine step, then one
 * paragraph per coarse step, starting on the first step after the last word.
 */
export function StatementSection({
  id,
  label,
  statement,
  copy = [],
  children,
}: {
  id?: string;
  label: string;
  statement: string;
  copy?: readonly string[];
  children?: ReactNode;
}) {
  const firstParagraph = coarseIndexAfter(1 + countWords(statement));

  const heading = (
    <h2 className={styles.statement}>
      <StatementWords statement={statement} />
    </h2>
  );

  return (
    <SectionShell id={id} innerClassName={styles.section}>
      <RevealGroup className={styles.intro}>
        <Reveal as="div" effect="fade" index={0}>
          <SectionLabel>{label}</SectionLabel>
        </Reveal>
        {copy.length > 0 ? (
          <div className={styles.columns}>
            {heading}
            <div className={styles.copy}>
              {copy.map((paragraph, index) => (
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
        ) : (
          heading
        )}
      </RevealGroup>
      {children}
    </SectionShell>
  );
}

/**
 * The words of the statement, revealed from index 1. A statement of several sentences carries a line
 * break between them: each sentence is then a block of its own, so the statement always breaks
 * between its sentences and each one is balanced by itself. (One balanced block narrows all of its
 * lines together, which splits "built in." or leaves the last word of the second sentence alone.)
 * A space joins the blocks, so the heading's text stays the plain statement.
 */
function StatementWords({ statement }: { statement: string }) {
  const sentences = statement.split("\n");
  if (sentences.length === 1) return <RevealWords text={statement} offset={1} />;

  const nodes: ReactNode[] = [];
  let offset = 1;
  for (const sentence of sentences) {
    if (nodes.length > 0) nodes.push(" ");
    nodes.push(
      <span key={nodes.length} className={styles.sentence}>
        <RevealWords text={sentence} offset={offset} />
      </span>,
    );
    offset += countWords(sentence);
  }
  return <>{nodes}</>;
}
