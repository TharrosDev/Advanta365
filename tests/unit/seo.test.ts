import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as llmsFullRoute } from "@/app/llms-full.txt/route";
import { GET as llmsRoute } from "@/app/llms.txt/route";
import manifest from "@/app/manifest";
import robots, { AI_CRAWLERS } from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getPhases, getTemplates } from "@/lib/catalog/repository";
import { LEGAL_DOCUMENTS } from "@/lib/legal";
import { llmsFull, llmsIndex } from "@/lib/seo/llms";
import type { Metadata } from "next";
import { DEFAULT_TITLE, pageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo/origin";
import {
  IDS,
  legalPageGraph,
  offerPrice,
  product,
  serializeJsonLd,
  siteGraph,
  templateList,
} from "@/lib/seo/structured-data";
import { OFFER, SITE, TOOLKIT } from "@/lib/site";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

afterEach(() => vi.unstubAllEnvs());

describe("the origin", () => {
  it("is the production domain unless SITE_ORIGIN moves it", () => {
    expect(SITE_ORIGIN).toBe("https://advanta365.com");
    expect(absoluteUrl("/catalog")).toBe("https://advanta365.com/catalog");
    expect(absoluteUrl()).toBe("https://advanta365.com/");
  });
});

describe("page metadata", () => {
  it("names the page as its canonical address and writes the cards out whole", () => {
    const metadata = pageMetadata({ path: "/contact", title: "Contact", description: "Write." });
    expect(metadata.alternates?.canonical).toBe("/contact");
    expect(metadata.openGraph).toMatchObject({
      url: "/contact",
      siteName: SITE.name,
      locale: "en_CA",
      title: `Contact · ${SITE.name}`,
      description: "Write.",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("names the home page's card unless the route has its own", () => {
    const shared = pageMetadata({ path: "/terms", description: "Terms." });
    const own = pageMetadata({ path: "/catalog", description: "Catalog.", ownCard: true });
    expect(JSON.stringify(shared.openGraph)).toContain("/opengraph-image");
    expect(own.openGraph).not.toHaveProperty("images");
    expect(own.twitter).not.toHaveProperty("images");
  });
});

describe("what a search result shows", () => {
  // Google cuts a title near 60 characters and a description near 160; past that the words that
  // sell the page are lost, so every page's own lines stay inside both.
  it("keeps every page's title and description inside what a result shows", async () => {
    const pages = await Promise.all([
      import("@/app/(site)/page"),
      import("@/app/(site)/catalog/page"),
      import("@/app/(site)/purchase/page"),
      import("@/app/(site)/sample/page"),
      import("@/app/(site)/why-advanta/page"),
      import("@/app/(site)/contact/page"),
      import("@/app/(site)/privacy/page"),
      import("@/app/(site)/terms/page"),
      import("@/app/(site)/refunds/page"),
      import("@/app/(site)/accessibility/page"),
      import("@/app/(site)/phases/[phase]/page"),
    ]);
    const phases = await getPhases();
    const over: string[] = [];
    let checked = 0;
    for (const page of pages as {
      metadata?: Metadata;
      generateMetadata?: (props: { params: Promise<{ phase: string }> }) => Promise<Metadata>;
    }[]) {
      const all = page.metadata
        ? [page.metadata]
        : page.generateMetadata
          ? await Promise.all(
              phases.map((phase) =>
                page.generateMetadata!({ params: Promise.resolve({ phase: phase.slug }) }),
              ),
            )
          : [];
      for (const metadata of all) {
        checked += 1;
        const title = metadata.title ? `${metadata.title} · ${SITE.name}` : DEFAULT_TITLE;
        const description = String(metadata.description);
        if (title.length > 60 || description.length > 160) {
          over.push(`${title} (${title.length}) / ${description} (${description.length})`);
        }
      }
    }
    expect(checked).toBeGreaterThan(10);
    expect(over).toEqual([]);
  });
});

describe("structured data", () => {
  it("escapes markup, so no string can close the script it is written in", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script> & more" });
    expect(text).not.toMatch(/[<>&]/);
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script> & more" });
  });

  it("describes the company, the brand and the site on every page", () => {
    const nodes = siteGraph()["@graph"] as { "@type": string; "@id": string }[];
    expect(nodes.map((node) => node["@type"])).toEqual(["Organization", "Brand", "WebSite"]);
    expect(nodes.map((node) => node["@id"])).toEqual([IDS.organization, IDS.brand, IDS.website]);
  });

  it("offers the toolkit at its one price, read from OFFER, with the full toolkit's counts", async () => {
    const node = product(await getPhases()) as {
      offers: { price: string; priceCurrency: string; url: string };
      additionalProperty: { name: string; value: unknown }[];
    };
    expect(offerPrice()).toBe((OFFER.priceCents / 100).toFixed(2));
    expect(node.offers).toMatchObject({
      price: offerPrice(),
      priceCurrency: OFFER.currency,
      url: absoluteUrl("/purchase"),
    });
    const value = (name: string) => node.additionalProperty.find((p) => p.name === name)?.value;
    expect(value("Playbooks")).toBe(TOOLKIT.playbooks);
    expect(value("Templates")).toBe(TOOLKIT.templates);
    expect(value("Rollout phases")).toBe(11);
    // Nothing the pages do not say: no rating, no review.
    expect(JSON.stringify(node)).not.toMatch(/aggregateRating|review/i);
  });

  it("gives a template an address only when it is a free sample", async () => {
    const [phases, templates] = await Promise.all([getPhases(), getTemplates()]);
    const list = templateList("All", templates, phases) as {
      itemListElement: { item: { name: string; url?: string; isAccessibleForFree: boolean } }[];
    };
    for (const { item } of list.itemListElement) {
      if (item.isAccessibleForFree) expect(item.url).toMatch(/\/catalog\?view=/);
      else expect(item.url).toBeUndefined();
    }
  });

  it("dates a legal page by the day the legal pages last changed", () => {
    const [page, crumbs] = legalPageGraph(LEGAL_DOCUMENTS[0]!)["@graph"] as Record<
      string,
      unknown
    >[];
    expect(page).toMatchObject({ dateModified: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    expect(crumbs).toMatchObject({ "@type": "BreadcrumbList" });
  });
});

describe("/sitemap.xml", () => {
  it("lists every page at its canonical address, and nothing private or filtered", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const phases = await getPhases();
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
      expect(url).not.toMatch(/\?|#|\/api\/|\/licence/);
    }
    for (const path of ["/", "/purchase", "/catalog", "/why-advanta", "/sample", "/contact"]) {
      expect(urls).toContain(absoluteUrl(path));
    }
    for (const phase of phases) expect(urls).toContain(absoluteUrl(`/phases/${phase.slug}`));
    for (const document of LEGAL_DOCUMENTS) expect(urls).toContain(absoluteUrl(document.href));
  });
});

describe("/robots.txt", () => {
  it("lets every crawler, the AI ones by name, read all but the private addresses", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const rules = robots();
    expect(rules.sitemap).toBe(absoluteUrl("/sitemap.xml"));
    const groups = [rules.rules].flat();
    for (const group of groups) {
      expect(group.allow).toBe("/");
      expect(group.disallow).toEqual(["/api/", "/licence"]);
    }
    const agents = groups.flatMap((group) => [group.userAgent ?? []].flat());
    for (const crawler of ["*", "GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"]) {
      expect(agents).toContain(crawler);
    }
    expect(agents).toEqual(["*", ...AI_CRAWLERS]);
  });

  it("turns every crawler away from a preview deployment", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots()).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
  });
});

describe("/manifest.webmanifest", () => {
  it("names icons that exist", () => {
    for (const icon of manifest().icons ?? []) {
      const file = icon.src === "/icon.svg" ? "app/icon.svg" : join("public", icon.src);
      expect(existsSync(join(ROOT, file)), icon.src).toBe(true);
    }
  });
});

describe("llms.txt", () => {
  it("summarizes the toolkit and links every phase, the samples, the policies and the full file", async () => {
    const [text, phases] = await Promise.all([llmsIndex(), getPhases()]);
    expect(text.startsWith(`# ${SITE.name}\n\n> `)).toBe(true);
    expect(text).toContain(`${TOOLKIT.playbooks} playbooks`);
    expect(text).toContain("sample content");
    for (const phase of phases) expect(text).toContain(absoluteUrl(`/phases/${phase.slug}`));
    for (const document of LEGAL_DOCUMENTS) expect(text).toContain(absoluteUrl(document.href));
    expect(text).toContain(absoluteUrl("/llms-full.txt"));
    expect(text.match(/\?view=/g)).toHaveLength(6);
  });

  it("holds every listing and the legal pages in full", async () => {
    const [text, templates] = await Promise.all([llmsFull(), getTemplates()]);
    for (const template of templates) expect(text).toContain(template.title);
    for (const document of LEGAL_DOCUMENTS) expect(text).toContain(`### ${document.title}`);
    expect(text).toContain("## Common questions");
  });

  it("keeps the brand's rules: one currency code, the certification on the practitioner", async () => {
    for (const text of [await llmsIndex(), await llmsFull()]) {
      expect(text).not.toMatch(/CAD\s+CAD/);
      expect(text).not.toMatch(/bilingual|en français/i);
      for (const line of text.split("\n").filter((l) => /prosci/i.test(l))) {
        expect(line).toMatch(/Prosci-certified practitioner|by Prosci Inc\.|trademark of Prosci/);
      }
    }
  });

  it("is served as plain UTF-8 text", async () => {
    for (const response of [await llmsRoute(), await llmsFullRoute()]) {
      expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
      expect((await response.text()).length).toBeGreaterThan(1000);
    }
  });
});
