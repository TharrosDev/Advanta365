"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { TransitionLink } from "@/components/motion/transition-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import type { ArrowDirection } from "@/components/ui/arrow-icon";
import { WipeBars, useWipe, useWipeTriggers } from "@/components/ui/wipe";
import type { Wipe } from "@/components/ui/wipe";
import { cx } from "@/lib/cx";
import styles from "./action-row.module.css";

/** An email address may wrap after its "@" before it has to break inside a word. Same text content. */
function withBreakHint(label: string): ReactNode {
  const at = label.indexOf("@");
  if (at < 0 || at === label.length - 1) return label;
  return (
    <>
      {label.slice(0, at + 1)}
      <wbr />
      {label.slice(at + 1)}
    </>
  );
}

/** The full-row sweep of a `fill` row: a white bar blended as a difference over the row's own surface. */
function HoverSweep({ wipes, settle }: { wipes: Wipe[]; settle: (id: number) => void }) {
  return (
    <span className={styles.sweep} aria-hidden="true">
      <WipeBars wipes={wipes} settle={settle} />
    </span>
  );
}

/**
 * A full-width hairline row that acts as one link (or button): label and optional caption on the
 * left, an optional trailing value and an arrow on the right.
 *
 * Plain rows underline the label on hover and keyboard focus. `fill` rows bleed 16px past their
 * column and invert as a whole, wiping in from the left; they carry their own surface, so the
 * inversion is right on both themes and inside any wrapper.
 */
export function ActionRow({
  label,
  caption,
  href,
  onClick,
  external = false,
  arrow = "up-right",
  trailing,
  size = "md",
  rule = "top",
  padded = false,
  fill = false,
  className,
}: {
  label: string;
  caption?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  external?: boolean;
  arrow?: ArrowDirection | false;
  trailing?: ReactNode;
  size?: "md" | "lg";
  rule?: "top" | "bottom" | "both";
  padded?: boolean;
  fill?: boolean;
  className?: string;
}) {
  const { wipes, spawn, release, settle } = useWipe();
  const triggers = useWipeTriggers(spawn, release);
  const interactive = href !== undefined || onClick !== undefined;

  const shared = {
    className: cx(
      styles.root,
      rule !== "bottom" && styles.top,
      rule !== "top" && styles.bottom,
      padded && styles.padded,
      size === "lg" && styles.lg,
      interactive && styles.interactive,
      fill && styles.fill,
      className,
    ),
    "data-sweeping": fill && wipes.length > 0 ? "" : undefined,
    ...(fill && interactive ? triggers : null),
  };

  const content = (
    <>
      <span className={styles.text}>
        <span className={cx(size === "lg" ? "t-headline-large" : "t-body-large", styles.label)}>
          {withBreakHint(label)}
        </span>
        {caption ? <span className="t-label-medium c-fg-50">{caption}</span> : null}
      </span>
      {trailing !== undefined && trailing !== null ? (
        <span className={cx("t-body-large tabular", styles.trailing)}>{trailing}</span>
      ) : null}
      {arrow ? (
        <span className={styles.arrow}>
          <ArrowIcon direction={arrow} />
        </span>
      ) : null}
      {fill && interactive ? <HoverSweep wipes={wipes} settle={settle} /> : null}
    </>
  );

  if (href === undefined) {
    if (onClick === undefined) return <div {...shared}>{content}</div>;
    return (
      <button type="button" onClick={onClick} {...shared}>
        {content}
      </button>
    );
  }

  const newTab = external ? { target: "_blank", rel: "noopener noreferrer" } : null;

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <TransitionLink href={href} onClick={onClick} {...newTab} {...shared}>
        {content}
      </TransitionLink>
    );
  }

  return (
    <a href={href} onClick={onClick} {...newTab} {...shared}>
      {content}
    </a>
  );
}
