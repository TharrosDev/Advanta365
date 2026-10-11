import type { ReactNode } from "react";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RowLink } from "@/components/ui/row-link";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import styles from "./next-steps.module.css";

/**
 * The closing band of a company page: the "Next" label in the margin, a short heading, and the
 * places to go next as rows that are links. `children` follow the list (a line about the parent
 * company, for one). Below 68em the label stacks above the heading.
 */
export function NextSteps({
  surface = "desk",
  title,
  links,
  children,
}: {
  surface?: "desk" | "paper";
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  children?: ReactNode;
}) {
  return (
    <Band surface={surface}>
      <Split margin={<Eyebrow>Next</Eyebrow>} marginClassName={styles.margin}>
        <h2 className={cx("type-section", styles.title)}>{title}</h2>
        <BandedList className={styles.list}>
          {links.map((link) => (
            <BandedRow key={link.href}>
              <RowLink href={link.href} label={link.label} />
            </BandedRow>
          ))}
        </BandedList>
        {children ? <div className={styles.after}>{children}</div> : null}
      </Split>
    </Band>
  );
}
