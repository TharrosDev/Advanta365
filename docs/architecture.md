# Architecture

Advanta365 is a Next.js 16 App Router site written in React 19 and TypeScript. Pages are server
components that read a validated catalog and compose UI primitives. Styling uses CSS Modules on top of
global design tokens. The site ships HTML, CSS and inline SVG, plus one client-side visual: a WebGL2 ink
simulation drawn on a canvas behind selected headlines and during the first-visit cover. The engine is
loaded only where it is shown and not on the calm routes of section 6.1 (`CALM_ROUTE_SOURCE`).

Runtime dependencies are limited to `next`, `react`, `react-dom` and `zod`. Fonts come from
`next/font/google`: Besley for display type and Atkinson Hyperlegible Next for text, both exposed as CSS
variables (`--font-besley`, `--font-atkinson`).

Related documents: `design-system.md` covers the visual rules and component usage.

## Contents

1. Routes
2. Server and client boundaries
3. Content, validation and data flow
4. Site shell
5. Design tokens and primitives
6. Load-in sequence and the cover
7. Ink layer
8. Motion and page transitions
9. Cart
10. Catalog URL state
11. Test hooks and test contract
12. Budgets
13. Failure modes

## 1. Routes

| Path | Source | Rendering | Notes |
|---|---|---|---|
| `/` | `app/(site)/page.tsx` | Server, reads phases, templates and bundles | Renders the first-visit cover, then the home sections |
| `/about` | `app/(site)/about/page.tsx` | Server, no data reads | Title `About`; hosts the `#compare` band |
| `/pricing` | `app/(site)/pricing/page.tsx` | Server, reads templates and bundles | Title `Pricing` |
| `/contact` | `app/(site)/contact/page.tsx` | Server, no data reads | Title `Contact` |
| `/sample` | `app/(site)/sample/page.tsx` | Server, reads phases | Title `Sample` |
| `/catalog` | `app/(site)/catalog/page.tsx` | Dynamic (awaits `searchParams`) | Title `Catalog`; filters live in the URL |
| `/phases/[phase]` | `app/(site)/phases/[phase]/page.tsx` | Static params for the 7 phases | `notFound()` for other slugs |
| `/templates/[slug]` | `app/(site)/templates/[slug]/page.tsx` | Static params for the 67 templates | `notFound()` for other slugs |
| `/bundles` | `app/(site)/bundles/page.tsx` | Static | Title `Bundles` |
| `/bundles/[slug]` | `app/(site)/bundles/[slug]/page.tsx` | Static params for the 5 bundles | `notFound()` for other slugs |
| `/cart` | `app/(site)/cart/page.tsx` | Static | Title `Cart`; receives every catalog entry as data |
| `/ink-lab` | `app/(lab)/ink-lab/page.tsx` | Development only | Calls `notFound()` unless `NODE_ENV` is `development` |
| Unmatched paths | `app/(site)/[...rest]/page.tsx`, `app/(site)/not-found.tsx`, `app/not-found.tsx` | 404 | Site 404 keeps the shell; the root 404 renders `MissingPage` and `InkLayer` without it |

Metadata: the root layout (`app/layout.tsx`) sets the title template `%s · Advanta365` and the default
title `Advanta365 · Don’t start from a blank prompt.` The description is built from the toolkit counts in
`lib/site.ts`. The home route exports no metadata of its own.

`proxy.ts` runs before routing. Any path containing an uppercase letter receives a 308 redirect to the
lowercase path. Its matcher skips `_next/` and any path containing a dot.

## 2. Server and client boundaries

Layouts and pages are server components. They read the catalog through the repository, then pass plain
values (strings, numbers, arrays of plain objects) to components. A component runs in the browser when its
file carries the `"use client"` directive or a client component imports it.

Client components (files with `"use client"`, and the cart store module they share):

| Area | Files | Why they are client |
|---|---|---|
| Cart | `components/cart/cart-button.tsx`, `cart-contents.tsx`, `cart-sync.tsx`, `add-to-cart.tsx` | Read the cart store, which is only available in the browser |
| Cart store | `components/cart/use-cart.ts` | `useSyncExternalStore` over `localStorage` |
| Catalog | `components/catalog/filter-panel.tsx`, `sort-select.tsx` | Update the URL with `router.replace` |
| Shell | `components/layout/primary-nav.tsx`, `phase-rail.tsx`, `nav-drawer.tsx` | Read `usePathname`; the drawer owns a native dialog |
| Company | `components/company/faq-list.tsx` | Open and closed state |
| Not found | `components/not-found/asked-path.tsx`, `late-boot.tsx` | Read `window.location`; add the boot script when needed |
| UI | `components/ui/motion-root.tsx`, `count-up.tsx` | Observers and the counter animation |
| Ink | `components/ink/ink-layer.tsx` | Singleton controller and the pause control |

The ink controller itself (`components/ink/ink-controller.ts`) is plain TypeScript created by `InkLayer`.
`InkBackdrop` (`components/ink/ink-backdrop.tsx`) is server-renderable: it outputs a `<picture>` with the
still image, and the canvas is added later on the client.

The engine (`lib/ink/engine/index.ts`) is reached only through a dynamic `import()` from the controller, so
it loads only on pages that show ink.

The cover is server-rendered markup (`components/intro/intro-cover.tsx`). What switches it on is an inline
script rendered by `IntroScript` at the start of `<body>`, before any other content. See section 6.

## 3. Content, validation and data flow

```
content/*.ts  ->  lib/catalog/schema.ts (zod)  ->  lib/catalog/validate.ts
              ->  lib/catalog/repository.ts (getters)  ->  pages and layouts  ->  components
```

### 3.1 Content files

| File | Holds |
|---|---|
| `content/phases.ts` | The seven phases and their steps |
| `content/templates/index.ts` | Concatenates the seven per-phase template lists in phase order |
| `content/templates/make-the-case.ts`, `plan.ts`, `design.ts`, `prepare.ts`, `communicate.ts`, `execute.ts`, `sustain.ts` | Templates per phase |
| `content/templates/sample.ts` | The `sample()` helper |
| `content/bundles.ts` | The five bundles |
| `content/taxonomy.ts` | Labels for deliverable types, apps, audiences, formats and ADKAR stages |

`sample(phase, entries)` adds `phase`, `featured` (default `false`) and `isSample: true` to each entry.
The per-phase files and `bundles.ts` mark their entries as sample content, so the beta strip shows while
any sample entry exists.

### 3.2 Schema and validation

`lib/catalog/schema.ts` defines the zod schemas. Slugs match `^[a-z0-9]+(-[a-z0-9]+)*$`. Text fields are
trimmed and non-empty. `priceCents` is a positive integer.

| Kind | Required fields |
|---|---|
| Step | `slug`, `name`, `summary`, `order` (integer) |
| Phase | `slug`, `name`, `summary`, `order` (integer), `steps` (at least one) |
| Template | `slug`, `title`, `summary`, `description`, `phase`, `step`, `deliverableType`, `apps` (at least one), `audiences` (at least one), `format`, `adkar` (may be empty), `priceCents`, `includes` (at least one), `featured`, `isSample`; optional `pageCount` (positive integer) |
| Bundle | `slug`, `title`, `summary`, `description`, `templateSlugs` (at least two), `priceCents`, `featured`, `isSample` |

`lib/catalog/validate.ts` parses each record, sorts phases by `order` and steps by `order` within each
phase, and keeps the file order of templates and bundles. It then checks:

- slugs are unique within phases, templates, bundles, and steps of one phase;
- each template's `phase` exists and its `step` belongs to that phase;
- each bundle's `templateSlugs` entries exist.

A failure throws `CatalogError` with the message `Invalid <kind> "<slug>" — <path>: <msg>`. The check runs
when `repository.ts` is first imported, so an invalid record stops every route that imports the repository.

### 3.3 Repository

`lib/catalog/repository.ts` is the only module in `app/` and `components/` that reads the phases, templates and bundles.
ESLint enforces this: imports of `@/content/*` are rejected in `app/**` and `components/**`, except
`@/content/taxonomy`.

| Getter | Returns |
|---|---|
| `getPhases()`, `getPhase(slug)` | Phases in order |
| `getTemplates()`, `getTemplate(slug)` | Templates in file order |
| `getBundles()`, `getBundle(slug)` | Bundles in file order |
| `getBundleTemplates(bundle)` | The bundle's templates in bundle order |
| `getBundlesContaining(templateSlug)` | Bundles that include a template |
| `getRelatedTemplates(slug, limit = 4)` | Templates in the same phase: same step first, then the rest of the phase; excludes the template itself |
| `hasSampleContent()` | `true` when any template or bundle is marked as sample |

Helpers used by pages and components:

| Helper | Behaviour |
|---|---|
| `bundleValueCents(templates)` | Sum of the template prices |
| `bundleSavingsCents(bundle, templates)` | Value minus bundle price, never below zero |
| `phaseCoverage(phases, templates)` | One entry per phase, sorted by `order`, with `covered` set when any template belongs to it |
| `formatPrice(cents)` (`lib/format.ts`) | en-US dollars; whole amounts drop `.00` |

### 3.4 Catalog contents

Seven phases, each with two steps (14 steps in total):

| Order | Slug | Name | Steps | Templates |
|---|---|---|---|---|
| 1 | `make-the-case` | Make the case | `build-the-business-case`, `secure-sponsorship` | 8 |
| 2 | `plan` | Plan | `assess-impact-and-readiness`, `set-the-change-strategy` | 12 |
| 3 | `design` | Design | `design-governance`, `design-the-adoption-approach` | 6 |
| 4 | `prepare` | Prepare | `build-the-champion-network`, `train-each-audience` | 9 |
| 5 | `communicate` | Communicate | `announce-the-change`, `equip-sponsors-and-managers` | 8 |
| 6 | `execute` | Execute | `go-live`, `run-hypercare` | 7 |
| 7 | `sustain` | Sustain | `measure-adoption`, `reinforce-and-hand-over` | 17 |

