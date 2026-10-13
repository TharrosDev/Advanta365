# Template File Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catalog templates name their real files; free samples download publicly, every other file
downloads only with an owner-issued licence; the site sends security headers and rate-limits the new routes.

**Architecture:** File records live on the template schema. A `FileStore` interface (local-disk driver
now) sits behind route handlers that check access first. A licence is a stateless HMAC token, claimed once
into an `HttpOnly` cookie and read by `/library` and the licensed file route.

**Tech Stack:** Next.js 16 App Router route handlers, React 19, TypeScript strict, zod 4, `node:crypto`,
`node:fs`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-13-template-file-delivery-design.md`

## Global Constraints

- Runtime dependencies stay `next`, `react`, `react-dom`, `zod` (design gate). No new package.
- The design gate scans `app/`, `components/`, `lib/` and `tests/` as text: never write `reveal`, `wipe`,
  `chrome`, `sheen`, `swirl`, `liquid`, `wordmark` or `the reference`, in any case, even in comments or
  test names.
- Only `components/ui/transition-link.tsx` imports `next/link`. A file link is a plain `<a>`.
- Raw colour values only in `app/globals.css`. Layout space uses the `--s-*` tokens. Media queries only
  from the gate's list.
- Each page has one `h1`.
- No personal data in an address; the licence holds the order code and the issue time only.
- Order code format: `^A365-\d{6}-[2-9A-HJ-NP-Z]{6}$`.
- Cookie: `__Host-a365-licence`, `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=34560000`.
- Environment: `FILE_STORE` (`local` or unset), `FILE_STORE_DIR`, `LICENCE_SECRET` (at least 32
  characters), `LICENCE_SECRET_PREVIOUS`, `LICENCE_REVOKED` (comma list), `SITE_ORIGIN` (script only).
- Limits: `/licence` 10 per minute per client, each file route 60 per minute per client.
- Allowed extensions and content types: `docx`
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `dotx`
  `application/vnd.openxmlformats-officedocument.wordprocessingml.template`, `pptx`
  `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `potx`
  `application/vnd.openxmlformats-officedocument.presentationml.template`, `xlsx`
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `xltx`
  `application/vnd.openxmlformats-officedocument.spreadsheetml.template`, `pdf` `application/pdf`, `zip`
  `application/zip`.
- Commits end with the attribution lines from the session reminder.

## Review Focus

1. A locked file requested through the free route (`/api/samples/<locked>/<id>`) must 404 exactly like an
   unknown slug. Covered in Task 4.
2. A token signed with the previous secret after rotation must still verify; a token for a revoked order
   must fail even with a valid signature. Covered in Task 3.
3. A catalog file whose key is in the record but missing from the store: the route answers 404 and the
   stored-files test fails. Covered in Tasks 2 and 4.
4. A key like `a/../../etc/passwd` or a symbolic link inside the store pointing outside it must be refused
   by the local driver even if validation were bypassed. Covered in Task 2.
5. The Vercel preview injects `vercel.live` scripts; a CSP that blocks them logs console errors on every
   preview. `next.config.ts` adds `https://vercel.live` sources when `VERCEL_ENV === "preview"`. Covered
   in Task 7.

---

### Task 1: File records on the catalog

**Files:**
- Create: `lib/files/types.ts`
- Modify: `lib/catalog/schema.ts`, `lib/catalog/validate.ts`, `lib/catalog/repository.ts`,
  `content/templates/sample.ts`, `lib/format.ts`
- Modify (fixtures): `content/templates/{make-the-case,plan,design,prepare,communicate,execute}.ts`
- Create: `tests/fixtures/files/**` (eight small text files)
- Test: `tests/unit/validate.test.ts`, `tests/unit/format.test.ts`, `tests/unit/content.test.ts`

**Interfaces:**
- Produces:
  - `FILE_TYPES: Record<FileExtension, string>`, `type FileExtension`, `extensionOf(name: string): FileExtension | undefined` (in `lib/files/types.ts`)
  - `TemplateFileSchema`, `type TemplateFile = { id: string; name: string; key: string; bytes: number; sha256: string }`; `Template.files: TemplateFile[]`
  - `getTemplateFile(slug: string, fileId: string): Promise<{ template: Template; file: TemplateFile } | undefined>`
  - `getTemplatesWithFiles(): Promise<Template[]>` (catalog order)
  - `formatBytes(bytes: number): string`

