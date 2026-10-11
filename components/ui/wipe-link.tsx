"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { TransitionLink } from "@/components/motion/transition-link";
import { WipeBars, useWipe, useWipeTriggers } from "@/components/ui/wipe";
import { cx } from "@/lib/cx";
import styles from "./wipe-link.module.css";

/**
 * A text link with a wipe on hover and keyboard focus.
 *
 * - `sweep` (default): a white bar in `mix-blend-mode: difference` crosses the link and inverts it to a
 *   black highlight with white text. It forces the text to black while a bar exists, so it is only
 *   correct on a LIGHT surface with nothing isolating it from that surface: the footer.
 * - `underline`: a 1px bar in the text colour draws in under the link. Correct on any theme.
 *
 * The effect hugs the label, not the anchor: a caller may make the anchor taller (padding or a
 * minimum height through `className`) without stretching the highlight or dropping the underline.
 * Below 768px the anchor's hit area is at least 44px tall without taking any layout space.
 */
export function WipeLink({
  href,
  children,
  variant = "sweep",
  external = false,
  className,
  onClick,
  "aria-current": ariaCurrent,
}: {
  href: string;
  children: ReactNode;
  variant?: "sweep" | "underline";
  external?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  "aria-current"?: "page";
}) {
  const { wipes, spawn, release, settle } = useWipe();
  const triggers = useWipeTriggers(spawn, release);
  const sweep = variant === "sweep";

  const shared = {
    className: cx(styles.root, sweep && styles.inverting, className),
    "data-sweeping": wipes.length > 0 ? "" : undefined,
    "aria-current": ariaCurrent,
    onClick,
    ...(external ? { target: "_blank", rel: "noopener noreferrer" } : null),
    ...triggers,
  };

  const content = (
    <span className={styles.label}>
      {children}
      <span className={sweep ? styles.sweep : styles.underline} aria-hidden="true">
        <WipeBars wipes={wipes} settle={settle} align={sweep ? "center" : "baseline"} />
      </span>
    </span>
  );

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <TransitionLink href={href} {...shared}>
        {content}
      </TransitionLink>
    );
  }

  return (
    <a href={href} {...shared}>
      {content}
    </a>
  );
}
