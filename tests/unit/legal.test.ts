import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { INTRO_FLAG } from "@/lib/boot/state";
import { DRAFT_KEY } from "@/lib/checkout/draft";
import { LICENCE_COOKIE } from "@/lib/licence/cookie";
import {
  LEGAL,
  LEGAL_DOCUMENTS,
  accessibility,
  formatLegalDate,
  plain,
  privacy,
  refunds,
  terms,
  type LegalBlock,
  type LegalDocument,
  type LegalFacts,
  type Rich,
} from "@/lib/legal";
import { CONTACT_LINK, LEGAL_LINKS, SITE } from "@/lib/site";

/** Every piece of running text of a block. */
function texts(block: LegalBlock): Rich[] {
  switch (block.kind) {
    case "p":
      return [block.text];
    case "list":
      return [...block.items];
    case "terms":
      return block.rows.flatMap((row) => [row.term, row.text]);
    case "heading":
      return [block.title];
  }
}

/** Every link of a document, as its address. */
function links(document: LegalDocument): string[] {
  return document.sections
    .flatMap((section) => section.blocks.flatMap(texts))
    .flatMap((text) => (typeof text === "string" ? [] : text))
    .flatMap((part) => (typeof part === "string" ? [] : [part.href]));
}

/** Every anchor a document puts on its page: its sections and its subsections. */
function anchors(document: LegalDocument): string[] {
  return document.sections.flatMap((section) => [
    section.id,
    ...section.blocks.flatMap((block) => (block.kind === "heading" ? [block.id] : [])),
  ]);
}

/** All the words of a document, the way a reader gets them. */
function words(document: LegalDocument): string {
  return [
    document.title,
    document.description,
    document.summary,
    ...document.points,
    ...document.sections.flatMap((section) => [
      section.title,
      ...section.blocks.flatMap(texts).map(plain),
    ]),
  ].join("\n");
}

// Ids the layout and the site shell already use on a legal page.
const TAKEN = ["main", "legal-contents", "legal-policies"];

// The pages a legal page may send a reader to.
const PAGES = [
  ...LEGAL_LINKS.map((entry) => entry.href),
  CONTACT_LINK.href,
  "/purchase",
  "/catalog",
  "/sample",
];

describe("the legal pages", () => {
  it("are the four the site links to, in the footer's order", () => {
    expect(LEGAL_DOCUMENTS.map((document) => document.href)).toEqual(
      LEGAL_LINKS.map((entry) => entry.href),
    );
  });

  for (const document of LEGAL_DOCUMENTS) {
    describe(document.href, () => {
      it("has a title, a description, a summary and its points", () => {
        expect(document.title.trim().length).toBeGreaterThan(5);
        expect(document.description.trim().length).toBeGreaterThan(40);
        expect(document.summary.trim().length).toBeGreaterThan(40);
        expect(document.points.length).toBeGreaterThanOrEqual(3);
        for (const point of document.points) expect(point.trim().length).toBeGreaterThan(10);
        expect(new Set(document.points).size).toBe(document.points.length);
      });

      it("has no empty section and no empty block", () => {
        expect(document.sections.length).toBeGreaterThanOrEqual(5);
        for (const section of document.sections) {
          expect(section.title.trim(), section.id).not.toBe("");
          expect(section.blocks.length, section.id).toBeGreaterThan(0);
          // A section is more than its subsection headings.
          expect(
            section.blocks.some((block) => block.kind !== "heading"),
            section.id,
          ).toBe(true);
          for (const block of section.blocks) {
            const parts = texts(block);
            expect(parts.length, section.id).toBeGreaterThan(0);
            for (const part of parts) expect(plain(part).trim(), section.id).not.toBe("");
          }
        }
      });

      it("gives every section and subsection an anchor of its own", () => {
        const ids = anchors(document);
        for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
        // The heading of a section takes "<id>-title": no anchor may be that of another.
        const all = [...ids, ...document.sections.map((section) => `${section.id}-title`)];
        expect(new Set(all).size).toBe(all.length);
        for (const id of all) expect(TAKEN).not.toContain(id);
      });

      it("gives every section a title of its own", () => {
        const titles = document.sections.map((section) => section.title);
        expect(new Set(titles).size).toBe(titles.length);
      });

      it("links only to pages that exist and anchors that are there", () => {
        for (const href of links(document)) {
          if (href.startsWith("mailto:")) {
            expect(href).toBe(`mailto:${SITE.contactEmail}`);
            continue;
          }
          const [path = "", hash] = href.split("#");
          expect(PAGES, href).toContain(path.split("?")[0]);
          if (hash === undefined) continue;
          const target = LEGAL_DOCUMENTS.find((other) => other.href === path);
          expect(target, href).toBeDefined();
          expect(anchors(target as LegalDocument), href).toContain(hash);
        }
      });

      it("links to the contact page and to the other three", () => {
        const found = links(document);
        expect(found).toContain(CONTACT_LINK.href);
        for (const other of LEGAL_DOCUMENTS) {
          if (other !== document) expect(found, other.href).toContain(other.href);
        }
      });

      it("prints no placeholder and no value that was left unset", () => {
        expect(words(document)).not.toMatch(/\b(TODO|TBD|TBC|lorem|ipsum|undefined|null|NaN)\b/i);
        expect(words(document)).not.toMatch(/\[[^\]]*\]|\{[^}]*\}|<[^>]*>/);
      });
    });
  }
});