- [ ] **Step 1: Write failing tests** in `tests/unit/validate.test.ts` (use the existing fixture builder in
  `tests/unit/fixtures/catalog.ts`):
  - `rejects a file key with ..`: key `plan/../x.docx` throws `CatalogError` matching `/files\.0\.key/`.
  - `rejects a key with a leading slash or a backslash`: `/plan/x.docx`, `plan\\x.docx`.
  - `rejects a name with an extension outside the list`: `Plan.exe`.
  - `rejects a malformed sha256`: 63 characters, upper-case hex.
  - `rejects two files sharing a key across templates`: message `Duplicate file key "<key>"`.
  - `rejects two files sharing an id in one template`: message `Duplicate file id "<id>" in template "<slug>"`.
  - `rejects a real record with no files`: `isSample: false`, `files: []`, message `Template "<slug>" is not a sample and has no files`.
  - `accepts a sample record with no files`, and `defaults files to []` when the field is absent.
  In `tests/unit/format.test.ts`: `formatBytes(512) === "1 KB"`, `formatBytes(24_576) === "24 KB"`,
  `formatBytes(2_400_000) === "2.3 MB"`, `formatBytes(15_728_640) === "15 MB"`.

- [ ] **Step 2: Run** `pnpm vitest run tests/unit/validate.test.ts tests/unit/format.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `lib/files/types.ts`: the extension table from Global Constraints; `extensionOf` lower-cases the
    part after the last dot.
  - `TemplateFileSchema`: `id` slug regex; `name` `/^[A-Za-z0-9][A-Za-z0-9 ._()-]*$/`, max 120, and
    `extensionOf(name)` defined; `key` `/^[a-z0-9._-]+(\/[a-z0-9._-]+)*$/` and no segment equal to `.` or
    `..`; `bytes` positive int; `sha256` `/^[0-9a-f]{64}$/`. `files: z.array(TemplateFileSchema).default([])`.
  - `validateCatalog`: the three new checks with the messages above.
  - `sample()`: `SampleInput` gains `files?: TemplateFile[]` (import the type), passed through.
  - `formatBytes`: binary units; under 1 MiB whole KB rounded up, minimum 1 KB; from 1 MiB, MB with
    one decimal under 10 MB and whole MB from 10 MB.
  - Repository: the two functions over the validated catalog.

- [ ] **Step 4: Add fixture files.** Under `tests/fixtures/files/`, one file per free sample at
  `<phase>/<slug>/<slug>.<format>` (format from the record), plus two for the locked template
  `sharepoint-migration-impact-assessment`: `plan/sharepoint-migration-impact-assessment/impact-scoring-workbook.xlsx`
  and `.../summary-slide.pptx`. Each file's text is `Advanta365 test fixture: <file name>\n`. Add the
  matching `files` entries to those seven records, with a comment `// Test fixture files (tests/fixtures/files), not real downloads.`
  Names in title case with spaces, e.g. `"Executive Sponsor Kickoff Deck.pptx"`; ids `deck`, `strategy`,
  `framework`, `training-deck`, `plan`, `checklist`, `workbook`, `summary-slide`. Get `bytes` from
  `wc -c` and `sha256` from `sha256sum`.

- [ ] **Step 5: Run** `pnpm test && pnpm typecheck`. Expected: PASS (the content test's counts are
  unchanged).

- [ ] **Step 6: Commit** `feat: catalog templates name their files`.

### Task 2: The file store

**Files:**
- Create: `lib/files/store.ts`, `lib/files/local-store.ts`
- Modify: `vitest.config.mts` (`test.env`: `FILE_STORE=local`, `FILE_STORE_DIR=tests/fixtures/files`,
  `LICENCE_SECRET=test-secret-test-secret-test-secret-0`)
- Test: `tests/unit/file-store.test.ts`, `tests/unit/stored-files.test.ts`

**Interfaces:**
- Consumes: `getTemplatesWithFiles()`, `TemplateFile` (Task 1).
- Produces:
  - `interface FileStore { id: string; stat(key: string): Promise<{ bytes: number } | null>; open(key: string): Promise<ReadableStream<Uint8Array> | null>; signedUrl?(key: string, downloadName: string, ttlSeconds: number): Promise<string> }`
  - `getFileStore(env?: NodeJS.ProcessEnv): FileStore | null` (reads at call time)
  - `createLocalStore(root: string): FileStore`

