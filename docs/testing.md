# Testing and guard rails

This page covers the checks that run against the repository: the commands, the unit and browser suites, the design gate that keeps the source inside the design system, the script budgets, the ink stills tooling, and the steps for adding a test. Run every command with `corepack pnpm` from the repository root.

## Overview

| Area | Unit tests | Browser specs | Scripts |
|---|---|---|---|
| Catalog, search and cart | `content`, `validate`, `query`, `search-params`, `coverage`, `pricing`, `format`, `compounds`, `cart-store` | `browse`, `catalog`, `cart`, `cart-keyboard`, `not-found` | |
| Brand and static assets | `brand-mark`, `kit-grain`, `stills-files` | `identity` | `paper-grain` |
| Boot, cover and motion | `boot-script`, `boot-cover`, `intro`, `kit-motion` | `intro`, `motion`, `reduced-motion` | |
| Ink | `ink-scenes`, `ink-stage`, `ink-zones`, `stills-files` | `ink-live`, `ink-fallback` | `ink-stills` |
| Look of the source | `design-gate` | `identity` | |
| Shell and navigation | `nav-links` | `header`, `menu`, `console` | |
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
| Components, styles or pages | `test`, `typecheck`, `lint`, `test:e2e` |
| Shipped JavaScript, boot script or ink engine | The two rows above, plus `check-budgets` against a production server |

## Unit tests

Vitest runs every `tests/unit/**/*.test.ts` file in the Node environment. The config (`vitest.config.mts`) maps the `@/` import alias to the repository root, so a test imports source with the same paths the app uses. Put browser specs in `tests/e2e`; Vitest reads only `tests/unit`.

Shared catalog fixtures live in `tests/unit/fixtures/catalog.ts`: `rawPhases`, `rawTemplate(overrides)`, `rawBundle`, `rawCatalog()` and `makeTemplate()`.

### Catalog, search and cart

| File | Guards |
|---|---|
| `content.test.ts` | The sample catalog as read through `lib/catalog/repository`: seven phases in fixed order with two steps each; minimum template counts per phase and per step; every deliverable type, app, audience and format is used; prices in the expected range; named pieces exist; the featured selection; copy with no banned term, straight quotes or exclamation marks; search by title; five bundles, each priced below its contents; bundle summaries that match their counts; the comparison's price span (the cheapest template to the complete bundle); every section of the worked example's contents links to a page the catalog holds; related-template and bundle lookups. |
| `validate.test.ts` | `validateCatalog` sorts phases and steps by order. It rejects a non-positive price, a duplicate template slug, an unknown phase, a step that belongs to another phase, a bundle that names a missing template, an unknown deliverable type and a slug that is not kebab case. A bundle and a template may share a slug. |
| `query.test.ts` | `queryTemplates` over synthetic templates: page size; facets combine with OR inside a facet and AND across facets; search by terms, case, quotes, literal regex characters and a length limit; the default `phase` sort (phase order, then step order, given order inside a step; unknown phases and steps last; the given order without phases) and the other sorts; page clamping; facet counts that ignore their own selection; the input is not mutated. |
| `search-params.test.ts` | `parseCatalogParams` and `serializeCatalogParams`: comma lists; unknown values dropped; an invalid page becomes 1; an unknown sort becomes `phase`, which stays out of the URL while any other sort is written; the query is trimmed and capped at 200 characters; fixed key order; defaults omitted; round trip. `catalogHref`, `clearFiltersHref` (keeps only the search term) and `activeFilters` (each selected value facet by facet with its names, and a link without it on page 1). |
| `covers.test.ts` | `coverSpec`: the kind, format and phase order of a template, no numeral for an unknown phase. `folderCovers`: the first three templates in the bundle's order, all of a shorter bundle, a narrower limit, none for zero or a negative limit. |
| `coverage.test.ts` | `phaseCoverage`: one entry per phase in order; a phase is covered once a template belongs to it; templates in unknown phases are ignored. `coverageLabel`: singular for one phase, runs joined with an en dash, separate runs with commas, empty for none. `bundlesForPhase`: only bundles holding the phase, the most focused first, then the one holding more, then the cheaper. `adjacentPhases`: neighbours in rollout order, none at the ends or for an unknown slug. |
| `pricing.test.ts` | `bundleValueCents` sums the contents; `bundleSavingsCents` is the difference, floored at zero. `catalogPriceSpan`: from the cheapest template to the bundle that reaches every phase, the dearest of several, no top end when none does, nothing without templates. |
| `worked-example.test.ts` | `contentsRows`: a template, step or phase target becomes its link and label; an unknown target leaves the section without a link; the order is kept. |
| `format.test.ts` | `formatPrice`: whole dollars drop the cents; other amounts keep them; thousands are separated. `formatLength`: slides for a deck, pages for every other format, singular for one. |
| `compounds.test.ts` | `splitCompounds`: hyphenated compounds become compound parts, a lone hyphen does not, and joining the parts gives back the title. |
| `cart-store.test.ts` | The storage key; `parseCart` on malformed input, de-duplication and removal of extra fields; `addLine`, `removeLine`, `hasLine`; `pruneLines` against the known slugs; `bundleHolding`, `coveredLines` and `cartSubtotalCents` (a template a bundle in the cart holds is not charged; overlapping bundles are both charged). |
| `nav-links.test.ts` | `currentPhase`: a phase page, a template's phase, and the catalog while it is filtered on exactly one known phase (`singleCatalogPhase`), on the catalog only. |

