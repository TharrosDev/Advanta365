import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, Hanken_Grotesk } from "next/font/google";
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

/* Blueprint system. Display: Familjen Grotesk — a warm structural grotesque
   used mixed-case for plate titles and node headings (replaces the old
   all-uppercase Archivo shout). Body/UI/annotations: Hanken Grotesk — a
   highly legible humanist sans that carries text and, in small tracked caps,
   the drafting annotation labels. No mono: the point is leaving the
   mono-as-technical costume behind. */
const displayFont = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-familjen",
  display: "swap",
});

const sansFont = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
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
  themeColor: "#f5f1e9",
  colorScheme: "light",
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
      className={`${displayFont.variable} ${sansFont.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Flags JS availability before first paint: reveal start-states are
            gated behind `.js` so no-JS visitors and crawlers see everything.
            A raw inline script (not next/script) is required here — it must
            execute synchronously during HTML parse, before any styled content
            paints, or reveal-hidden states flash in after first render. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js");`,
          }}
        />
        {children}
        {/* Raw script tag so the structured data exists in the static HTML.
            next/script serializes beforeInteractive payloads into the
            __next_s queue, which non-JS crawlers never see. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(rootGraph) }}
        />
      </body>
    </html>
  );
}
