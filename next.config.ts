import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2xsxph8kpxj0f.cloudfront.net",
      },
    ],
  },
  // The former standalone pages are now sections of the single-page site.
  // Preserve inbound links by redirecting old routes to their anchors.
  async redirects() {
    return [
      { source: "/framework", destination: "/#framework", permanent: true },
      { source: "/delivery", destination: "/#delivery", permanent: true },
      { source: "/modules", destination: "/#modules", permanent: true },
      { source: "/governance", destination: "/#governance", permanent: true },
      { source: "/adoption", destination: "/#adoption", permanent: true },
      { source: "/wow", destination: "/#adoption", permanent: true },
      { source: "/microsoft-365", destination: "/#microsoft-365", permanent: true },
      { source: "/why", destination: "/#why", permanent: true },
    ];
  },
};

export default config;
