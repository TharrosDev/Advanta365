import type { AriaAttributes, MouseEventHandler, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./row-link.module.css";

/** An address may break after its "@" instead of running out of a narrow row. */
function withBreak(label: ReactNode): ReactNode {
  if (typeof label !== "string") return label;
  const at = label.indexOf("@");
  if (at === -1) return label;
  return (
    <>
      {label.slice(0, at + 1)}
      <wbr />
      {label.slice(at + 1)}
    </>
  );
}

/**
 * A whole row that is one link. Goes directly inside a `BandedRow` and fills it to its edges:
 * an optional `lead` (a numeral, a tile) on the label's baseline, the label with an optional caption
 * under it, an optional `trailing` value (a price, a tally), then the arrow. Below 40em the trailing
 * value goes under the caption, so the label keeps the width of the row. On hover and keyboard focus
 * the row takes the wash, the label is underlined and the arrow moves. `size="lg"` sets the label
 * one step larger. A root-relative `href` is an internal link; `external` opens a new tab.
 */
export function RowLink({
  href,
  label,
  caption,
  trailing,
  lead,
  size = "md",
  external = false,
  onClick,
  className,
  "aria-current": ariaCurrent,
}: {
  href: string;
  label: ReactNode;
  caption?: ReactNode;
  trailing?: ReactNode;
  lead?: ReactNode;
  size?: "md" | "lg";
  external?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  "aria-current"?: AriaAttributes["aria-current"];
}) {
  const content = (
    <>
      {lead ? <span className={styles.lead}>{lead}</span> : null}
      <span className={styles.body}>
        <span className={styles.text}>
          <span className={cx(size === "lg" ? "type-section" : "type-item", styles.label)}>
            {withBreak(label)}
          </span>
          {caption ? <span className={cx("type-note", styles.caption)}>{caption}</span> : null}
        </span>
        {trailing ? (
          <span className={cx("type-ui", "tabular", styles.trailing)}>{trailing}</span>
        ) : null}
      </span>
      <Icon name="arrow" className={styles.arrow} />
    </>
  );

  const shared = {
    className: cx(styles.root, className),
    onClick,
    "aria-current": ariaCurrent,
  };

  if (!external && href.startsWith("/") && !href.startsWith("//")) {
    return (
      <TransitionLink href={href} {...shared}>
        {content}
      </TransitionLink>
    );
  }

  return (
    <a
      href={href}
      {...shared}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
    >
      {content}
    </a>
  );
}
