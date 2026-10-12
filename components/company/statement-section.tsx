import type { ReactNode } from "react";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import styles from "./statement-section.module.css";

/**
 * A band that makes one statement. The label sits in the margin; beside it are the statement (the
 * band's `<h2>`, one sentence per line block), the copy as paragraphs that drift in, and then
 * `children`, which bring their own layout. There is no rule in the margin. Below 68em the label
 * stacks above the statement. `surface` picks the band. `size` sets the statement in `.type-banner`
 * (the default) or one step down in `.type-page`, for a page that runs several statement bands in a
 * row and keeps the large sizes for one or two of them.
 */
export function StatementSection({
  id,
  label,
  statement,
  copy = [],
  surface = "desk",
  size = "banner",
  children,
}: {
  id?: string;
  label: string;
  statement: string;
  copy?: readonly string[];
  surface?: "desk" | "paper" | "wash";
  size?: "banner" | "page";
  children?: ReactNode;
}) {
  return (
    <Band id={id} surface={surface}>
      <Split
        margin={<Eyebrow>{label}</Eyebrow>}
        marginClassName={cx(styles.margin, size === "page" && styles.marginPage)}
      >
        <h2 className={cx(size === "page" ? "type-page" : "type-banner", styles.statement)}>
          <Sentences text={statement} />
        </h2>
        {copy.length > 0 ? (
          <div className={styles.copy}>
            {copy.map((paragraph) => (
              <Appear as="p" key={paragraph} className={cx("type-copy", styles.paragraph)}>
                {paragraph}
              </Appear>
            ))}
          </div>
        ) : null}
        {children ? <div className={styles.children}>{children}</div> : null}
      </Split>
    </Band>
  );
}
