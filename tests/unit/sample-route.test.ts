import { readFileSync } from "node:fs";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "@/app/api/samples/[slug]/[fileId]/route";
import type { TemplateFile } from "@/lib/catalog/schema";
import { serveFile } from "@/lib/files/respond";
import type { FileStore } from "@/lib/files/store";

const DECK = "make-the-case/executive-sponsor-kickoff-deck/executive-sponsor-kickoff-deck.pptx";
let client = 0;

/** A request from a client of its own, so the limiter of one test never counts another's calls. */
function get(slug: string, fileId: string, ip = `198.51.100.${(client += 1)}`) {
  const request = new Request(`https://advanta365.com/api/samples/${slug}/${fileId}`, {
    headers: { "x-forwarded-for": ip },
  });
  return GET(request, { params: Promise.resolve({ slug, fileId }) });
}

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/samples/[slug]/[fileId]", () => {
  test("serves a free sample's file as an attachment", async () => {
    const response = await get("executive-sponsor-kickoff-deck", "deck");
    const bytes = readFileSync(`tests/fixtures/files/${DECK}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    expect(response.headers.get("content-length")).toBe(String(bytes.length));
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="Executive Sponsor Kickoff Deck.pptx"; filename*=UTF-8''Executive%20Sponsor%20Kickoff%20Deck.pptx`,
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(Buffer.from(await response.arrayBuffer()).equals(bytes)).toBe(true);
  });

  test("a locked template's file, an unknown template and an unknown file answer alike", async () => {
    const answers = await Promise.all([
      get("sharepoint-migration-impact-assessment", "workbook"),
      get("no-such-template", "deck"),
      get("executive-sponsor-kickoff-deck", "no-such-file"),
    ]);
    const bodies = await Promise.all(answers.map((response) => response.text()));
    expect(answers.map((response) => response.status)).toEqual([404, 404, 404]);
    expect(new Set(bodies).size).toBe(1);
    expect(answers[0]!.headers.get("cache-control")).toBe("no-store");
  });

  test("answers 503 when no file store is configured", async () => {
    vi.stubEnv("FILE_STORE", "");
    const response = await get("executive-sponsor-kickoff-deck", "deck");
    expect(response.status).toBe(503);
  });

  test("answers 404 when the store does not have the file", async () => {
    vi.stubEnv("FILE_STORE_DIR", "tests/fixtures");
    const response = await get("executive-sponsor-kickoff-deck", "deck");
    expect(response.status).toBe(404);
  });

  test("refuses the 61st request from one client in a minute", async () => {
    const ip = "192.0.2.61";
    for (let call = 0; call < 60; call += 1) {
      expect((await get("no-such-template", "deck", ip)).status).toBe(404);
    }
    const refused = await get("executive-sponsor-kickoff-deck", "deck", ip);
    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});

describe("serveFile", () => {
  const file: TemplateFile = {
    id: "deck",
    name: "Deck (final) v2.pptx",
    key: "a/deck.pptx",
    bytes: 4,
    sha256: "0".repeat(64),
  };

  test("redirects to a store's signed address when it has one", async () => {
    const store: FileStore = {
      id: "signing",
      stat: async () => ({ bytes: 4 }),
      open: async () => null,
      signedUrl: async (key, name, ttl) =>
        `https://files.example/${key}?name=${encodeURIComponent(name)}&ttl=${ttl}`,
    };
    const response = await serveFile(store, file, "licensed");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://files.example/a/deck.pptx?name=Deck%20(final)%20v2.pptx&ttl=300",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("keeps a licensed file out of every cache", async () => {
    const store: FileStore = {
      id: "memory",
      stat: async () => ({ bytes: 4 }),
      open: async () => new Response("abcd").body,
    };
    const response = await serveFile(store, file, "licensed");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.text()).toBe("abcd");
  });
});
