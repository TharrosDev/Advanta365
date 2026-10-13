# Template file delivery and back-end hardening

Date: 2026-10-13. Status: awaiting owner review.

## Goal

Prepare the back end to host the real template files. The six free samples can be downloaded by anyone.
Every other file can be downloaded only with a licence the owner issues after a paid order. No payment
provider is connected in this change; a later webhook issues the same licence the owner issues by hand.

Success:

- A real catalog record names its files, and a missing, unsafe or malformed file record fails `pnpm test`
  and `pnpm build`, as other catalog errors do.
- A free sample's files download from its pop-up. A locked file cannot be fetched without a licence, and
  its route answers as if the file did not exist.
- The owner runs one script to turn an order code into a link. The buyer opens it once and then has a
  library of every file.
- With no file store configured, nothing breaks: download controls are hidden and the file routes
  answer 503.

## Decisions made with the owner

- Scope: files and gated delivery. No payment provider.
- Storage: not decided. Build a storage interface with a local-disk driver. The production driver comes later.
- Access: a signed licence link (HMAC). No database.
- A template has one or more files.
- Licence links never expire. Revocation is the only control.
- Security headers: a baseline Content Security Policy that keeps pages static. Scripts are not limited to
  nonces.
- Rate limiting: an in-app limiter that is per instance and best effort, plus a documented host firewall rule.
- The side effects are fixed in this change: the privacy policy's cookie wording, rate limiting and
  security headers.

Decisions made on the owner's behalf:

- The licence holds the order code and the time it was issued, and nothing personal. The site's rule is
  that no personal data is written into an address.
- The licence travels in the link once, then lives in an `HttpOnly` cookie. The cookie lasts 400 days, the
  most a browser keeps one, and opening the link again renews it.
- A locked file, an unknown template and an unknown file all answer 404, alike.
- No download log is kept, so the refund policy's "not downloaded" test cannot be checked from the site. This
  is recorded in the launch checklist, not solved here.

## 1. File records

`lib/catalog/schema.ts`: `TemplateSchema` gains `files: TemplateFile[]` (default `[]`).

| Field    | Rule                                                                                         |
| -------- | -------------------------------------------------------------------------------------------- |
| `id`     | Kebab slug, unique within the template. The last part of the download address               |
| `name`   | The file name the buyer saves: letters, digits, spaces, `. _ ( ) -`, ending in an allowed extension |
| `key`    | Where the store keeps it: segments of `[a-z0-9._-]`, joined by `/`. No `..`, no leading `/`, no `\` |
| `bytes`  | Positive integer                                                                             |
| `sha256` | 64 lower-case hex characters                                                                 |

Allowed extensions, each with its content type: `docx`, `dotx`, `pptx`, `potx`, `xlsx`, `xltx`, `pdf`
and `zip`. The table is `lib/files/types.ts`.

`lib/catalog/validate.ts` adds these checks:

- A real record (`isSample: false`) has at least one file.
- No two files in the catalog share a `key`.
- No two files in a template share an `id`.

Sample records may have no files. The `sample()` helper passes `files` through.

In this change the six free samples and one locked sample template get fixture files under
`tests/fixtures/files/`, so the routes, the button and the library can be tested. The fixtures are a few
bytes each and are labelled as fixtures.

## 2. Storage: `lib/files/`

```ts
interface FileStore {
  id: string;                                   // "local"
  stat(key: string): Promise<{ bytes: number } | null>;
  open(key: string): Promise<ReadableStream<Uint8Array> | null>;
  signedUrl?(key: string, downloadName: string, ttlSeconds: number): Promise<string>;
}
function getFileStore(): FileStore | null;
```

- The environment decides `getFileStore()`. `FILE_STORE=local` with `FILE_STORE_DIR` gives the local
  driver. Unset gives `null`, and downloads are then off.
- The local driver resolves every key with `path.resolve` and refuses any path outside its root,
  including through a symbolic link (`realpath`).
- A route prefers `signedUrl` and redirects to it with a 302 when the driver has one, and otherwise
  streams `open`. Vercel documents a 4.5 MB limit on a function's response body, and a deck can be
  larger. So on Vercel the production driver must sign URLs (R2 or S3, for example). The local driver
  is for development, tests and self-hosting.
- `tests/unit/stored-files.test.ts` checks every catalog file in the configured store: present, the
  right size and the right SHA-256. `pnpm test` runs it against the fixtures. Before launch it runs
  against the real files: `FILE_STORE=local FILE_STORE_DIR=<dir> pnpm vitest run tests/unit/stored-files.test.ts`.

## 3. Licences: `lib/licence/`

- **Format.** `v1.<payload>.<signature>`, both parts base64url.
  - The payload is JSON `{ "o": "<order code>", "i": <issued, unix seconds> }`.
  - The signature is HMAC-SHA256 over `v1.<payload>`.
  - The order code must match `orderCode`'s format (`A365-YYMMDD-XXXXXX`, with the alphabet from
    `lib/checkout/order.ts`).
- **Secrets.**
  - `LICENCE_SECRET` signs, and must be at least 32 characters.
  - `LICENCE_SECRET_PREVIOUS` is optional and is only verified against, for rotation.
  - Without `LICENCE_SECRET`, every licence fails.
- **Verify.** Comparison is constant-time (`timingSafeEqual`) and parsing is strict. Any failure gives one
  result, `invalid`, with no reason exposed.
- **Revoke.** `LICENCE_REVOKED` is a comma-separated list of order codes. A revoked licence is `invalid`.
- **No personal data.** The token holds no email address or name.
- **Imports.** `lib/licence/token.ts` imports only `node:crypto` and uses relative paths, so the mint script
  can run it under Node's type stripping (Node 22.18 and later).

## 4. Routes

| Route                              | Does                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /api/samples/[slug]/[fileId]` | Serves the file when the template is free. Otherwise 404                                                |
| `GET /licence?t=<token>`           | A valid token: sets the cookie, then 303 to `/library`. An invalid one: 303 to `/library?link=invalid`, no cookie |
| `/library`                         | A page. With a valid cookie: every template that has files, by phase, each file a link with its size. Without: how to get a link, and the contact address |
| `GET /api/library/[slug]/[fileId]` | Serves the file when the cookie holds a valid licence. Otherwise 404                                    |

