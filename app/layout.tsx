import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import {
  BASE_KEYWORDS,
  OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  jsonLd,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";

/* Display: Archivo variable with the width axis — expanded uppercase is the
   site's broadcast voice. Body: Public Sans (the USWDS typeface, shared with
   the Echofive parent site). Mono: IBM Plex Mono for coordinates. */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  display: "swap",
  // Two weights only — every mono treatment on the site uses 400 or 500.
  weight: ["400", "500"],
});

const ROOT_DESCRIPTION =
  "ADVANTA365 is the enterprise Microsoft 365 framework that combines governance, adoption, change management, and structured rollouts into one repeatable operating model for SharePoint Online, Teams, and OneDrive — built for large, complex, regulated organizations.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: ROOT_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  keywords: BASE_KEYWORDS,
  category: "technology",
  alternates: {
    canonical: "/",
    languages: { "en-US": "/" },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Enterprise Microsoft 365 Framework`,
    description: ROOT_DESCRIPTION,
    locale: SITE_LOCALE,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Enterprise Microsoft 365 Framework`,
    description:
      "Enterprise-grade Microsoft 365 adoption, governance, implementation, and enablement framework.",
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1814",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/* Root-level JSON-LD: Organization + WebSite (linked by @id) */
const rootGraph = {
  "@context": "https://schema.org",
  "@graph": [organizationSchema(), websiteSchema()],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${publicSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Flags JS availability before paint: reveal start-states are gated
            behind `.js` so no-JS visitors and crawlers see everything. */}
        <Script id="js-flag" strategy="beforeInteractive">
          {`document.documentElement.classList.add("js");`}
        </Script>
        {children}
        <Script
          id="ld-root"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: jsonLd(rootGraph) }}
        />
      </body>
    </html>
  );
}
