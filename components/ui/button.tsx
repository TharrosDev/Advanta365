"use client";

import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode, Ref } from "react";
import { TransitionLink } from "@/components/motion/transition-link";
import { WipeBars, useWipe, useWipeTriggers } from "@/components/ui/wipe";
import { cx } from "@/lib/cx";
import styles from "./button.module.css";

type ButtonProps = {
  variant?: "slab" | "outline" | "text";
  size?: "md" | "lg";
  fullWidth?: boolean;
  href?: string;
  linkRef?: Ref<HTMLAnchorElement>;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/**
 * The non-CTA button: purchase slab, form submit, dialog buttons. Renders a link when `href` is
 * given (the anchor receives `linkRef`), otherwise a `<button>` that takes every native attribute.
 *
 * `slab` and `outline` invert as a whole on hover and keyboard focus, wiping in from the left;
 * `text` is an underlined label. Children are rendered once, so the accessible name is the visible
 * text.
 */
export function Button({
  variant = "slab",
  size = "md",
  fullWidth = false,
  href,
  linkRef,
  className,
  children,
  ...rest
}: ButtonProps) {
  const { wipes, spawn, release, settle } = useWipe();
  const triggers = useWipeTriggers(spawn, release);
  const sweeps = variant !== "text";

  const classes = cx(
    styles.root,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  );
  const sweeping = sweeps && wipes.length > 0 ? "" : undefined;

  const content = (
    <>
      <span className={styles.content}>{children}</span>
      {sweeps ? (
        <span className={styles.sweep} aria-hidden="true">
          <WipeBars wipes={wipes} settle={settle} />
        </span>
      ) : null}
    </>
  );

  if (href !== undefined) {
    // An anchor takes the attributes that make sense on a link; button-only ones are dropped.
    const link = {
      id: rest.id,
      title: rest.title,
      tabIndex: rest.tabIndex,
      "aria-label": rest["aria-label"],
      "aria-describedby": rest["aria-describedby"],
      "aria-current": rest["aria-current"],
      onClick: rest.onClick as MouseEventHandler<HTMLElement> | undefined,
      className: classes,
      "data-sweeping": sweeping,
      ...(sweeps ? triggers : null),
    };

    if (href.startsWith("/") && !href.startsWith("//")) {
      return (
        <TransitionLink ref={linkRef} href={href} {...link}>
          {content}
        </TransitionLink>
      );
    }

    return (
      <a ref={linkRef} href={href} {...link}>
        {content}
      </a>
    );
  }

  const { onMouseEnter, onMouseLeave, onFocus, onBlur, onKeyUp, type = "button", ...native } = rest;

  return (
    <button
      {...native}
      type={type}
      className={classes}
      data-sweeping={sweeping}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (sweeps) triggers.onMouseEnter();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        if (sweeps) triggers.onMouseLeave();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (sweeps) triggers.onFocus(event);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (sweeps) triggers.onBlur();
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (sweeps) triggers.onKeyUp(event);
      }}
    >
      {content}
    </button>
  );
}
