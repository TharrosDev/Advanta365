import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode, Ref } from "react";
import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./button.module.css";

type ButtonProps = {
  variant?: "mark" | "outline" | "ink" | "text";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** Puts the arrow icon after the label; it moves on hover. */
  arrow?: boolean;
  href?: string;
  /** With `href`: opens a new tab. */
  external?: boolean;
  linkRef?: Ref<HTMLAnchorElement>;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/**
 * The site's button. Renders a link when `href` is given (the anchor receives `linkRef`; a
 * root-relative `href` is an internal link), otherwise a `<button type="button">` that takes every
 * native attribute.
 *
 * `mark` is the highlighter: the buyer's main move on a page. `outline` is every secondary action.
 * `ink` is the main action where the surface is already the wash. `text` is an underlined label
 * with no box (Remove, Clear all filters). Sizes are heights: 40 (44 below 68em), 48 and 56. The
 * children sit in a row 7px apart, so an icon can be passed before the label. Hover and keyboard
 * focus look the same, and the width never changes between states.
 */
export function Button({
  variant = "mark",
  size = "md",
  fullWidth = false,
  arrow = false,
  href,
  external = false,
  linkRef,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx(
    "type-ui",
    styles.root,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    className,
  );

  const content = (
    <>
      {children}
      {arrow ? <Icon name="arrow" className={styles.arrow} /> : null}
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
    };

    if (!external && href.startsWith("/") && !href.startsWith("//")) {
      return (
        <TransitionLink ref={linkRef} href={href} {...link}>
          {content}
        </TransitionLink>
      );
    }

    return (
      <a
        ref={linkRef}
        href={href}
        {...link}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      >
        {content}
      </a>
    );
  }

  const { type = "button", ...native } = rest;

  return (
    <button {...native} type={type} className={classes}>
      {content}
    </button>
  );
}
