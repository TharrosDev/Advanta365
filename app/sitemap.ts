import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

type Entry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: Entry["changeFrequency"];
  }> = [
    { path: "", priority: 1.0, changeFrequency: "monthly" },
    { path: "contact", priority: 0.6, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: r.path ? `${SITE_URL}/${r.path}` : SITE_URL,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