There are 67 templates. Their formats are docx (32), xlsx (19), pptx (12) and pdf (4). Prices range from
$19 to $79. Eight templates are featured. `pageCount` is set on 43 templates.

Five bundles, all marked as sample content:

| Slug | Templates | Bundle price | Sum of template prices | Phases reached | Featured |
|---|---|---|---|---|---|
| `sharepoint-rollout-complete` | 25 | $799 | $1,235 | 1 to 7 | yes |
| `case-and-plan-kit` | 10 | $309 | $475 | 1, 2 | yes |
| `design-and-prepare-kit` | 9 | $329 | $506 | 3, 4 | yes |
| `launch-and-sustain-kit` | 12 | $339 | $508 | 5, 6, 7 | no |
| `sponsor-essentials` | 6 | $139 | $214 | 1, 5, 7 | no |

### 3.5 Taxonomy

| Facet | Values (label) |
|---|---|
| Deliverable type | `communication` (Communications), `training` (Training), `assessment` (Assessments), `plan` (Plans), `stakeholder` (Stakeholder tools), `sponsor` (Sponsor tools), `resistance` (Resistance management), `measurement` (Measurement), `governance` (Governance) |
| App | `sharepoint` (SharePoint), `teams` (Teams), `onedrive` (OneDrive), `outlook` (Outlook), `copilot` (Copilot), `m365-general` (Microsoft 365 (general)) |
| Audience | `sponsor` (Sponsors), `change-lead` (Change leads), `manager` (People managers), `end-user` (End users), `site-owner` (Site Owners), `im-rep` (IM Representatives), `it-admin` (IT admins) |
| Format | `docx` (Word), `pptx` (PowerPoint), `xlsx` (Excel), `pdf` (PDF) |
| ADKAR | `awareness`, `desire`, `knowledge`, `ability`, `reinforcement` |

## 4. Site shell

`app/(site)/layout.tsx` is an async server layout. It reads phases, templates, bundles and
`hasSampleContent()` in parallel, then renders this tree, in order:

1. A skip link (`Button` with `href="#main"`, text "Skip to content"), fixed at the top left and shown
   on keyboard focus.
2. `CartSync`, which prunes saved cart lines whose items are missing from the catalog. It renders nothing.
3. `BetaStrip`, only while `hasSampleContent()` is true.
4. A `.frame` element (`position: relative`, flex column, `min-height: 100svh`, `overflow-x: clip`) containing:
   - `Header`, with `CartButton` in its tools area;
   - `PhaseRail`;
   - `<main id="main">` holding the route's children;
   - `Footer`;
   - `InkLayer`, which renders the pause control through a portal and no other DOM.

Do not wrap route children in an error boundary: a `notFound()` call inside a page must still set the
404 status.

### 4.1 Header

`components/layout/header.tsx` is a server component that renders `<header data-bar>` with a `Wrap`
inside it.

- Brand: a link to `/` containing `BrandLockup`. The accessible name is "Advanta365".
- `PrimaryNav`: links to Catalog, Bundles, Pricing, About and Contact (from `PRIMARY_LINKS` in
  `components/layout/nav-links.ts`). Shown from 68em. The current link has `aria-current="page"`, or
  `"true"` when the current path is nested under it.
- Tools: `CartButton`, then `NavDrawer`.

The bar is `position: sticky` at `top: 0`, height `var(--bar-h)`, and is a container for two container
queries that hide the menu word below 24.3em and the brand name below 21.2em. Container queries are used
only in `header.module.css` and `nav-drawer.module.css`.

### 4.2 Nav drawer

`components/layout/nav-drawer.tsx` (client) renders the "Menu" button and a native `<dialog>` opened with
`showModal()`.

- The dialog is labelled "Site menu". It contains a `nav` labelled "Menu" with the five primary links, and a
  group labelled "Rollout phases" with the seven phase links, each with a numeral.
- It shows the contact address as a `mailto:` link taken from `SITE.contactEmail`.
- Escape and the Close button close it. A click on the backdrop closes it when the event target is the
  dialog itself.
- The dialog closes on a pathname change unless it was opened on that same pathname.
- It closes when the viewport reaches `(min-width: 68em)`, where the inline navigation takes over.
- The drawer is 88vw wide at most and 23.625rem at most, anchored to the right edge.

### 4.3 Phase rail

`components/layout/phase-rail.tsx` renders the phases as a `PhaseTabs` row labelled "Phases". It is
hidden below 68em. It scrolls with the page. Its tabs use `aria-current="page"` on `/phases/<slug>`, and
`aria-current="true"` on `/templates/<slug>` for a template in that phase. `currentPhase()` in
`nav-links.ts` computes both.

### 4.4 Footer

`components/layout/footer.tsx` renders `<footer data-band="binder">`, which sets the binder band. Its contents, in order:

- the bare brand lockup and the contact link;
- a `nav` labelled "Footer" with the primary links and Cart;
- a `nav` labelled "Rollout phases" with the phase links;
- two status lines: "Sample catalog (beta)" and "Checkout is not available yet";
- the copyright line and the trademark notice.

The footer has `InkBackdrop` with scene `wisps` and edges `top`, and a veil with `data-ink-calm="veil"`.

### 4.5 Beta strip

`components/layout/beta-strip.tsx` is a non-landmark `div` with the text "Beta preview — templates shown are
samples." It sets `--strip-h` on `:root` through `:root:has(.root)`. The default `--strip-h` is `0px`.

## 5. Design tokens and primitives

### 5.1 Tokens

Tokens live in `app/globals.css` under `:root`. The file also imports `app/motion.css` first. Only
`app/globals.css` and `app/icon.svg` contain raw colour values. Components read the semantic layer.