- [ ] **Step 1: Write failing tests** in `tests/unit/file-store.test.ts` against a temp dir (`mkdtemp`):
  `stat` and `open` of a present file give its size and bytes; a missing key gives `null`;
  `../outside.txt`, `/etc/hostname` and `a/../../outside.txt` give `null` for both; a symbolic link inside
  the root that points to a file outside it gives `null`; `getFileStore({})` is `null`;
  `getFileStore({ FILE_STORE: "local" })` without a dir is `null`; `getFileStore({ FILE_STORE: "s3" })` is `null`.
  In `tests/unit/stored-files.test.ts`: when `getFileStore()` is not null, every file of
  `getTemplatesWithFiles()` exists with its `bytes` and its SHA-256 (hash the stream); when it is null,
  `it.skip` with a note.

- [ ] **Step 2: Run** `pnpm vitest run tests/unit/file-store.test.ts tests/unit/stored-files.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** The local driver resolves `path.resolve(root, key)`, then `realpath` of both
  the root and the target, and refuses unless the target starts with `root + path.sep`. `open` returns
  `Readable.toWeb(createReadStream(path))`. `getFileStore` resolves a relative `FILE_STORE_DIR` against
  `process.cwd()`.

- [ ] **Step 4: Run** `pnpm test`. Expected: PASS.

- [ ] **Step 5: Commit** `feat: a file store with a local-disk driver`.

### Task 3: Licences and the mint script

**Files:**
- Create: `lib/licence/token.ts` (imports only `node:crypto`), `lib/licence/cookie.ts`, `scripts/mint-licence.mjs`
- Test: `tests/unit/licence.test.ts`

**Interfaces:**
- Produces:
  - `type LicenceEnv = { secret?: string; previous?: string; revoked: ReadonlySet<string> }`
  - `licenceEnv(env?: NodeJS.ProcessEnv): LicenceEnv`
  - `signLicence(orderCode: string, secret: string, issuedAt?: number): string` (throws on a bad code or a secret under 32 characters)
  - `verifyLicence(token: string | null | undefined, env: LicenceEnv): { orderCode: string; issuedAt: number } | null`
  - `ORDER_CODE: RegExp`
  - In `cookie.ts`: `LICENCE_COOKIE = "__Host-a365-licence"`, `LICENCE_COOKIE_MAX_AGE = 34_560_000`, `readCookie(header: string | null, name: string): string | null`

- [ ] **Step 1: Write failing tests:** a signed token verifies to its code and time; changing one
  character of the payload or the signature fails; another secret fails; a token signed with
  `previous` verifies when `previous` is set; a revoked code fails; no `secret` fails everything;
  `"v2.x.y"`, `""`, `null`, a payload that is not JSON and an order code like `A365-261013-ABCDE0` fail;
  `signLicence` throws for a 31-character secret; `ORDER_CODE.test(orderCode(new Date(), crypto.getRandomValues(new Uint8Array(6))))`
  for 100 draws (keeps the format in step with `lib/checkout/order.ts`); `readCookie` finds a value among
  several, and returns `null` when absent.

- [ ] **Step 2: Run** `pnpm vitest run tests/unit/licence.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** Token `v1.<b64url(JSON {o,i})>.<b64url(HMAC-SHA256(secret, "v1." + payload))>`.
  Verification computes the HMAC with each configured secret and compares with `timingSafeEqual` after a
  length check, then parses the payload strictly (exactly keys `o` and `i`, `i` a positive integer).
  `licenceEnv` splits `LICENCE_REVOKED` on commas and trims.
  Script: `node scripts/mint-licence.mjs <order-code>` imports `../lib/licence/token.ts`, prints
  `${SITE_ORIGIN ?? "https://advanta365.com"}/licence?t=<token>`. On a bad code or a missing or short
  secret it prints one line to stderr and exits 1.

- [ ] **Step 4: Run** the tests, then
  `LICENCE_SECRET=test-secret-test-secret-test-secret-0 node scripts/mint-licence.mjs A365-261013-ABCDEF`.
  Expected: PASS, and one line ending in `/licence?t=v1.`… Then
  `node scripts/mint-licence.mjs bad` exits 1.

