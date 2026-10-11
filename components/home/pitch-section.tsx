import { Reveal, RevealWords } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./home.module.css";

/**
 * One of the two plain statement sections between the hero and the swirl band: a label strip, then
 * the statement (the section's `<h2>`) with one paragraph of copy. One column on a phone; statement
 * on the left and copy on the right from 1024px, the same layout as `StatementSection`
 * (components/company/statement-section.tsx), which the About page uses.
 * Natural height. It follows the page theme, which is light this far up the page.
 *
 * `underHero` is for the section that follows the hero: its surface starts transparent, so the lowest
 * ribbon dissolves into the top padding instead of being cut off in a straight line.
 *
 * Reveal order, in one group: label 0, the statement's words from 1 on the fine step, the copy on
 * the first coarse step after the last word.
 */
function PitchSection({
  id,
  label,
  statement,
  copy,
  underHero = false,
}: {
  id: string;
  label: string;
  statement: string;
  copy: string;
  underHero?: boolean;
}) {
  const copyIndex = coarseIndexAfter(1 + countWords(statement));

  return (
    <SectionShell
      id={id}
      className={cx(styles.pitchSection, underHero && styles.pitchUnderHero)}
      innerClassName={styles.pitch}
    >
      <RevealGroup className={styles.pitchIntro}>
        <Reveal as="div" effect="fade" index={0}>
          <SectionLabel>{label}</SectionLabel>
        </Reveal>
        <div className={styles.pitchColumns}>
          <h2 className={styles.pitchStatement}>
            <RevealWords text={statement} offset={1} />
          </h2>
          <Reveal
            as="p"
            effect="fade"
            index={copyIndex}
            className={cx("t-body-large", "c-fg-80", styles.pitchCopy)}
          >
            {copy}
          </Reveal>
        </div>
      </RevealGroup>
    </SectionShell>
  );
}

/** `#problem`: a rollout that launches on schedule is not yet a rollout people use. */
export function ProblemSection() {
  return (
    <PitchSection
      id="problem"
      label="The problem"
      statement="Most rollouts launch. Fewer get adopted."
      copy="The technology goes live on schedule. Then people keep emailing attachments, saving to their desktops and working around the new tools. The missing piece is almost never the platform. It’s the people side: the case for change, the comms, the training and the follow-through."
      underHero
    />
  );
}

/** `#solution`: the toolkit as the starting material, an AI tool for the last tenth. */
export function SolutionSection() {
  return (
    <PitchSection
      id="solution"
      label="The answer"
      statement="90% done before you open your AI tool."
      copy="AI can draft a comms plan in seconds. It can’t tell you which one held up with 10,000 employees, a nervous sponsor and a cutover weekend. Advanta365 can. Start with content refined across decades of real rollouts, then use AI to fit it to your organization, tone and timeline."
    />
  );
}
