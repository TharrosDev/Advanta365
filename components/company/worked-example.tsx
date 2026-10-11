import { Appear } from "@/components/ui/appear";
import { Blank } from "@/components/ui/blank";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { PaperStack } from "@/components/ui/paper-stack";
import { cx } from "@/lib/cx";
import styles from "./worked-example.module.css";

/** How many lines of the document are drawn, and how much of its width each one fills. */
const LINES = [100, 92, 96, 64, 100, 88, 94, 52];

/**
 * The worked example as an object: a thick document, a stack of twelve edges with its first page on
 * top, printed with the organization's name, ghost lines for the text and the blank in light blue.
 * It is the aside of the title block, so it lands as the page loads. It is decoration and says
 * nothing a screen reader needs, so it is hidden from one; `name` is the organization it is
 * printed with.
 */
export function WorkedExample({ name, className }: { name: string; className?: string }) {
  return (
    <Appear move="settle" when="load" order={1} aria-hidden="true" className={className}>
      <PaperStack under={12} className={styles.stack}>
        <PaperSheet ratio="portrait" depth={2} className={styles.page}>
          <p className={cx("type-section", styles.name)}>{name}</p>
          <span className={styles.rule} />
          <span className={styles.lines}>
            {LINES.map((width, index) => (
              <span key={index} className={styles.line} style={{ width: `${width}%` }} />
            ))}
          </span>
          <Blank size="md" caret="none" className={styles.blank} />
        </PaperSheet>
      </PaperStack>
    </Appear>
  );
}
