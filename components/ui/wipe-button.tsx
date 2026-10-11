"use client";

import type { MouseEventHandler } from "react";
import { TransitionLink } from "@/components/motion/transition-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import type { ArrowDirection } from "@/components/ui/arrow-icon";
import { WipeBars, useWipe, useWipeTriggers } from "@/components/ui/wipe";
import { cx } from "@/lib/cx";
import styles from "./wipe-button.module.css";

/**
 * The primary call to action: an underlined label. On hover or keyboard focus a solid block wipes
 * across it while the label slides in by 24px and reads inverted where the block has passed.
 *
 * The inverted copy is not a second text node: the ghost prints the label through `attr(data-label)`
 * inside an `aria-hidden` wrapper, so the element holds the label exactly once and its accessible name
 * is the label.
 */
export function WipeButton({
  children,
  href,
  external = false,
  arrow,
  type = "button",
  disabled = false,
  onClick,
  className,
  "aria-label": ariaLabel,
}: {
  children: string;
  href?: string;
  external?: boolean;
  arrow?: ArrowDirection;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  "aria-label"?: string;
}) {
  const { wipes, spawn, release, settle } = useWipe();
  const triggers = useWipeTriggers(spawn, release);
  const classes = cx(styles.root, className);

  const content = (
    <>
      <span className={styles.content}>
        <span className="t-body-large">{children}</span>
        {arrow ? <ArrowIcon direction={arrow} /> : null}
      </span>
      <span className={styles.sweep} aria-hidden="true">
        <WipeBars wipes={wipes} settle={settle}>
          <span className={cx(styles.content, styles.ghost)} data-label={children}>
            {arrow ? <ArrowIcon direction={arrow} /> : null}
          </span>
        </WipeBars>
      </span>
    </>
  );

  if (href === undefined) {
    return (
      <button
        type={type}
        className={classes}
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={onClick}
        {...triggers}
      >
        {content}
      </button>
    );
  }

  const newTab = external ? { target: "_blank", rel: "noopener noreferrer" } : null;

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <TransitionLink
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onClick}
        {...newTab}
        {...triggers}
      >
        {content}
      </TransitionLink>
    );
  }

  return (
    <a
      href={href}
      className={classes}
      aria-label={ariaLabel}
      onClick={onClick}
      {...newTab}
      {...triggers}
    >
      {content}
    </a>
  );
}
