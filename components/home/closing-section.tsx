import { RevealGroup } from "@/components/motion/reveal-group";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/**
 * `#closing`: the last band before the footer. Always dark, half a viewport, one centred statement
 * and the one button that leads to the catalog.
 *
 * Reveal order, in one group: title words 0..7 on the fine step (the title breaks between its two
 * sentences, see `.sentenceLines`), then the button on coarse 6.
 */
export function ClosingSection() {
  return (
    <SectionShell id="closing" theme="dark" height="half" innerClassName={styles.closing}>
      <RevealGroup>
        <SectionIntro
          center
          title={"Get the 90%.\nFinish the rest your way."}
          titleClassName={cx("t-display-fluid", styles.sentenceLines)}
          actions={
            <div className={styles.centredActions}>
              <WipeButton href="/catalog">Shop Advanta365</WipeButton>
            </div>
          }
        />
      </RevealGroup>
    </SectionShell>
  );
}
