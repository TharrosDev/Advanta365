import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import type { PhaseLink } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { getPhases } from "@/lib/catalog/repository";
import styles from "./layout.module.css";

/**
 * The frame around every page, in DOM order: the skip link, then one column that is at least a
 * screen tall and holds the bar, the one `<main>` and the footer.
 *
 * The bar's Roadmap drop-down and the drawer inside the bar list the toolkit's steps and mark the
 * one whose page is shown.
 *
 * `children` is rendered directly inside `<main>`. There is deliberately no boundary around it that
 * could flush the shell early: a route that answers "not found" at request time must still be able to
 * set the 404 status.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const phases = await getPhases();

  const phaseLinks: PhaseLink[] = phases.map(({ slug, name, number }) => ({ slug, name, number }));

  return (
    <>
      <Button href="#main" className={styles.skip}>
        Skip to content
      </Button>
      <div className={styles.frame}>
        <Header phases={phaseLinks} />
        <main id="main" className={styles.main}>
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
