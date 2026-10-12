import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The pages that were folded into the purchase page and into About keep their addresses: a
  // bookmark or a link from elsewhere still lands on the page that took over.
  async redirects() {
    return [
      { source: "/bundles", destination: "/purchase", permanent: true },
      { source: "/bundles/:slug", destination: "/purchase", permanent: true },
      { source: "/pricing", destination: "/purchase", permanent: true },
      { source: "/cart", destination: "/purchase", permanent: true },
      { source: "/contact", destination: "/about#contact", permanent: true },
    ];
  },
};

export default config;
