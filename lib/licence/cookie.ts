/**
 * The cookie a licence lives in once its link has been opened (app/licence/route.ts). `__Host-` binds
 * it to this host, over HTTPS, for the whole site. 400 days is the longest a browser keeps a cookie;
 * opening the link again renews it.
 */
export const LICENCE_COOKIE = "__Host-a365-licence";

export const LICENCE_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

/** One cookie's value from a `Cookie` header, or `null`. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const pair of header.split(";")) {
    const at = pair.indexOf("=");
    if (at !== -1 && pair.slice(0, at).trim() === name) return pair.slice(at + 1).trim();
  }
  return null;
}
