import { Tally } from "@/components/ui/tally";
import { coverageLabel, type PhaseCoverage } from "@/lib/catalog/coverage";
import { cx } from "@/lib/cx";
import styles from "./coverage-tally.module.css";

/**
 * Which rollout phases a bundle reaches, said and shown: a note in words ("Covers phases 3–4") over
 * a seven-block tally with a numeral in each block, the reached phases inked. The note is the text
 * read out, with the phase names after it for assistive technology ("Covers phases 3–4: Design,
 * Prepare"); the tally under it is a picture of the same thing and is hidden from it. Nothing is
 * drawn when no phase is reached.
 */
export function CoverageTally({
  coverage,
  className,
}: {
  coverage: readonly PhaseCoverage[];
  className?: string;
}) {
  const covered = coverage.filter((phase) => phase.covered);
  if (covered.length === 0) return null;

  return (
    <div className={cx(styles.root, className)}>
      <p className={cx("type-note", styles.label)}>
        {coverageLabel(coverage)}
        <span className="visually-hidden">{`: ${covered.map((phase) => phase.name).join(", ")}`}</span>
      </p>
      <Tally
        total={coverage.length}
        filled={covered.map((phase) => phase.order)}
        size="md"
        numerals
      />
    </div>
  );
}