- [ ] **Step 5: Commit** `feat: signed licences and a script to mint them`.

### Task 4: Serving files, rate limiting and the free route

**Files:**
- Create: `lib/http/rate-limit.ts`, `lib/files/respond.ts`, `app/api/samples/[slug]/[fileId]/route.ts`
- Test: `tests/unit/rate-limit.test.ts`, `tests/unit/sample-route.test.ts`

**Interfaces:**
- Consumes: `getTemplateFile`, `getFileStore`, `FILE_TYPES`, `extensionOf`.
- Produces:
  - `createRateLimiter(options: { limit: number; windowMs: number; maxKeys?: number }): { check(key: string, now?: number): { ok: true } | { ok: false; retryAfter: number } }`
  - `clientKey(request: Request): string`
  - `serveFile(store: FileStore, file: TemplateFile, access: "public" | "licensed"): Promise<Response>`
  - `notFound(): Response`, `tooMany(retryAfter: number): Response`, `unavailable(): Response` (plain text, `Cache-Control: no-store`, `X-Robots-Tag: noindex`)
  - `contentDisposition(name: string): string`

- [ ] **Step 1: Write failing tests.**
  - Rate limiter: the 11th call in a window with `limit: 10` gives `{ ok: false }` with `retryAfter`
    in seconds rounded up; a new window resets; two keys count apart; past `maxKeys` the oldest windows
    are pruned and the map never exceeds it. `clientKey` takes the first `x-forwarded-for` entry, then
    `x-real-ip`, then `"unknown"`.
  - Route, by calling the exported `GET(new Request(url, { headers }), { params: Promise.resolve({...}) })`
    with a unique `x-forwarded-for` per test:
    - The free deck gives 200 with `Content-Type` from the table, `Content-Length` equal to `bytes`,
      `Content-Disposition` containing `attachment; filename="Executive Sponsor Kickoff Deck.pptx"` and
      `filename*=UTF-8''Executive%20Sponsor%20Kickoff%20Deck.pptx`, `X-Content-Type-Options: nosniff`,
      `X-Robots-Tag: noindex`, `Cache-Control: public, max-age=3600`, and the fixture's bytes.
    - The locked workbook, an unknown slug and an unknown file id each give 404 with the same body.
    - `vi.stubEnv("FILE_STORE", "")` gives 503.
    - A store with `signedUrl` (inject through a `vi.mock` of `lib/files/store`) gives 302 to the
      signed address with `Cache-Control: no-store`.
    - A record whose key is missing from the store gives 404.
    - The 61st call from one client in a minute gives 429 with `Retry-After`.

- [ ] **Step 2: Run** `pnpm vitest run tests/unit/rate-limit.test.ts tests/unit/sample-route.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** The route exports `GET` and `export const runtime = "nodejs"`. Order: rate
  limit, store (503), lookup (404 unless `template.free`), `serveFile`. `serveFile` prefers `signedUrl`
  (TTL 300), else `stat` (404 if null), else streams `open`. `contentDisposition` keeps printable
  ASCII other than `"` and `\` in `filename` and puts `encodeURIComponent` in `filename*`. No response
  repeats an error message.

- [ ] **Step 4: Run** `pnpm test && pnpm lint && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit** `feat: free samples download, with rate limiting`.

### Task 5: The licence claim and the licensed route

**Files:**
- Create: `app/licence/route.ts`, `app/api/library/[slug]/[fileId]/route.ts`
- Test: `tests/unit/library-routes.test.ts`

**Interfaces:**
- Consumes: Tasks 3 and 4.
- Produces: the cookie set by `/licence`, read by `/api/library/...` and by `/library` (Task 6).

- [ ] **Step 1: Write failing tests.**
  - `/licence?t=<valid>`: 303, `Location` ends `/library`, `Set-Cookie` contains `__Host-a365-licence=`,
    `HttpOnly`, `Secure`, `SameSite=lax` (case-insensitive), `Path=/` and `Max-Age=34560000`, plus
    `Referrer-Policy: no-referrer` and `Cache-Control: no-store`.
  - `/licence?t=garbage`, a revoked code and no `t`: 303 to `/library?link=invalid`, no `Set-Cookie`.
  - 11th claim in a minute from one client: 429.
  - `/api/library/sharepoint-migration-impact-assessment/workbook`: with a valid cookie 200 and
    `Cache-Control: private, no-store`; with no cookie, a tampered cookie or a revoked code, 404; a free
    file with a valid cookie, 200; no store, 503.

- [ ] **Step 2: Run** `pnpm vitest run tests/unit/library-routes.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement.** The claim uses `NextResponse.redirect(new URL(path, request.url), 303)` and
  `response.cookies.set(LICENCE_COOKIE, token, {...})`. The licensed route reads the cookie with
  `readCookie(request.headers.get("cookie"), LICENCE_COOKIE)`; order: rate limit, licence (404), store
  (503), lookup (404), `serveFile(..., "licensed")`.

