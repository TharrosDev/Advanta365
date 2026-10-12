"use client";

import { usePathname } from "next/navigation";
import { PRIMARY_LINKS, linkCurrent } from "@/components/layout/nav-links";
import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./primary-nav.module.css";

/**
 * The bar's inline navigation: Purchase, Catalog, About in one row. The link of the page being
 * shown is highlighted and carries `aria-current="page"`; on a page underneath it it carries
 * `aria-current="true"`. A client component only because it
 * reads the pathname.
 */
export function PrimaryNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={className}>
      <ul className={styles.list}>
        {PRIMARY_LINKS.map((link) => (
          <li key={link.href}>
            <TransitionLink
              href={link.href}
              className={cx("type-ui", styles.link)}
              aria-current={linkCurrent(pathname, link.href)}
            >
              {link.label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