- **Cookie.** `__Host-a365-licence`, with `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=34560000`.
- **File response headers.**
  - `Content-Type` comes from the extension table.
  - `Content-Disposition: attachment` gives both an ASCII `filename` and an RFC 5987 `filename*`.
  - `Content-Length`, `X-Content-Type-Options: nosniff` and `X-Robots-Tag: noindex`.
  - `Cache-Control` is `public, max-age=3600` for free files and `private, no-store` for licensed ones.
- **Missing store.** Both file routes answer 503 with a plain line.
- **Failure detail.** No response repeats a store error or says why a licence failed.
- **Page and claim headers.** `/library` and `/licence` send `Referrer-Policy: no-referrer` and
  `noindex`, and `/library` renders on demand because it reads the cookie.
- **Path case.** `proxy.ts` lower-cases paths. The token is in the query and the file ids are lower-case
  slugs, so it changes nothing here.

## 5. Rate limiting: `lib/http/rate-limit.ts`

- A fixed-window counter in memory, keyed by client address. The address is the first entry of
  `x-forwarded-for`, else `x-real-ip`, else `unknown`.
- The map is capped and pruned.
- `/licence`: 10 a minute. Each file route: 60 a minute. Over the limit: 429 with `Retry-After`.
- This holds per server instance only and resets on a cold start. Real enforcement is a Vercel Firewall
  rate-limit rule on `/licence` and `/api/`, which the README documents.

## 6. Security headers: `next.config.ts`

Every route gets these headers:

- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` (no `upgrade-insecure-requests`, which would get in the way of the tests' plain-HTTP server; HSTS covers it).
  In development, `script-src` adds `'unsafe-eval'` for React's refresh.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
- `Strict-Transport-Security: max-age=63072000` (no `includeSubDomains`, so other subdomains of the domain
  are not affected)

What the policy does not stop: an injected inline script. That needs nonces, which make every page
dynamic. A payment provider will need its origins added to `script-src`, `connect-src` and `frame-src`.
`docs/architecture.md` section 3.7 gets that step.

## 7. Interface

- **`TemplateDetail` (the free sample pop-up).** A "Download" button per file, with name, format and size,
  linking to `/api/samples/...`. It renders only when `getFileStore()` is not `null` and the template has
  files, and the server computes that. The purchase button stays.
- **`/library`.** Built from the existing primitives (`Band`, `Wrap`, `BandedList`, `Button`), with one
  `h1`, and inside the site shell. It is not in the navigation.

## 8. Privacy and legal

- **`lib/legal/privacy.ts`.** "No cookies" becomes "no tracking cookies". The cookies section describes the
  one strictly necessary cookie:
  - Who gets it: only a buyer who opens a licence link.
  - What it holds: the order code and a signature, nothing personal.
  - How long: 400 days.
  - What it is for: downloading the purchased files.
  - There is no banner, because the cookie is strictly necessary. A lawyer should confirm that.
- **`tests/unit/legal.test.ts`** follows the new wording.
- **README launch checklist.** Two items are added:
  - The production file store.
  - The refund policy's "not downloaded" test: the site keeps no download record.

## 9. Script

`node scripts/mint-licence.mjs <order-code>` reads `LICENCE_SECRET` and `SITE_ORIGIN` (default
`https://advanta365.com`) from the environment and prints the link. A bad code or a missing secret
exits non-zero with one line.

## 10. Tests

- **Unit tests.**
  - The file schema and catalog checks.
  - Token sign and verify, tampering, wrong secret, rotation, revocation, a bad order code and a missing secret.
  - The local store's refusal of traversal and symbolic links.
  - The rate limiter.
  - Each route handler called directly with a `Request`: free served with the right headers, locked 404,
    unknown 404, licensed with and without the cookie, revoked, a missing store giving 503, a signed-URL
    driver giving 302, and 429.
  - The stored-files check and the privacy wording.
- **Browser tests** run with the fixture store:
  - A free sample's download from the pop-up.
  - A minted link, then `/library`, then a download.
  - A locked file's address without a cookie gives 404.
  - The security headers are present, and the main routes show no CSP violation (the console spec).
- **Configuration.** The Playwright web server and Vitest set `FILE_STORE`, `FILE_STORE_DIR` and a test
  `LICENCE_SECRET`.

## 11. Docs

- `README.md`: the path to production, the environment variables, the firewall rule and the checklist.
- `docs/architecture.md`: a new section 3.8 on files and licences, plus the routes, the failure modes and
  the 3.7 note on CSP.
- `docs/testing.md`: the new specs.

## Out of scope

- A payment provider and its webhook.
- A production storage driver.
- A nonce-based CSP.
- A shared rate-limit store.
- A download log.
- The worked example's file. It becomes downloadable when it is a catalog entry with files.