- [ ] **Step 4: Run** `pnpm test && pnpm lint && pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit** `feat: claim a licence link and download licensed files`.

### Task 6: The library page and the download button

**Files:**
- Create: `app/(site)/library/page.tsx`, `components/library/library-section.tsx`,
  `components/library/library-section.module.css`, `components/catalog/file-downloads.tsx`,
  `components/catalog/file-downloads.module.css`
- Modify: `playwright.config.ts`, `components/ui/button.tsx` (prop `download?: boolean`), `components/catalog/template-detail.tsx`
  (prop `downloadable: boolean`), `app/(site)/catalog/page.tsx`
- Test: `tests/e2e/downloads.spec.ts`

**Interfaces:**
- Consumes: `getTemplatesWithFiles`, `getPhases`, `getFileStore`, `verifyLicence`, `licenceEnv`,
  `LICENCE_COOKIE`, `formatBytes`, `FORMAT_LABELS`.
- Produces: `FileDownloads({ files, hrefFor }: { files: TemplateFile[]; hrefFor: (file: TemplateFile) => string })`,
  a list where each file is a `Button variant="outline" download` with the name, its format label and size.

- [ ] **Step 1: Give the Playwright web server the fixture env** (`webServer.env` in `playwright.config.ts`:
  `FILE_STORE=local`, `FILE_STORE_DIR=tests/fixtures/files`, `LICENCE_SECRET` as in Vitest), then write the
  failing browser spec `tests/e2e/downloads.spec.ts`:
  - `a free sample downloads from its pop-up`: `/catalog?view=executive-sponsor-kickoff-deck`,
    `page.waitForEvent("download")` after clicking the link named `/Executive Sponsor Kickoff Deck\.pptx/`;
    `download.suggestedFilename() === "Executive Sponsor Kickoff Deck.pptx"`.
  - `a licence link opens the library`: `goto("/licence?t=" + signLicence("A365-261013-ABCDEF", secret))`,
    then the URL is `/library` and the `h1` is "Your toolkit"; the workbook link downloads
    `Impact Scoring Workbook.xlsx`.
  - `the library without a licence says how to get one`: `/library` shows the contact address and no
    download links; `/library?link=invalid` also says the link did not work.
  - `a locked file is not served without a licence`: `request.get("/api/library/sharepoint-migration-impact-assessment/workbook")`
    status 404, and the same path under `/api/samples/` is 404.

- [ ] **Step 2: Run** `pnpm exec playwright test tests/e2e/downloads.spec.ts --project=chromium`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `Button`: with `href` and `download`, render the plain `<a href download>` branch.
  - Catalog page: `downloadable={getFileStore() !== null && opened.files.length > 0}`; `TemplateDetail`
    renders `<FileDownloads>` in a `section` with the `h3` "Download" above the purchase button when
    `downloadable`, with `hrefFor` `/api/samples/${slug}/${file.id}`.
  - Library page: `metadata` `{ title: "Your toolkit", robots: { index: false, follow: false } }`; reads
    `(await cookies()).get(LICENCE_COOKIE)?.value` and `searchParams.link`. States, in `LibrarySection`
    (one `Band` on paper, `Wrap`, the `h1` "Your toolkit"):
    - Valid licence and a store: the lead "Every file in the toolkit. Download what you need; this link
      keeps working on this browser." and, per phase in order, an `h2` with the phase name and each
      template's title with its `FileDownloads` (`hrefFor` `/api/library/...`).
    - Valid licence, no store: "Downloads are not available right now. Write to <contact> and we will
      send your files."
    - No or invalid licence: "Open the link from your order email to see your files here. If it does not
      work, write to <contact> with your order code." With `link=invalid`, first: "That link did not work."
  - CSS uses tokens only; the list reuses `BandedList` and `BandedRow`.

- [ ] **Step 4: Run** the spec, plus `tests/e2e/template-dialog.spec.ts`, `tests/e2e/viewports.spec.ts`
  and `pnpm test`. Expected: PASS. If the viewport spec lists routes, add `/library`.

- [ ] **Step 5: Commit** `feat: the library page and the free sample download button`.

### Task 7: Security headers

**Files:**
- Modify: `next.config.ts`
- Test: `tests/e2e/headers.spec.ts`

- [ ] **Step 1: Write the failing spec:** `request.get("/")` has the CSP from the spec (assert it
  contains `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'` and `form-action 'self'`),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, `Permissions-Policy` containing `camera=()`, and
  `Strict-Transport-Security: max-age=63072000`; `/library` and `/licence` have
  `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex`; `/api/samples/x/y` has `X-Robots-Tag: noindex`.

