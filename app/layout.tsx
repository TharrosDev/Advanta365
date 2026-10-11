import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { EntryScript } from "@/components/entry/entry-script";
import { SITE } from "@/lib/site";
import "./globals.css";

// Variable font (weight axis 400-700): no `weight` option, so every weight comes from one file.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

// The Open Graph block carries no title or description of its own: Next fills both from the page's
// resolved title and description, so a shared link to an inner page names that page.
export const metadata: Metadata = {
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: "website", siteName: SITE.name },
};

// Without JavaScript no RevealGroup can mark itself in view: release every paused reveal.
const NOSCRIPT_REVEAL_CSS = "[data-reveal-group]{--reveal-play:running!important}";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The entry script and the theme controller write attributes on <html> before and after hydration.
    <html lang="en" dir="ltr" className={instrumentSans.variable} suppressHydrationWarning>
      <body>
        <EntryScript />
        <noscript>
          <style>{NOSCRIPT_REVEAL_CSS}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
