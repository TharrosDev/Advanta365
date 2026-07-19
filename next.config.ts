import type { NextConfig } from "next";

/* Baseline security headers. The site embeds nothing and is embedded by
   nothing, so the policy can be strict. HSTS is safe: production is
   HTTPS-only on Vercel. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
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
