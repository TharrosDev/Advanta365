# Testing and guard rails

This page covers the checks that run against the repository: the commands, the unit and browser suites, the design gate that keeps the source inside the design system, the script budgets, and the steps for adding a test. Run every command with `corepack pnpm` from the repository root.

## Overview

| Area | Unit tests | Browser specs | Scripts |
|---|---|---|---|
| Catalog, search and the free samples | `content`, `validate`, `query`, `search-params`, `coverage`, `worked-example`, `format`, `compounds` | `browse`, `catalog`, `locked`, `template-dialog`, `redirects`, `not-found` | |
| Purchase page, checkout and hero | `checkout-schema`, `checkout-order`, `checkout-steps`, `checkout-provider` | `purchase`, `checkout`, `hero` | |
| Legal pages | `legal` | `legal` | |
| Brand and static assets | `brand-mark`, `kit-grain` | `identity` | `gen-icon`, `paper-grain` |
| Boot, cover and motion | `boot-script`, `boot-cover`, `kit-motion` | `intro`, `motion`, `reduced-motion` | |
| Look of the source | `design-gate` | `identity` | |
| Shell and navigation | `nav-links`, `into-view` | `header`, `menu`, `console` | |
| Layout at every window size | | `viewports` | |
| Script weight | | | `check-budgets` |
| Runner | `smoke` | | |

## Commands

| Command | What it runs |
|---|---|
| `corepack pnpm test` | `vitest run`: the unit tests, once. |
| `corepack pnpm typecheck` | `next typegen`, then `tsc --noEmit`. |
| `corepack pnpm lint` | `eslint .` over the whole repository. |
| `corepack pnpm test:e2e` | `playwright test`. The web server step runs a production build and serves it on port 3100. |
| `corepack pnpm format` | `prettier --write .`. |
| `corepack pnpm dev`, `build`, `start` | `next dev`, `next build`, `next start`. |

Check formatting without writing files with `corepack pnpm exec prettier --check <paths>`.

Three scripts run by path, not through `package.json`:

| Command | Purpose |
|---|---|
| `node scripts/check-budgets.mjs <baseUrl>` | Compares the script weight of the home page with the committed baseline, and checks that no shader chunk has come back. Needs a running production server. |
| `node scripts/gen-icon.mjs` | Writes `app/icon.svg` from the mark in `lib/brand/mark.ts`. |
| `node scripts/paper-grain.mjs` | Writes the paper grain texture to `public/paper/grain.png`. |

Suggested checks by kind of change:

| Change | Run |
|---|---|
| Code in `lib/` or catalog content | `test`, `typecheck`, `lint` |
| Components, styles or pages | `test`, `typecheck`, `lint`, and the e2e specs the change touches (below) |
| Shipped JavaScript or the boot script | The two rows above, plus `check-budgets` against a production server |

Run only the e2e specs a change touches, not the whole suite: the full run takes about six
minutes. Find them by searching `tests/e2e` for the route, component or text the change touches,
then run those files, for example `corepack pnpm exec playwright test tests/e2e/purchase.spec.ts
--project=chromium` (add `--project=mobile` for a phone-specific change). `viewports.spec.ts` is the geometry guard for any
change to layout or CSS. The full suite runs once, as the last gate before a merge.

## Unit tests

Vitest runs every `tests/unit/**/*.test.ts` file in the Node environment. The config (`vitest.config.mts`) maps the `@/` import alias to the repository root, so a test imports source with the same paths the app uses. Put browser specs in `tests/e2e`; Vitest reads only `tests/unit`.

Shared catalog fixtures live in `tests/unit/fixtures/catalog.ts`: `rawPhases`, `rawTemplate(overrides)`, `rawCatalog()` (carrying exactly six free templates) and `makeTemplate()`.

### Catalog and search

