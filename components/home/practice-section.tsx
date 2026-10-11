import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/**
 * `#practice`: the one wash band of the page. The label sits in the margin; the statement, its
 * paragraph and the two next steps stand in the content column, left-aligned, with nothing behind
 * them. The solid ink button is the main action here because the band is already the highlighter's
 * diluted colour.
 */
export function PracticeSection() {
  return (
    <Band id="practice" surface="wash">
      <Split margin={<Eyebrow>Why it’s different</Eyebrow>}>
        <h2 className={cx("type-banner", styles.practiceTitle)}>
          Proven experience at a template price.
        </h2>
        <p className={cx("type-lead", styles.practiceBody)}>
          Build it yourself with AI and you start from a blank prompt. Hire a consultant and you
          rent the playbook. Advanta365 is one licence for content refined across real rollouts, and
          you keep what you adapt.
        </p>
        <div className={styles.practiceActions}>
          <Button variant="ink" href="/about#compare">
            See how it compares
          </Button>
          <Button variant="outline" href="/pricing">
            How pricing works
          </Button>
        </div>
      </Split>
    </Band>
  );
}
