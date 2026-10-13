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
  /** With `href`: the link downloads a file, as a plain anchor the router leaves alone. */
  download?: boolean;
  /** With an internal `href`: `false` keeps the page where it is (a link to a pop-up). */
  scroll?: boolean;
  linkRef?: Ref<HTMLAnchorElement>;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/**
 * The site's button. Renders a link when `href` is given (the anchor receives `linkRef`; a
 * root-relative `href` is an internal link), otherwise a `<button type="button">` that takes every
 * native attribute.
 *
 * `mark` is the buyer's main move on a page: solid ink, which turns to the highlighter under the
 * pointer. `outline` is every secondary action. `ink` is the same solid button, named for the main
 * action where the surface is already the wash. `text` is an underlined label with no box (Remove,
 * Clear all filters); its words sit in a span of their own, so the highlighter can be drawn behind
 * them. Sizes are heights: 40 (44 below 68em), 48 and 56. The children sit in a row 7px apart, so
 * an icon can be passed before the label. Hover and keyboard focus look the same, and the width
 * never changes between states.
 *
 * `disabled` takes the button out of the tab order. For an action that is not built yet, pass
 * `aria-disabled="true"` and no `onClick` instead: it looks disabled and does nothing, but a
 * keyboard still reaches its words.
 */
export function Button({
  variant = "mark",
  size = "md",
  fullWidth = false,
  arrow = false,
  href,
  external = false,
  download = false,
  scroll,
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
      {variant === "text" ? <span className={styles.words}>{children}</span> : children}
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

    if (!external && !download && href.startsWith("/") && !href.startsWith("//")) {
      return (
        <TransitionLink ref={linkRef} href={href} scroll={scroll} {...link}>
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
        {...(download ? { download: "" } : null)}
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