| Group | Tokens |
|---|---|
| Paper and ink | `--desk`, `--paper`, `--desk-deep`, `--rule`, `--rule-firm`, `--ink`, `--ink-soft`, `--ink-faint` |
| Mark | `--mark` (#86c1ff), `--mark-deep` (#5fa8f5), `--mark-wash` (#eaf4ff), `--on-mark` (ink), `--on-ink` |
| Binder (footer) | `--binder`, `--binder-rise`, `--on-binder`, `--on-binder-soft`, `--rule-on-binder` |
| Errors | `--alert`, `--alert-wash` |
| Overlays | `--scrim`, `--bar-shadow` |
| Pigments (read by the ink engine) | `--pigment-paper`, `--pigment-binder`, `--pigment-black`, `--pigment-blue`, `--pigment-blue-dark`, `--pigment-pale` |
| Elevation | `--depth-0` to `--depth-4` |
| Semantic | `--ground`, `--surface`, `--stripe`, `--tile`, `--text`, `--text-soft`, `--text-faint`, `--line`, `--line-firm`, `--line-ink`, `--focus-ring` |

The semantic layer is redefined per band. `[data-band]` sets `background: var(--ground)` and
`color: var(--text)`. The bands are `desk`, `paper`, `wash`, `ink` and `binder`. `ink` and `binder` share
one block: binder ground with binder-rise surfaces and on-binder text. `components/ui/band.tsx` sets
`data-band` from its `surface` prop (default `desk`).

The page sets `color-scheme: light`.

Type faces and classes:

| Class | Face | Weight / line height |
|---|---|---|
| `.type-poster` | Display | 800 / 0.86 |
| `.type-hero` | Display | 600 / 1.04 |
| `.type-statement` | Display | 600 / 1.06 |
| `.type-banner` | Display | 600 / 1.12 |
| `.type-page` | Display | 600 / 1.16 |
| `.type-section` | Display | 600 / 1.24 |
| `.type-item` | Display | 600 / 1.3 |
| `.type-amount` | Display | 700 / 1.1 |
| `.type-lead` | Text | 400 / 1.5 |
| `.type-copy` | Text | 400 / 1.58 |
| `.type-ui` | Text | 600 / 1.375 |
| `.type-note` | Text | 400 / 1.43 |
| `.type-eyebrow` | Text | 700 / 1.385, uppercase, tracking 0.08em |
| `.type-tag` | Text | 700 / 1.333, uppercase, tracking 0.06em |

Display classes reset letter-spacing and turn off tabular figures. Size tokens are `clamp()` values
(for example `--size-hero` runs from 2.5rem to 5rem). `.tabular` and `.visually-hidden` are utilities.

Spacing uses a 7px module: `--s-1` (0.4375rem) through `--s-9` (10.5rem). Page layout uses `--page-max`
(77rem), `--page-pad`, `--col-gap`, `--band-pad` (`--s-6`, `--s-7` from 40em), `--bar-h` (3.5rem, 4.375rem
from 68em) and `--rail-h` (2.625rem). Controls use `--tap` (2.75rem, the minimum target below 68em),
`--control-sm` (2.5rem, desktop bar only), `--control` (3rem) and `--control-lg` (3.5rem). Shapes use
`--round-1` to `--round-3`, `--edge` (2px) and `--hair` (1px). Layers are
`--layer-bar` (50), `--layer-skip` (90) and `--layer-cover` (100).

Media queries in use: `(min-width: 40em)`, `(min-width: 68em)`, `(hover: hover)`,
`(prefers-reduced-motion: no-preference)`, `(prefers-reduced-motion: reduce)`, `(prefers-contrast: more)`
and `(forced-colors: active)`. Nothing else is allowed (section 11.4).

Base rules: border-box sizing; `html` with `scroll-padding-top` set to the bar height plus `--s-3`;
`html:has(dialog[open])` disables page scroll; headings and paragraphs have no margins; headings use
`text-wrap: balance`; `:focus-visible` draws a 3px outline in `--focus-ring`; `::selection` uses the mark
colour. The forced-colors block maps `[data-block]`, `[data-blank]` and focus to system colours.

### 5.2 Primitives (`components/ui`)

Primitives are the building blocks for pages. Each one has a CSS module unless noted.

| Primitive | Purpose |
|---|---|
| `Band` | A full-width section with `surface` (desk, paper, wash, ink, binder), `pad` (none, title, tight, regular, roomy), an optional `backdrop`, and an inner `Wrap` |
| `Wrap` | Page column: `max-width: var(--page-max)`, centred, with `--page-pad` |
| `Sheet` | A surface with radius and an `edge` (rule or ink) |
| `PaperSheet` | A sheet of paper with grain, `ratio` (free, portrait 5/7, landscape 4/3, slide 16/9), `size`, `depth`, and `lit` for pointer light |
| `PaperStack` | Sheets placed behind a top sheet, each with a small offset and turn |
| `Folder` | A folder shape with a tab and stacked sheets that lift on hover or focus |
| `Button` | `variant` (mark, outline, ink, text), `size` (sm, md, lg), `href` (root-relative links use `TransitionLink`), `arrow` |
| `TransitionLink` | `next/link` with prefetch on. The only file that imports `next/link` |
| `TextLink`, `RowLink` | Inline and row-style links |
| `BandedList`, `BandedRow` | Ruled lists (also exported as `Ledger`, `LedgerRow`) |
| `FactList` | Label and value rows built on `BandedList` |
| `Split` | Two-column layout from 68em with a margin column, optional sticky margin and a rule |
| `ShelfHead` | Section heading with eyebrow, title, body and action |
| `Eyebrow` | Uppercase label with an optional square marker |
| `Tag` | `format`, `saving` or `plain` labels |
| `Tally` | A row of blocks for counts. `animate` fills the blocks on scroll |
| `Odometer` | A rolling numeral used for the 90% figure |
| `CountUp` | Counts from 0 to a value on first view |
| `Blank` | A blinking or steady caret bar |
| `Note` | A short paragraph on the wash ground |
| `Input`, `Select`, `Checkbox` | Form controls |
| `Pagination` | Previous, numbered pages and next |
| `PhaseTabs` | Phase tabs in `rail` or `large` size |
| `Icon` | Inline SVG glyphs: arrow, chevron, plus, minus, close, tick, bars |
| `LogoMark`, `BrandLockup` | The mark, as a tile or bare lockup |
| `KeepCompounds` | Keeps hyphenated compounds from breaking across lines |
| `Sentences` | Splits text into sentences, optionally animated in one at a time |
| `Appear` | Wrapper that sets the entrance hook (`data-move`) |
| `PageShift` | `ViewTransition` wrapper for route changes |
| `MotionRoot` | Client component that sets up the scroll observer (renders nothing) |

Helpers: `lib/cx.ts` exports `cx` (joins truthy class names) and `cssVars` (builds a style object and
drops `undefined` values). `lib/brand/mark.ts` holds the logo geometry: `MARK_VIEWBOX` (32 by 24),
`MARK_STROKE_WIDTH` (4.2), the three segments, and the path strings `MARK_PATH_D`, `MARK_LEGS_D`,
`MARK_BAR_D`, `MARK_BODY_D` and `MARK_TAIL_D`. `app/icon.svg` uses the same colours as the tokens: a
#0B0D12 tile, the body in #FFFFFF and the tail in #86C1FF.

## 6. Load-in sequence and the cover

The sequence is driven by one inline script, `BOOT_SCRIPT` (`lib/boot/boot-script.ts`). It is generated
from constants in `lib/boot/state.ts` and runs before first paint. `IntroScript` prints it inside a hidden
`div`, so a client-rendered 404 does not log an error.

### 6.1 Constants

| Name | Value | Use |
|---|---|---|
| `INTRO_FLAG` | `advanta365.intro.v1` | sessionStorage flag for the cover |
| `INTRO_SEEN` | `1` | Value of the flag once the session has loaded |
| `INTRO_PATH` | `/` | Only the home route plays the cover |
| `INTRO_SKIP_EVENTS` | `pointerdown`, `keydown`, `wheel`, `touchstart` | Any of these ends the cover early |
| `INTRO_BACKSTOP_MS` | 4500 | The cover is ended at this time regardless |
| `INK_KEY` | `advanta365.ink.v1` | sessionStorage key for the ink mode and tier |
| `INK_BACKSTOP_MS` | 6000 | A live ink mode that no layer claims becomes still |
| `CALM_ROUTE_SOURCE` | `^/(catalog\|cart)(/\|$)\|^/(templates\|bundles)/.` | Routes where ink is swapped for stills |

### 6.2 Script order

1. If `prefers-reduced-motion: reduce` matches, set `data-ink="still"` and return. Nothing else is set, so
   no motion, no cover and no ink run.
2. Set `data-motion="on"`.
3. Set `data-timeline="on"` when `CSS.supports("animation-timeline: view()")` is true.
4. Set `data-ink-route="calm"` on calm routes.
5. Decide the ink mode. `data-ink` becomes `still` when `prefers-contrast: more`, `forced-colors: active`,
   `prefers-reduced-data: reduce`, `navigator.connection.saveData`, or the stored value is `off`. It becomes
   `paused` when the stored value is `paused`, and `live` when the stored value is a tier name. Otherwise a
   probe runs: a throwaway `webgl2` context with `failIfMajorPerformanceCaveat` must provide
   `EXT_color_buffer_float` or `EXT_color_buffer_half_float`, and its renderer name must not match the
   software pattern (SwiftShader, llvmpipe, softpipe, "software", "basic render"). The probe context is
   lost afterwards. On failure, `data-ink` is `still` and `off` is stored.
6. A `live` ink mode that no layer has claimed after 6000 ms becomes `still`.
7. The cover decision: read `INTRO_FLAG`. If storage throws, nothing runs. Otherwise the flag is written as
   `1` on every first load of the session, on any path and in a hidden tab. The cover plays only when the
   stored value was not `1`, the path is `/`, and `document.visibilityState` is `visible`.
8. When the cover plays: set `data-intro="play"`, listen for `INTRO_SKIP_EVENTS` (capture and passive) to
   set `data-intro="leave"`, listen for `animationstart` and `animationend` on the cover, and start a
   4500 ms timer.

Pure equivalents of these decisions (`shouldPlayIntro`, `inkMode`, `isSoftwareRenderer`, `isCalmRoute`)
live in `lib/boot/state.ts`. The unit tests run the inline script against them, so the two stay equal.

### 6.3 Attributes set on `<html>` before first paint

| Attribute | Values | Set by |
|---|---|---|
| `data-motion` | `on` | Boot script |
| `data-timeline` | `on` | Boot script, when view timelines are supported |
| `data-ink` | `live`, `paused`, `still` | Boot script, then the controller |
| `data-ink-route` | `calm` | Boot script and controller |
| `data-intro` | `play`, `ink`, `leave`; absent when done | Boot script (`play`, `leave`), controller (`ink`), boot script on the end event |
| `data-io` | `armed` | `MotionRoot`, in a layout effect on each pathname change |

### 6.4 Timeline of the cover

| Time (ms) | Event |
|---|---|
| 0 | `data-intro="play"`. The cover (`[data-intro-cover]`, fixed, `z-index: var(--layer-cover)`) shows over the page |
| 120 to 480 | Left leg of the mark is drawn (`pen-stroke` on `.legs`) |
| 420 to 600 | Bar is drawn |
| 500 to 900 | The name (`.name`) fades in |
| 560 to 800 | Tail is drawn |
| 600 | Skip hint fades in |
| 1200 to 1650 | Cover leaves (`cover-leave`, 450 ms, `--curve-leave`) |
| 2000 to 2800 | Cover ink leave (`cover-ink`, used when the ink took over) |
| 4500 | Backstop: the `data-intro` attribute is unset |

The mark is drawn with `pathLength={1}` and dash offsets. The pen curve is `--curve-pen`.

### 6.5 Skip, takeover and end

- Skip: any `INTRO_SKIP_EVENTS` input sets `data-intro="leave"`, which runs `cover-skip` (200 ms). The
  skip listeners are detached as soon as the cover's own animation starts. Child animations do not count.
- End: an `animationend` event whose target is the cover itself, or the 4500 ms backstop, removes the
  `data-intro` attribute and detaches the listeners.
- Takeover by ink: the ink controller prefetches the engine module when `data-intro` and `data-ink="live"`
  are present at startup. When the engine reports ready while the cover is up, the controller checks four
  things: `data-intro` is `play`, the cover element exists, the cover's own animation `currentTime` is at most
  1050 ms, and the WebGL2 context of the ink canvas offers `KHR_parallel_shader_compile`. If all four pass, it sets
  `data-intro="ink"`, marks the cover backdrop `live`, presets the `intro` scene, and runs it for 2800 ms.
  Otherwise the cover runs alone and the ink starts after the cover is gone.
- After the cover: when `data-intro` is unset, the controller probes the tier if none is stored and then
  chooses the backdrop to run.
- Load entrances finish under the cover. Under `:root[data-intro][data-motion="on"]`, load entrances use
  `animation-duration: 1ms` and no delay, so headings are visible when the cover goes.

The `/ink-lab` page has its own cover script that ignores the session flag, the path and reduced motion. It
exists for development only.

## 7. Ink layer

The ink layer is a WebGL2 fluid simulation. Dye is dropped into the water, advected by a velocity field
and rendered as ink over the ground colour. A backdrop is a region of a page where the ink runs. Pages place
backdrops; the controller decides which backdrop runs at a time.

### 7.1 Parts

| Part | File | Role |
|---|---|---|
| Types | `lib/ink/types.ts` | Public types of the engine, safe for first-load code |
| Engine | `lib/ink/engine/index.ts` | `createInk(canvas, options)` and `isSupported()`. Loaded by dynamic import |
| Tiers and budgets | `lib/ink/engine/defaults.ts` | `TIERS`, `TIER_ORDER`, `BUDGET`, simulation and look defaults |
| GL | `lib/ink/engine/gl.ts` | Programs, render targets, double buffers, draw calls |
| Shaders | `lib/ink/engine/shaders.ts` | GLSL ES 3.00 vertex and fragment programs (copy, curl, force, advectVel, divergence, jacobi, project, advectDye, splatVel, splatDye, impulse, composite) |
| Pigments | `lib/ink/pigments.ts` | Reads the `--pigment-*` tokens as RGB values |
| Scenes | `lib/ink/scenes.ts` | The seven scenes and the timeline helpers |
| Stages | `lib/ink/stage.ts` | Stage weights, run lengths and the choice rule |
| Zones | `lib/ink/zones.ts` | Calm zones around text and edge strips |
| Stills | `lib/ink/stills.ts`, `lib/ink/stills.json` | Still manifest and paths |
| Test hook | `lib/ink/test-hook.ts` | Installs `window.__inkTest` (section 11.2) |
| Controller | `components/ink/ink-controller.ts` | Lifecycle, stages, pointer, failure handling and the cover takeover |
| Layer | `components/ink/ink-layer.tsx` | Singleton client component: starts the controller and renders the pause control |
| Backdrop | `components/ink/ink-backdrop.tsx` | Server-renderable region with the still and the slot for the canvas |
| Lab | `components/ink/ink-lab.tsx` | Development page for the scenes |

Other pieces: `components/intro/intro-cover.tsx` (the cover, which hosts an intro backdrop),
`lib/boot/state.ts`, `lib/boot/boot-script.ts`, and `public/ink/` (the eleven stills).

### 7.2 Engine interface

`createInk(canvas, options)` never throws. Without WebGL2, without `EXT_color_buffer_float` or half-float
targets, or without renderable RGBA16F, `supported` is `false` and an `unsupported` event fires on the
next microtask.

| Method | Effect |
|---|---|
| `preset(name, overrides?)` | Clears the water, applies the scene's simulation and look, arms its timeline |
| `fire(name)` | Runs a named trigger once until the next clear (the ninety scene uses `tenth`) |
| `still(name?, steps?)` | Stops the loop, applies the preset, fires all triggers, runs `steps` steps in batches of 24, then renders |
| `start()`, `stop()` | Frame loop on and off |
| `rest({ duration })` | Eases the water to standstill and emits `rest` |
| `step(n)`, `render()`, `resize()` | Deterministic stepping and drawing |
| `drop(drop)`, `stir(stir)`, `stream(stream)`, `impulse({dx, dy})` | Input. `stream` returns `{ stop() }` |
| `setCalmZone(zones)` | Calm zones: a zone, an array, a function (re-run after each resize), or `null` |
| `clear({ duration? })` | Mist and fade over `duration`; `0` drains at once |
| `set({ sim?, look? })` | Changes physics and look |
| `setQuality(tier)`, `probe()`, `measureCost(frames)` | Tier control, self-measurement and timing |
| `stats()` | Tier, running state, step count, time, fps, frame time, canvas size, pixel sizes |
| `on(event, fn)`, `off(event, fn)` | Events: `ready`, `restored`, `end`, `cleared`, `quality`, `lost`, `unsupported`, `slow`, `rest` |
| `destroy()` | Frees targets, programs, buffers and listeners |

Context options: `alpha: false`, `antialias: false`, `depth: false`, `stencil: false`,
`preserveDrawingBuffer: false`, `failIfMajorPerformanceCaveat: true`.

The controller passes these options: pigments read from the tokens, a quality (the stored tier if any,
otherwise `medium` during the cover, otherwise `auto`), `maxDpr` (1.5 when `(pointer: coarse)`, else 2),
`interactive: true` and `scrollImpulse: true`. Defaults include `seed: 365`, `stepsPerSecond: 60`,
`autoPause: true` and `adapt: true`.

### 7.3 Time and randomness

- The simulation step is fixed at 1/60 s. Each animation frame adds the elapsed time capped at 100 ms and
  runs at most two steps. Extra time is dropped. The frame is rendered once after its steps. A frame with no
  step does not render.
- Randomness comes from one xorshift32 generator (`makeRandom(seed)`, eight warm-up draws), reseeded on
  every preset and probe. The ambient noise seed is `seed % 1000`.
- Every scene is deterministic for a given seed and tier, which the scene tests rely on.

### 7.4 Simulation pipeline

Each substep runs in this order:

1. Timeline: `runTimeline` fires due entries. Streams run. Mipmaps refresh when dirty.
2. Clearing: during a clear, the mist value and fade are computed from the elapsed fraction. At the end,
   the clear drains, emits `cleared` and runs queued triggers.
3. Curl, then force. The force step applies vorticity confinement, gravity (weighted by the near and far
   dye layers), ambient potential currents, and calm drag.
4. Velocity advection (semi-Lagrangian midpoint), damping and viscosity.
5. Divergence (with walls and swell sources), Jacobi pressure iterations, then projection.
6. Dye advection. The near layer uses limited-cubic sampling when the tier allows it. The far layer advects
   at `farLag` and is sharpened only on the high tier. Each channel decays, and calm zones add extra decay.
   A floor is subtracted each step.

Fields: four dye channels in RGBA16F (near black, near blue, far black, far blue) with mipmaps (up to 7
levels), a velocity field (RG), and a pressure field.

Ink mapping: `"blue"` maps to the blue channel, an object with `black` and `blue` maps to both, and
anything else maps to the black channel. The choice between the pale and dark black pigments comes from the
look, not from the engine.

Drops and streams are given in canvas heights for radius and velocity, and as fractions of the canvas for
position, with the origin at the top left. A drop has defaults for position (0.5, 0.2), radius (0.05),
amount (2), depth (0.5, the share sent to the far layer), fiber (0.7) and push (1.25). The stroke stretch
follows the velocity direction up to 1.2.

### 7.5 Tiers and budgets

| Tier | Sim cells | Dye pixels | Dye scale | Pressure iterations | DPR cap | Canvas pixels | Shadow steps | Far sharp |
|---|---|---|---|---|---|---|---|---|
| high | 112,000 | 1,300,000 | 1 | 26 | 2 | 2,400,000 | 5 | yes |
| medium | 62,000 | 760,000 | 0.8 | 20 | 1.75 | 1,700,000 | 4 | no |
| low | 34,000 | 420,000 | 0.62 | 16 | 1.5 | 1,000,000 | 3 | no |

Cubic sampling is on for all tiers. `TIER_ORDER` is `low`, `medium`, `high`.

Frame budgets used by the probe: high 9 ms, medium 10 ms, low unlimited.

Probe (`runProbe`): starts at `medium` when `(pointer: coarse)` matches, otherwise at `high`. Each candidate
tier is sized, seeded with two drops, and timed with the median of up to seven steps after four warm-ups
(stopping at 90 ms total). If the cost is over budget, the probe steps down until it is within budget. If
the starting tier is below `high` and the cost is under 45% of the budget, it tries one tier up. The probe
then clears the water and resets the clock. The probe runs when `quality` is `auto`, and when the cover ends
if no tier is stored.

Adaptive watch: a frame over 24 ms adds one to a slow counter, and a normal frame subtracts two (floor 0).
At 75, the engine steps one tier down. At the lowest tier it emits `slow` instead, and the controller turns
the ink off for the session.

Canvas size: the engine computes simulation size from the aspect ratio and the cell budget, and dye size
from the dye budget and the device pixel ratio capped by `maxDpr` and the tier's `dprCap`. Resizing
reallocates fields only when their sizes change. Existing fields are resampled into the new targets. When
the aspect ratio crosses 0.8 either way (portrait or landscape), the scene is presetted again so it lays out
for the new shape.

### 7.6 Scenes

Each scene is a function of a context (`aspect`, `portrait` when the aspect is below 0.8, `width`,
`height`, and `anchors` with the page rectangles). Scripts can only call drop, stream and clear.

| Scene | Ground | Still steps | Duration | Trigger | What happens |
|---|---|---|---|---|---|
| `intro` | paper | 96 | 2.8 s | none | A black drop at 0 s, a blue drop at 0.6 s, a clear at 1.75 s (1.05 s). Narrow on portrait |
| `hero` | paper | 660 | no end | none | A black drop at 0 s, blue at 3.5 s, black at 7.5 s, then repeating drips from 13 s. The lane is the `open` anchor's horizontal range |
| `title` | paper | 420 | no end | none | Black at 0 s, blue at 1.6 s, then repeating drips from 9 s. Uses the `heroWater` simulation |
| `ninety` | binder | 300 | no end | `tenth` | Trigger only. The `tenth` trigger drops blue ink under the `tenth` anchor, then a second drop at 0.5 s. Uses the dark look |
| `bloom` | paper | 720 | no end | none | Blue drops rise from the bottom edge at 0, 2.2 and 4.0 s, then repeat from 9 s |
| `wisps` | binder | 600 | no end | none | Four drops at 0 s alternating pale and blue, then one drop every 4.5 to 7.5 s from 3 s. Uses the dark look |
| `spill` | paper | 480 | no end | none | Six black drops at 0, 0.7, 1.5, 2.6, 4.2 and 6.4 s, then repeats from 10 s |

Dark-ground scenes use `LOOK_DARK`: binder ground, pale black pigment, blue-dark pigment and a higher
ambient light. Light-ground scenes use `LOOK_DEFAULTS`: paper ground and the black and blue pigments.

### 7.7 Stages

`lib/ink/stage.ts` lists the stages the controller runs. Each has a weight, a run length, a ground and an
optional trigger.

| Stage | Weight | Run (ms) | Ground | Trigger |
|---|---|---|---|---|
| `intro` | 9 | 2800 | paper | none |
| `hero` | 3 | 30000 | paper | none |
| `title` | 2 | 14000 | paper | none |
| `ninety` | 3 | 12000 | binder | `tenth` |
| `bloom` | 2 | 24000 | paper | none |
| `wisps` | 1 | 20000 | binder | none |
| `spill` | 3 | 24000 | paper | none |

Choice rules (`chooseStage`): only candidates that are visible are considered.

1. The topmost candidate wins when at least 40% of it is visible. A candidate that is at least 95%
   visible beats it when the topmost candidate is less than 95% visible.
2. Otherwise the candidate with the best score (visible area times weight) wins.
3. The current owner keeps the canvas unless the challenger's score is at least 1.25 times the owner's.

Other constants: `WAKE_MS` is 12000 (a stage woken by input runs for this long at most), `REST_SECONDS` is
2.5 (the ease-out on a stage's end).

Ninety fires at `NINETY_FIRE` (0.47) and re-arms below `NINETY_REARM` (0.2). The progress value runs from 0
when the band's top meets the bottom of the window to 1 when its bottom leaves the top. Without view
timelines, the controller fires at 0.6 instead.

### 7.8 Calm zones and edges

Calm zones keep text readable. The engine lowers density inside a calm zone, and a cap pulls pixels toward
the ground until their luminance is no lower (paper) or no higher (binder) than the cap. Dither noise is
suppressed inside capped zones.

| Kind | Padding | Feather | Floor | Hold | Fade | Cap (paper) | Cap (binder) |
|---|---|---|---|---|---|---|---|
| `text` | 24 | 120 | 0.04 | 1 | 1 | 0.8 | 0.06 |
| `display` | 26 | 110 | 0.42 | 0 | 0 | 0.3 | 0.14 |
| `veil` | 0 | 40 | 1 | 0 | 0 | 0.8 | 0.06 |

Below 1088 px wide, `text` zones use padding 8 and feather 56. Edge strips (`edgeZone`) feather 96 px,
start 200 px outside the canvas and reach 24 px inside. Floor 0, hold 0, fade 1. Calm zones from the page are
merged (the closest pair first) until at most four remain. A merged zone takes the stricter kind. At most
four edges are used. `buildZones` returns the calm zones first and the edges after.

Pages mark calm regions with `data-ink-calm` (`text`, `display` or `veil`). Anchors are marked with
`data-ink-anchor` (`open` for open water, `tenth` for the tally block). `data-edges` takes one or more of
`top`, `right`, `bottom`, `left`.

### 7.9 Stills

Stills are WebP images of each scene at a fixed point. They show whenever the root is not `data-ink="live"`,
the route is calm, or the backdrop is in the `rest` state. The manifest in `lib/ink/stills.json` names the
eleven stills:

| Name | Route | Viewport (CSS px) | DPR | Scene | Borrowed calm zones |
|---|---|---|---|---|---|
| `hero-wide` | `/` | 1440 by 900 | 1 | hero | none |
| `hero-tall` | `/` | 320 by 700 | 2 | hero | none |
| `ninety-wide` | `/` | 1440 by 900 | 1 | ninety | none |
| `ninety-tall` | `/` | 320 by 700 | 2 | ninety | none |
| `bloom-wide` | `/` | 1920 by 900 | 1 | bloom | none |
| `bloom-tall` | `/` | 390 by 844 | 2 | bloom | none |
| `wisps-wide` | `/about` | 1920 by 900 | 1 | wisps | none |
| `wisps-tall` | `/about` | 390 by 844 | 2 | wisps | none |
| `title` | `/about` | 1088 by 900 | 1 | title | display zones from `/phases/prepare` |
| `spill-wide` | `/nope` | 1440 by 900 | 1 | spill | none |
| `spill-tall` | `/nope` | 320 by 700 | 2 | spill | none |

Constants: `STILL_QUALITY` 0.86, `STILL_MAX_BYTES` 90 KiB per file, `STILLS_MAX_BYTES` 600 KiB in total.
`stillPath(name)` returns `/ink/<name>.webp`. Each `StillPair` has a `wide` still and an optional `tall`
still. The tall still is used at widths below 68em, where the wide one is used from 68em up.

The eleven files in `public/ink/` match the manifest. Together they are about 144 KB.

### 7.10 Backdrops and markup

`InkBackdrop` takes `scene`, an optional `still` pair, optional `edges` and a `className`. It renders:

```html
<div data-ink-backdrop data-scene="hero" data-edges="bottom" data-ink-state="idle" aria-hidden="true">
  <picture data-ink-still>
    <source media="(min-width: 68em)" srcset="/ink/hero-wide.webp" />
    <img src="/ink/hero-tall.webp" alt="" loading="lazy" decoding="async" fetchpriority="low" />
  </picture>
  <div data-ink-slot></div>
</div>
<div data-ink-control></div>
```

The parent element must be positioned. The backdrop is absolutely placed over its parent, does not take
pointer events, and sits under siblings. The control sits at the bottom right and receives the pause button.
The slot is transparent until the backdrop is live. `data-ink-state` is `idle` (still shown, no canvas),
`live` (canvas running) or `rest` (the canvas has stopped and the still shows).

Backdrops are placed on the home page (hero, ninety, bloom), in the footer (wisps), on title blocks
(`title`, through `TitleBlock` with `ink`), on the not-found page (spill) and on the cover (intro, without a
still). `TitleBlock` shows its backdrop only from 68em.

### 7.11 Controller lifecycle

`createController(onControl)` returns `route(path)`, `toggle()` and `destroy()`. `InkLayer` creates one
controller per page load. It marks the root with `data-ink-layer` so a second mount does nothing.

- Loading: the engine chunk loads when a backdrop nears the viewport (intersection margin 150%), when the
  cover is playing with `data-ink="live"`, or during an idle callback after startup.
- Creating: the first use creates a canvas (`data-ink-canvas`, `aria-hidden`) in the backdrop's slot and
  calls `createInk` with the pigments read from the tokens.
- Activating a backdrop: stops the loop, resizes, applies the scene's preset with the backdrop's anchors,
  sets the calm zones (re-read after font loading), and shows the pause control. A backdrop with the `intro`
  scene under the cover waits for the takeover.
- Running: `run(ms)` starts the loop and calls `rest({ duration: 2.5 })` after `ms`. The intro scene ends
  itself.
- Waking: pointer movement over a resting live stage restarts it for `min(runMs, 12000)`.
- Pointer: pointer down and up on open water (outside interactive elements, inside a live backdrop) drop
  blue ink with amount 1.6 and radius 0.035, throttled to 250 ms. On touch, the tap must move less than 8 px
  and last less than 300 ms.
- Scrolling: each scroll schedules one check on the next frame and wakes the stage when it is resting.
- Moving between backdrops: the current backdrop goes `idle` after 200 ms if it is visible, and the new one
  activates. A backdrop that is not visible activates at once.
- The controller listens for the `prefers-reduced-motion` change and calls `fail(false)`.

Events from the engine map to controller actions: `unsupported` and `slow` call `fail(true)`, `quality`
writes the tier to storage, `rest` sets `running` to false, `end` stops, `lost` and `restored` are handled as
described in section 7.12, and `ready` sets `data-ink-ready` on `<html>`.

### 7.12 Failure handling

| Condition | Result |
|---|---|
| Boot probe finds no usable GPU or software renderer | `data-ink="still"`, `off` stored for the session |
| Engine reports `unsupported` | `fail(true)`: stills for the session, `off` stored |
| Engine chunk fails to load | Stills for this page view. The stored mode is not changed |
| Lowest tier still too slow (`slow`) | `fail(true)`: stills for the session |
| First context loss (`lost`) | Canvas stops; the backdrop goes `rest` and shows the still. A `restored` event brings it back to `live` |
| Second context loss in the session | `fail(true)`: stills for the session |
| `prefers-reduced-motion` changes to reduce | `fail(false)`: stills for this page view |
| Reduced motion at load | Boot script returns early: stills, no cover, no motion |
| `prefers-contrast: more` or `forced-colors: active` | Stills; backdrops and controls are `display: none` |
| `data-ink="still"` on a calm route (`/catalog`, `/cart`, `/templates/*`, `/bundles/*`) | Canvas removed; stills show |
| Page hidden (`pagehide`) | Loop stops; `pageshow` with `persisted` restarts the choice |
| JavaScript disabled | Boot script does not run, so `data-ink` is absent. The stills rule applies to any root that is not live, so stills show. No cover, no pause control |
| Storage throws | Ink probe and stored reads fall back to in-memory defaults. The cover does not play |

### 7.13 Pause

`InkLayer` renders a button inside the backdrop's control slot through a portal. It has `data-ink-toggle`,
an `aria-label` of "Pause ink" while running and "Play ink" while paused, and a 14 by 14 pause or play SVG.
The button is 44 px square (`calc(var(--s-5) + 2px)`).

`toggle()`: when the mode is `paused` at load, the stored value is cleared, `data-ink` becomes `live`, and
the controller chooses a backdrop. Otherwise it pauses: `paused` is set, the loop stops, `data-ink-paused`
is set on `<html>`, and `paused` is stored. Resuming stores the tier, then runs the stage or re-arms ninety.
While paused, the still of the chosen backdrop is shown.

## 8. Motion and page transitions

Motion is in `app/motion.css`, which is imported first by `app/globals.css`. Every keyframe and every
animated property sits inside `@media (prefers-reduced-motion: no-preference)`. Behaviour hangs on hooks
(attributes), not on class names.

### 8.1 Hooks

| Hook | Set by | Effect |
|---|---|---|
| `data-move="drift" \| "ink-in" \| "settle" \| "grow"` | `Appear` (`move` prop), `Sentences` (`ink-in`), `TemplateCard` (`settle`) | Entrance animation |
| `data-when="load"` | `Appear` (`when` prop) | Entrance runs on page load, not on scroll |
| `data-seen` | `watchSeen` | Set once the element has arrived in view |
| `data-watch` | `Tally` (`animate`) | Element to observe. `data-watch="half"` waits for half the element to be visible |
| `data-ninety` | `SolutionSection` | Ninety band: wheel and blocks fill on scroll |
| `--order` | `Appear`, `Sentences`, drawer items | Stagger index |
| `data-paper`, `data-lit` | `PaperSheet` (`lit` prop) | Paper shadow and pointer tilt |
| `data-bar` | `Header` | Shadow under the bar |
| `data-ledger` | `BandedList` | Rule that grows on scroll |
| `data-block` | `Tally` | Blocks: ink, mark or empty |
| `data-odometer-wheel` | `Odometer` | Rolling digits |
| `data-ink-backdrop`, `data-ink-slot` | `InkBackdrop` | Ink region, hidden under contrast or forced colours |
| `data-lit-scope` | Read by `lib/scroll/pointer.ts` and `app/motion.css` | Scopes the pointer light to an ancestor |

### 8.2 Entrances

Two paths. Which one applies is decided by the root attributes.

Timeline path (`html[data-motion="on"][data-timeline="on"]`): elements are animated by scroll position
through `animation-timeline: view()`.

| Move | Animation | Range |
|---|---|---|
| `drift` | `move-drift` (opacity 0 to 1, moves 12px up) | `entry calc(var(--order) * 4%) cover min(22%, 14rem)` |
| `ink-in` | `move-ink-in-plain` (opacity); `move-ink-in` adds an 8px blur from 68em | `entry calc(10% + order * 4%) cover min(30%, 18rem)` |
| `settle` | `move-settle` (opacity, moves 28px up, scale 1.03). Its paper shadow uses `move-shadow` on the same timeline | `entry calc(order * 4%) cover min(30%, 18rem)` |
| `grow` | `move-grow` (scale 0 to 1) | `entry calc(10% + order * 4%) cover min(28%, 16rem)` |

Ledger rules grow on the `--ledger` timeline. The bar's shadow fades in over the first 84 px of scrolling
(`bar-shadow-in` on `scroll(root block)`). The ninety band uses the `--ninety` timeline: the wheel rolls
from 20% to 44% of the view, each block fills across a 3% window that starts 2.6% after the previous block,
and the mark block fills from 44% to 47%.

Observer path (`html[data-motion="on"][data-io="armed"]`, without the timeline): elements start in their
hidden state until they carry `data-seen`, then transition. Drift takes 480 ms on
`--curve-settle`. Settle takes `--time-settle` (560 ms), with `--curve-settle` for opacity and `--curve-drop` for movement and scale; ink-in
takes `--time-ink` (640 ms) on `--curve-ink`; grow takes 600 ms. The stagger for every move is
`order * --stagger` (70 ms). The ninety band fills its wheel over `--time-count` (1200 ms), and its blocks fill over
`--time-fill` (180 ms) with delays spread across the count.

`MotionRoot` (`components/ui/motion-root.tsx`, client) runs before paint on each pathname change. It exits
unless `data-motion` is `on`. It starts `watchSeen` on `[data-watch]` (plus `[data-move]` and `[data-ninety]` when
timelines are off), then sets `data-io="armed"`. The observer uses a root margin of `0px 0px -12% 0px`
and marks elements `data-seen` once they arrive. Arrival means the element's top is above 88% of the
viewport, or, for `data-ninety` and `data-watch="half"`, at least half of it is visible. A
`MutationObserver` watches for elements added to the body. A second effect attaches the pointer light.

Load entrances (`[data-move][data-when="load"]`) play on the clock rather than on scroll. The hero, the
title block lead and the worked example use them.

### 8.3 Paper, pointer light and tilt

`PaperSheet` renders `[data-paper]` with a grain image (`--grain`) and a radial sheen (`--sheet-light`) on
its `::before`, and a lifted shadow on its `::after`. The `::after` fades in over 420 ms.

With `lit`, the sheet gets `data-lit`. `lib/scroll/pointer.ts` (`trackLight`) runs only where
`(hover: hover)` matches. It ignores touch pointers and writes `--lx` and `--ly` (position, in percent) and
`--tx` and `--ty` (tilt, up to 1.2 degrees) on the sheet under the pointer, with one `requestAnimationFrame`
per frame. On hover the sheet moves up 6 px (`translate: 0 -6px`) and tilts from `--tx` and `--ty`. On keyboard focus within the sheet it moves up 6 px without the tilt. The lift takes `--time-lift` (260 ms).

### 8.4 Counters, odometer and tally

- `CountUp` renders the final number on the server. When motion is on, and the element has not already
  arrived, it counts from 0 to the value over `--time-count` (1200 ms) with a cubic ease-out once 40% of the
  element is visible. The span's width is set from the digit count with `--digits` so the layout does not shift.
- `Odometer` renders the figure as two digit wheels. The wheel moves to the tens digit with
  `translate: 0 calc(var(--tens) * -1em)`. It is decorative and `aria-hidden`.
- `Tally` renders blocks. With `animate`, blocks start empty and fill from the left with `tally-fill`, delayed
  by `--time-enter` plus `--i` times `--time-fill-gap`. The blocks are held empty only while `data-io` is
  `armed`.

### 8.5 Page transitions

`PageShift` wraps route content in React's `ViewTransition` with `enter="page-in"` and `exit="page-out"`.
It is used by the home hero, the title block and the not-found page. Shared elements use
`ViewTransition` with `share="sheet-morph"`:

- `TemplateCover` on `/catalog` rows, phase pages, template pages and related sheets, named `cover-<slug>`;
- `Folder` on bundle rows, the home bundles section and bundle pages, named `folder-<slug>`.

In `motion.css`, under no-preference: the outgoing page (`.page-out`) fades over 140 ms, the incoming page
(`.page-in`) runs `move-ink-in-plain` over 260 ms with an 80 ms delay (adding blur from 40em), and the
`.sheet-morph` group takes 420 ms on `--curve-settle`. Outside that query, `::view-transition` ignores
pointer events and the root snapshot is hidden on exit.

### 8.6 Reduced motion and other media

Reduced motion is handled at three levels:

1. The boot script returns early, so `data-motion`, `data-timeline` and `data-intro` are never set. Motion
   hooks in CSS do nothing, `MotionRoot` exits, and `CountUp` does not count.
2. Every animation and transition rule sits inside `(prefers-reduced-motion: no-preference)`. View
   transition groups under `reduce` have `animation: none !important`, and outgoing views are `display: none`.
3. `app/globals.css` has a global safety net under reduce: animation and transition durations are set to
   `0.01ms` with one iteration.

The boot script reads the media query only at load. The CSS rules follow live changes. The ink controller
listens for changes and switches the ink to stills when reduce is selected.

`(prefers-contrast: more)`: backdrops are hidden, the bar gets a 1px ink bottom border, and its shadow is
hidden. Sheets get a 1px solid border and no shadow. `(forced-colors: active)`: backdrops are hidden;
tally blocks and focus use system colours.

Timing and curve tokens (`app/globals.css`):

| Token | Value | Used for |
|---|---|---|
| `--time-swap` | 120ms | Drawer item stagger base |
| `--time-enter` | 240ms | Tally start delay |
| `--time-exit` | 160ms | Scrim fade |
| `--time-fill` | 180ms | Block fill |
| `--time-fill-gap` | 80ms | Gap between blocks |
| `--time-blink` | 1100ms | Caret blink cycle |
| `--time-lift` | 260ms | Sheet lift and hover |
| `--time-ink` | 640ms | Ink-in entrances |
| `--time-settle` | 560ms | Settle entrances |
| `--time-count` | 1200ms | Counters and ninety wheel |
| `--time-page-out`, `--time-page-in` | 140ms, 260ms | Page transitions |
| `--time-morph` | 420ms | Shared element morph |
| `--stagger` | 70ms | Entrance stagger |
| `--curve-settle` | `cubic-bezier(0.22,0.61,0.36,1)` | General easing |
| `--curve-leave` | `cubic-bezier(0.55,0.06,0.68,0.19)` | Cover leave |
| `--curve-ink` | `cubic-bezier(0.16,0.84,0.3,1)` | Ink entrances |
| `--curve-drop` | `cubic-bezier(0.3,1.25,0.5,1)` | Settling drop |
| `--curve-pen` | `cubic-bezier(0.65,0,0.2,1)` | Pen strokes |

Other keyframes sit in component CSS modules: `caret-blink`, `drawer-in`, `fade-in`, `link-in`, `pen-stroke`,
`pop` (the cart badge), `scrim-in`, `sheet-up`, `sign-out`, `tally-fill`, `cover-ink`, `cover-leave` and
`cover-skip`.

## 9. Cart

The cart is a list of lines in the browser. A line is one template or one bundle, stored once.

### 9.1 Store

`lib/cart/store.ts` defines the types and pure functions.

- `CART_STORAGE_KEY` is `advanta365.cart.v1`.
- `CartLine` is `{ kind: "template" | "bundle", slug: string }`.
- `parseCart(raw)` returns `[]` for empty, invalid JSON or non-array input. It keeps only valid lines and
  removes duplicates.
- `addLine`, `removeLine`, `hasLine` operate on the kind and slug. `addLine` returns the same array when the
  line is already present.
- `pruneLines(lines, { templates, bundles })` drops lines whose slug is not in the matching set.
- `BundleContents` maps a bundle slug to the template slugs it holds. `bundleHolding(lines, templateSlug,
  contents)` returns the first bundle line (in cart order) that holds the template; the template need not be
  in the cart. `coveredLines(lines, contents)` maps each template line a bundle in the cart holds to that
  bundle. `cartSubtotalCents(lines, priceOf, contents)` sums the line prices, leaving out covered template
  lines and counting an unknown price as 0.

`components/cart/use-cart.ts` holds the external store. The lines are cached in memory after the first
read. Writes update memory first, then `localStorage` inside a try block, so a blocked storage still leaves
the cart working for the page. Listeners are notified after each write. A `storage` event from another tab
reloads the cache.

`useCart()` returns `{ lines, count, ready, has, add, remove }`. `ready` is `false` on the server and during
hydration (the server snapshot), then `true`. The server snapshot of `lines` is empty. `replaceCartLines(next)`
writes a whole list.

### 9.2 Components

| Component | Behaviour |
|---|---|
| `CartSync` | Mounted in the site layout with every template and bundle slug. Replaces the saved lines with the pruned list only when the length changes. Renders nothing |
| `CartButton` | A link to `/cart` with the text "Cart" and a count badge. Shows `0` until ready. The accessible name is "Cart" until ready, then "Cart, N item(s)". The badge remounts on each change so its pop animation restarts |
| `AddToCart` | Before the line is in the cart: a full-width mark button with the label (for example "Add to cart" or "Add bundle to cart"). After adding: a link labelled "In cart — view cart", with focus moved to it, and a polite status message "Added to cart." A template page passes `bundles` (the bundles holding the template); while one of them is in the cart the control is a note "Included in <bundle>, which is in your cart." and an outline "View cart" link instead |
| `CartContents` | Until ready: "Loading your cart…". Lines are pruned against the catalog items it receives. Empty: a sheet with the message and buttons to the catalog and to bundles. Non-empty: a ruled list, each row with a glyph, a kind label ("Template" or "Bundle"), a link to the item, its price and a Remove button. A template a bundle in the cart holds also shows "Included in <bundle>" (a link to the bundle) and its price struck through, read as "<price>, not charged"; it keeps its Remove button |
| Summary | A sheet labelled "Order summary" with the subtotal, a disabled "Checkout — coming soon" button and the note "Purchasing is not available in this beta. Your cart is saved in this browser." |

Subtotal is the sum of line prices, leaving out templates that a bundle in the same cart holds
(`cartSubtotalCents`). When any are left out, the summary says "Leaves out N template(s) already in a bundle."
under the amount. Two bundles that overlap are both charged.

Focus after removing a line moves to the Remove button at the same index, or to the empty-state heading
when the last line goes.

`app/(site)/cart/page.tsx` is static. It builds one item for each of the 72 catalog entries (67 templates and
5 bundles) with `title`, `priceCents` and `href` (and `templateSlugs` for a bundle), and passes them to
`CartContents`. The client needs these
values to show saved lines and to prune stale ones.

## 10. Catalog URL state

The catalog's filters, search, sort and page live in the URL. A search URL is the full state of the page.

### 10.1 Parameters

| Parameter | Format | Rules |
|---|---|---|
| `q` | text | First value, trimmed, capped at 200 characters |
| `phase` | slugs | Validated against `getPhases()` |
| `type` | deliverable types | Validated against the taxonomy |
| `app` | apps | Validated against the taxonomy |
| `audience` | audiences | Validated against the taxonomy |
| `format` | formats | Validated against the taxonomy |
| `sort` | `featured` (default), `title`, `price-asc`, `price-desc` | Anything else becomes `featured` |
| `page` | integer | Must match `^[1-9]\d{0,5}$`; otherwise `1` |

Facet values accept repeated keys and comma-separated lists. They are deduplicated, and unknown values are
dropped silently. `parseCatalogParams` (`lib/catalog/search-params.ts`) returns the criteria.
`serializeCatalogParams` writes `q`, then each facet comma-joined, then `sort` only when it is not the
default, then `page` only when it is above 1. Keys appear in that fixed order, and empty values are omitted.

### 10.2 Query

`queryTemplates` (`lib/catalog/query.ts`) returns the matching templates for a page.

- Facets are OR within a facet and AND across facets.
- Search splits the query on whitespace. Every term must appear in the title, summary or description.
  Matching is case-insensitive, straight and curly quotes and apostrophes are treated as equal, and regex
  characters are literal. Phase names, apps and audiences are not searched.
- Facet counts are computed with each facet's own selection cleared, so a count shows what ticking that box
  would return. Search and the other facets still apply.
- Sort: `featured` puts featured templates first, then sorts by title with `localeCompare`. `title` sorts by
  title. `price-asc` and `price-desc` sort by price and break ties by title.
- Pagination: `PAGE_SIZE` is 24. The page is clamped to between 1 and the page count (at least 1). The catalog
  page passes the clamped page back into its criteria, so links never point past the last page.

### 10.3 Controls

- `SearchBox` is a plain `GET` form to `/catalog`. Hidden inputs keep the facets and the sort, and drop the
  page.
- `SortSelect` and `FilterPanel` are client components. A change calls `router.replace` with the new query and
  resets the page to 1. `FilterPanel` updates its checkboxes optimistically (`useOptimistic` in a transition).
- `FilterPanel` disables a checkbox whose count is 0 unless it is already checked. Below 68em the panel is a
  native dialog opened from a "Filters" button, with a "Show results" button that closes it.
- "Clear all filters" links to `/catalog?q=<q>` when a search term exists, or to `/catalog` otherwise. It keeps
  only the search term, so the sort also resets (`clearFiltersHref`).
- `ActiveFilters` (client) lists every selected facet value above the result count as a chip, a list labelled
  "Active filters". Each chip is a link to the catalog without that value, on page 1 (`activeFilters` in
  `lib/catalog/search-params.ts`), named "Remove <facet> filter: <value>". "Clear all" ends the row and goes
  where "Clear all filters" goes. With script, a plain click calls `router.replace` without scrolling; focus
  then moves to the chip now at the removed one's position (or the one before), or to the result count
  (`#results-heading`, `tabIndex=-1`) once no chip is left. Nothing renders without filters.
- Empty result: with only a search term, the heading is `No templates match “<q>”.`, the link is "Clear search"
  (the same criteria without `q`), and a navigation labelled "Browse by phase" shows the phases as large
  `PhaseTabs`. With filters it stays "No templates match these filters." with "Clear filters" (or "Clear
  search and filters" when a term is also set), linking to `/catalog`.
- The phase rail marks a phase (`aria-current="true"`) on `/catalog` while the `phase` parameter names exactly
  one known phase (`singleCatalogPhase` and `currentPhase` in `components/layout/nav-links.ts`). It reads the
  search inside a Suspense boundary whose fallback is the rail drawn from the pathname alone.
- `Pagination` renders links to `/catalog` with the same criteria and the new page. It renders nothing when
  there is one page.

## 11. Test hooks and test contract

### 11.1 Commands

| Command | Runs |
|---|---|
| `corepack pnpm test` | Vitest over `tests/unit/**/*.test.ts` |
| `corepack pnpm test:e2e` | Playwright over `tests/e2e`, after `npm run build && npm run start -- -p 3100` (or reuses a server on port 3100 outside CI) |
| `corepack pnpm typecheck` | `next typegen` and `tsc --noEmit` |
| `corepack pnpm lint` | `eslint .` |
| `corepack pnpm dev`, `build`, `start` | Development server, production build, production server |

Run the scripts in `scripts/` by path, for example `node scripts/check-budgets.mjs <baseUrl>`: `scripts/ink-stills.mjs`,
`scripts/check-budgets.mjs` and `scripts/paper-grain.mjs`.

### 11.2 Ink test hook

The hook is installed only when `window.__INK_TEST__` is set before the layer mounts. The controller then
dynamically imports `lib/ink/test-hook.ts` and calls `installInkTest(handle)`, which sets `window.__inkTest`:

| Member | Purpose |
|---|---|
| `still(scene)` | Holds the scene, renders, and returns a WebP data URL at `STILL_QUALITY` |
| `hold(scene)` | Activates the scene with the backdrop pinned and waits for ready (up to 5 s) |
| `preset(name)`, `step(n)`, `render()`, `setQuality(tier)` | Engine control for deterministic tests |
| `loseContext()`, `restoreContext()` | Forces context loss and restore |
| `zoneExtremes()` | Reads back pixels under each calm rectangle and reports the cap and the extreme luminance |
| `cost(frames)` | `measureCost(frames)` in milliseconds per step and draw |
| `stats()`, `engine()` | Engine statistics and the engine object |

The controller also exposes a layer handle with `ink()`, `canvas()`, `scene()`, `hold(scene)` and `calm()`
(the current calm rectangles with their cap).

### 11.3 Attributes used by tests

| Attribute | Where | Meaning |
|---|---|---|
| `data-ink` | `<html>` | `live`, `paused` or `still` |
| `data-ink-ready` | `<html>` | The engine reported ready |
| `data-ink-paused` | `<html>` | Pause is on |
| `data-ink-route` | `<html>` | `calm` on calm routes |
| `data-ink-layer` | `<html>` | The layer has mounted |
| `data-intro` | `<html>` | `play`, `ink`, `leave`; absent when done |
| `data-motion`, `data-timeline`, `data-io` | `<html>` | Motion switches (section 8.2) |
| `data-ink-state` | Backdrop | `idle`, `live` or `rest` |
| `data-ink-running`, `data-ink-tier` | Canvas | Loop state and tier |
| `data-ink-toggle` | Pause button | The pause control |
| `data-ink-calm`, `data-ink-anchor` | Page elements | Calm regions and anchors |
| `data-scene`, `data-edges` | Backdrop | Scene and edges |
| `data-intro-cover` | Cover | The cover element |
| `data-seen`, `data-tally`, `data-block`, `data-odometer`, `data-odometer-wheel` | Motion elements | Entrance and counter state |
| `data-band` | Band | Ground: desk, paper, wash, ink or binder |
| `data-paper`, `data-lit` | Sheets | Paper and pointer light |
| `data-bar`, `data-phase-rail`, `data-nav-drawer` | Shell | Bar, rail and drawer |
| `data-ledger`, `data-folder` | Lists, folders | Rule and folder |
| `data-cover`, `data-format` | Template covers | Format ratio |
| `data-specimen`, `data-mark` | Home page | Specimen and highlighted phrase |

### 11.4 Standing rules

The design gate (`tests/unit/design-gate.test.ts`) scans every file under `app/`, `components/`, `lib/` and
`tests/`, comments included.

- Raw colour values (hex colours of 3, 4, 6 or 8 digits, and `rgb`, `hsl`, `hwb`, `lab`, `lch`, `oklab`,
  `oklch`, `color` and `color-mix` functions) appear only in `app/globals.css` and `app/icon.svg`.
- No stylesheet contains `prefers-color-scheme`, or the word "infinite".
- `@media` queries are limited to the seven forms in section 5.1.
- `@container` appears only in `header.module.css` and `nav-drawer.module.css`.
- Only `components/ui/transition-link.tsx` imports `next/link`.
- `package.json` dependencies are exactly `next`, `react`, `react-dom` and `zod`.
- Canvas and WebGL calls are allowed only in `lib/ink/`, `components/ink/` and `lib/boot/`.
- `requestAnimationFrame` calls are allowed only in `lib/ink/`, `components/ink/`, `lib/scroll/`,
  `lib/boot/`, `components/intro/` and `components/ui/count-up.tsx`. The scroll string literal is allowed
  only in `lib/ink/`, `components/ink/` and `lib/scroll/`.

### 11.5 Unit tests (Vitest)

Each file below is in `tests/unit/`:

| File | Covers |
|---|---|
| `cart-store.test.ts` | Parsing, adding, removing and pruning cart lines; bundle overlap and the subtotal |
| `nav-links.test.ts` | The phase a page belongs to, including the catalog filtered on one phase |
| `content.test.ts` | The real catalog: phases, counts, prices, sample flags, copy rules, search, bundles, related templates |
| `query.test.ts` | Filters, search, sort, facet counts, pagination |
| `search-params.test.ts` | URL parsing and serialisation; active-filter chips and their links |
| `validate.test.ts` | Validation errors and sorting |
| `coverage.test.ts`, `pricing.test.ts`, `format.test.ts` | Helpers |
| `compounds.test.ts` | Compound splitting for `KeepCompounds` |
| `brand-mark.test.ts` | Logo geometry and `app/icon.svg` |
| `boot-script.test.ts` | Runs `BOOT_SCRIPT` against stand-ins for the document, storage, media queries and WebGL |
| `boot-cover.test.ts` | Cover markup and timings; `InkBackdrop` markup; stills manifest |
| `kit-motion.test.ts` | `motion.css` rules: keyframes and animations inside `no-preference`, timeline ordering, hidden states only under `data-motion="on"` |
| `kit-grain.test.ts` | Paper grain image format and size |
| `stills-files.test.ts` | Stills on disk match the manifest and size limits |
| `ink-scenes.test.ts`, `ink-stage.test.ts`, `ink-zones.test.ts` | Scene scripts, stage choice and calm zones |
| `design-gate.test.ts` | Section 11.4 |
| `smoke.test.ts` | Test runner check |

### 11.6 End-to-end tests (Playwright)

Projects in `playwright.config.ts`:

- `chromium`: Desktop Chrome at 1280 by 800. Runs every spec except `ink-live`.
- `mobile`: Pixel 7. Runs every spec except `ink-live`.
- `gpu`: runs `ink-live.spec.ts` at 1440 by 900 with `--ignore-gpu-blocklist` and `--enable-gpu`, plus
  `--use-angle=d3d11` on Windows. Runs after the other two projects.
- `firefox`: runs a subset of specs when Firefox starts on the machine (`PW_FIREFOX=1` or a successful
  `--version` check).

Specs:

| Spec | Projects | Covers |
|---|---|---|
| `browse.spec.ts` | chromium, mobile, firefox | Navigating from the home page to a phase and a template; the sample page; no horizontal overflow on 11 routes |
| `cart.spec.ts`, `cart-keyboard.spec.ts` | chromium, mobile | Adding, removing, subtotal and bundle overlap, reload, corrupt storage, pruning, blocked storage, focus after changes |
| `catalog.spec.ts` | chromium, mobile | Counts, pages, filters, chips, URL restore, search, empty states, malformed parameters, the phone filter dialog |
| `console.spec.ts` | chromium, mobile, firefox | No console errors or page errors on 11 routes |
| `header.spec.ts` | chromium | Desktop navigation, `aria-current`, the rail, the sticky bar |
| `menu.spec.ts` | mobile | The drawer: links, Escape, Close, scrim click, navigation and Back closing it |
| `identity.spec.ts` | chromium, mobile | Landmarks, tokens, band ground, section order, focus rings, minimum target sizes at 320px |
| `intro.spec.ts` | chromium, mobile | Cover states, skip, timing, reload, reduced motion |
| `ink-fallback.spec.ts` | chromium, mobile, firefox | No WebGL, software renderer, high contrast, no JavaScript |
| `ink-live.spec.ts` | gpu | Live ink: first frame, frame cost, calm caps, pause, resize, context loss, the cover takeover |
| `motion.spec.ts` | chromium, mobile, firefox | Entrances with and without timelines, the ninety band, view transitions |
| `reduced-motion.spec.ts` | chromium, mobile, firefox | Reduced motion on 12 routes: still ink, no cover, no motion |
| `not-found.spec.ts` | chromium, mobile | 404 status and content for missing paths; lowercase redirect |

`tests/e2e/support/ink.ts` gives the ink specs helpers for reading pixels, states, timings and console
problems.

## 12. Budgets

| Budget | Limit | Enforced by |
|---|---|---|
| Gzip size of the first-load scripts of `/` (scripts and inline code, summed) | Baseline plus 12 KiB | `scripts/check-budgets.mjs` against `tests/budgets/baseline.json` |
| Shader chunks (JavaScript containing `#version 300 es`) | 40 KiB gzip in total; none may be an initial script of `/`, `/about` or `/catalog` | `scripts/check-budgets.mjs` |
| Boot script | 1536 bytes gzip; must not contain `</script` or `<!--` | `boot-script.test.ts` |
| Ink stills | 90 KiB each, 600 KiB in total | `scripts/ink-stills.mjs` and `stills-files.test.ts` |
| Paper grain image | 4 KiB | `kit-grain.test.ts` |
| Probe frame budget | 9 ms (high), 10 ms (medium) | Engine probe |
| Ink frame cost at high tier | 6 ms or less (test) | `ink-live.spec.ts` |
| Calm caps | Within 0.02 of the cap | `ink-stills.mjs --check` and `ink-live.spec.ts` |
| Ink blue | Darkest saturated blue at luminance 0.25 or more, hue 205 to 216 | `ink-stills.mjs --blue` |
| Scene drops | Within the canvas (`-0.05` to `1.05`), positive radius and amount | `ink-scenes.test.ts` |

`scripts/check-budgets.mjs <baseUrl> [--record] [--pages=...]` needs a running production server, and a
build in `.next/static` for the shader check. `--record` writes `tests/budgets/baseline.json`, which holds the
gzip total, the script list, the shader chunks and the shader total for `/`.

`scripts/ink-stills.mjs` has four modes, and only one can run at a time:

- capture (default): renders the eleven stills into `public/ink/`, lowering the WebP quality from 0.86 in steps
  of 0.04 to 0.70 until each file is at most 90 KiB;
- `--check`: reads the calm-zone luminance under each still at seven widths on twelve routes and fails if a
  zone breaks its cap by more than 0.02;
- `--blue`: checks the ink colour in three frames;
- `--sheets`: writes contact sheets of scenes at desktop and phone sizes into `.qa-shots/final`.

Exit codes: 0 when the check passes, 1 when a check or budget fails, 2 for usage or an environment that cannot
run the engine (no GPU, or no build).

`scripts/paper-grain.mjs` writes `public/paper/grain.png`: a 128 px indexed PNG with four palette entries
from the ink colour at alphas 0, 0.03, 0.06 and 0.09. It fails above 4 KiB.

## 13. Failure modes

| Failure | Behaviour |
|---|---|
| Invalid catalog record | `CatalogError` on first import of `repository.ts`. Every route that imports it fails to render, and the message names the kind, slug and field |
| Unknown phase, template or bundle slug | `notFound()`. The site 404 page renders with the shell; the root 404 renders without it |
| Malformed catalog query | Unknown values are dropped; a bad `page` becomes `1`; an out-of-range page is clamped. The response is 200 |
| Malformed or blocked cart storage | Invalid JSON gives an empty cart. Writes that fail are caught, and the cart still works for the page |
| Saved lines for missing items | Pruned by `CartSync`, and against the item list on `/cart` |
| Cover cannot start | No cover; the page loads as normal |
| Cover interrupted | Skip, or the 4500 ms backstop unsets `data-intro`. The ink takeover is skipped unless its checks pass |
| Ink unsupported or failing | Stills show for the page view or the session, as in section 7.12 |
| Ink engine chunk fails | Stills for this page view |
| Reduced motion | No cover, no motion, stills |
| High contrast or forced colours | No canvas and no backdrops; sheets get explicit borders |
| JavaScript disabled | Stills, no cover, no pause control, content readable |
| Narrow phone with a filter open | The filter dialog is a full bottom sheet with its own scrolling body |
| Drawer open across navigation | Closes on the pathname change unless it was opened on that pathname |
| Resize across the portrait and landscape boundary | The ink scene is presetted again for the new shape |
| Browser page hidden | The ink loop stops; it resumes on `pageshow` if the page was persisted |
