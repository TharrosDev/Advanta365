import { BrandLockup } from "@/components/ui/brand-lockup";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/ui/transition-link";
import { Wrap } from "@/components/ui/wrap";
import { cx } from "@/lib/cx";
import { CONTACT_LINK, LEGAL_LINKS, NAV, PURCHASE_LINK, SITE } from "@/lib/site";
import styles from "./footer.module.css";

/**
 * The pages a visitor looks for at the foot of a page: the two that describe the product (the same
 * two as the bar) and the way to write to us. The purchase has its own button above them.
 */
const SITE_LINKS = [...NAV, CONTACT_LINK] as const;

/**
 * The non-affiliation notice, a sentence to a line. The design gate reads the source line by line
 * and lets a line name the certifying body only with an approved phrase, so the sentences that do
 * stay whole.
 */
const NOTICE = [
  `${SITE.name} and ${SITE.parent} are independent and are not affiliated with or endorsed by Prosci Inc. or Microsoft Corporation.`,
  "Prosci is a registered trademark of Prosci Inc.",
  "Microsoft 365, SharePoint and Copilot are trademarks of the Microsoft group of companies.",
].join(" ");

/**
 * The site footer: the binder, the only dark surface of the site, and the last page of the working
 * copy. It is short on purpose, three rows under one highlighter edge.
 *
 * The first row is the lockup and the one button ("Get the toolkit", to the purchase). The second is
 * the one navigation, labelled "Footer": the site's links (Catalog, Why Advanta, Contact) and, after
 * them, the legal pages. The third is the fine print: the copyright sentence and the non-affiliation
 * notice.
 *
 * Below 40em everything stands in one column, the button across it and every link a full touch
 * target. From 40em the lockup and the button share a row and the two lists share a line; from 68em
 * the copyright stands in the first four columns of the twelve and the notice in the other eight.
 */
export function Footer() {
  return (
    <footer className={styles.root} data-band="binder">
      <Wrap className={styles.grid}>
        <div className={styles.top}>
          <BrandLockup variant="bare" />
          <Button href={PURCHASE_LINK.href} size="lg" arrow className={styles.buy}>
            Get the toolkit
          </Button>
        </div>
        <nav aria-label="Footer" className={styles.nav}>
          <ul className={styles.list}>
            {SITE_LINKS.map((link) => (
              <li key={link.href} className={styles.entry}>
                <TransitionLink href={link.href} className={cx("type-ui", styles.link)}>
                  <span className={styles.name}>{link.label}</span>
                </TransitionLink>
              </li>
            ))}
          </ul>
          <ul className={cx(styles.list, styles.legal)}>
            {LEGAL_LINKS.map((link) => (
              <li key={link.href} className={styles.entry}>
                <TransitionLink href={link.href} className={cx("type-note", styles.link)}>
                  <span className={styles.name}>{link.label}</span>
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.fine}>
          <p className={cx("type-note", styles.copyright)}>
            © {new Date().getFullYear()} {SITE.name}. {SITE.name} is a product of {SITE.parent}.
          </p>
          <p className={cx("type-note", styles.notice)}>{NOTICE}</p>
        </div>
      </Wrap>
    </footer>
  );
}
