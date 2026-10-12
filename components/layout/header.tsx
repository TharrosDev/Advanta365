import { NavDrawer } from "@/components/layout/nav-drawer";
import type { PhaseLink, TemplatePhases } from "@/components/layout/nav-links";
import { PrimaryNav } from "@/components/layout/primary-nav";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { TransitionLink } from "@/components/ui/transition-link";
import { Wrap } from "@/components/ui/wrap";
import { SITE } from "@/lib/site";
import styles from "./header.module.css";

/**
 * The bar: a sticky sheet of white paper at the top of every page, set off by a soft shadow and no
 * line under it. `data-bar` is the hook of app/motion.css, which draws that shadow on a layer of its
 * own (so the bar must not use its own `::after`) and lets it arrive over the first 84px of scroll.
 * Left to right, which is also the DOM and tab order: the brand, the primary links (from 68em) and
 * the Menu button of the drawer (below 68em).
 *
 * On the narrowest screens the word "Menu" and then the brand name are hidden visually; the
 * accessible names "Menu" and "Advanta365" stay.
 */
export function Header({
  phases,
  templatePhases,
}: {
  phases: readonly PhaseLink[];
  templatePhases: TemplatePhases;
}) {
  return (
    <header data-bar="" className={styles.root}>
      <Wrap className={styles.inner}>
        <TransitionLink href="/" className={styles.brand}>
          <BrandLockup nameClassName={styles.brandName} />
        </TransitionLink>
        <PrimaryNav className={styles.nav} />
        <div className={styles.tools}>
          <NavDrawer
            phases={phases}
            templatePhases={templatePhases}
            email={SITE.contactEmail}
            toggleClassName={styles.menu}
            wordClassName={styles.menuWord}
          />
        </div>
      </Wrap>
    </header>
  );
}
