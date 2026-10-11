import type { ReactNode } from "react";
import { CartButton } from "@/components/cart/cart-button";
import { CartSync } from "@/components/cart/cart-sync";
import { InkLayer } from "@/components/ink/ink-layer";
import { BetaStrip } from "@/components/layout/beta-strip";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import type { PhaseLink, TemplatePhases } from "@/components/layout/nav-links";
import { PhaseRail } from "@/components/layout/phase-rail";
import { Button } from "@/components/ui/button";
import { getBundles, getPhases, getTemplates, hasSampleContent } from "@/lib/catalog/repository";
import styles from "./layout.module.css";

/**
 * The frame around every page, in DOM order: the skip link, the beta strip (while the catalog holds
 * sample content), then one column that is at least a screen tall and holds the bar, the phase
 * rail, the one `<main>` and the footer.
 *
 * The bar and the drawer inside it, and the rail, mark the phase a page belongs to. They get the
 * phases and a map from each template to its phase, so a template page can light its phase's tab.
 *
 * The ink layer is mounted once, after the footer, so nothing of it can come before `children`. It
 * renders no element of its own beyond the pause button it hands to a live stage.
 *
 * `children` is rendered directly inside `<main>`. There is deliberately no boundary around it that
 * could flush the shell early: a route that answers "not found" at request time must still be able to
 * set the 404 status.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [phases, isSample, templates, bundles] = await Promise.all([
    getPhases(),
    hasSampleContent(),
    getTemplates(),
    getBundles(),
  ]);

  const phaseLinks: PhaseLink[] = phases.map((phase) => ({ slug: phase.slug, name: phase.name }));
  const templatePhases: TemplatePhases = Object.fromEntries(
    templates.map((template) => [template.slug, template.phase]),
  );

  return (
    <>
      <Button href="#main" className={styles.skip}>
        Skip to content
      </Button>
      <CartSync templates={templates.map((t) => t.slug)} bundles={bundles.map((b) => b.slug)} />
      {isSample && <BetaStrip />}
      <div className={styles.frame}>
        <Header phases={phaseLinks} templatePhases={templatePhases} cart={<CartButton />} />
        <PhaseRail phases={phaseLinks} templatePhases={templatePhases} />
        <main id="main" className={styles.main}>
          {children}
        </main>
        <Footer phases={phaseLinks} />
        <InkLayer />
      </div>
    </>
  );
}
