"use client";

import { usePathname } from "next/navigation";
import { linkCurrent } from "@/components/layout/nav-links";
import { TransitionLink } from "@/components/ui/transition-link";
import { cssVars, cx } from "@/lib/cx";
import { NAV } from "@/lib/site";
import styles from "./primary-nav.module.css";

/**
 * The bar's inline navigation, from 68em: Catalog and Why Advanta in one row. The link of the page
 * being shown carries `aria-current="page"`; on a page underneath it, `aria-current="true"`.
 *
 * One ink underline (`data-nav-underline`, decoration only) sits under the row and stands under
 * the current link. The row is a grid of equal columns, so the underline is positioned from the
 * index of that link alone: `--i` is set on the navigation, and with no current link `data-current`
 * is absent and the underline is not displayed. app/motion.css slides it when movement is wanted.
 * A client component only because it reads the pathname.
 */
export function PrimaryNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const current = NAV.findIndex((link) => linkCurrent(pathname, link.href) !== undefined);
  const hasCurrent = current !== -1;

  return (
    <nav
      aria-label="Primary"
      className={cx(styles.root, className)}
      data-current={hasCurrent ? "" : undefined}
      style={cssVars({ "--n": NAV.length, "--i": hasCurrent ? current : undefined })}
    >
      <ul className={styles.list}>
        {NAV.map((link) => (
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
      <span className={styles.underline} data-nav-underline="" aria-hidden="true" />
    </nav>
  );
}
