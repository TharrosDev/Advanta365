import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Besley } from "next/font/google";
import type { ReactNode } from "react";
import { IntroScript } from "@/components/intro/intro-script-tag";
import { JsonLd } from "@/components/seo/json-ld";
import { MotionRoot } from "@/components/ui/motion-root";
import { cx } from "@/lib/cx";
import { DEFAULT_TITLE, KEYWORDS, LLMS_ALTERNATES, OG_LOCALE } from "@/lib/seo/metadata";
import { isPublicDeployment, SITE_ORIGIN } from "@/lib/seo/origin";
import { siteGraph } from "@/lib/seo/structured-data";
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

// Vercel Analytics and Speed Insights load their scripts from `/_vercel/…`, which only a Vercel
// deployment serves (it sets `VERCEL`, at build and at run time). Anywhere else, a local
// `next start` among them, the two tags would only fetch a 404 and log it, so they are left out.
const ON_VERCEL = Boolean(process.env.VERCEL);

/**
 * The ownership tags of the search consoles, read from the environment so that no account's code is
 * written in the source: `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`. Unset, no tag.
 */
const VERIFICATION: Metadata["verification"] = {
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
  ...(process.env.BING_SITE_VERIFICATION
    ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
    : {}),
};

// The defaults every page starts from. `metadataBase` turns the paths of the canonical links and
// the cards into absolute addresses. There is no canonical link here: a layout's would be inherited
// by every page that sets none (the 404 among them), so each indexable page sets its own through
// `pageMetadata` (lib/seo/metadata.ts), which also writes its Open Graph and X cards out whole.
// The card images come from the `opengraph-image` files. A preview deployment asks not to be indexed.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: DEFAULT_TITLE, template: `%s · ${SITE.name}` },
  description: SITE.snippet,
  applicationName: SITE.name,
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  authors: [{ name: SITE.parent, url: SITE_ORIGIN }],
  creator: SITE.parent,
  publisher: SITE.parent,
  keywords: [...KEYWORDS],
  category: "business",
  robots: isPublicDeployment()
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: OG_LOCALE,
    title: DEFAULT_TITLE,
    description: SITE.snippet,
  },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: SITE.snippet },
  verification: VERIFICATION,
  alternates: { types: LLMS_ALTERNATES },
};

// The browser's toolbar takes the paper's white, as the manifest does.
export const viewport: Viewport = { themeColor: "white" };

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
        <JsonLd data={siteGraph()} />
        {ON_VERCEL && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
