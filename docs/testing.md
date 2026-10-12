# Testing and guard rails

This page covers the checks that run against the repository: the commands, the unit and browser suites, the design gate that keeps the source inside the design system, the script budgets, the ink stills tooling, and the steps for adding a test. Run every command with `corepack pnpm` from the repository root.

## Overview

| Area | Unit tests | Browser specs | Scripts |
|---|---|---|---|
| Catalog, search and the free samples | `content`, `validate`, `query`, `search-params`, `coverage`, `worked-example`, `format`, `compounds` | `browse`, `catalog`, `locked`, `template-dialog`, `redirects`, `not-found` | |
| Purchase page and hero | | `purchase`, `hero` | |
| Brand and static assets | `brand-mark`, `kit-grain`, `stills-files` | `identity` | `paper-grain` |
| Boot, cover and motion | `boot-script`, `boot-cover`, `kit-motion` | `intro`, `motion`, `reduced-motion` | |
| Ink | `ink-scenes`, `ink-stage`, `ink-zones`, `ink-cadence`, `stills-files` | `ink-live`, `ink-fallback` | `ink-stills` |
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
| `node scripts/check-budgets.mjs <baseUrl>` | Compares the script weight of the home page and the shader chunks with the committed baseline. Needs a running production server. |
| `node scripts/ink-stills.mjs` | Captures the ink stills, checks them, measures the light blue, or writes contact sheets. Needs a GPU and a production build. |
| `node scripts/paper-grain.mjs` | Writes the paper grain texture to `public/paper/grain.png`. |

Suggested checks by kind of change:

| Change | Run |
|---|---|
| Code in `lib/` or catalog content | `test`, `typecheck`, `lint` |
| Components, styles or pages | `test`, `typecheck`, `lint`, and the e2e specs the change touches (below) |
| Shipped JavaScript, boot script or ink engine | The two rows above, plus `check-budgets` against a production server |

Run only the e2e specs a change touches, not the whole suite: the full run takes about six
minutes. Find them by searching `tests/e2e` for the route, component or text the change touches,
then run those files, for example `corepack pnpm exec playwright test tests/e2e/purchase.spec.ts
--project=chromium` (add `--project=mobile` for a phone-specific change, and use
`--project=gpu --no-deps` for `ink-live.spec.ts`). `viewports.spec.ts` is the geometry guard for any
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
| `format.test.ts` | `formatPrice`: whole dollars drop the cents; other amounts keep them, so `49999` is `$499.99`; thousands are separated. `countWord`: a word up to twelve and digits beyond, a capital for the first word of a sentence, and `FREE_SAMPLE_COUNT` reads "six". `formatLength`: slides for a deck, pages for every other format, singular for one. |
| `compounds.test.ts` | `splitCompounds`: hyphenated compounds become compound parts, a lone hyphen does not, and joining the parts gives back the title. |
| `nav-links.test.ts` | `singleCatalogPhase`: one known phase from repeated keys and comma lists, nothing for none, several or unknown ones. `currentPhase`: a phase page, the catalog while it is filtered on exactly one known phase, and no other page (there are no template pages). |
| `into-view.test.ts` | `intoViewOffset`: an item already in a sideways row stays; one cut off at either end is brought to the row's start padding. |
| `scrim.test.ts` | `createScrimPress`: a click closes a dialog only when its press, its release and the click all landed on the dialog itself (the dimmed page); a selection dragged in either direction between the panel and the dimmed page does not; each gesture starts clean. |
| `history.test.ts` | `previousEntryIs`: true when the entry before the current one is the address, in any order of its parameters; false for another page, other parameters or another site, and whenever the history cannot say (no Navigation API, the first entry, an unreadable address). |

### Brand and static assets

| File | Guards |
|---|---|
| `brand-mark.test.ts` | The mark geometry in `lib/brand/mark.ts` (three strokes, viewBox, stroke width and path data); the 365 on the arm (three digits of one stroke each, read 3, 6, 5 with air between them, filling `MARK_DIGITS_BOX` inside the viewBox, clear of the legs and above the arm, the 6 keeping its eye); `LogoMark` markup (current colour stroke, hidden from assistive technology by default, `role="img"` with a title, the two-tone tail, the digits drawn last in two inks and never in one or with `digits={false}`); the contents of `app/icon.svg`. |
| `kit-grain.test.ts` | `public/paper/grain.png` is an indexed 128 by 128 PNG with four palette entries, a transparent first entry, a bounded maximum alpha and at most 4096 bytes. `app/globals.css` declares the `--grain` URL. |
| `stills-files.test.ts` | `public/ink` holds exactly the thirteen files named in `lib/ink/stills.json`, each a WebP within the per-file and total byte budgets, with viewport, ratio and route values in range; no `hero` still remains and the `prompt` pair is there. |

