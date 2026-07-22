import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/* Content-Security-Policy. The site is fully static and self-contained: no
   third-party scripts, styles, fonts, frames, or API calls. Inline allowances
   are required by Next's bootstrap scripts, the pre-paint `.js` flag, JSON-LD
   blocks, and React style attributes. Images are all first-party files (the
   favicon and OG card). Dev additionally needs eval + websockets for HMR. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/* Baseline security headers. The site embeds nothing and is embedded by
   nothing, so the policy can be strict. HSTS is safe: production is
   HTTPS-only on Vercel. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root: a stray lockfile in a parent directory otherwise
  // makes Next infer the wrong root and warn on every build.
  turbopack: { root: __dirname },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // The OG card must stay embeddable by link-preview clients that
      // hotlink it cross-origin (listed after the global rule so it wins).
      {
        source: "/og.png",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
  // The former standalone pages are now sections of the single-page site.
  // Preserve inbound links by redirecting old routes to their anchors.
  async redirects() {
    return [
      { source: "/framework", destination: "/#framework", permanent: true },
      { source: "/delivery", destination: "/#delivery", permanent: true },
      { source: "/modules", destination: "/#modules", permanent: true },
      // Governance content now lives in the framework + delivery sections.
      { source: "/governance", destination: "/#framework", permanent: true },
      { source: "/adoption", destination: "/#adoption", permanent: true },
      { source: "/wow", destination: "/#adoption", permanent: true },
      { source: "/microsoft-365", destination: "/#platforms", permanent: true },
      { source: "/why", destination: "/#why", permanent: true },
    ];
  },
};

export default config;
