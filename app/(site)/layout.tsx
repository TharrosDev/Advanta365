import type { ReactNode } from "react";
import { CartButton } from "@/components/cart/cart-button";
import { CartSync } from "@/components/cart/cart-sync";
import { BetaBar } from "@/components/layout/beta-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SiteFrame } from "@/components/layout/site-frame";
import { PageFade } from "@/components/motion/page-fade";
import { ViewportLock } from "@/components/motion/viewport-lock";
import { getBundles, getPhases, getTemplates, hasSampleContent } from "@/lib/catalog/repository";
import styles from "./layout.module.css";

/**
 * The frame around every page: skip link, beta bar, header, the one `<main>`, footer, and the
 * body-level layers (2000px guide lines, route fade).
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

  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <CartSync templates={templates.map((t) => t.slug)} bundles={bundles.map((b) => b.slug)} />
      <ViewportLock />
      {isSample && <BetaBar />}
      <div className={styles.frame}>
        <Header phases={phases} cart={<CartButton />} />
        <main id="main" className={styles.main}>
          {children}
        </main>
        <Footer phases={phases} />
      </div>
      <SiteFrame />
      <PageFade />
    </>
  );
}
