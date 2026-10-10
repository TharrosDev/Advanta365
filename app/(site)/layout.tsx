import type { ReactNode } from "react";
import { CartButton } from "@/components/cart/cart-button";
import { CartSync } from "@/components/cart/cart-sync";
import { BetaBanner } from "@/components/layout/beta-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getBundles, getPhases, getTemplates, hasSampleContent } from "@/lib/catalog/repository";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [phases, isSample, templates, bundles] = await Promise.all([
    getPhases(),
    hasSampleContent(),
    getTemplates(),
    getBundles(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="focus:bg-surface sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <CartSync templates={templates.map((t) => t.slug)} bundles={bundles.map((b) => b.slug)} />
      {isSample && <BetaBanner />}
      <Header phases={phases} cart={<CartButton />} />
      <main id="main" className="grow">
        {children}
      </main>
      <Footer phases={phases} />
    </div>
  );
}