describe("the facts the legal pages are written around", () => {
  const set: LegalFacts = {
    ...LEGAL,
    address: "1 Example Street, Ottawa",
    governingProvince: "Ontario",
    privacyContactName: "The privacy officer",
    hostingProvider: "Example Host",
    refundWindowDays: 14,
    clientWorkAllowed: true,
    accessibilityAuditDate: "2027-01-15",
  };
  const unset: LegalFacts = {
    ...LEGAL,
    address: undefined,
    governingProvince: undefined,
    privacyContactName: undefined,
    hostingProvider: undefined,
    refundWindowDays: undefined,
    clientWorkAllowed: false,
    accessibilityAuditDate: undefined,
  };

  it("have a real date, printed in words", () => {
    expect(LEGAL.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(LEGAL.effectiveDate))).toBe(false);
    expect(formatLegalDate("2026-10-12")).toBe("October 12, 2026");
    expect(LEGAL.entity.trim()).not.toBe("");
    expect(LEGAL.privacyEmail).toContain("@");
  });

  it("word every page without a gap when nothing optional is set", () => {
    for (const build of [privacy, terms, refunds, accessibility]) {
      const text = words(build(unset));
      expect(text).not.toMatch(/\bundefined\b/);
      expect(text).not.toMatch(/ {2}|\( ?\)| ,| \./);
    }
  });

  it("the refund policy names a number of days only when one is set", () => {
    expect(words(refunds(unset))).not.toMatch(/\d+ days/);
    expect(words(refunds(set))).toContain("within 14 days of your purchase");
  });

  it("the terms name the province only when one is set", () => {
    expect(words(terms(set))).toContain("the Province of Ontario");
    expect(words(terms(unset))).not.toContain("Province of");
    expect(words(terms(unset))).toContain("write to us first");
    expect(words(terms(set))).not.toContain("write to us first");
  });

  it("the privacy policy names the host, the contact and the address only when they are set", () => {
    expect(words(privacy(set))).toContain("hosted by Example Host");
    expect(words(privacy(set))).toContain("The privacy officer is responsible for privacy");
    expect(words(privacy(set))).toContain("1 Example Street, Ottawa");
    expect(words(privacy(unset))).toContain("our hosting provider");
  });

  it("the accessibility statement claims an audit only when there has been one", () => {
    expect(words(accessibility(set))).toContain("January 15, 2027");
    expect(words(accessibility(unset))).toContain("not the result of an independent audit");
  });
});

describe("the privacy policy against the code", () => {
  const document = privacy(LEGAL);

  it("names the two session storage entries and the one cookie the site keeps", () => {
    const cookies = document.sections.find((section) => section.id === "cookies");
    const named = cookies?.blocks.flatMap((block) =>
      block.kind === "terms" ? block.rows.map((row) => row.term) : [],
    );
    expect(named).toEqual([INTRO_FLAG, DRAFT_KEY, LICENCE_COOKIE]);
  });

  it("describes the licence cookie as strictly necessary, for buyers only, for 400 days", () => {
    const text = words(document);
    expect(text).not.toMatch(/sets no cookies/i);
    expect(text).not.toContain("What the site keeps in your browser stays in your browser");
    expect(text).toContain("strictly necessary");
    expect(text).toContain("400 days");
    expect(text).toContain("no tracking cookies");
  });

  it("names the visit and speed measurements the root layout mounts", () => {
    const layout = readFileSync(
      fileURLToPath(new URL("../../app/layout.tsx", import.meta.url)),
      "utf8",
    );
    const text = words(document);
    for (const [module, name] of [
      ["@vercel/analytics", "Vercel Web Analytics"],
      ["@vercel/speed-insights", "Vercel Speed Insights"],
    ] as const) {
      expect(layout.includes(module), module).toBe(text.includes(name));
    }
    expect(text).not.toMatch(/no analytics/i);
  });

  it("keeps what is planned for the checkout in a part of its own", () => {
    expect(anchors(document)).toContain("when-checkout-opens");
    const checkout = document.sections.find((section) => section.id === "checkout");
    const at = checkout?.blocks.findIndex((block) => block.kind === "heading") ?? -1;
    expect(at).toBeGreaterThan(0);
    // No payment processor is named before one is chosen.
    expect(words(document)).not.toMatch(/stripe|paypal|square|shopify|paddle|lemon/i);
  });
});
