import type { ReactNode } from "react";
import { Appear } from "@/components/ui/appear";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Folder } from "@/components/ui/folder";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { PaperStack } from "@/components/ui/paper-stack";
import { cx } from "@/lib/cx";
import styles from "./ways-to-buy.module.css";

export type Way = { title: string; range: string; body: string; href: string; action: string };

/** What one way to buy holds: its name, the price range, a sentence on it and the way in. */
function WayContent({ way }: { way: Way }) {
  return (
    <>
      <h2 className="type-section">{way.title}</h2>
      <p className={cx("type-amount", styles.range)}>{way.range}</p>
      <p className={cx("type-copy", styles.body)}>{way.body}</p>
      <div className={styles.action}>
        <Button href={way.href} variant="outline" arrow>
          {way.action}
        </Button>
      </div>
    </>
  );
}

/**
 * The two ways to buy as two objects on the desk: the singles on a stack of paper and the bundles in
 * a folder whose tab says how many there are. From 68em the label stands in columns 1 to 3, the stack
 * in columns 4 to 7 and the folder in columns 8 to 12 (the grid's own lines); from 40em they stand
 * side by side, and below that one under the other. The stack's top sheet starts level with the
 * folder's front panel, and both reach the same foot. Each settles onto the page as it scrolls in.
 */
export function WaysToBuy({
  label,
  singles,
  sets,
  setsTab,
}: {
  label: string;
  singles: Way;
  sets: Way;
  /** What the folder's tab says. */
  setsTab: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.margin}>
        <Eyebrow>{label}</Eyebrow>
      </div>
      <ul className={styles.ways}>
        <Appear as="li" move="settle" className={cx(styles.way, styles.stackWay)}>
          <PaperStack under={2} className={styles.stack}>
            <PaperSheet depth={2} className={styles.sheet}>
              <WayContent way={singles} />
            </PaperSheet>
          </PaperStack>
        </Appear>
        <Appear as="li" move="settle" order={1} className={cx(styles.way, styles.folderWay)}>
          <Folder tab={setsTab} className={styles.folder} frontClassName={styles.front}>
            <WayContent way={sets} />
          </Folder>
        </Appear>
      </ul>
    </div>
  );
}
