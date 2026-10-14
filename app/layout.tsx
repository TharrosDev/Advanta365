import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Besley } from "next/font/google";
import type { ReactNode } from "react";
import { IntroScript } from "@/components/intro/intro-script-tag";
import { MotionRoot } from "@/components/ui/motion-root";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import "./globals.css";

// Two variable fonts, roman only: no `weight` option, so every weight of a family comes from one
// file. Besley (400-900) is the voice of the documents, Atkinson Hyperlegible Next (200-800) the
// voice of the store. `app/globals.css` reads the two variables through its face tokens.
const besley = Besley({ subsets: ["latin"], display: "swap", variable: "--font-besley" });
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-atkinson",
});

// The Open Graph block carries no title or description of its own: Next fills both from the page's
// resolved title and description, so a shared link to an inner page names that page.
export const metadata: Metadata = {
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: "website", siteName: SITE.name },
};

// `IntroScript` comes first in the body, so it runs before anything is painted. It writes the
// switches of the motion system on `<html>` (`data-motion`, `data-timeline`, and `data-intro` for
// a first visit to the home page), attributes that React does not render: hence `suppressHydrationWarning` there. `MotionRoot` is the script half of the motion
// system. `data-scroll-behavior="smooth"` tells the router that anchors glide (app/motion.css), so
// it still jumps when the route changes.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={cx(besley.variable, atkinson.variable)}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <IntroScript />
        {children}
        <MotionRoot />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
