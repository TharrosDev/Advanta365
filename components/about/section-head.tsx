import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { cx } from "@/lib/cx";
import styles from "./section-head.module.css";

/**
 * The head of a Why Advanta section: the label, the section's one `<h2>` (a line break in `title` makes
 * two sentences, each inking in as it scrolls in) and an optional paragraph under it. `size` is the
 * heading's step on the type scale: `banner` for a head that has the width of the page, `page` for
 * one that stands in a narrow column or belongs to a quieter section. The two headlines of the page
 * stay the h1 and the black band; every other statement steps down from them.
 */
export function SectionHead({
  id,
  label,
  title,
  size = "banner",
  className,
  children,
}: {
  id?: string;
  label: string;
  title: string;
  size?: "banner" | "page";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx(styles.root, className)}>
      <Eyebrow>{label}</Eyebrow>
      <h2 id={id} className={cx(size === "banner" ? "type-banner" : "type-page", styles.title)}>
        <Sentences text={title} move />
      </h2>
      {children ? <div className={cx("type-copy", styles.body)}>{children}</div> : null}
    </div>
  );
}
