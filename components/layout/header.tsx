import type { ReactNode } from "react";
import { Menu } from "@/components/layout/menu";
import { PRIMARY_LINKS } from "@/components/layout/nav-links";
import { TransitionLink } from "@/components/motion/transition-link";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo-mark";
import type { Phase } from "@/lib/catalog/schema";
import { cssVars } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./header.module.css";

/**
 * Timings of the hand-over from the entry overlay on "/": the mark cross-fades in over the swap time
 * (the overlay's own swap duration, 200ms), then the brand text follows.
 */
const ENTRY_TIMING = cssVars({ "--entry-swap": "200ms", "--entry-brand": "400ms" });

/**
 * The site header: brand, Menu, cart. It is absolute at the top of the page (it scrolls away, there
 * is no sticky bar) and has no background, so its colour simply follows the page theme.
 *
 * DOM order, visual order and tab order are the same at every width: brand, Menu, cart.
 */
export function Header({ phases, cart }: { phases: Phase[]; cart: ReactNode }) {
  return (
    <header className={styles.root} style={ENTRY_TIMING}>
      <Container className={styles.inner}>
        <TransitionLink href="/" className={styles.brand}>
          {/* The entry overlay docks its chrome mark onto this svg (hook: data-site-symbol). */}
          <span className={styles.symbol} data-site-symbol="">
            <LogoMark height="1.5em" />
          </span>
          <span className={styles.brandText}>{SITE.name}</span>
        </TransitionLink>
        <Menu
          primary={PRIMARY_LINKS}
          secondary={phases.map((phase) => ({ href: `/phases/${phase.slug}`, label: phase.name }))}
          contact={{ email: SITE.contactEmail, caption: "For general questions" }}
        />
        <div className={styles.cart}>{cart}</div>
      </Container>
    </header>
  );
}