### Brand and static assets

| File | Guards |
|---|---|
| `brand-mark.test.ts` | The mark geometry in `lib/brand/mark.ts` (three strokes, viewBox, stroke width and path data); `LogoMark` markup (current colour stroke, hidden from assistive technology by default, `role="img"` with a title, the two-tone tail); the contents of `app/icon.svg`. |
| `kit-grain.test.ts` | `public/paper/grain.png` is an indexed 128 by 128 PNG with four palette entries, a transparent first entry, a bounded maximum alpha and at most 4096 bytes. `app/globals.css` declares the `--grain` URL. |
| `stills-files.test.ts` | `public/ink` holds exactly the files named in `lib/ink/stills.json`, each a WebP within the per-file and total byte budgets, with viewport, ratio and route values in range. |

### Boot, cover and motion

| File | Guards |
|---|---|
| `boot-script.test.ts` | Runs `BOOT_SCRIPT` against stand-ins for the document, session storage, media queries, navigator, canvas and WebGL. It checks the decisions against the pure functions in `lib/boot/state.ts`: the reduced-motion early return, `data-motion` and `data-timeline`, ink mode, GPU probing and software renderers, the backstop timers, the cover flag and skip events, and the size limits (at most 1536 bytes gzipped, no `</script` or `<!--`). It also checks that `IntroScript` prints the script once inside a hidden wrapper. |
| `boot-cover.test.ts` | The markup of `IntroCover` and `InkBackdrop`: one cover element hidden from assistive technology, no focusable control, three pen paths with unit path length, no image or canvas in the cover; the cover animation timings in `intro-cover.module.css`. |
| `kit-motion.test.ts` | Reads `app/motion.css` as text. Every `@keyframes` block and every animating declaration sits inside `(prefers-reduced-motion: no-preference)`. Inside one rule, `animation-timeline` and `animation-range` follow the `animation` shorthand. Hidden starting states appear only under `html[data-motion="on"]`. No infinite animation, `@property` or iteration count. The five move keyframes (`move-drift`, `move-ink-in`, `move-settle`, `move-shadow`, `move-grow`) must exist, no rule blurs (no `filter` animates or transitions), and the ink-in range ends sooner than the drift range. |

### Ink

