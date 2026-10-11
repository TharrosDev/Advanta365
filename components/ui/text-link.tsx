import type { AriaAttributes, MouseEventHandler, ReactNode } from "react";
import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./text-link.module.css";

/**
 * A link inside running text or a list: the text colour of its surface with a thin underline. On
 * hover and keyboard focus the underline thickens and the highlighter is drawn behind the words;
 * on the binder the underline takes the highlighter instead. A root-relative `href` is an internal
 * link; anything else (`mailto:`, a full address) is a plain anchor, and `external` opens a new tab.
 */
export function TextLink({
  href,
  children,
  external = false,
  onClick,
  className,
  "aria-current": ariaCurrent,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  "aria-current"?: AriaAttributes["aria-current"];
}) {
  const shared = {
    className: cx(styles.root, className),
    onClick,
    "aria-current": ariaCurrent,
  };

  if (!external && href.startsWith("/") && !href.startsWith("//")) {
    return (
      <TransitionLink href={href} {...shared}>
        {children}
      </TransitionLink>
    );
  }

  return (
    <a
      href={href}
      {...shared}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
    >
      {children}
    </a>
  );
}
