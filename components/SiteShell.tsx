import type { ReactNode } from "react";
import SmoothScroll from "@/components/providers/SmoothScroll";
import RevealRoot from "@/components/ui/RevealRoot";
import ScrollProgress from "@/components/fx/ScrollProgress";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/**
 * Shared page chrome: skip link, smooth scroll + reveal providers, fixed
 * nav, grain atmosphere, and the abyss footer. Sections passed as children
 * stay server components.
 */
export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <Nav />
      <div className="grain" aria-hidden="true" />
      <main id="main">
        <RevealRoot>{children}</RevealRoot>
      </main>
      <Footer />
    </SmoothScroll>
  );
}
