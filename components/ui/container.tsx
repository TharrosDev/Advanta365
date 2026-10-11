import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./container.module.css";

type ContainerSize = "full" | "wide" | "narrow" | "prose";

const SIZE_CLASS: Record<ContainerSize, string | undefined> = {
  full: undefined,
  wide: styles.wide,
  narrow: styles.narrow,
  prose: styles.prose,
};

/** Centred, guttered content box. `full` is the 2000px site width; the other sizes cap it further. */
export function Container({
  as: Tag = "div",
  size = "full",
  className,
  children,
  ...rest
}: {
  as?: "div" | "section" | "header" | "footer" | "nav";
  size?: ContainerSize;
  className?: string;
  children?: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Tag {...rest} className={cx(styles.root, SIZE_CLASS[size], className)}>
      {children}
    </Tag>
  );
}