| File | Guards |
|---|---|
| `ink-scenes.test.ts` | Each of the seven scenes in `lib/ink/scenes.ts` runs against a recorder at 60 Hz with a fixed seed, on a wide and a tall canvas. Drops stay near the canvas and have positive radius and amount; the same seed gives the same events; the timing and placement rules of each scene hold; `STAGES[name].runMs` is positive and at most 30 seconds. |
| `ink-stage.test.ts` | `chooseStage`, `visibleArea` and `coverProgress` in `lib/ink/stage.ts`: stage weights, which grounds are dark, which scene has the `tenth` trigger, the topmost-candidate rule, the challenger margin, and the fire and rearm thresholds for the ninety band. |
| `ink-zones.test.ts` | `calmZone` for the text, display and veil kinds (padding, feather, floor, hold, fade and cap values, and the narrow-window text variant); the dark-ground caps; `edgeZone`; `parseEdges`; `buildZones` order and limits; `mergeNearest`; `anchorRect` and `relativeRect`. |

## Design gate

`tests/unit/design-gate.test.ts` keeps the source inside the design system. It reads every file under `app/`, `components/`, `lib/` and `tests/`, the README and `docs/` as plain text. Matches in comments count, because the check works on lines of text, not on parsed code. The gate leaves itself out of the scan and so the banned strings it lists are not flagged there.

A failing assertion names the file, the line and the rule that matched, for example `components/layout/footer.tsx:12: hex colour`. The gate also contains self-tests: they feed sample text through the scoped rules and check that the allowed places pass and other places fail.

### Banned terms and values

The banned-terms array in `design-gate.test.ts` (line 64) lists banned words and identifiers. Words match in any letter case; identifiers match as written. To ban another term, append a `literal(...)` entry to that array. The gate also bans:

- fixed pixel widths of 232, 366, 620, 938 and 502 px, unless the number is part of a longer number;
- `min-width` or `max-width` queries of 768, 1024 or 2000 px;
- a negative `letter-spacing`.

It also holds a wording rule over the `.ts` and `.tsx` files of `app/`, `components/` and `lib/`: a line
that names Prosci must say "Prosci-certified practitioner" or be the footer's notice ("by Prosci Inc.",
"trademark of Prosci"). Prosci describes the practitioner, never the product.

The gate also requires that the README and every file under `docs/` avoid three banned strings, and it keeps a fixed list of folder names out of the tree.

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

- The test directory is `tests/e2e`. The base URL is `http://localhost:3100`.
- The reporter is `list`. Traces are kept for failing tests. `forbidOnly` is set in CI.
- The web server step runs `npm run build && npm run start -- -p 3100`. Outside CI an existing server on the port is reused, so stop a stale server before a run that must use a fresh production build.

### Projects

| Project | Device and viewport | Runs |
|---|---|---|
| `chromium` | Desktop Chrome, 1280 by 800 | Every spec except `ink-live.spec.ts`. |
| `mobile` | Pixel 7 | Every spec except `ink-live.spec.ts`. |
| `gpu` | Desktop Chrome, 1440 by 900, with the GPU arguments | `ink-live.spec.ts` only. It depends on `chromium`, `mobile` and, when that project is registered, `firefox`. It runs one test at a time. |
| `firefox` | Desktop Firefox, 1280 by 800 | `browse`, `console`, `reduced-motion`, `ink-fallback` and `motion`. Registered only when Firefox starts on the machine, or when `PW_FIREFOX=1` is set. |

The GPU arguments are `--ignore-gpu-blocklist` and `--enable-gpu`, plus `--use-angle=d3d11` on Windows. Firefox is the browser without view timelines, so it exercises the observer path of the motion system.

A spec that is not named by the Firefox pattern runs in `chromium` and `mobile`. The Projects column of the table below lists the exceptions.

### Specs

