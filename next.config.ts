import type { NextConfig } from "next";

/**
 * The content security policy. It keeps the site's own origin as the only source of everything and
 * shuts out plugins, foreign frames around the site, a changed base address and forms posting
 * elsewhere. Scripts may be inline: the boot script and Next.js's own inline scripts need it, and
 * a nonce would make every page render on demand. So this policy does not stop an injected inline
 * script; it is a baseline, not a defence against cross-site scripting.
 */
function contentSecurityPolicy(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  // React's refresh in development evaluates code.
  if (process.env.NODE_ENV === "development") directives["script-src"]!.push("'unsafe-eval'");
  // Vercel draws its toolbar and comments on preview deployments, from these sources (Vercel's
  // toolbar documentation, "Using a Content Security Policy"). Production never gets them.
  if (process.env.VERCEL_ENV === "preview") {
    directives["script-src"]!.push("https://vercel.live");
    directives["connect-src"]!.push("https://vercel.live", "wss://ws-us3.pusher.com");
    directives["img-src"]!.push("https://vercel.live", "https://vercel.com");
    directives["style-src"]!.push("https://vercel.live");
    directives["font-src"]!.push("https://vercel.live", "https://assets.vercel.com");
    directives["frame-src"] = ["https://vercel.live"];
  }
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // No includeSubDomains: other hosts under the domain are not this site's to decide for.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

/** The licence link: the licence never travels on as a referrer, and the address is not indexed. */
const PRIVATE_HEADERS = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/licence", headers: PRIVATE_HEADERS },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
  // The pages that were folded into the purchase page keep their addresses, and so does the page
  // that was About and is now Why Advanta: a bookmark or a link from elsewhere still lands on the
  // page that took over. A template's own page became the pop-up of the catalog, which `view`
  // opens when the template is a free sample. `/contact` is a page again and is not listed here.
  async redirects() {
    return [
      { source: "/bundles", destination: "/purchase", permanent: true },
      { source: "/bundles/:slug", destination: "/purchase", permanent: true },
      { source: "/pricing", destination: "/purchase", permanent: true },
      { source: "/cart", destination: "/purchase", permanent: true },
      { source: "/about", destination: "/why-advanta", permanent: true },
      { source: "/templates/:slug", destination: "/catalog?view=:slug", permanent: true },
    ];
  },
};

export default config;
