import type { ReactNode } from "react";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import styles from "./statement-section.module.css";

/**
 * A band that makes one statement. The label sits in the margin; beside it are the statement (the
 * band's `<h2>`, one sentence per line block), the copy as paragraphs and then `children`, which
 * bring their own layout. Below 68em the label stacks above the statement. `surface` picks the band.
 */
export function StatementSection({
  id,
  label,
  statement,
  copy = [],
  surface = "desk",
  children,
}: {
  id?: string;
  label: string;
  statement: string;
  copy?: readonly string[];
  surface?: "desk" | "paper" | "wash";
  children?: ReactNode;
}) {
  return (
    <Band id={id} surface={surface}>
      <Split margin={<Eyebrow>{label}</Eyebrow>} marginClassName={styles.margin}>
        <h2 className={cx("type-page", styles.statement)}>
          <Sentences text={statement} />
        </h2>
        {copy.length > 0 ? (
          <div className={styles.copy}>
            {copy.map((paragraph) => (
              <p key={paragraph} className={cx("type-copy", styles.paragraph)}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
        {children ? <div className={styles.children}>{children}</div> : null}
      </Split>
    </Band>
  );
}