| Spec | Projects | Guards |
|---|---|---|
| `browse.spec.ts` | chromium, mobile, firefox | Home to a phase to a template; the hero's link to the worked example; no horizontal overflow on eleven routes. |
| `cart.spec.ts` | chromium, mobile | Adding and removing lines; the subtotal, and a template already in a bundle in the cart left out of it (and the template page's note); the disabled checkout control; persistence across a reload; corrupted saved data; removal of unknown slugs; a cart that still works when storage is blocked. |
| `cart-keyboard.spec.ts` | chromium, mobile | Focus after adding, removing and emptying the cart; the status message; a stale saved cart is cleared. |
| `catalog.spec.ts` | chromium, mobile | The result count and paging; facet filters; restoring filters from the URL; search that keeps the filters; the active-filter chips and Clear all; the empty states (search only, with the phases, and with filters) and their clear links; malformed parameters; an out-of-range page; the filter dialog on a phone. |
| `console.spec.ts` | chromium, mobile, firefox | Eleven routes load with no console error and no page error. |
| `header.spec.ts` | chromium only (skips the mobile project) | The banner; the primary navigation and its current-page marks; the phase rail; the sticky bar; the rail leaving the viewport on scroll. |
| `identity.spec.ts` | chromium, mobile | Design checks in the browser: landmarks; one `h1` per page; root colours and fonts; band values; the ink hooks on the page; the order and ids of the home sections; focus rings; catalog card ratios; no overflow and minimum touch targets at 320 px. |
| `intro.spec.ts` | chromium, mobile | The cover on a first visit: its states; its end on a click, key press or wheel; the time limit; no cover on reload or on other routes; no cover with reduced motion, blocked storage or JavaScript off. |
| `ink-fallback.spec.ts` | chromium, mobile, firefox | Without WebGL2, with more contrast, and without JavaScript: still images only, no canvas, no pause control, a clean console. The software-renderer case runs in Chromium only. |
| `ink-live.spec.ts` | gpu | Live ink on a GPU: the first frame; frame cost; calm caps; the stop when idle; pause and resume; resize; one canvas across scenes; context loss and restore; the not-found scene; the handover from the cover. Skips when the page is not live. |
| `menu.spec.ts` | mobile (in chromium every test skips) | The phone drawer: the dialog, its links and phases, Escape, a click on the scrim, the Close button, and navigation or back navigation closing it. |
| `motion.spec.ts` | chromium, mobile, firefox | Entrances hidden until scrolled into view, with timelines and without (Chromium stubs `CSS.supports`); the fill of the ninety band under a 90% figure that reads its value at every step, and the `#inside` counts that never count up; view transitions and the shared cover name. |
| `not-found.spec.ts` | chromium, mobile | Missing paths return 404 with the page heading and the phase navigation; mixed-case paths redirect to lower case. |
| `reduced-motion.spec.ts` | chromium, mobile, firefox | With the reduced-motion preference on twelve routes: still ink, no motion attributes, no canvas, no running animations, no cover; the still images load; the 90% figure and the tally show their final state. |

### Helpers and support

`tests/e2e/helpers.ts` exports:

- `NAVIGATION_TIMEOUT`, 15 seconds, for client-side navigations.
- `introSeen(page)`, which sets the session flag for the cover before any script runs, so the page is not under the cover.

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
| Capture (default) | Renders each still on its route and viewport, at the device pixel ratio in the manifest, and writes WebP files to `public/ink/`. Quality starts at 0.86 and steps down by 0.04 to a floor of 0.70 until the file is at most 90 KiB. | The eleven files together exceed 600 KiB. |
| `--check` | Renders the routes at seven widths (320 to 1920 px) with ink off. Reads the still pixels under each calm zone and compares them with the zone cap. | On a light ground, the darkest pixel falls below the cap minus 0.02. On a dark ground, the lightest pixel rises above the cap plus 0.02. |
| `--blue` | Measures the light blue at 1440 by 900: the hero at 8 and 30 seconds, and the intro at 1.3 seconds. It takes the darkest 1 percent of saturated blue pixels. | Fewer than 100 such pixels exist, or their luminance is below 0.25, or their hue is outside 205 to 216 degrees. |
| `--sheets` | Writes contact sheets of each scene at fixed times, for a desktop viewport (1440 by 900 at 1x) and a phone viewport (390 by 844 at 2x), as `sheet-<viewport>-<scene>.png`. | Not applicable. |

Options:

- `--base=URL` sets the server. The default is `http://localhost:3100`. If nothing answers there and `--base` was not passed, the script starts `next start -p 3100` from the existing `.next` build and stops it afterwards. Without `.next/BUILD_ID` it prints a request for a production build and exits with 2.
- `--only=name,name` limits the capture to the named stills. With `--sheets`, scene names and viewport names (for example `spill,phone`) are accepted.
- `--out=DIR` sets the output directory for `--sheets`. The default is `.qa-shots/final`, which is gitignored.
- `--widths=` and `--routes=` are read by `--check`.

Chromium runs with `--use-angle=d3d11`, `--ignore-gpu-blocklist` and `--enable-gpu` for capture, `--blue` and `--sheets`, on every platform. `--check` runs without them. The engine needs a GPU. Without one the script exits with 2.

The script imports `lib/ink/stage.ts` and `lib/ink/zones.ts` directly, so Node must run TypeScript files with type stripping. It re-runs itself with `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` to hide the warning about the package type.

The script copies the byte budgets and the quality start from `lib/ink/stills.ts`, and the session and storage keys from `lib/boot/state.ts`; the quality floor and step are defined only in the script. When a copied value changes in its source, change the script too.

### Paper grain

`scripts/paper-grain.mjs` writes `public/paper/grain.png`, the texture behind the paper surfaces. It produces a 128 pixel square indexed PNG with four palette entries in the ink colour, at alpha 0, 0.03, 0.06 and 0.09. The pixels are drawn from a fixed seed, so the output does not change between runs. The script fails if the file exceeds 4096 bytes. `tests/unit/kit-grain.test.ts` checks the result, so run the unit tests after regenerating the file.

## Lint, formatting and types

**ESLint** (`eslint.config.mjs`) is a flat config. It ignores `.next/`, `node_modules/`, `playwright-report/`, `test-results/`, `.qa-shots/` and `next-env.d.ts`. It extends the Next.js `core-web-vitals` and `typescript` configurations. Under `app/` and `components/`, importing from `@/content/*` is an error, except `@/content/taxonomy`. Catalog data is read through `@/lib/catalog/repository`.

**Prettier** uses `printWidth: 100` (`.prettierrc`). `.prettierignore` leaves out `.next`, `node_modules`, `pnpm-lock.yaml`, the report folders, `.superpowers`, `docs` and `.claude`.

**TypeScript** (`tsconfig.json`) is strict and sets `noUncheckedIndexedAccess`. It resolves modules with the `bundler` strategy and maps `@/*` to the repository root. Type checking covers the `.ts` and `.tsx` files, test files and `playwright.config.ts` included, plus the generated Next.js types.

**Next.js** (`next.config.ts`) enables `reactStrictMode` and disables the `X-Powered-By` header.

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
- Media queries use only the breakpoints and preference queries in the allow-list. Breakpoints are `40em` and `68em`.
- Canvas, shader contexts, animation frames and scroll listeners go in the folders listed under scoped techniques.
- Words to ban go in the banned-terms array of `design-gate.test.ts` (line 64).

### A change to catalog content

Records under `content/` are checked by `validateCatalog` when the repository module loads. An invalid record throws a `CatalogError` that names the kind, the slug and the field. `content.test.ts` pins facts about the sample catalog: phase order, step counts, bundle sums and the wording of bundle summaries. Update those expectations in the same change as the data.
