/**
 * The address the site is published at, with no slash at the end. Every absolute address the site
 * writes for search engines, shared links and AI tools (the canonical links, the sitemap, the
 * structured data, `llms.txt`) is built on it.
 *
 * `SITE_ORIGIN` moves it, as it does for `scripts/mint-licence.mjs`; the default is the production
 * domain. It is read on the server only: no component that runs in the browser imports this file.
 */
export const SITE_ORIGIN = (process.env.SITE_ORIGIN ?? "https://advanta365.com").replace(
  /\/+$/,
  "",
);

/** A path of the site as an absolute address: `absoluteUrl("/catalog")`. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}

/**
 * Whether this build is the one the public reaches. A Vercel preview (or any other deployment that
 * says it is not production) asks search engines and AI crawlers to stay away, so a preview address
 * never competes with the real one. A build outside Vercel counts as production.
 */
export function isPublicDeployment(): boolean {
  const environment = process.env.VERCEL_ENV;
  return environment === undefined || environment === "production";
}