| File | Guards |
|---|---|
| `content.test.ts` | The sample catalog as read through `lib/catalog/repository`: seven phases in fixed order with two steps each; minimum template counts per phase and per step; every deliverable type, app, audience and format is used; every record flagged as sample; no template carries a price or a featured flag; the pieces the pitch names exist; exactly six free templates, the six named, one in each of six phases, listed in phase order by `getFreeTemplates`; copy with no banned term, straight quotes or exclamation marks; search by title; the catalog's default order (the six free samples in phase order, then the rest in phase order); slug and related-template lookups; every section of the worked example's contents names a place the catalog holds; a free sample's section links into the catalog (`/catalog?view=<slug>`) and a locked template's section has no link. |
| `validate.test.ts` | `validateCatalog` sorts phases and steps by order. It requires exactly six free templates (a catalog with 0, 5, 7 or 8 is rejected, naming the count), names the template and field when `free` is not a boolean, and rejects a duplicate template slug, an unknown phase, a step that belongs to another phase, an unknown deliverable type and a slug that is not kebab case. |
| `query.test.ts` | `queryTemplates` over synthetic templates: page size; facets combine with OR inside a facet and AND across facets; search by terms, case, quotes, literal regex characters and a length limit; the default `samples` sort (the free templates first, each group then in phase order, then step order, keeping the given order inside a step), the `phase` sort (that rollout order alone; unknown phases and steps last; the given order without phases) and the `title` sort; the `free` filter alone, with facets and search, and in the facet counts; page clamping; facet counts that ignore their own selection; the input is not mutated. |
| `search-params.test.ts` | `parseCatalogParams` and `serializeCatalogParams`: comma lists; unknown values dropped; an invalid page becomes 1; an unknown sort (a retired one such as `featured` or `price-desc` too) becomes `samples`, which stays out of the URL while `phase` and `title` are written; `free=1`; the query is trimmed and capped at 200 characters; fixed key order (`free` after the facets, before `sort`); defaults omitted; round trip. `parseView` accepts a slug and rejects anything else, taking the first of a repeated value; `catalogHref` puts `view` last. `clearFiltersHref` keeps only the search term; `hasFilters` counts a facet value or the free filter and nothing else; `activeFilters` lists the free filter first and then each selected value facet by facet, with its names, what removing it is called, and a link without it on page 1. |
| `coverage.test.ts` | `phaseCoverage`: one entry per phase in order; a phase is covered once a template belongs to it; templates in unknown phases are ignored. `adjacentPhases`: neighbours in rollout order, none at the ends or for an unknown slug. |
| `worked-example.test.ts` | `contentsRows`: a free sample's target becomes a link into the catalog under the template's title, a locked template's its title without a link, a step or phase target its link and label; an unknown target leaves the section without a link; the order is kept. |
| `format.test.ts` | `formatPrice` and `formatPriceParts`: whole dollars drop the cents; other amounts keep them, so `OFFER` prints as `$1,499.99 CAD` (a no-break space before the code); thousands are separated; the code follows the currency passed in. `countWord`: a word up to twelve and digits beyond, a capital for the first word of a sentence, and `FREE_SAMPLE_COUNT` reads "six". `formatLength`: slides for a deck, pages for every other format, singular for one. |
| `compounds.test.ts` | `splitCompounds`: hyphenated compounds become compound parts, a lone hyphen does not, and joining the parts gives back the title. |
| `nav-links.test.ts` | `singleCatalogPhase`: one known phase from repeated keys and comma lists, nothing for none, several or unknown ones. `currentPhase`: a phase page, the catalog while it is filtered on exactly one known phase, and no other page (there are no template pages). |
| `into-view.test.ts` | `intoViewOffset`: an item already in a sideways row stays; one cut off at either end is brought to the row's start padding. |
| `scrim.test.ts` | `createScrimPress`: a click closes a dialog only when its press, its release and the click all landed on the dialog itself (the dimmed page); a selection dragged in either direction between the panel and the dimmed page does not; each gesture starts clean. |
| `history.test.ts` | `previousEntryIs`: true when the entry before the current one is the address, in any order of its parameters; false for another page, other parameters or another site, and whenever the history cannot say (no Navigation API, the first entry, an unreadable address). |
| `checkout-schema.test.ts` | The places of the form (Canada first, every country once and in order; regions listed for Canada and the United States only; what a region is called). `parseDetails`: trimmed values, one message per needed field of an empty form and none for an optional one, addresses that are not an email, a listed region for its own country, any region or none elsewhere, the region judged alongside the other fields, an unknown country, the length limits. `orderSchema`: the one offer at its price and currency, agreed to, with its own code, a moment and complete details, and no field for a card. |
| `checkout-order.test.ts` | `orderCode` (the day in UTC, six characters from the entropy, never a 0, 1, I or O, always a code the schema accepts); `buildOrder` (nothing from a draft that is not ready); the summary's lines from `TOOLKIT`, the price as `formatPrice` prints it and the tax line; `detailRows`; `orderText`; `orderMailto` (addressed to `SITE.contactEmail` only, the order's code in the subject, message line ends, everything encoded). |
| `checkout-steps.test.ts` | `checkoutHref` and `parseCheckoutStep` (the step and nothing else, any case, the first of a repeated value, junk opens nothing); `furthestStep` and `resolveStep` (never a step the order has not reached, always a way back); numbering, states and the announcement; the stored draft (a round trip, empty for anything that is not a draft, unknown keys dropped, a code that is not one disbelieved, no key for a card). |
| `checkout-provider.test.ts` | The provider seam with a fake provider: `getPaymentProvider()` answers `null`; `startPayment` hands over the checked order, follows an `https:` or same-origin redirect and no other, passes on an embedded secret only when the provider can draw it, turns a rejection into the site's own failure message, and starts nothing for an order that is not one. `PaymentStep` rendered to markup: with no provider the honest notice, the order and the `mailto:`; with one, its pay button; never an input. |
| `file-store.test.ts` | The local store serves a file inside its root and answers `null` for a missing key, a directory, `..`, an absolute path, an empty key and a symbolic link out of the root; `getFileStore` from the environment |
| `stored-files.test.ts` | Every file the catalog names is in the configured store, at its size and with its SHA-256 (the fixtures under `pnpm test`; the real files before launch) |
| `licence.test.ts` | Licences: sign and verify, a changed payload or signature, another secret, rotation, revocation, no or short secret, malformed tokens and payloads, the order code format against `orderCode`; the cookie's name, age and reading |
| `rate-limit.test.ts` | The limiter: the limit and `retryAfter`, a new window, clients counted apart, the cap; `clientKey` |
| `sample-route.test.ts` | `/api/samples`: a free file with its headers and bytes; a locked, unknown or missing file answers 404 alike; 503 with no store; 429; `serveFile` redirects to a signed address and keeps a licensed file out of caches |
| `library-routes.test.ts` | `/licence` sets the cookie and redirects, or sets nothing for a bad, empty or revoked licence, and limits claims; `/api/library` serves to a licence and answers 404 without one, 503 with no store |
| `legal.test.ts` | The four legal documents of `lib/legal`, as data: they are the routes of `LEGAL_LINKS`, in order; each has a title, a description, a summary and at least three points; no section and no block is empty; every section and subsection has a kebab-case anchor of its own, none of them an id the layout uses; every link goes to a page that exists (and a `#` to an anchor that is there), and each page links to the contact page and to the other three; no placeholder or unset value is printed. The builders are run with every optional fact of `LEGAL` set and unset: a number of days appears in the refund policy only when `refundWindowDays` is set, the province in the terms only when `governingProvince` is, the host, privacy contact and address in the privacy policy only when they are, and an audit in the accessibility statement only when it has a date. The privacy policy names exactly the two session storage keys (the cover's flag in `lib/boot/state.ts` and the checkout's draft, `DRAFT_KEY` in `lib/checkout/draft.ts`), keeps what is planned for the checkout under its own heading and names no payment processor. |

