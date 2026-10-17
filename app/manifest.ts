import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * `/manifest.webmanifest`: the site's name, its icons and its one ground, for a browser that saves
 * it to a home screen and for the crawlers that read the manifest for the name and the icon. The
 * colours are the paper the site is printed on (white, written by name: raw colour values live in
 * the stylesheet and the icon only). The PNG icons are written by `scripts/gen-favicon.mjs`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE.name}: change management for Microsoft 365`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "browser",
    lang: "en-CA",
    dir: "ltr",
    background_color: "white",
    theme_color: "white",
    categories: ["business", "productivity", "education"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icons/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icons/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/icons/maskable-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
