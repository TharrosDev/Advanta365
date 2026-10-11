import type { ReactNode } from "react";
import { TransitionLink } from "@/components/motion/transition-link";
import { Chip } from "@/components/ui/chip";
import { cx } from "@/lib/cx";
import styles from "./detail-card.module.css";

/**
 * A ruled text card: optional number, title, optional note chip, body and footer row.
 *
 * With `href` the title is the card's single link. The anchor holds only the title text (so that is its
 * accessible name) and is stretched over the whole card by a pseudo-element. Always a `<div>`.
 */
export function DetailCard({
  title,
  titleAs: Title = "h3",
  titleClassName = "t-headline-large",
  href,
  body,
  note,
  number,
  footer,
  center = false,
  className,
  bodyClassName,
}: {
  title: string;
  titleAs?: "h2" | "h3";
  titleClassName?: string;
  href?: string;
  body?: ReactNode;
  note?: string;
  number?: string;
  footer?: ReactNode;
  center?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  const heading = (
    <Title className={cx(styles.title, titleClassName)}>
      {href !== undefined ? (
        <TransitionLink className={styles.link} href={href}>
          {title}
        </TransitionLink>
      ) : (
        title
      )}
    </Title>
  );

  return (
    <div
      className={cx(
        styles.root,
        "ruled",
        center && styles.center,
        href !== undefined && styles.linked,
        className,
      )}
    >
      {number ? <span className={cx("t-label-medium", styles.number)}>{number}</span> : null}
      {note ? (
        // The chip sits beside the title but outside the heading, so the heading text stays the title.
        <div className={styles.heading}>
          {heading}
          <Chip className={styles.note}>{note}</Chip>
        </div>
      ) : (
        heading
      )}
      {body ? (
        <p className={cx("t-body-large", "c-fg-60", styles.body, bodyClassName)}>{body}</p>
      ) : null}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