### Brand and static assets

| File | Guards |
|---|---|
| `brand-mark.test.ts` | The mark geometry in `lib/brand/mark.ts` (three strokes, both viewBoxes, stroke width, the legs' lean, the ink centred in its box and path data); the 365 on the arm (three digits of one stroke each, read 3, 6, 5 with air between them, filling `MARK_DIGITS_BOX` inside the viewBox, clear of the legs and above the arm, the 6 keeping its eye); `LogoMark` markup (current colour stroke, hidden from assistive technology by default, `role="img"` with a title, the two-tone tail, the digits drawn last in two inks and never in one or with `digits={false}`); `app/icon.svg` equal to what `scripts/gen-icon.mjs` writes. |
| `kit-grain.test.ts` | `public/paper/grain.png` is an indexed 128 by 128 PNG with four palette entries, a transparent first entry, a bounded maximum alpha and at most 4096 bytes. `app/globals.css` declares the `--grain` URL. |

### Boot, cover and motion

| File | Guards |
|---|---|
| `boot-script.test.ts` | Runs `BOOT_SCRIPT` against stand-ins for the document, session storage and media queries. It checks the decisions against the pure function in `lib/boot/state.ts`: the names in the site's own storage namespace, the reduced-motion early return (nothing written and nothing stored), `data-motion` and `data-timeline`, the cover flag (the first load of a session on any page, and no cover when storage cannot be read) and skip events, the end of the cover on its own animation and on the 5500 ms backstop, no restart once it is leaving, the one-shot click guard that a touch or pen skip arms (and that a mouse, key or wheel does not), and the size limits (at most 1536 bytes gzipped, no `</script` or `<!--`). It also checks that `IntroScript` prints the script once inside a hidden wrapper. |
| `boot-cover.test.ts` | The markup of `IntroCover`: one cover element hidden from assistive technology, no focusable control, six pen paths (the tail and the two strokes of the "A" at 4.2, the three digits at 1.1) with unit path length, no image or canvas in the cover; the cover animation timings in `intro-cover.module.css` (the strokes at 120 to 800, the digits 800 to 1000, the mark held to 2500 and the cover gone at 2950, the skip of 200 ms keeping the pointer all the while; on the cover's own way out the signature and the hint gone before the paper starts to clear); the cover displayed only while the root carries `data-intro`. |
| `kit-motion.test.ts` | Reads `app/motion.css` as text. Every `@keyframes` block and every animating declaration sits inside `(prefers-reduced-motion: no-preference)`. Inside one rule, `animation-timeline` and `animation-range` follow the `animation` shorthand. Hidden starting states appear only under `html[data-motion="on"]`. No infinite animation, `@property` or iteration count. The five move keyframes (`move-drift`, `move-ink-in`, `move-settle`, `move-shadow`, `move-grow`) must exist. No entrance blurs: no `filter` animates or transitions, in a rule or in a `move-` keyframe. The ink-in range ends sooner than the drift range. |

## Design gate

`tests/unit/design-gate.test.ts` keeps the source inside the design system. It reads every file under `app/`, `components/`, `lib/` and `tests/`, the README and `docs/` as plain text. Matches in comments count, because the check works on lines of text, not on parsed code. The gate leaves itself out of the scan and so the banned strings it lists are not flagged there.

A failing assertion names the file, the line and the rule that matched, for example `components/layout/footer.tsx:12: hex colour`. The gate also contains self-tests: they feed sample text through the scoped rules and check that the allowed places pass and other places fail.

### Banned terms and values

The banned-terms array in `design-gate.test.ts` (line 64) lists banned words and identifiers. Words match in any letter case; identifiers match as written. To ban another term, append a `literal(...)` entry to that array. The gate also bans:

- fixed pixel widths of 232, 366, 620, 938 and 502 px, unless the number is part of a longer number;
- `min-width` or `max-width` queries of 768, 1024 or 2000 px;
- a negative `letter-spacing`.

The gate also requires that the README and every file under `docs/` avoid three banned strings, and it keeps a fixed list of folder names out of the tree.

It also holds a wording rule over the `.ts` and `.tsx` files of `app/`, `components/` and `lib/`: a line that names Prosci must say "Prosci-certified practitioner" or be the footer's notice ("by Prosci Inc.", "trademark of Prosci"). Prosci describes the practitioner, never the product.

### Scoped techniques

Some techniques are allowed in named places only. A folder entry ends in `/`; a file entry is an exact path. The scope is `app/`, `components/` and `lib/`, in these file types: css, ts, tsx, mjs, js, json, svg, glsl, frag, vert and md.

| Technique | Allowed in |
|---|---|
| `<canvas`, `getContext(`, `webgl` (any case) | Nowhere |
| `requestAnimationFrame` | `lib/scroll/`, `lib/boot/`, `components/intro/` |
| The string `"scroll"` or `'scroll'` | `lib/scroll/` |

Adding a folder to one of these lists is a design decision: change the list in `design-gate.test.ts` in the same change, with a reason.

### Standing rules

| Rule | Applies to |
|---|---|
| Raw colour is written only in `app/globals.css` and `app/icon.svg`. Raw colour means a 3, 4, 6 or 8 digit hex value or a call to `rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color` or `color-mix`. | css, ts, tsx, svg, glsl, frag and vert under `app/`, `components/`, `lib/` |
| No function is named after a colour model. | ts, tsx, glsl, frag and vert under `app/`, `components/`, `lib/` |
| No stylesheet contains `prefers-color-scheme`. The site has one theme. | css |
| No stylesheet contains `infinite`, in any case. | css |
| Media queries are limited to `(min-width: 40em)`, `(min-width: 68em)`, `(hover: hover)`, `(prefers-reduced-motion: reduce)`, `(prefers-reduced-motion: no-preference)`, `(prefers-contrast: more)` and `(forced-colors: active)`. | css |
| `@container` appears only in `components/layout/header.module.css` and `components/layout/nav-drawer.module.css`. | css |
| Only `components/ui/transition-link.tsx` imports `next/link`. | css, ts, tsx, svg, glsl, frag and vert under `app/`, `components/`, `lib/` |
| The runtime dependencies in `package.json` are exactly `next`, `react`, `react-dom` and `zod`. | `package.json` |

The colour pattern matches hex values and colour functions only. Keep any 0 to 255 channel numbers in TypeScript equal to the tokens they mirror in `app/globals.css`.

## Browser tests

Playwright is configured in `playwright.config.ts`:

- The test directory is `tests/e2e`. The base URL is `http://localhost:3100`; `PW_PORT` moves the port, for a second checkout that runs at the same time.
- The reporter is `list`. Traces are kept for failing tests. `forbidOnly` is set in CI.
- The web server step runs `npm run build && npm run start -- -p 3100`. Outside CI an existing server on the port is reused, so stop a stale server before a run that must use a fresh production build.

### Projects

| Project | Device and viewport | Runs |
|---|---|---|
| `chromium` | Desktop Chrome, 1280 by 800 | Every spec, except the tests tagged `@quiet`. |
| `mobile` | Pixel 7 | Every spec, except the tests tagged `@quiet`. |
| `quiet` | Desktop Chrome, 1280 by 800 | The tests tagged `@quiet`, which `chromium` and `mobile` leave out. It depends on `chromium`, `mobile` and, when that project is registered, `firefox`. |
| `quiet-mobile` | Pixel 7 | The same tests. It depends on `quiet`. |
| `firefox` | Desktop Firefox, 1280 by 800 | `browse`, `console`, `reduced-motion` and `motion`. Registered only when Firefox starts on the machine, or when `PW_FIREFOX=1` is set. |

A test that reads a paint time off the page's clock is tagged `@quiet` (`{ tag: "@quiet" }`). That clock runs through every moment the browser waits for the processor: beside seven other workers the home page's largest paint was measured at 424 to 1648 ms, against 232 to 552 ms alone, while the server answered in 8 to 25 ms both times. The `quiet` projects run those tests one at a time, after the parallel projects. The one test so far is the largest paint of a first visit in `intro.spec.ts`.

No project and no test retries.

A check that depends on how soon a test gets to look is written so that it always runs: it reads a record made in the page (an observer or a frame callback installed before the first script), and where that is not possible it calls `test.skip` with a reason. No `expect` sits inside an `if` on a clock.

Firefox is the browser without view timelines, so it exercises the observer path of the motion system.

A spec that is not named by the Firefox pattern runs in `chromium` and `mobile`. The Projects column of the table below lists the exceptions.

### Specs

| Spec | Projects | Guards |
|---|---|---|
| `browse.spec.ts` | chromium, mobile, firefox | Home to a phase and on to its free sample, open in the catalog; the hero to the six free samples; the worked example; no horizontal overflow on eight routes. |
| `catalog.spec.ts` | chromium, mobile | The results as a grid of tiles, several to a row; six free first and every other tile locked; every address of the catalog names `/catalog` as the canonical one; no price on the page; "Free samples only" and the URL; the sort options (samples first, phase order or titles, never a price); filters, restoring from the URL, search that keeps the filters; the active-filter chips (one per value, one for "Free samples only", Clear all, focus on the count after the last); a free tile's link keeping the filters; phase order and the one filtered phase lit; the empty states (search only, with the phases shown once, and with filters) and their clear links; malformed parameters; the phone's rail (one strip of phases with the lit one in view, the search with its button inside beside Filters, the sort order in the sheet) and the phone filter dialog; the sort select keeping the picked option while a slow server answers; Clear all filters clearing in place (the entry is replaced, focus lands on the first row); the filter sheet closing when the window grows from 1087 to 1088px, with the page free again. |
| `locked.spec.ts` | chromium, mobile | A locked tile: a button named for its template, with the blur on the cover only and nothing drawn over it; a press denies for 600 ms and says "Included with the toolkit."; Enter and Space; five fast presses and one line per press; the shake and the red ring on the well; reduced motion (the ring and the line, nothing moves); `?view=` a locked template, answered by its tile or, where the tile is not on the page of results, by a line above them; a phase page's locked tiles carry nothing drawn over their covers, with no id twice; without JavaScript. |
| `template-dialog.spec.ts` | chromium, mobile | The pop-up: a free tile opens it over the grid and the address names the template; its content; Escape, Close and the dimmed page close it, drop `view`, keep the search and filters and hand focus back; Back; another sample opens after a close; `view` values that open nothing; a link that opens it on load; the home and phase tiles; the first of a repeated `view`; a page that does not hold the sample; without JavaScript. A selection dragged from the pop-up onto the dimmed page leaves it open; a close after an open from the catalog leaves no entry (Back goes to the page before the catalog), and a close after an open from another page stays on the catalog with Back going to that page. |
| `purchase.spec.ts` | chromium, mobile | The Purchase page: no title block, one `h1` (the heading on the folder) and the price once, on the tag; the folder with the six sample covers and a tally of seven phases; the ledger; Checkout as an enabled link to `/purchase?checkout=details` with the line to the contact page under it; no questions section, and the contents leaf beside the folder from 68em; 320px; the tag's swing and its stillness under reduced motion; the home page's folder leading here. |
| `downloads.spec.ts` | chromium, mobile | A free sample downloads from its pop-up; a licence link opens the catalog with no locked tile and says so; a buyer opens a locked template's pop-up, with no sample tag or purchase button, and downloads its file; a buyer's tile opens its pop-up; a buyer's phase page has no locked tile; a bad link says so on the catalog and unlocks nothing; without a licence a locked template opens nothing and its file is 404 |
| `headers.spec.ts` | chromium, mobile | The security headers and the content security policy on a page; no referrer and `noindex` on the licence link; `noindex` on file addresses |
| `checkout.spec.ts` | chromium, mobile | The checkout: the Checkout link opens it over the page without moving it, and the address names the step; the order summary in the form that fits the window; a link to a step opens it, any other value opens nothing, and a link to a step the order has not reached shows the first; Escape, Close, the dimmed page (not on a phone, where the dialog is the whole window) and Back close it with focus back on the link; all steps are one history entry; labels, required marking and autocomplete tokens; the region as a list or a free line; errors on blur and on submit, with a summary that takes focus and links to each field; Enter submits; the whole walk to the Payment step, which says payment is not connected and offers the order by email and to copy, with no order data in any address or request; the draft surviving a reload and a visit to the Terms, keeping its code; Start over; what is stored; the phone layout (full window, sticky actions, the summary as a row that opens), 320px and the column from 68em; the step's movement and its stillness under reduced motion; the catalog's pop-up; without JavaScript. |
| `redirects.spec.ts` | chromium, mobile | The retired addresses (bundles, bundle pages, pricing, cart, about, template pages) end on the right page, hash and query; the 308 and its `Location`; `/contact` answering as a page of its own; the offer on Purchase; a template's old address opens its pop-up, or is answered as locked. |
| `hero.spec.ts` | chromium, mobile | The hero: its structure, copy, buttons and proof strip, with no backdrop or canvas behind the words; the six documents as links named by their titles, in order, lit and overlapping; each opens its pop-up, and the one on top or in focus comes to the front; the sequence runs once with its timings (the box from 700ms for 800ms, the documents from 1300ms, 110ms apart and 560ms each) and the documents can then be focused; it plays again on a return to the home page inside the site; under the cover of a first visit the box stands and the documents wait, and the clock starts when the cover has gone; the first screen fits windows from 1280 by 720 to 1920 by 1080; no title or tag cut by a neighbour and 44px of each document its own; the band ends at its own bottom edge; two hands of three on a phone; reduced motion and no JavaScript (no box, the documents from the start). |
| `console.spec.ts` | chromium, mobile, firefox | Twelve routes load with no console error and no page error. |
| `contact.spec.ts` | chromium, mobile | The Contact page: status 200 and its title; one `h1`; exactly one section and one band in `main`, a region named by the title; the address as the one plain `mailto:` link, at least 44px tall; no form, field or button; the list "What to write about" with four links, each the address with a `subject`; no sideways overflow at 320 and 1920 (chromium only); the footer's link to the page; `/about` answering 308 to `/why-advanta`, which holds no `#contact` and no `mailto:`. |
| `legal.spec.ts` | chromium, mobile | The four legal pages (`/privacy`, `/terms`, `/refunds`, `/accessibility`), each: status 200, one `h1` with its title, the document title and a description; one `time` with the date the page last changed; "In short" before the first section; a navigation "On this page" whose links are the ids of the `[data-legal-section]` sections in order, each entry named by the number and heading of its section and each section headed by one `h2`; no id on the page twice and no `h3` outside a section; a link to `/contact` and the `mailto:` address in the words, the four pages in the "Policies" aside with the current one marked, and a link to each of the other three in the words; no cookie, nothing in local storage and no session entry outside the site's own names (the checkout's draft is written on the Purchase page alone). Once: an entry of the contents brings its section into view and its number takes the highlighter (`:target`), and `#when-checkout-opens` is an `h3`; a policy link leads to the next page; at 1280 the contents, the words and the policies stand side by side, the two at the sides sticky, and no paragraph is wider than 640px (chromium only); at 320 the contents come first, each entry 44px tall, with no sideways overflow. |
| `header.spec.ts` | chromium only (skips the mobile project) | The banner; Catalog and Why Advanta in the row and the purchase button (no cart); their order; `aria-current` on the row and on the button at `/purchase`; the row centred on the bar at 1280 and 1440; the button's name with and without its price across 68em; the sliding underline; the phase rail; the sticky bar. |
| `identity.spec.ts` | chromium, mobile | Design checks in the browser: landmarks; one `h1` per page; root colours and fonts; band values; no canvas, in the page or in the HTML sent; `/`, `/why-advanta` and `/catalog` at rest 5.5 seconds after they load; the order and ids of the home sections; the hero holds no tally and no caret; the headline's size and mark; focus rings; the 365 on the mark where the digits are 7px high and nowhere else, and the favicon unchanged; the catalog's tiles each with a printed page in its own format; retired wording is absent; no overflow and minimum touch targets at 320 px. |
| `intro.spec.ts` | chromium, mobile | The cover on a first visit: its states; its largest paint under a second; the finished mark held to 2.5 seconds and the cover gone by 3.4; its end within 500 ms of a click or a key press (also at 0.5 and 1.5 seconds in), and on a wheel turn; no cover on reload or on other routes; no cover with reduced motion, blocked storage or JavaScript off. |
| `menu.spec.ts` | mobile (in chromium every test skips) | The phone bar and drawer: the brand, the button without its price and Menu at 390 and 320px, each a 44px target; the dialog, its four pages (Purchase, Catalog, Why Advanta, Contact) and seven phases, Escape, a click on the scrim (and a drag from the panel that ends on it, which leaves it open), the Close button, and navigation or back navigation closing it. |
| `motion.spec.ts` | chromium, mobile, firefox | Entrances hidden until scrolled into view, with timelines and without (Chromium stubs `CSS.supports`); the fill of the ninety band under a 90% figure that reads its value at every step, and the `#inside` counts that never count up; a change of page runs a view transition; a filter change or opening a sample in the pop-up starts none. |
| `not-found.spec.ts` | chromium, mobile | Missing paths return 404 with the page heading and the phase navigation; mixed-case paths redirect to lower case. |
| `reduced-motion.spec.ts` | chromium, mobile, firefox | With the reduced-motion preference on thirteen routes: no motion attributes, no canvas, no running animations, no cover, every entrance in its final state; the 90% figure and the tally show their final state; links and the catalog filters work. |
| `viewports.spec.ts` | chromium only (skips the mobile project) | The geometry of every page at every window the site is built for: twelve routes (`/`, `/catalog`, `/phases/plan`, `/purchase`, `/why-advanta`, `/contact`, `/privacy`, `/terms`, `/refunds`, `/accessibility`, `/sample` and the 404 at `/nope`) at sixteen sizes, from 320 by 640 and 390 by 844 through tablets (768 by 1024, 820 by 1180, 1024 by 768), the two sides of 68em (1087 and 1088 wide), the laptops and monitors (1280, 1366, 1440, 1536, 1680, 1920) to 2560 by 1440, 3440 by 1440 and 3840 by 2160, 192 tests in all. Each sets its own window size and checks: one `h1`; no element of the header, main or footer past the window's edge (the frame clips sideways, so the elements themselves are measured; a visually hidden box and a row that scrolls sideways on purpose are not counted); from 1280 up, the words of the page span more than half of the window, so a large monitor is used and the page is not left as a narrow column (the 404, which sets its few words in six columns on purpose, is left out of this one); and no console or page error. It measures and takes no screenshots. |

### Helpers and support

`tests/e2e/helpers.ts` exports:

- `NAVIGATION_TIMEOUT`, 15 seconds, for client-side navigations.
- `introSeen(page)`, which sets the session flag for the cover before any script runs, so the page is not under the cover.
- `hydrated(page)`, which waits for `data-hydrated` on the root element: the client components of the page have their handlers. Wait for it before pressing a control that a script answers, on a page you have just loaded.

`tests/e2e/support/hero.ts` holds the helpers of `hero.spec.ts`: `STAGE` and `DOCS` are the selectors of the stage and its documents; `recordStage` notes the stage on every frame from the first (how many documents are in the page, how many are out of sight, how many `hero-` animations exist); `stageFrames` and `unsettledFrames` read the frames back; `settled` waits for the stage to be at rest; `stageState` reads the documents as computed now.

`tests/e2e/support/intro.ts` holds helpers for the specs that look at the cover of a first visit: `recordIntro` logs every value of `data-intro` with the page clock, from before the first script; `introStates` and `introAt` read them back; `pageClock` reads the page clock.

## Budgets

`scripts/check-budgets.mjs` is plain Node with no dependencies. It measures a running production server.

```bash
node scripts/check-budgets.mjs http://localhost:3100
node scripts/check-budgets.mjs http://localhost:3100 --record
node scripts/check-budgets.mjs http://localhost:3100 --pages=/,/why-advanta,/catalog
```

The pages checked are `/`, `/why-advanta` and `/catalog` by default. `--pages` replaces that list. The script weight of `/` is always measured, and `/` is put first when the list does not name it.

It measures two things:

1. **Script weight of `/`.** Every `<script src>` that a modern browser runs and every inline script that holds code. Scripts marked `nomodule` are listed but not counted. The streamed page data is skipped. Each file is gzipped at level 9 and the sizes are summed. The sum may grow by at most 12 KiB over the recorded baseline.
2. **Shader chunks.** Every `.js` file under `.next/static` that contains `#version 300 es`. The site ships none, so the check reports none; it stays as a guard. Together they may weigh at most 40 KiB gzipped, and none may be an initial script of a checked page.

The shader half needs a production build, so `.next/static` must exist. Without it the script throws "run a production build first" and exits with code 1.

### Baseline

`--record` writes `tests/budgets/baseline.json` with these fields:

| Field | Content |
|---|---|
| `page` | `/` |
| `gzipTotal` | The summed gzip size of the counted scripts of `/`. This is the value the growth check compares against. |
| `scripts` | Each script with its path, gzip size, and the `counted` flag. A `nomodule` script is recorded with `counted: false` and with its marker flag set to `true`. |
| `shaderChunks` | The shader chunks found, with their paths and gzip sizes (none today). |
| `shaderGzipTotal` | The summed gzip size of the shader chunks. The shader check uses the fixed limit, not this value. |

Refresh the baseline after an intended change to the shipped scripts: run a production build, start the server, run the script with `--record`, and commit the file.

Exit codes: 0 when every budget holds, 1 when one is broken, 2 for a usage error.

## Paper grain

`scripts/paper-grain.mjs` writes `public/paper/grain.png`, the texture behind the paper surfaces. It produces a 128 pixel square indexed PNG with four palette entries in the ink colour, at alpha 0, 0.03, 0.06 and 0.09. The pixels are drawn from a fixed seed, so the output does not change between runs. The script fails if the file exceeds 4096 bytes. `tests/unit/kit-grain.test.ts` checks the result, so run the unit tests after regenerating the file.

## Lint, formatting and types

**ESLint** (`eslint.config.mjs`) is a flat config. It ignores `.next/`, `node_modules/`, `playwright-report/`, `test-results/`, `.qa-shots/` and `next-env.d.ts`. It extends the Next.js `core-web-vitals` and `typescript` configurations. Under `app/` and `components/`, importing from `@/content/*` is an error, except `@/content/taxonomy`. Catalog data is read through `@/lib/catalog/repository`.

**Prettier** uses `printWidth: 100` (`.prettierrc`). `.prettierignore` leaves out `.next`, `node_modules`, `pnpm-lock.yaml`, the report folders, `.superpowers`, `docs` and `.claude`.

**TypeScript** (`tsconfig.json`) is strict and sets `noUncheckedIndexedAccess`. It resolves modules with the `bundler` strategy and maps `@/*` to the repository root. Type checking covers the `.ts` and `.tsx` files, test files and `playwright.config.ts` included, plus the generated Next.js types.

**Next.js** (`next.config.ts`) enables `reactStrictMode`, disables the `X-Powered-By` header and redirects the retired addresses (`/bundles`, `/bundles/:slug`, `/pricing`, `/cart` to `/purchase`; `/about` to `/why-advanta`; `/templates/:slug` to `/catalog?view=:slug`), all permanent.

**Proxy** (`proxy.ts`) answers a path that contains upper-case letters with a 308 redirect to the lower-case path. Its matcher skips `_next` and paths with a file extension.

## Adding a test

### A unit test

1. Create `tests/unit/<name>.test.ts`. Vitest picks up the file automatically.
2. Import source with the `@/` alias, and use the fixtures in `tests/unit/fixtures/catalog.ts` for catalog data.
3. Run `corepack pnpm test`.

```ts
import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("drops the cents from whole dollars", () => {
    expect(formatPrice(4900, "CAD")).toBe("$49 CAD");
  });
});
```

Logic that needs a browser (layout, focus, motion) belongs in a browser spec.

### A browser spec

1. Create `tests/e2e/<name>.spec.ts`. It runs in `chromium` and `mobile`. Add its name to the Firefox pattern in `playwright.config.ts` only when the behaviour must hold in Firefox.
2. Call `introSeen(page)` before the first `goto` of any test that opens the home page for another reason.
3. When the page must load cleanly, collect console and page errors with `page.on("console")` and `page.on("pageerror")`, as `console.spec.ts` does.

```ts
import { expect, test } from "@playwright/test";
import { introSeen } from "./helpers";

test("the phase page is titled with its phase", async ({ page }) => {
  await introSeen(page);
  await page.goto("/phases/prepare");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepare");
});
```

### A change that touches the look or motion

- Colour belongs in `app/globals.css` as a token on `:root`. Components read it with `var(--token)`. Raw colour anywhere else fails the design gate.
- Keyframes and transitions go in `app/motion.css` or in the component's CSS module. Animating rules sit inside `(prefers-reduced-motion: no-preference)`. `kit-motion.test.ts` checks `app/motion.css`.
- Media queries use only the breakpoints and preference queries in the allow-list. Breakpoints are `40em` and `68em`. A large monitor is not a breakpoint: past a 1600px window the root font size grows (`html` in `app/globals.css`) and the page scales with it, so write lengths in rem and read `--over` or `--page-max` where a measure must follow the window. A change to layout or CSS is checked at every window size by `viewports.spec.ts`: run it, and add a size or a route to it when the change is for a window it does not cover.
- The site has no canvas and no shader context. Animation frames and scroll listeners go in the folders listed under scoped techniques.
- Words to ban go in the banned-terms array of `design-gate.test.ts` (line 64).

### A change to catalog content

Records under `content/` are checked by `validateCatalog` when the repository module loads. An invalid record throws a `CatalogError` that names the kind, the slug and the field. `content.test.ts` pins facts about the sample catalog: phase order, step counts and the six free templates by name. Update those expectations in the same change as the data. Exactly six templates must have `free: true`; `validateCatalog` rejects any other number.
