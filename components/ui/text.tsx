import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

export type TextVariant =
  | "display-xl"
  | "display-large"
  | "display-medium"
  | "display-small"
  | "display-fluid"
  | "headline-large"
  | "headline-medium"
  | "headline-small"
  | "title-large"
  | "title-medium"
  | "title-small"
  | "body-large"
  | "body-medium"
  | "body-small"
  | "label-large"
  | "label-medium"
  | "label-small";

export type TextColor = "fg-30" | "fg-40" | "fg-50" | "fg-60" | "fg-80" | "fg-100";

export type TextTag =
  "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "li" | "dt" | "dd" | "label" | "figcaption";

/**
 * Sugar over the global type utilities of `app/globals.css`: emits `t-{variant}`, `w-{weight}` and
 * `c-{color}`. Using those classes directly on an element is equally valid.
 */
export function Text({
  as: Tag = "p",
  variant = "body-large",
  weight,
  color,
  className,
  children,
  ...rest
}: {
  as?: TextTag;
  variant?: TextVariant;
  weight?: "regular" | "medium" | "semibold" | "bold";
  color?: TextColor;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "color">) {
  return (
    <Tag
      {...rest}
      className={cx(`t-${variant}`, weight && `w-${weight}`, color && `c-${color}`, className)}
    >
      {children}
    </Tag>
  );
}
