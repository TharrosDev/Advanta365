import { SectionIntro } from "@/components/ui/section-intro";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/**
 * `#practice`: the centred statement that turns the whole page dark (ThemeScroll watches this
 * section's id). The text block sits in the middle row of a three-row grid, the label on the top row.
 * The title is sized so its two lines fit on a small phone (see `.practiceTitle`).
 *
 * Its reveals are not in a RevealGroup. The wrapper holds them paused (`--reveal-play: paused`) until
 * ThemeScroll puts `data-in-view` on the section, which it does the first time the page goes dark;
 * `data-reveal-group` lets the no-script rule of the root layout release them without JavaScript.
 * Order: label 0, title words 1..6, body coarse 5, actions 6.
 */
export function PracticeSection() {
  return (
    <SectionShell id="practice" height="full">
      <div className={styles.practiceIntro} data-reveal-group="">
        <SectionIntro
          center
          className={styles.practiceGrid}
          label="Why it’s different"
          title="Proven experience at a template price."
          titleClassName={cx("t-display-fluid", styles.practiceTitle)}
          body="Build it yourself with AI and you start from a blank prompt. Hire a consultant and you rent the playbook. Advanta365 is one licence for content refined across real rollouts, and you keep what you adapt."
          actions={
            <div className={styles.centredActions}>
              <WipeButton href="/about#compare">See how it compares</WipeButton>
              <WipeButton href="/pricing">How pricing works</WipeButton>
            </div>
          }
        />
      </div>
    </SectionShell>
  );
}
