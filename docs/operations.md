# Operations

This page is for running the site: its environment variables, the file store and licences, the
deployment on Vercel, the security headers, and the seams a production build connects to. The
mechanics behind each are in [`architecture.md`](architecture.md) (sections 3.7 and 3.8). What must
be settled before the first sale is in [`launch-checklist.md`](launch-checklist.md).

## Contents

- [Environment variables](#environment-variables)
- [Files and licences](#files-and-licences)
- [Deploying on Vercel](#deploying-on-vercel)
- [Security headers](#security-headers)
- [Rate limits](#rate-limits)
- [Path to production](#path-to-production)

## Environment variables

No variable is needed to run the site: with none set it serves every page, and downloads are off.
Keep secrets in the host's settings and, locally, in `.env.local`. `.gitignore` leaves out every
`.env*` file, so none is committed.

| Variable | Read in | Meaning |
| --- | --- | --- |
| `FILE_STORE` | `lib/files/store.ts` | `local` for the local-disk driver. Unset turns downloads off: the download buttons are hidden and the file routes answer 503. |
| `FILE_STORE_DIR` | `lib/files/store.ts` | The folder the local driver serves, relative to the working directory or absolute. |
| `LICENCE_SECRET` | `lib/licence/token.ts`, `scripts/mint-licence.mjs` | Signs and verifies licences. At least 32 characters. Server only; never committed. |
| `LICENCE_SECRET_PREVIOUS` | `lib/licence/token.ts` | The secret before a rotation. It only verifies, so links sent before the rotation keep working. |
| `LICENCE_REVOKED` | `lib/licence/token.ts` | Order codes, comma separated, whose licences no longer work. |
| `SITE_ORIGIN` | `lib/seo/origin.ts`, `scripts/mint-licence.mjs` | The address the site is published at. Every absolute address it writes (canonical links, the sitemap, structured data, `llms.txt`, minted licence links) is built on it. Default `https://advanta365.com`. |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | `app/layout.tsx` | The search consoles' ownership tags. Unset, no tag is written. |
| `VERCEL` | `app/layout.tsx` | Set by Vercel. Only then are Vercel Web Analytics and Speed Insights rendered: elsewhere their scripts would only fetch a 404. |
| `VERCEL_ENV` | `lib/seo/origin.ts`, `next.config.ts` | Set by Vercel. Anything but `production` asks every crawler to stay away (`noindex`, and `robots.txt` turns them all away); `preview` also lets Vercel's toolbar through the content security policy. Unset counts as production. |
| `NODE_ENV` | `next.config.ts` | `development` lets React's refresh evaluate code (`'unsafe-eval'` in the policy). |

The test runners set their own: Vitest and the Playwright web server both set `FILE_STORE=local`,
`FILE_STORE_DIR=tests/fixtures/files` and a test-only `LICENCE_SECRET`. Playwright also reads
`PW_PORT`, `PW_FIREFOX` and `CI` ([`testing.md`](testing.md#browser-tests)).

## Files and licences

Each template lists the files it is delivered as (`files` on the record: an id, the name the buyer
saves, the key where the store keeps it, its size and its SHA-256). Validation fails on an unsafe
key, an extension outside `lib/files/types.ts`, a repeated key or id, and a real record
(`isSample: false`) with no files.

- **Free samples** download from their pop-up, from `/api/samples/<slug>/<file id>`. Any other
  template's file answers 404 there, the same as a file that does not exist.
- **Everything else** needs a licence. In a browser holding one, every tile of the catalog and the
  phase pages is unlocked, and any template opens in the pop-up with its files to download from
  `/api/library/<slug>/<file id>`. That route serves a file only to a browser holding a valid
  licence and answers 404 otherwise, so a tile unlocked by hand in the page never unlocks a file.
- With no store configured, download buttons are hidden and the file routes answer 503.

### Issuing a licence

Until a payment provider is connected, an order arrives by email from the checkout's Payment step,
with its order code (`A365-YYMMDD-XXXXXX`). Once it is paid, turn the code into a link and send it
to the buyer:

```bash
LICENCE_SECRET=<the site's secret> node scripts/mint-licence.mjs A365-261013-ABCDEF
```

The script prints `<SITE_ORIGIN>/licence?t=<licence>`. It needs Node 22.18 or later, which runs the
TypeScript module it imports directly. Opening the link once puts the licence in an `HttpOnly`
cookie (`__Host-a365-licence`, 400 days) and lands on the catalog, unlocked; a bad link lands on
`/catalog?link=invalid`, which says so.

A licence holds the order code and the time it was issued, signed with HMAC-SHA256, and nothing
personal. It does not expire.

- **To withdraw one**, add its order code to `LICENCE_REVOKED`.
- **To rotate the secret**, move the old value to `LICENCE_SECRET_PREVIOUS` and set a new
  `LICENCE_SECRET`. New links are signed with the new secret; old ones still verify.

### Checking the real files

Before the real files are offered, check them against the catalog: every file a record names must be
in the store, at its size and with its SHA-256.

```bash
FILE_STORE=local FILE_STORE_DIR=<folder> pnpm vitest run tests/unit/stored-files.test.ts
```

## Deploying on Vercel

The site is a standard Next.js build (`pnpm build`) and needs no server of its own beyond what
Vercel runs. Things to know there:

- **Response size.** A function's response body is limited to 4.5 MB, so the local-disk driver
  cannot serve real decks on Vercel. Production needs a driver whose `signedUrl` returns a
  short-lived address from an object store (R2 or S3, for example); the routes already redirect to it
  when a driver has one.
- **Secrets.** Set `LICENCE_SECRET` (and the file store's variables) in the project's settings, for
  Production only.
- **Previews.** A preview deployment is not indexed and turns every crawler away, and its content
  security policy lets Vercel's toolbar and comments through. Production never gets those sources.
- **Measurements.** Vercel Web Analytics and Speed Insights are rendered only on Vercel. They set no
  cookie; the privacy policy names them.
- **Firewall.** Add a Vercel Firewall rate-limit rule on `/licence` and `/api/` (per IP). The
  limiter in the code is not enough on its own (see [Rate limits](#rate-limits)).

## Security headers

`next.config.ts` sends these on every route:

- a content security policy that keeps the site's own origin as the only source of everything, with
  no plugins, no framing and no form posting elsewhere;
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, a permissions policy that turns off the camera, microphone, location and
  topics, and HSTS for two years (without subdomains).

`/licence` also sends `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex`, and every `/api/`
address `X-Robots-Tag: noindex`.

Inline scripts stay allowed so pages can be static (the boot script and Next.js's own inline scripts
need it, and a nonce would make every page render on demand), so the policy does not stop an
injected inline script: it is a baseline, not a defence against cross-site scripting. A payment
provider will need its own origins added to `script-src`, `connect-src` and `frame-src`
([`architecture.md`](architecture.md#37-checkout-and-the-payment-seam), step 8).

## Rate limits

`/licence` allows 10 requests a minute per client and each file route 60. Past that the answer is a
429 with `Retry-After`. The counter is in memory, per server instance, and resets on a cold start,
so it only slows one client on one instance. Set the Vercel Firewall rule above for real enforcement.

## Path to production

The code already has the seams that a production build connects to.

| Concern | Seam in the code |
| --- | --- |
| Catalog data | Files in `content/`, read through `lib/catalog/repository.ts`. Its functions are async, so another source can implement the same functions. [`content.md`](content.md) covers replacing the sample records. |
| Record shapes | `lib/catalog/schema.ts` defines the phase and template records, and `lib/catalog/validate.ts` checks them. |
| The offer | `OFFER` in `lib/site.ts`: its name and its price in cents. The tag, the bar's button and the Purchase page all print it. |
| Checkout | `getPaymentProvider()` in `lib/checkout/provider.ts` returns `null`. A provider is returned from there ([`architecture.md`](architecture.md#37-checkout-and-the-payment-seam) walks through it). |
| Files | `getFileStore()` in `lib/files/store.ts`: a `FileStore` driver for the real files. Only a local-disk driver exists. |
| Licences | `signLicence()` in `lib/licence/token.ts`: the owner mints one by hand today; a payment webhook calls the same function. |
| Page metadata | The root `metadata` in `app/layout.tsx`, and each page's `pageMetadata` (`lib/seo/metadata.ts`). |
