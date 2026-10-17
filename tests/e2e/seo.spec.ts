import { expect, test } from "@playwright/test";

// What search engines and AI tools read off each page: one canonical address that is the page's
// own, a description, the Open Graph and X cards with an image, and structured data that parses.
// Read off the server's HTML; no page is drawn.

const PAGES = [
  "/",
  "/catalog",
  "/phases/define-the-change",
  "/phases/start-here",
  "/purchase",
  "/why-advanta",
  "/contact",
  "/sample",
  "/privacy",
  "/terms",
  "/refunds",
  "/accessibility",
];

/** The content of the first `<meta>` with an attribute of a value, or undefined. */
function meta(html: string, attribute: "name" | "property", value: string): string | undefined {
  const tag = new RegExp(`<meta ${attribute}="${value}" content="([^"]*)"`).exec(html);
  return tag?.[1];
}

/** Every JSON-LD block of a page, parsed. */
function structuredData(html: string): { "@graph": { "@type": string }[] }[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1] ?? ""),
  );
}

for (const path of PAGES) {
  test(`${path} tells search engines and AI tools what it is`, async ({ request }) => {
    const html = await (await request.get(path)).text();

    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    expect(canonicals).toHaveLength(1);
    expect(new URL(canonicals[0]![1]!).pathname).toBe(path);

    expect(meta(html, "name", "description")?.length).toBeGreaterThan(50);
    expect(meta(html, "name", "robots")).toBe("index, follow");
    expect(meta(html, "property", "og:title")).toBeTruthy();
    expect(meta(html, "property", "og:image")).toMatch(/\/opengraph-image/);
    expect(meta(html, "name", "twitter:card")).toBe("summary_large_image");
    expect(html).toContain('<link rel="alternate" type="text/plain" href="https://');

    const types = structuredData(html).flatMap((block) => block["@graph"].map((n) => n["@type"]));
    expect(types).toEqual(expect.arrayContaining(["Organization", "Brand", "WebSite"]));
    expect(types.length).toBeGreaterThan(3);
  });
}

test("a missing page asks not to be indexed", async ({ request }) => {
  const response = await request.get("/nope");
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toContain('<meta name="robots" content="noindex');
  expect(html).not.toContain('content="index, follow"');
});

test("the files for crawlers answer, each with its kind", async ({ request }) => {
  for (const [path, type] of [
    ["/robots.txt", "text/plain"],
    ["/sitemap.xml", "application/xml"],
    ["/manifest.webmanifest", "application/manifest+json"],
    ["/llms.txt", "text/plain"],
    ["/llms-full.txt", "text/plain"],
    ["/favicon.ico", "image/x-icon"],
    ["/apple-icon.png", "image/png"],
    ["/icons/icon-512.png", "image/png"],
    ["/opengraph-image", "image/png"],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain(type);
  }
});
