import { expect, test } from "@playwright/test";

// The security headers every route sends (next.config.ts), and the stricter ones of the licence
// routes. Read off the server's answers; no page is drawn.

test("every page sends the security headers and the content security policy", async ({
  request,
}) => {
  const headers = (await request.get("/")).headers();
  const policy = headers["content-security-policy"] ?? "";
  for (const directive of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]) {
    expect(policy).toContain(directive);
  }
  expect(policy).not.toContain("unsafe-eval");
  expect(policy).not.toContain("vercel.live");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["strict-transport-security"]).toBe("max-age=63072000");
});

test("the licence link sends no referrer and is not indexed", async ({ request }) => {
  const headers = (await request.get("/licence?t=x", { maxRedirects: 0 })).headers();
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["x-robots-tag"]).toBe("noindex");
});

test("file addresses are not indexed", async ({ request }) => {
  const headers = (await request.get("/api/samples/x/y")).headers();
  expect(headers["x-robots-tag"]).toBe("noindex");
});