### Boot, cover and motion

| File | Guards |
|---|---|
| `boot-script.test.ts` | Runs `BOOT_SCRIPT` against stand-ins for the document, session storage, media queries, navigator, canvas and WebGL. It checks the decisions against the pure functions in `lib/boot/state.ts`: the reduced-motion early return, `data-motion` and `data-timeline`, ink mode, GPU probing and software renderers, the calm routes (the catalog and what lies under it, and no other), the backstop timers (5500 ms for the cover, and room for a takeover at `INTRO_TAKEOVER_MS`), the cover flag and skip events, the one-shot click guard that a touch or pen skip arms (and that a mouse, key or wheel does not), and the size limits (at most 1536 bytes gzipped, no `</script` or `<!--`). It also checks that `IntroScript` prints the script once inside a hidden wrapper. |
| `boot-cover.test.ts` | The markup of `IntroCover` and `InkBackdrop`: one cover element hidden from assistive technology, no focusable control, six pen paths (the tail and the two strokes of the "A" at 4.2, the three digits at 1.1) with unit path length, no image or canvas in the cover; the cover animation timings in `intro-cover.module.css` (the digits 800 to 1000, the leave at 2500, the ink exit starting 250 ms into the clear and ending with the scene, the signature fading at 2500, the skip keeping the pointer for all of its 200 ms; on the cover's own way out the signature and the hint gone before the paper starts to clear, after the latest takeover by the ink); the `fetchpriority` of a backdrop with `priority`; the stills manifest (the thirteen names, each once, with page and window). |
| `kit-motion.test.ts` | Reads `app/motion.css` as text. Every `@keyframes` block and every animating declaration sits inside `(prefers-reduced-motion: no-preference)`. Inside one rule, `animation-timeline` and `animation-range` follow the `animation` shorthand. Hidden starting states appear only under `html[data-motion="on"]`. No infinite animation, `@property` or iteration count. The five move keyframes (`move-drift`, `move-ink-in`, `move-settle`, `move-shadow`, `move-grow`) must exist. No entrance blurs: no `filter` animates or transitions, in a rule or in a `move-` keyframe, the one exception being the rule of the hero's empty prompt box as it dissolves. The ink-in range ends sooner than the drift range. |

### Ink

| File | Guards |
|---|---|
| `ink-scenes.test.ts` | Each of the seven scenes in `lib/ink/scenes.ts` runs against a recorder at 60 Hz with a fixed seed, on a wide and a tall canvas. Drops stay near the canvas and have positive radius and amount; the same seed gives the same events; the timing and placement rules of each scene hold (the `intro` timeline of 3.5 seconds; the `prompt` scene's empty first 0.7 seconds, its two drops either side of the `open` anchor, its clear and its slow drips; there is no `hero` scene); `STAGES[name].runMs` is positive and at most 30 seconds. |
| `ink-stage.test.ts` | `chooseStage`, `visibleArea` and `coverProgress` in `lib/ink/stage.ts`: stage weights, which grounds are dark, which scene has the `tenth` trigger, the topmost-candidate rule, the end-of-page rule (the lowest backdrop wins at the very end once it is in view whole), the challenger margin, and the fire and rearm thresholds for the ninety band. |
| `ink-zones.test.ts` | `calmZone` for the text, display and veil kinds (padding, feather, floor, hold, fade and cap values, and the narrow-window text variant); the dark-ground caps; `edgeZone`; `parseEdges`; `buildZones` order and limits; `mergeNearest`; `anchorRect` and `relativeRect`. |
| `ink-cadence.test.ts` | `medianOf` and `slowFrameMs` in `lib/ink/engine/defaults.ts`, which the engine's adaptive watch judges a slow frame by: 24 ms on a display of 60 Hz or more, a frame over 1.5 times the cadence on a display capped at 30 Hz (so its 33 ms frames are normal and a stall is not), no forgiveness for a cadence slower than 30 Hz, and the counter that steps a tier down at 76 slow frames. |

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
| `<canvas`, `getContext(`, `webgl` (any case) | `lib/ink/`, `components/ink/`, `lib/boot/` |
| `requestAnimationFrame` | `lib/ink/`, `components/ink/`, `lib/scroll/`, `lib/boot/`, `components/intro/` |
| The string `"scroll"` or `'scroll'` | `lib/ink/`, `components/ink/`, `lib/scroll/` |

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

The colour pattern matches hex values and colour functions only. Keep 0 to 255 channel numbers in TypeScript equal to the tokens they mirror in `app/globals.css`, as the ink pigment fallbacks in `lib/ink/pigments.ts` do.

## Browser tests

Playwright is configured in `playwright.config.ts`:

- The test directory is `tests/e2e`. The base URL is `http://localhost:3100`; `PW_PORT` moves the port, for a second checkout that runs at the same time.
- The reporter is `list`. Traces are kept for failing tests. `forbidOnly` is set in CI.
- The web server step runs `npm run build && npm run start -- -p 3100`. Outside CI an existing server on the port is reused, so stop a stale server before a run that must use a fresh production build.

### Projects

| Project | Device and viewport | Runs |
|---|---|---|
| `chromium` | Desktop Chrome, 1280 by 800 | Every spec except `ink-live.spec.ts`. |
| `mobile` | Pixel 7 | Every spec except `ink-live.spec.ts`. |
| `quiet` | Desktop Chrome, 1280 by 800 | The tests tagged `@quiet`, which `chromium` and `mobile` leave out. It depends on `chromium`, `mobile` and, when that project is registered, `firefox`. |
| `quiet-mobile` | Pixel 7 | The same tests. It depends on `quiet`. |
| `gpu` | Desktop Chrome, 1440 by 900, with the GPU arguments | `ink-live.spec.ts` only. It depends on `quiet-mobile`, so it starts when every other project has finished. It runs one test at a time. |
| `firefox` | Desktop Firefox, 1280 by 800 | `browse`, `console`, `reduced-motion`, `ink-fallback` and `motion`. Registered only when Firefox starts on the machine, or when `PW_FIREFOX=1` is set. |

The default projects have no GPU, so the boot script finds the ink `still` there: a test that needs live ink, the hero's sequence among them, belongs in `ink-live.spec.ts`.

A test that reads a paint time off the page's clock is tagged `@quiet` (`{ tag: "@quiet" }`). That clock runs through every moment the browser waits for the processor: beside seven other workers the home page's largest paint was measured at 424 to 1648 ms, against 232 to 552 ms alone, while the server answered in 8 to 25 ms both times. The `quiet` projects run those tests one at a time, after the parallel projects. The one test so far is the largest paint of a first visit in `intro.spec.ts`.

No project retries. One test does: the second test of `ink-live.spec.ts`, which holds every task of the page's first five seconds to 200 ms and asserts nothing else, may be tried three times (`retries: 2` on its own `describe`). The browser reports every long task of the main thread, including one the machine held up before any code of the ink ran; the bound stays at 200 ms.

A check that depends on how soon a test gets to look is written so that it always runs: it reads a record made in the page (an observer or a frame callback installed before the first script), or the scene stepped by hand, and where neither is possible it calls `test.skip` with a reason. No `expect` sits inside an `if` on a clock.

The GPU arguments are `--ignore-gpu-blocklist` and `--enable-gpu`, plus `--use-angle=d3d11` on Windows. Firefox is the browser without view timelines, so it exercises the observer path of the motion system.

A spec that is not named by the Firefox pattern runs in `chromium` and `mobile`. The Projects column of the table below lists the exceptions.

### Specs

| Spec | Projects | Guards |
|---|---|---|
| `browse.spec.ts` | chromium, mobile, firefox | Home to a phase and on to its free sample, open in the catalog; the hero to the six free samples; the worked example; no horizontal overflow on seven routes. |
| `catalog.spec.ts` | chromium, mobile | The results as a grid of tiles, several to a row; six free first and every other tile locked; every address of the catalog names `/catalog` as the canonical one; no price on the page; "Free samples only" and the URL; the sort options (samples first, phase order or titles, never a price); filters, restoring from the URL, search that keeps the filters; the active-filter chips (one per value, one for "Free samples only", Clear all, focus on the count after the last); a free tile's link keeping the filters; phase order and the one filtered phase lit; the empty states (search only, with the phases shown once, and with filters) and their clear links; malformed parameters; the phone's rail (one strip of phases with the lit one in view, the search with its button inside beside Filters, the sort order in the sheet) and the phone filter dialog; the sort select keeping the picked option while a slow server answers; Clear all filters clearing in place (the entry is replaced, focus lands on the first row); the filter sheet closing when the window grows from 1087 to 1088px, with the page free again. |
| `locked.spec.ts` | chromium, mobile | A locked tile: a button named for its template under a chain and a padlock; the blur on the cover only; a press denies for 600 ms and says "Included with the toolkit."; Enter and Space; five fast presses and one line per press; the vibration, the rattle and the red outline; reduced motion (the outline and the line, nothing moves); `?view=` a locked template, answered by its tile or, where the tile is not on the page of results, by a line above them; a phase page carries the locks' drawing once, with no id twice; without JavaScript. |
| `template-dialog.spec.ts` | chromium, mobile | The pop-up: a free tile opens it over the grid and the address names the template; its content; Escape, Close and the dimmed page close it, drop `view`, keep the search and filters and hand focus back; Back; another sample opens after a close; `view` values that open nothing; a link that opens it on load; the home and phase tiles; the first of a repeated `view`; a page that does not hold the sample; without JavaScript. A selection dragged from the pop-up onto the dimmed page leaves it open; a close after an open from the catalog leaves no entry (Back goes to the page before the catalog), and a close after an open from another page stays on the catalog with Back going to that page. |
| `purchase.spec.ts` | chromium, mobile | The Purchase page: one title and the price once, on the tag; the folder with the six sample covers and a tally of seven phases; the ledger; the Checkout button that says it is not built, can be reached and does nothing; no questions section, and the contents leaf beside the folder from 68em; 320px; the tag's swing and its stillness under reduced motion; the home page's folder leading here. |
| `redirects.spec.ts` | chromium, mobile | The retired addresses (bundles, bundle pages, pricing, cart, contact, template pages) end on the right page, hash and query; the 308 and its `Location`; the contact section on About; the offer on Purchase; a template's old address opens its pop-up, or is answered as locked. |
| `hero.spec.ts` | chromium, mobile | The hero where the ink is still, as it is in these projects: its structure, copy, buttons and proof strip; the six documents as links named by their titles, in order, lit and overlapping; each opens its pop-up; with still ink, and in a session whose ink is paused, the documents stand and can be focused from the first frame, there is no box and nothing of the sequence starts on any frame; the same on a return to the home page inside the site and under the cover of a first visit; the first screen fits windows from 1280 by 720 to 1920 by 1080; no title or tag cut by a neighbour and 44px of each document its own; the band ends at its own bottom edge; two hands of three on a phone; the headline's contrast over the still; reduced motion and no JavaScript (no box, documents from the start). |
| `console.spec.ts` | chromium, mobile, firefox | Seven routes load with no console error and no page error. |
| `header.spec.ts` | chromium only (skips the mobile project) | The banner; Catalog and About in the row and the purchase button (no cart); their order; `aria-current` on the row and on the button at `/purchase`; the row centred on the bar at 1280 and 1440; the button's name with and without its price across 68em; the sliding underline; the phase rail; the sticky bar. |
| `identity.spec.ts` | chromium, mobile | Design checks in the browser: landmarks; one `h1` per page; root colours and fonts; band values; the ink hooks on the page; the order and ids of the home sections; the headline's size and mark; focus rings; the 365 on the mark where the digits are 7px high and nowhere else, and the favicon unchanged; the catalog's tiles each with a printed page in its own format; retired wording is absent; no overflow and minimum touch targets at 320 px. |
| `intro.spec.ts` | chromium, mobile | The cover on a first visit: its states; its largest paint under a second; the finished mark held to 2.5 seconds and the cover gone by 3.4; its end within 500 ms of a click or a key press (also at 0.5 and 1.5 seconds in), and on a wheel turn; no cover on reload or on other routes; no cover with reduced motion, blocked storage or JavaScript off. |
| `ink-fallback.spec.ts` | chromium, mobile, firefox | Without WebGL2, with more contrast, and without JavaScript: still images only, no canvas, no pause control, a clean console. The software-renderer case runs in Chromium only. |
| `ink-live.spec.ts` | gpu | Live ink on a GPU: the prompt scene (it runs within 2.5 seconds of a repeat visit, a frame costs at most 6 ms, no task is longer than 200 ms, the caps hold for twenty seconds, it opens over the box, drips again from 6 seconds and starts within 800 ms of the page's first paint; stepped by hand from its start, it is blank at 0.6 seconds and clean at 3.6); the hero's sequence (the timings of its animations and their one start; on a first visit the box under the cover and the clock that starts as the cover goes; a pause half-way, or a fall to still, lands the documents at once and ink that plays again leaves them; a paused session played again; a return to the home page inside the site plays it again); the stop when idle; pause and resume; resize; one canvas across scenes; context loss and restore; the not-found scene; the takeover of the cover (within 1.6 seconds, gone 3.5 seconds later, ended within 500 ms of a key). Skips when the page is not live. |
| `menu.spec.ts` | mobile (in chromium every test skips) | The phone bar and drawer: the brand, the button without its price and Menu at 390 and 320px, each a 44px target; the dialog, its three links and seven phases, Escape, a click on the scrim (and a drag from the panel that ends on it, which leaves it open), the Close button, and navigation or back navigation closing it. |
| `motion.spec.ts` | chromium, mobile, firefox | Entrances hidden until scrolled into view, with timelines and without (Chromium stubs `CSS.supports`); the fill of the ninety band under a 90% figure that reads its value at every step, and the `#inside` counts that never count up; a change of page runs a view transition; a filter change or opening a sample in the pop-up starts none. |
| `not-found.spec.ts` | chromium, mobile | Missing paths return 404 with the page heading and the phase navigation; mixed-case paths redirect to lower case. |
| `reduced-motion.spec.ts` | chromium, mobile, firefox | With the reduced-motion preference on eight routes: still ink, no motion attributes, no canvas, no running animations, no cover; the still images load; the 90% figure and the tally show their final state; links and the catalog filters work. |
| `viewports.spec.ts` | chromium only (skips the mobile project) | The geometry of every page at every window the site is built for: seven routes (`/`, `/catalog`, `/phases/plan`, `/purchase`, `/about`, `/sample` and the 404 at `/nope`) at sixteen sizes, from 320 by 640 and 390 by 844 through tablets (768 by 1024, 820 by 1180, 1024 by 768), the two sides of 68em (1087 and 1088 wide), the laptops and monitors (1280, 1366, 1440, 1536, 1680, 1920) to 2560 by 1440, 3440 by 1440 and 3840 by 2160, 112 tests in all. Each sets its own window size and checks: one `h1`; no element of the header, main or footer past the window's edge (the frame clips sideways, so the elements themselves are measured; a visually hidden box, an ink backdrop, which its band crops on purpose, and a row that scrolls sideways on purpose are not counted); from 1280 up, the words of the page span more than half of the window, so a large monitor is used and the page is not left as a narrow column (the 404, which sets its few words in six columns beside the ink, is left out of this one); and no console or page error. It measures and takes no screenshots. |

### Helpers and support

`tests/e2e/helpers.ts` exports:

- `NAVIGATION_TIMEOUT`, 15 seconds, for client-side navigations.
- `introSeen(page)`, which sets the session flag for the cover before any script runs, so the page is not under the cover.
- `hydrated(page)`, which waits for `data-hydrated` on the root element: the client components of the page have their handlers. Wait for it before pressing a control that a script answers, on a page you have just loaded.

`tests/e2e/support/hero.ts` holds helpers for the two specs that look at the hero's stage: `recordStage` notes the stage on every frame from the first (whether the box is displayed, how many documents are out of sight, how many animations of the sequence exist) and every value of `data-ink`; `stageFrames` and `unsettledFrames` read the frames back; `recordSequence` and `sequence` note each animation of the sequence with its delay, length and start time; `settled` waits for the stage to be at rest; `stageState` and `timings` read the box and the documents as computed now.

`tests/e2e/support/ink.ts` holds helpers for the ink specs: `withInkTest` sets the test flag before the page mounts; `recordIntro` logs changes to `data-intro`; `introStates` and `introAt` read them back; `inkMode`, `canvases`, `backdropState`, `canvasPixel` and `inkedPixels` read the layer; `scrollToElement` and `scrollToEnd` scroll; `pageClock` reads the page clock; `collectProblems` collects console errors and page errors.

When the flag is set, `lib/ink/test-hook.ts` installs `window.__inkTest`. It exposes `still`, `hold`, `engine`, `cost`, `stats`, `zoneExtremes`, `loseContext` and `restoreContext`. `engine()` returns the Ink object, which has `step`, `render`, `setQuality` and `preset`.

## Budgets

`scripts/check-budgets.mjs` is plain Node with no dependencies. It measures a running production server.

```bash
node scripts/check-budgets.mjs http://localhost:3100
node scripts/check-budgets.mjs http://localhost:3100 --record
node scripts/check-budgets.mjs http://localhost:3100 --pages=/,/about,/catalog
```

The pages checked are `/`, `/about` and `/catalog` by default. `--pages` replaces that list. The script weight of `/` is always measured, and `/` is put first when the list does not name it.

It measures two things:

1. **Script weight of `/`.** Every `<script src>` that a modern browser runs and every inline script that holds code. Scripts marked `nomodule` are listed but not counted. The streamed page data is skipped. Each file is gzipped at level 9 and the sizes are summed. The sum may grow by at most 12 KiB over the recorded baseline.
2. **Shader chunks.** Every `.js` file under `.next/static` that contains `#version 300 es`. Together they may weigh at most 40 KiB gzipped, and none may be an initial script of a checked page.

The shader half needs a production build, so `.next/static` must exist. Without it the script throws "run a production build first" and exits with code 1.

### Baseline

`--record` writes `tests/budgets/baseline.json` with these fields:

| Field | Content |
|---|---|
| `page` | `/` |
| `gzipTotal` | The summed gzip size of the counted scripts of `/`. This is the value the growth check compares against. |
| `scripts` | Each script with its path, gzip size, and the `counted` flag. A `nomodule` script is recorded with `counted: false` and with its marker flag set to `true`. |
| `shaderChunks` | The shader chunks found, with their paths and gzip sizes. |
| `shaderGzipTotal` | The summed gzip size of the shader chunks. The shader check uses the fixed limit, not this value. |

Refresh the baseline after an intended change to the shipped scripts: run a production build, start the server, run the script with `--record`, and commit the file.

Exit codes: 0 when every budget holds, 1 when one is broken, 2 for a usage error.

## Ink stills tooling

`scripts/ink-stills.mjs` works with the stills listed in `lib/ink/stills.json`. It runs in one of four modes. Passing more than one mode prints the usage and exits with 2.

| Mode | What it does | Fails when |
|---|---|---|
| Capture (default) | Renders each still on its route and viewport, at the device pixel ratio in the manifest, and writes WebP files to `public/ink/`. Quality starts at 0.86 and steps down by 0.04 to a floor of 0.70 until the file is at most 90 KiB. | The thirteen files together exceed 600 KiB. |
| `--check` | Renders the routes (`/`, `/about`, `/purchase`, `/sample`, `/phases/prepare`, `/catalog`, `/nope`) at seven widths (320 to 1920 px) with ink off. Reads the still pixels under each calm zone and compares them with the zone cap. | On a light ground, the darkest pixel falls below the cap minus 0.02. On a dark ground, the lightest pixel rises above the cap plus 0.02. |
| `--blue` | Measures the light blue at 1440 by 900: the prompt scene at 2 and 2.5 seconds, and the intro at 1.3 seconds. It takes the darkest 1 percent of saturated blue pixels. | Fewer than 100 such pixels exist, or their luminance is below 0.25, or their hue is outside 205 to 216 degrees. |
| `--sheets` | Writes contact sheets of each scene at fixed times, for a desktop viewport (1440 by 900 at 1x) and a phone viewport (390 by 844 at 2x), as `sheet-<viewport>-<scene>.png`. | Not applicable. |

Options:

- `--base=URL` sets the server. The default is `http://localhost:3100`. If nothing answers there and `--base` was not passed, the script starts `next start -p 3100` from the existing `.next` build and stops it afterwards. Without `.next/BUILD_ID` it prints a request for a production build and exits with 2.
- `--only=name,name` limits the capture to the named stills (for example `bloom-purchase-wide,bloom-purchase-tall`). With `--sheets`, scene names and viewport names (for example `spill,phone`) are accepted.
- `--out=DIR` sets the output directory for `--sheets`. The default is `.qa-shots/final`, which is gitignored.
- `--widths=` and `--routes=` are read by `--check` (a route is given as `--routes=/purchase`; a shell that rewrites a leading slash into a path, such as Git Bash, needs `MSYS_NO_PATHCONV=1`).

Chromium runs with `--use-angle=d3d11`, `--ignore-gpu-blocklist` and `--enable-gpu` for capture, `--blue` and `--sheets`, on every platform. `--check` runs without them. The engine needs a GPU. Without one the script exits with 2.

The script imports `lib/ink/stage.ts` and `lib/ink/zones.ts` directly, so Node must run TypeScript files with type stripping. It re-runs itself with `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` to hide the warning about the package type.

The script copies the byte budgets and the quality start from `lib/ink/stills.ts`, and the session and storage keys from `lib/boot/state.ts`; the quality floor and step are defined only in the script. When a copied value changes in its source, change the script too.

### Paper grain

`scripts/paper-grain.mjs` writes `public/paper/grain.png`, the texture behind the paper surfaces. It produces a 128 pixel square indexed PNG with four palette entries in the ink colour, at alpha 0, 0.03, 0.06 and 0.09. The pixels are drawn from a fixed seed, so the output does not change between runs. The script fails if the file exceeds 4096 bytes. `tests/unit/kit-grain.test.ts` checks the result, so run the unit tests after regenerating the file.

## Lint, formatting and types

**ESLint** (`eslint.config.mjs`) is a flat config. It ignores `.next/`, `node_modules/`, `playwright-report/`, `test-results/`, `.qa-shots/` and `next-env.d.ts`. It extends the Next.js `core-web-vitals` and `typescript` configurations. Under `app/` and `components/`, importing from `@/content/*` is an error, except `@/content/taxonomy`. Catalog data is read through `@/lib/catalog/repository`.

**Prettier** uses `printWidth: 100` (`.prettierrc`). `.prettierignore` leaves out `.next`, `node_modules`, `pnpm-lock.yaml`, the report folders, `.superpowers`, `docs` and `.claude`.

**TypeScript** (`tsconfig.json`) is strict and sets `noUncheckedIndexedAccess`. It resolves modules with the `bundler` strategy and maps `@/*` to the repository root. Type checking covers the `.ts` and `.tsx` files, test files and `playwright.config.ts` included, plus the generated Next.js types.

**Next.js** (`next.config.ts`) enables `reactStrictMode`, disables the `X-Powered-By` header and redirects the retired addresses (`/bundles`, `/bundles/:slug`, `/pricing`, `/cart` to `/purchase`; `/contact` to `/about#contact`; `/templates/:slug` to `/catalog?view=:slug`), all permanent.

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
    expect(formatPrice(4900)).toBe("$49");
  });
});
```

Logic that needs a browser (layout, focus, motion, the ink engine) belongs in a browser spec.

### A browser spec

1. Create `tests/e2e/<name>.spec.ts`. It runs in `chromium` and `mobile`. Add its name to the Firefox pattern in `playwright.config.ts` only when the behaviour must hold in Firefox.
2. Call `introSeen(page)` before the first `goto` of any test that opens the home page for another reason.
3. Collect console and page errors with `collectProblems` from `tests/e2e/support/ink.ts` when the page must load cleanly.
4. Specs that need a GPU go in `ink-live.spec.ts`, which runs in the `gpu` project only.

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
- Canvas, shader contexts, animation frames and scroll listeners go in the folders listed under scoped techniques.
- Words to ban go in the banned-terms array of `design-gate.test.ts` (line 64).

### A change to catalog content

Records under `content/` are checked by `validateCatalog` when the repository module loads. An invalid record throws a `CatalogError` that names the kind, the slug and the field. `content.test.ts` pins facts about the sample catalog: phase order, step counts and the six free templates by name. Update those expectations in the same change as the data. Exactly six templates must have `free: true`; `validateCatalog` rejects any other number.
