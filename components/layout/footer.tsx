import { useId } from "react";
import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { PRIMARY_LINKS, type PhaseLink } from "@/components/layout/nav-links";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TextLink } from "@/components/ui/text-link";
import { TransitionLink } from "@/components/ui/transition-link";
import { Wrap } from "@/components/ui/wrap";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./footer.module.css";

/**
 * The site footer: the binder, the only dark surface of the site. Faint blue wisps drift at its
 * foot (the `wisps` backdrop, first in the footer, so everything else is lifted above it). The
 * backdrop is not the whole footer but a strip under the legal line, fading in from its top, so
 * no wisp, live or still, ever stands under a link or a line of the notice. The whole footer, edge
 * to edge, is still the veil that caps the ink under the light the words need; the strip is the
 * veil's own bottom padding.
 *
 * From 68em it is the twelve-column grid: the brand and the contact address (columns 1 to 4), the
 * "Footer" navigation (5 to 7), the site's one "Rollout phases" navigation under its visible label
 * (8 to 10) and the two status lines (11 to 12); under them the copyright sentence (1 to 4) and
 * the non-affiliation notice (5 to 12). The first line of every column sits on the same row.
 * From 40em it is two columns; below, the two navigations stay side by side and everything else
 * is stacked. There are no rules between the parts.
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
          <div className={styles.brand}>
            <BrandLockup variant="bare" />
            <p className={cx("type-ui", styles.contact)}>
              <TextLink href={`mailto:${SITE.contactEmail}`} className={styles.email}>
                {SITE.contactEmail}
              </TextLink>
            </p>
          </div>
          <nav aria-label="Footer" className={styles.site}>
            <ul className={styles.list}>
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href} className={styles.row}>
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
            <ul className={styles.list}>
              {phases.map((phase, index) => (
                <li key={phase.slug} className={styles.row}>
                  <TransitionLink
                    href={`/phases/${phase.slug}`}
                    className={cx("type-ui", styles.link)}
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
          <ul className={cx("type-note", styles.status)}>
            <li>Sample catalog (beta)</li>
            <li>Checkout is not available yet</li>
          </ul>
          <div className={styles.legal}>
            <p className={cx("type-note", styles.copyright)}>
              © {new Date().getFullYear()} {SITE.name}. {SITE.name} is a product of {SITE.parent}.
            </p>
            <p className={cx("type-note", styles.notice)}>
              {SITE.name} and {SITE.parent} are independent and are not affiliated with or endorsed
              by Prosci Inc. or Microsoft Corporation. Prosci is a registered trademark of Prosci
              Inc. Microsoft 365, SharePoint and Copilot are trademarks of the Microsoft group of
              companies.
            </p>
          </div>
        </Wrap>
      </div>
    </footer>
  );
}
