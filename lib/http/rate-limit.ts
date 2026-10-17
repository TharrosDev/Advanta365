/**
 * A fixed-window request counter, kept in the server's memory. Each server instance counts on its
 * own and forgets on a cold start, so this only stops one client hammering one warm instance; the
 * host's firewall rule (README, "Files and licences") is what enforces a limit across the site.
 */
type RateLimiter = {
  /** Counts one request from `key`: allowed, or refused with the seconds until its window ends. */
  check(key: string, now?: number): { ok: true } | { ok: false; retryAfter: number };
  /** How many clients are being counted. */
  size(): number;
};

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  // Insertion order is age order: a window that starts again is moved to the end.
  const windows = new Map<string, { start: number; count: number }>();

  function makeRoom(now: number) {
    for (const [key, window] of windows) {
      if (now - window.start >= windowMs) windows.delete(key);
    }
    while (windows.size >= maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest === undefined) break;
      windows.delete(oldest);
    }
  }

  return {
    check(key, now = Date.now()) {
      const window = windows.get(key);
      if (!window || now - window.start >= windowMs) {
        windows.delete(key);
        if (windows.size >= maxKeys) makeRoom(now);
        windows.set(key, { start: now, count: 1 });
        return { ok: true };
      }
      if (window.count < limit) {
        window.count += 1;
        return { ok: true };
      }
      return { ok: false, retryAfter: Math.ceil((window.start + windowMs - now) / 1000) };
    },
    size: () => windows.size,
  };
}

/** Who is asking: the first address of `x-forwarded-for`, else `x-real-ip`, else one shared key. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}
