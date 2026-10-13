import { describe, expect, test } from "vitest";
import { clientKey, createRateLimiter } from "@/lib/http/rate-limit";

describe("the rate limiter", () => {
  test("allows the limit in a window and refuses the next, saying when to come back", () => {
    const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
    for (let call = 0; call < 10; call += 1) expect(limiter.check("a", 1_000).ok).toBe(true);
    expect(limiter.check("a", 1_500)).toEqual({ ok: false, retryAfter: 60 });
    expect(limiter.check("a", 30_200)).toEqual({ ok: false, retryAfter: 31 });
  });

  test("starts again in a new window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("a", 59_999).ok).toBe(false);
    expect(limiter.check("a", 60_000).ok).toBe(true);
  });

  test("counts each client apart", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("b", 0).ok).toBe(true);
    expect(limiter.check("a", 0).ok).toBe(false);
  });

  test("keeps no more clients than its cap, dropping the oldest", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 3 });
    for (const key of ["a", "b", "c", "d"]) limiter.check(key, 0);
    expect(limiter.size()).toBe(3);
    // "a" was dropped, so it is counted afresh.
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.size()).toBe(3);
  });
});

describe("clientKey", () => {
  const request = (headers: Record<string, string>) =>
    new Request("https://advanta365.com/", { headers });

  test("takes the first address of x-forwarded-for", () => {
    expect(clientKey(request({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
  });

  test("falls back to x-real-ip, then to one shared key", () => {
    expect(clientKey(request({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientKey(request({}))).toBe("unknown");
  });
});
