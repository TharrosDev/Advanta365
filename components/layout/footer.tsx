import { PRIMARY_LINKS } from "@/components/layout/nav-links";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo-mark";
import { WipeLink } from "@/components/ui/wipe-link";
import { MARK_SEGMENTS, MARK_STROKE_WIDTH, MARK_VIEWBOX } from "@/lib/brand/mark";
import type { Phase } from "@/lib/catalog/schema";
import { cssVars, cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./footer.module.css";

/**
 * The mark's feet stop a little short of the bottom edge of its box (the round stroke ends need the
 * room). This is that gap as a share of the box height; the wordmark lowers the mark by it so the "A"
 * stands on the same baseline as the two words.
 */
const MARK_FOOT =
  Math.max(...MARK_SEGMENTS.flatMap((segment) => [segment.a[1], segment.b[1]])) +
  MARK_STROKE_WIDTH / 2;
const MARK_FOOT_GAP = Number(((MARK_VIEWBOX.height - MARK_FOOT) / MARK_VIEWBOX.height).toFixed(4));

/**
 * The site footer. Always light (its own theme scope), so every page ends on a white sheet even when
 * the page above it is dark. Holds the one "Rollout phases" navigation of the site, the legal notice
 * and the full-width wordmark. Nothing in it animates on scroll.
 */
export function Footer({ phases }: { phases: Phase[] }) {
  return (
    <footer className={styles.root} data-theme="light">
      <Container className={styles.inner}>
        <div className={styles.nav}>
          <nav aria-label="Footer" className={styles.column}>
            <ul className={styles.primary}>
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href} className="t-headline-large">
                  <WipeLink href={link.href}>{link.label}</WipeLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={cx(styles.column, styles.aside)}>
            <nav aria-label="Rollout phases">
              <ul className={styles.secondary}>
                {phases.map((phase) => (
                  <li key={phase.slug} className="t-body-large">
                    <WipeLink href={`/phases/${phase.slug}`}>{phase.name}</WipeLink>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="t-body-large">
              <WipeLink href="/cart">Cart</WipeLink>
            </p>
          </div>
        </div>
        <div className={styles.legal}>
          <p className="t-label-medium">
            © {new Date().getFullYear()} {SITE.name}. Templates are aligned with Prosci methodology.{" "}
            {SITE.name} is an independent provider and is not affiliated with or endorsed by Prosci
            Inc. or Microsoft Corporation. Microsoft 365 and SharePoint are trademarks of the
            Microsoft group of companies.
          </p>
          <ul className={styles.legalRow}>
            <li className="t-label-medium">Sample catalog (beta)</li>
            <li className="t-label-medium">Checkout is not available yet</li>
            <li className="t-label-medium">
              <WipeLink href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</WipeLink>
            </li>
          </ul>
        </div>
      </Container>
      <Container
        className={styles.wordmark}
        style={cssVars({ "--wordmark-symbol-drop": MARK_FOOT_GAP })}
        aria-hidden="true"
      >
        <span className={cx("t-display-fluid", styles.wordmarkWord)}>Advanta</span>
        <LogoMark className={styles.wordmarkSymbol} height="var(--wordmark-symbol-height)" />
        <span className={cx("t-display-fluid", styles.wordmarkWord)}>365</span>
      </Container>
    </footer>
  );
}
