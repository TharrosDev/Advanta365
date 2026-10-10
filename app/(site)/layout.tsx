import Link from "next/link";
import type { ReactNode } from "react";
import { BetaBanner } from "@/components/layout/beta-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getPhases, hasSampleContent } from "@/lib/catalog/repository";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [phases, isSample] = await Promise.all([getPhases(), hasSampleContent()]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      {isSample && <BetaBanner />}
      <Header
        phases={phases}
        cart={
          <Link href="/cart" className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium">
            Cart
          </Link>
        }
      />
      <main id="main" className="grow">
        {children}
      </main>
      <Footer phases={phases} />
    </div>
  );
}
