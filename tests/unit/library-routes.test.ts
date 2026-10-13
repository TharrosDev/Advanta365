import { afterEach, describe, expect, test, vi } from "vitest";
import { GET as libraryFile } from "@/app/api/library/[slug]/[fileId]/route";
import { GET as claim } from "@/app/licence/route";
import { LICENCE_COOKIE } from "@/lib/licence/cookie";
import { signLicence } from "@/lib/licence/token";

const CODE = "A365-261013-ABCDEF";
const token = () => signLicence(CODE, process.env.LICENCE_SECRET!);
let client = 0;
const nextIp = () => `198.51.100.${(client += 1)}`;

function claimWith(query: string, ip = nextIp()) {
  return claim(
    new Request(`https://advanta365.com/licence${query}`, { headers: { "x-forwarded-for": ip } }),
  );
}

function download(slug: string, fileId: string, cookie?: string) {
  const headers: Record<string, string> = { "x-forwarded-for": nextIp() };
  if (cookie !== undefined) headers.cookie = `${LICENCE_COOKIE}=${cookie}`;
  const request = new Request(`https://advanta365.com/api/library/${slug}/${fileId}`, { headers });
  return libraryFile(request, { params: Promise.resolve({ slug, fileId }) });
}

afterEach(() => vi.unstubAllEnvs());

describe("GET /licence", () => {
  test("a good link puts the licence in a cookie and goes to the catalog", async () => {
    const response = await claimWith(`?t=${token()}`);
    expect(response.status).toBe(303);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/catalog");
    expect(new URL(response.headers.get("location")!).search).toBe("");

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${LICENCE_COOKIE}=${token().split(".")[0]}.`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=34560000/);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test.each([
    ["a token that is not a licence", "?t=garbage"],
    ["no token", ""],
    ["an empty token", "?t="],
  ])("%s goes to the catalog saying the link did not work, and sets nothing", async (_, query) => {
    const response = await claimWith(query);
    expect(response.status).toBe(303);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/catalog");
    expect(location.searchParams.get("link")).toBe("invalid");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("a revoked order's link sets nothing", async () => {
    vi.stubEnv("LICENCE_REVOKED", CODE);
    const response = await claimWith(`?t=${token()}`);
    expect(new URL(response.headers.get("location")!).searchParams.get("link")).toBe("invalid");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("refuses the 11th claim from one client in a minute", async () => {
    const ip = "192.0.2.11";
    for (let call = 0; call < 10; call += 1) {
      expect((await claimWith("?t=garbage", ip)).status).toBe(303);
    }
    expect((await claimWith(`?t=${token()}`, ip)).status).toBe(429);
  });
});

describe("GET /api/library/[slug]/[fileId]", () => {
  test("serves a locked template's file to a licence, kept out of every cache", async () => {
    const response = await download("sharepoint-migration-impact-assessment", "workbook", token());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toContain(
      'filename="Impact Scoring Workbook.xlsx"',
    );
  });

  test("serves a free sample's file to a licence too", async () => {
    const response = await download("executive-sponsor-kickoff-deck", "deck", token());
    expect(response.status).toBe(200);
  });

  test.each([
    ["no cookie", undefined],
    ["an empty cookie", ""],
    ["a changed licence", `${token()}x`],
  ])("answers 404 to %s", async (_, cookie) => {
    const response = await download("sharepoint-migration-impact-assessment", "workbook", cookie);
    expect(response.status).toBe(404);
  });

  test("answers 404 to a revoked order's licence", async () => {
    vi.stubEnv("LICENCE_REVOKED", CODE);
    const response = await download("sharepoint-migration-impact-assessment", "workbook", token());
    expect(response.status).toBe(404);
  });

  test("answers 404 to a licence for a file that does not exist", async () => {
    const response = await download("sharepoint-migration-impact-assessment", "nope", token());
    expect(response.status).toBe(404);
  });

  test("answers 503 to a licence when no file store is configured", async () => {
    vi.stubEnv("FILE_STORE", "");
    const response = await download("sharepoint-migration-impact-assessment", "workbook", token());
    expect(response.status).toBe(503);
  });
});
