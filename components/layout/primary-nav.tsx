"use client";

import { usePathname } from "next/navigation";
import { linkCurrent, type PhaseLink } from "@/components/layout/nav-links";
import { PhasesMenu } from "@/components/layout/phases-menu";
import { TransitionLink } from "@/components/ui/transition-link";
import { cssVars, cx } from "@/lib/cx";
import { NAV } from "@/lib/site";
import styles from "./primary-nav.module.css";

/**
 * The bar's inline navigation, from 68em: Catalog, the Roadmap drop-down and Why Advanta in one
 * row. The link of the page being shown carries `aria-current="page"`; on a page underneath it,
 * `aria-current="true"`. A phase's own page belongs to Roadmap.
 *
 * One ink underline (`data-nav-underline`, decoration only) sits under the row and stands under
 * the current item. The row is a grid of equal columns, so the underline is positioned from the
 * index of that item alone: `--i` is set on the navigation, and with no current item `data-current`
 * is absent and the underline is not displayed. app/motion.css slides it when movement is wanted.
 * A client component only because it reads the pathname.
 */
export function PrimaryNav({
  phases,
  className,
}: {
  phases: readonly PhaseLink[];
  className?: string;
}) {
  const pathname = usePathname();
  const [catalog, ...rest] = NAV;
  // The row's items, in order: Catalog, Roadmap, then the rest of the links.
  const items = [catalog, "phases", ...rest] as const;
  const current = items.findIndex((item) =>
    item === "phases"
      ? pathname.startsWith("/phases/")
      : item !== undefined && linkCurrent(pathname, item.href) !== undefined,
  );
  const hasCurrent = current !== -1;

  return (
    <nav
      aria-label="Primary"
      className={cx(styles.root, className)}
      data-current={hasCurrent ? "" : undefined}
      style={cssVars({ "--n": items.length, "--i": hasCurrent ? current : undefined })}
    >
      <ul className={styles.list}>
        {items.map((item) =>
          item === undefined ? null : item === "phases" ? (
            <li key="phases">
              <PhasesMenu phases={phases} buttonClassName={styles.phases} />
            </li>
          ) : (
            <li key={item.href}>
              <TransitionLink
                href={item.href}
                className={cx("type-ui", styles.link)}
                aria-current={linkCurrent(pathname, item.href)}
              >
                {item.label}
              </TransitionLink>
            </li>
          ),
        )}
      </ul>
      <span className={styles.underline} data-nav-underline="" aria-hidden="true" />
    </nav>
  );
}
