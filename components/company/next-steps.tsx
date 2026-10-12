import type { ReactNode } from "react";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RowLink } from "@/components/ui/row-link";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import styles from "./next-steps.module.css";

/**
 * The closing band of a company page, on paper: a hairline across the page column above it, the
 * "Next" label in the margin, a short heading, and the places to go next as a ledger of rows that
 * are links. `children` follow the list, if a page has a line to add. Below 68em the label stacks
 * above the heading.
 */
export function NextSteps({
  title,
  links,
  children,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  children?: ReactNode;
}) {
  return (
    <Band surface="paper" pad="none">
      <Split
        margin={<Eyebrow>Next</Eyebrow>}
        marginClassName={styles.margin}
        className={styles.split}
      >
        <h2 className={cx("type-page", styles.title)}>{title}</h2>
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