- [ ] **Step 2: Run** `pnpm exec playwright test tests/e2e/headers.spec.ts --project=chromium`. Expected: FAIL.

- [ ] **Step 3: Implement `headers()`** in `next.config.ts`. Build the CSP from a list of directives;
  `script-src` adds `'unsafe-eval'` when `NODE_ENV === "development"`. When `VERCEL_ENV === "preview"`,
  add `https://vercel.live` to `script-src`, `connect-src`, `img-src`, `style-src`, `font-src` and
  `frame-src https://vercel.live`, plus `wss://ws-us3.pusher.com` to `connect-src`. Check these against
  Vercel's current toolbar CSP documentation before committing. Comment why each exception exists.

- [ ] **Step 4: Run** the spec and `tests/e2e/console.spec.ts` (every route logs no CSP violation).
  Expected: PASS.

- [ ] **Step 5: Commit** `feat: security headers and a baseline content security policy`.

### Task 8: Privacy policy, test wiring and docs

**Files:**
- Modify: `lib/legal/privacy.ts`, `tests/unit/legal.test.ts`, `tests/e2e/console.spec.ts` (add `/library`), `README.md`,
  `docs/architecture.md`, `docs/testing.md`

- [ ] **Step 1: Write failing tests** in `tests/unit/legal.test.ts`: the cookies section's terms are
  `[INTRO_FLAG, DRAFT_KEY, LICENCE_COOKIE]`; the policy's words do not contain `sets no cookies`; it
  contains `strictly necessary` and `400 days`.

- [ ] **Step 2: Run** `pnpm vitest run tests/unit/legal.test.ts`. Expected: FAIL.

- [ ] **Step 3: Rewrite the privacy wording.**
  - `description`: "…no tracking cookies, no analytics, no accounts."
  - First point: "The site sets no tracking cookies and runs no analytics, advertising or tracking
    scripts."
  - Cookies section: replace "sets no cookies" with a paragraph saying one strictly necessary cookie is
    set only for a buyer who opens the link from their order email, and a `terms` row
    `[LICENCE_COOKIE, "Holds your licence: the order code and a signature, nothing about you. It lets this browser download the files you bought, and lasts 400 days. Opening the link again renews it."]`
    after the two storage rows.
  - Update the file's header comment.

- [ ] **Step 4: Docs.**
  - README: the folder layout (`app/licence`, `app/api`, `app/(site)/library`, `lib/files`, `lib/licence`,
    `lib/http`, `tests/fixtures/files`), the scripts table (`mint-licence`), a section "Files and licences"
    with the environment variables and the Vercel Firewall rule (rate limit `/licence` and `/api/` per
    IP), the path-to-production table's new rows, and two launch checklist items (a production file
    store that signs URLs, because of the 4.5 MB function response limit; the refund policy's "not
    downloaded" test cannot be checked, since no download log is kept).
  - `docs/architecture.md`: section 3.8 Files and licences, the routes table, failure-mode rows (no store
    gives 503; an invalid licence gives 404; a missing stored file gives 404), and in 3.7 the step to add a
    provider's origins to the CSP.
  - `docs/testing.md`: the new unit tests and specs.

- [ ] **Step 5: Run everything:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, then
  `pnpm exec playwright test --project=chromium --project=mobile`. Expected: PASS.

- [ ] **Step 6: Commit** `docs: files, licences and the privacy policy's one cookie`.
