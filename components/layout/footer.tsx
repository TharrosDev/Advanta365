import { useId } from "react";
import { InkBackdrop } from "@/components/ink/ink-backdrop";
import type { NavLink, PhaseLink } from "@/components/layout/nav-links";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TextLink } from "@/components/ui/text-link";
import { TransitionLink } from "@/components/ui/transition-link";
import { Wrap } from "@/components/ui/wrap";
import { cx } from "@/lib/cx";
import { NAV, PURCHASE_LINK, SITE } from "@/lib/site";
import styles from "./footer.module.css";

const [CATALOG_LINK, ABOUT_LINK] = NAV;

/**
 * The footer's own map of the site, in the order a visitor goes: the one purchase, the catalog, the
 * worked example, About and the contact section on it. The bar lists fewer pages; the footer is
 * where the rest are found.
 */
const SITE_LINKS: readonly NavLink[] = [
  PURCHASE_LINK,
  CATALOG_LINK,
  { href: "/sample", label: "Worked example" },
  ABOUT_LINK,
  { href: "/about#contact", label: "Contact" },
];

/**
 * The tagline in two parts: the sentence, and its last two words. The first screen sets those two
 * in the highlighter; here, on the binder, where the highlighter can be a line, they stand over
 * one.
 */
const TAGLINE_WORDS = SITE.tagline.split(" ");
const TAGLINE_LEAD = TAGLINE_WORDS.slice(0, -2).join(" ");
const TAGLINE_MARKED = TAGLINE_WORDS.slice(-2).join(" ");

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
 * copy. Faint blue wisps drift at its foot (the `wisps` backdrop, first in the footer, so
 * everything else is lifted above it). The backdrop is not the whole footer but a strip under the
 * legal text, fading in from its top, so no wisp, live or still, ever stands under a link or a
 * line of the notice. The whole footer, edge to edge, is still the veil that caps the ink under the
 * light the words need; the strip is the veil's own bottom padding.
 *
 * Three parts, in reading order. The statement: the lockup, the tagline in Besley, the one button
 * ("Get the toolkit", so that the link named Purchase below it stays the only one of that name) and
 * the contact address. The two navigations: the site, under its label, and the seven phases, the
 * site's one "Rollout phases" navigation under its visible label. The fine print: the two status
 * lines drawn as the tally's blocks (the marked block is what is there, the open one what is not
 * yet), the copyright sentence and the non-affiliation notice.
 *
 * From 68em it is the twelve-column grid: the statement (columns 1 to 7) beside the site (9 to 12),
 * the phases as seven index tabs standing on one hairline across all twelve columns, and under them
 * the status lines (1 to 4) and the legal text (5 to 12). From 40em it is two columns, the site
 * beside the phases as two ledgers. Below, everything is one column and the two lists are ledgers
 * of rows on hairlines, each a full touch target.
 */
export function Footer({ phases }: { phases: readonly PhaseLink[] }) {
  const phasesLabelId = useId();

  return (
    <footer className={styles.root} data-band="binder">
      <InkBackdrop
        scene="wisps"
        still={{ wide: "wisps-wide", tall: "wisps-tall" }}
        className={styles.wisps}
      />
      <div className={styles.veil} data-ink-calm="veil">
        <Wrap className={styles.grid}>
          <div className={styles.statement}>
            <BrandLockup variant="bare" />
            <p className={styles.tagline}>
              {TAGLINE_LEAD} <span className={styles.marked}>{TAGLINE_MARKED}</span>
            </p>
            <div className={styles.actions}>
              <Button href={PURCHASE_LINK.href} size="lg" arrow className={styles.buy}>
                Get the toolkit
              </Button>
              <p className={cx("type-ui", styles.contact)}>
                <TextLink href={`mailto:${SITE.contactEmail}`} className={styles.email}>
                  {SITE.contactEmail}
                </TextLink>
              </p>
            </div>
          </div>
          <nav aria-label="Footer" className={styles.site}>
            <Eyebrow marker={false} className={styles.label}>
              The site
            </Eyebrow>
            <ul className={styles.ledger}>
              {SITE_LINKS.map((link) => (
                <li key={link.href} className={styles.entry}>
                  <TransitionLink href={link.href} className={cx("type-ui", styles.link)}>
                    <span className={styles.name}>{link.label}</span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby={phasesLabelId} className={styles.phases}>
            <Eyebrow id={phasesLabelId} marker={false} className={styles.label}>
              Rollout phases
            </Eyebrow>
            <ul className={styles.index}>
              {phases.map((phase, index) => (
                <li key={phase.slug} className={styles.entry}>
                  <TransitionLink
                    href={`/phases/${phase.slug}`}
                    className={cx("type-ui", styles.link, styles.tab)}
                  >
                    <span className={styles.numeral} aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className={styles.name}>{phase.name}</span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.fine}>
            <ul className={cx("type-note", styles.status)}>
              <li className={styles.here}>Sample catalog (beta)</li>
              <li className={styles.yet}>Checkout is not available yet</li>
            </ul>
            <div className={styles.legal}>
              <p className={cx("type-note", styles.copyright)}>
                © {new Date().getFullYear()} {SITE.name}. {SITE.name} is a product of {SITE.parent}.
              </p>
              <p className={cx("type-note", styles.notice)}>{NOTICE}</p>
            </div>
          </div>
        </Wrap>
      </div>
    </footer>
  );
}
