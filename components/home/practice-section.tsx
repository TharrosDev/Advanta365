import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/**
 * `#practice`: the one wash band of the page, laid out as `#problem` is. The statement stands in
 * columns 1 to 9 and inks in as it scrolls in; its paragraph and the two next steps stand lower, in
 * columns 7 to 12. The solid ink button is the main action here because the band is already the
 * highlighter's diluted colour.
 */
export function PracticeSection() {
  return (
    <Band id="practice" surface="wash" pad="roomy" innerClassName={styles.statement}>
      <Eyebrow className={styles.statementLabel}>Why it’s different</Eyebrow>
      <h2 className={cx("type-statement", styles.statementTitle)}>
        <Sentences move text="Proven experience at a template price." />
      </h2>
      <Appear className={styles.statementAside}>
        <p className={cx("type-lead", styles.statementCopy)}>
          Build it yourself with AI and you start from a blank prompt. Hire a consultant and you
          rent the playbook. Advanta365 is one licence for content refined across real rollouts, and
          you keep what you adapt.
        </p>
        <div className={styles.practiceActions}>
          <Button variant="ink" href="/about#compare">
            See how it compares
          </Button>
          <Button variant="outline" href="/purchase">
            Buy the complete toolkit
          </Button>
        </div>
      </Appear>
    </Band>
  );
}
