import { BrandLink } from "@/components/layout/brand-link";
import { NavDrawer } from "@/components/layout/nav-drawer";
import type { PhaseLink } from "@/components/layout/nav-links";
import { PrimaryNav } from "@/components/layout/primary-nav";
import { PurchaseButton } from "@/components/layout/purchase-button";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Wrap } from "@/components/ui/wrap";
import { SITE } from "@/lib/site";
import styles from "./header.module.css";

/**
 * The bar: a sticky sheet of white paper at the top of every page, set off by a soft shadow and no
 * line under it. `data-bar` is the hook of app/motion.css, which draws that shadow on a layer of its
 * own (so the bar must not use its own `::after`) and lets it arrive over the first 84px of scroll.
 *
 * From 68em it has three zones on one row: the brand at the left, Catalog, the Phases drop-down and
 * Why Advanta centred on the bar itself (not on the room the other two leave), and the purchase button at the right.
 * Below 68em the row is the brand, the button without its price, and the Menu button of the
 * drawer. DOM and tab order follow the picture: brand, links, button, Menu.
 *
 * The narrowest bars give way in a fixed order: the word "Menu" goes first, then the brand name,
 * so that at 320px the mark, the button and the Menu button all stay, each a 44px target. The
 * accessible names "Menu" and "Advanta365" stay.
 *
 * The brand is `BrandLink`: a plain link to the home page from every other page, and on the home
 * page itself a return-to-top button (smooth scroll, instant under reduced motion, no history
 * entry). It is the only part of the bar besides the navigation that needs the pathname, so the bar
 * itself stays a server component.
 */
export function Header({ phases }: { phases: readonly PhaseLink[] }) {
  return (
    <header data-bar="" className={styles.root}>
      <Wrap className={styles.inner}>
        <BrandLink href="/" className={styles.brand}>
          <BrandLockup nameClassName={styles.brandName} />
        </BrandLink>
        <PrimaryNav phases={phases} className={styles.nav} />
        <div className={styles.tools}>
          <PurchaseButton className={styles.buy} />
          <NavDrawer
            phases={phases}
            email={SITE.contactEmail}
            toggleClassName={styles.menu}
            wordClassName={styles.menuWord}
          />
        </div>
      </Wrap>
    </header>
  );
}
