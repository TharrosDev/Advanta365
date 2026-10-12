import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
