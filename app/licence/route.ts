import { NextResponse } from "next/server";
import { tooMany } from "@/lib/files/respond";
import { clientKey, createRateLimiter } from "@/lib/http/rate-limit";
import { LICENCE_COOKIE, LICENCE_COOKIE_MAX_AGE } from "@/lib/licence/cookie";
import { licenceEnv, verifyLicence } from "@/lib/licence/token";

export const runtime = "nodejs";

const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

/**
 * `/licence?t=<licence>`: the link a buyer is sent. A good licence goes into an HttpOnly cookie and
 * the browser moves on to the catalog, unlocked, so the licence leaves the address bar and is never
 * sent on as a referrer. Anything else lands on the catalog saying the link did not work, and sets
 * nothing.
 */
export async function GET(request: Request): Promise<Response> {
  const limited = limiter.check(clientKey(request));
  if (!limited.ok) return tooMany(limited.retryAfter);

  const token = new URL(request.url).searchParams.get("t");
  const licence = verifyLicence(token, licenceEnv());

  const response = NextResponse.redirect(
    new URL(licence ? "/catalog" : "/catalog?link=invalid", request.url),
    303,
  );
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (licence && token) {
    response.cookies.set(LICENCE_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: LICENCE_COOKIE_MAX_AGE,
    });
  }
  return response;
}
