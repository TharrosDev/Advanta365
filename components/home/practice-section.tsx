import { SectionIntro } from "@/components/ui/section-intro";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import styles from "./home.module.css";

/**
 * `#practice`: the centred statement that turns the whole page dark (ThemeScroll watches this
 * section's id). The text block sits in the middle row of a three-row grid, the label on the top row.
 *
 * Its reveals are not in a RevealGroup. The wrapper holds them paused (`--reveal-play: paused`) until
 * ThemeScroll puts `data-in-view` on the section, which it does the first time the page goes dark;
 * `data-reveal-group` lets the no-script rule of the root layout release them without JavaScript.
 * Order: label 0, title words 1..8, body coarse 6, actions 7.
 */
export function PracticeSection() {
  return (
    <SectionShell id="practice" height="full">
      <div className={styles.practiceIntro} data-reveal-group="">
        <SectionIntro
          center
          className={styles.practiceGrid}
          label="Practice"
          title="Thirty years of change practice, ready to use"
          body="The plans, communications, training and measurement tools a rollout needs, drawn from 30 years of practice and aligned with Prosci methodology. Open them, tailor them, and put them to work the same day."
          actions={
            <div className={styles.practiceActions}>
              <WipeButton href="/about">About Advanta365</WipeButton>
              <WipeButton href="/pricing">How pricing works</WipeButton>
            </div>
          }
        />
      </div>
    </SectionShell>
  );
}
