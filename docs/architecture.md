# Architecture

Advanta365 is a Next.js 16 App Router site, in its "Wet Ink" edition. Pages are server components
that read a validated catalog and compose primitives. The look is HTML, CSS and inline SVG, with one
exception: a real-time ink simulation drawn on a single WebGL2 canvas behind a few headlines (and
under the cover of a first visit), loaded only where it is shown and never on a page where someone
buys. The client JavaScript there is serves the cart, the catalog filters, the phone menu, the
navigations that mark the current page, the motion observer and the ink layer. This document describes
how the parts connect. For the visual rules see `design-system.md`.

## Server and client boundaries

- Layouts and pages are server components. They load data and pass plain values down.
- A file with `"use client"` is a client island. It is still rendered to HTML on the server, then
  hydrated, and its hooks run in the browser only. The islands are:
  - the cart: `components/cart/use-cart.ts` (the store), `cart-sync.tsx`, `cart-button.tsx`,
    `add-to-cart.tsx` and `cart-contents.tsx`;
  - the catalog: `components/catalog/filter-panel.tsx` and `sort-select.tsx`;
  - the shell: `components/layout/primary-nav.tsx`, `phase-rail.tsx` and `nav-drawer.tsx`;
  - `components/company/faq-list.tsx`, `components/not-found/asked-path.tsx` and
    `components/not-found/late-boot.tsx`;
  - the motion: `components/ui/motion-root.tsx`, `count-up.tsx`, `page-shift.tsx`;
  - the ink: `components/ink/ink-layer.tsx` (the controller is plain TypeScript,
    `ink-controller.ts`).
- The cover of a first visit is not an island. `IntroCover` (`components/intro/intro-cover.tsx`) is
  a static server component, and what switches it on is an inline script that the root layout
  renders first thing in `<body>` (`IntroScript`, from the string `BOOT_SCRIPT` in
  `lib/boot/boot-script.ts`). The script runs once per page load, before anything is painted
  and long before hydration; the ink layer and the CSS read its attributes. See "The boot script and
  the cover".
- A file without the directive uses no state or effects and can be rendered from either side: `Band`,
  `Wrap`, `Split`, `Sheet`, `BandedList`, `RowLink`, `Button`, `TextLink`, `Tally`, `Blank`, `Tag`,
  `Icon`, `LogoMark`, `BrandLockup` and the other static primitives. `TransitionLink` is a plain
  `next/link` wrapper with no state, so server components render it. `Header` and `Footer` are server
  components too; the client parts inside them are `PrimaryNav` and `NavDrawer`.
- Catalog data lives in `content/**`. Only `lib/catalog/repository.ts` reads it. It validates every
  record with zod when the module loads (`validateCatalog`) and throws `CatalogError`, which names the
  record, field or duplicate slug. Its functions are async, so a database can replace the file source
  without touching callers.
- The cart is pure logic in `lib/cart/store.ts` (`parseCart`, `addLine`, `removeLine`, `pruneLines`).
  `components/cart/use-cart.ts` exposes it as an external store, mirrored to `localStorage` under
  `advanta365.cart.v1`. Storage access is wrapped in try/catch: without storage the cart still works for
  the page. Changes made in another tab arrive through the `storage` event.
- `CartSync`, rendered by the site layout, removes lines whose template or bundle has left the catalog.
  It runs on every page, so the header count is right everywhere.

## Routes

| Route               | File                                   | Notes                                           |
| ------------------- | -------------------------------------- | ----------------------------------------------- |
| `/`                 | `app/(site)/page.tsx`                  | Home: the hero, shelves, the ninety, the closing |
| `/catalog`          | `app/(site)/catalog/page.tsx`          | Search, sort and filters in the URL             |
| `/phases/[phase]`   | `app/(site)/phases/[phase]/page.tsx`   | Static per phase. Calls `notFound()`            |
| `/templates/[slug]` | `app/(site)/templates/[slug]/page.tsx` | Static per template. Calls `notFound()`         |
| `/bundles`          | `app/(site)/bundles/page.tsx`          |                                                 |
| `/bundles/[slug]`   | `app/(site)/bundles/[slug]/page.tsx`   | Static per bundle. Calls `notFound()`           |
| `/cart`             | `app/(site)/cart/page.tsx`             | Checkout is a disabled "coming soon" control    |
| `/pricing`          | `app/(site)/pricing/page.tsx`          |                                                 |
| `/about`            | `app/(site)/about/page.tsx`            | `#compare` is linked from the home page         |
| `/sample`           | `app/(site)/sample/page.tsx`           | Describes the worked example; offers no file    |
| `/contact`          | `app/(site)/contact/page.tsx`          |                                                 |
| any other path      | `app/(site)/[...rest]/page.tsx`        | Calls `notFound()`, so the site shell stays     |

The home page is one array of sections in `app/(site)/page.tsx`; reordering the page is reordering
that array. Before the sections it renders `IntroCover`, which no other page does (see "The boot
script and the cover"). Top to bottom, with the band each one sits on (`components/home/`):

| Section                                          | File                   | Band  | Ink                    |
| ------------------------------------------------ | ---------------------- | ----- | ---------------------- |
| Hero: headline, lead, two buttons, open water    | `hero.tsx`             | paper | `hero`                 |
| `#featured`: six featured templates as a spread  | `featured-section.tsx` | desk  |                        |
| `#inside`: the specimen, the manifest, the phases | `inside-section.tsx`   | paper |                        |
| `#bundles`: a feature folder and a ledger         | `bundles-section.tsx`  | desk  |                        |
| `#problem`                                        | `pitch-spread.tsx`     | paper |                        |
| `#solution`: the ninety                           | `pitch-spread.tsx`     | ink   | `ninety`               |
| `#practice`: why it is different                 | `practice-section.tsx` | wash  |                        |
| `#values`: four value drawings                    | `values-section.tsx`   | paper |                        |
| Built for Microsoft 365 (no id)                  | `built-for-row.tsx`    | paper |                        |
| `#closing`: the last ten                          | `closing-section.tsx`  | paper | `bloom`                |

The specimen (`hero-sheet.tsx`, exported as `Specimen`) is built in `page.tsx` by `buildSpecimen()` from the
first featured template (the first template if none is featured), its phase and step, and the same
labelled facts the template page lists. It stands in the margin of `#inside` from 68em, and it is the
one place where catalog text is repeated, so it is `aria-hidden`. A template whose phase is missing
yields no specimen. The bundle cards take their phase coverage from `phaseCoverage()` in
`lib/catalog/coverage.ts`. The ninety is `data-ninety` on the band with an `Odometer`, a `Tally` and
two anchors for the ink (`open` and the tenth block).

404 rules:

- No `<Suspense>` boundary and no `loading.tsx` may sit above `children` in `app/(site)`. A boundary
  there sends a 200 shell before the not-found error, so `/nope` would answer 200. Keep this in mind
  when adding a layout.
- `app/(site)/not-found.tsx` renders inside the site layout. `app/not-found.tsx` covers the rare case of
  a path outside the group. Both render `MissingPage` (`components/not-found/missing-page.tsx`); the
  address that was asked for is printed by the client component `AskedPath`.
- A 404 that is decided at request time is answered as an empty document, and React builds the whole
  page, root layout included, in the browser. Nothing in a layout may count on being parsed from the
  server's HTML there. A `<script>` element is the case in point: one that React makes in the browser
  never runs, and React logs an error about it. The boot script is therefore printed as HTML
  inside a hidden wrapper (see "The boot script and the cover"), which is inert and silent on such a
  page, and `LateBoot` (a client component inside `MissingPage`) runs the same string as a script
  element it appends to the head when `data-ink` is still missing, so the spill is live on a 404.

`proxy.ts` answers mixed-case paths with a 308 redirect to lower case. Everything else passes through.

## Site shell

`app/(site)/layout.tsx` renders, in order:

1. The skip link ("Skip to content"), a `Button href="#main"`, which is the first focusable element. It
   is parked above the top edge and drops into the corner on keyboard focus.
2. `CartSync` and, while the catalog holds sample content (`hasSampleContent()`), `BetaStrip`: one line
   on the wash, in the flow, which scrolls away.
3. `.frame`, a column at least `100svh` tall that clips sideways (`overflow-x: clip`, so the sticky bar
   keeps working). It holds `Header`, `PhaseRail`, `<main id="main">` with the page, and `Footer`, and
   right after the footer renders `InkLayer` once (nothing above `children`, no `Suspense`).

The layout reads the phases, templates and bundles once and passes the shell two plain values: `phases`
(`PhaseLink[]`: slug and name) and `templatePhases` (a map from each template slug to its phase slug, the
`TemplatePhases` type). Both are in `components/layout/nav-links.ts`, with `PRIMARY_LINKS` (Catalog,
Bundles, Pricing, About, Contact) and two helpers that turn a pathname into `aria-current`:
`linkCurrent()` for the primary links and `currentPhase()` for the phases.

Pages render `Band`s (usually opened by a `TitleBlock`) directly inside `<main>`. The layout owns
`<main>`, so there is exactly one per page.

### The bar

`header.tsx` renders `<header>`: sticky at the top, `--bar-h` tall (56px, 70px from 68em), on paper
with a soft shadow and no line under it. Left to right, which is also the DOM order and the tab order:

1. The brand: a `TransitionLink` to `/` around the tile `BrandLockup`.
2. `PrimaryNav` (`nav aria-label="Primary"`), from 68em. The link of the page being shown gets
   `aria-current="page"`; on a page underneath it (a bundle under Bundles) it gets
   `aria-current="true"`. It is a client component only because it reads the pathname.
3. The cart. The layout passes `<CartButton />` in as the `cart` prop, so the header itself stays a
   server component.
4. `NavDrawer`, whose "Menu" button shows below 68em.

The bar is a container (`container-type: inline-size`) and carries two micro-queries. They measure
the bar, not the window, so a classic scrollbar does not shift the switch: below 24.3em the word
"Menu" is hidden visually, and below 21.2em so is the brand name. The accessible names "Menu" and
"Advanta365" stay. The drawer's panel does the same for its own brand name at 17em. These are the
only `@container` queries in the code, and the design gate keeps it so.

### The phase rail

`phase-rail.tsx` renders `<nav aria-label="Phases" data-phase-rail>` directly after the header, from
68em only (it is `display: none` below). It is a full-bleed strip of paper that scrolls away, with
`PhaseTabs size="rail"` inside a `Wrap`: seven numbered tabs, each named exactly by its phase. The tab
of the phase being shown is current: `aria-current="page"` on `/phases/{slug}`, `aria-current="true"`
on the page of a template in that phase (found through `templatePhases`). Any other page has no
current tab. It is a client component only because it reads the pathname.

### The drawer

`nav-drawer.tsx` is the site menu below 68em. The toggle is an outline button in the bar with
`aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`. The panel is a native modal `<dialog>`
named "Site menu" (`data-nav-drawer`), opened with `showModal()`, on the right edge of the screen
with the dimmed page behind it (`drawer-in` and `scrim-in`; see `design-system.md`).

Top to bottom: the brand and its own Close button; `nav aria-label="Menu"` holding the five primary
links and, under a visible "Rollout phases" label, the seven phases (a list labelled by that text,
not a second navigation); the contact address at the foot.

It closes on Close, Escape, a click on the dimmed page (a click whose target is the dialog itself; the
inner panel covers the rest), any link inside it, any change of pathname and a window that grows past
68em (a `matchMedia` listener). Closing is instant. `open` state only mirrors the dialog for
`aria-expanded`; the dialog's own `close` event clears it, so every way of closing goes through one
handler. Focus is trapped while open and returns to the toggle, both natively. The page does not
scroll while a dialog is open (`html:has(dialog[open]) { overflow: hidden }`).

### The footer

`footer.tsx` renders `<footer data-band="binder">`, the binder, the footer's own dark surface (black
also fills `#solution` and the AI statement on `/about`). Its first child is the `wisps` backdrop; the
whole footer, edge to edge, is the `data-ink-calm="veil"` box that holds the wisps under the light
the words need. From 68em it is
the twelve-column grid: the bare brand and the contact address (columns 1 to 4), `nav aria-label="Footer"`
with the primary links and Cart (5 to 7), the site's one navigation named "Rollout phases" under its
visible label (8 to 10), and the two status lines "Sample catalog (beta)" and "Checkout is not
available yet" (11 to 12). Under them: the copyright sentence and the non-affiliation notice. From 40em
it is two columns; below, the two navigations stay side by side and the rest is stacked.

### Page openers

`TitleBlock` (`components/layout/title-block.tsx`) opens every inner page on paper and holds the
page's only `<h1>`, whose text is exactly the page title. With `ink` it carries the `title` backdrop
from 68em and makes its words one calm box; `aside` takes the phase numeral or a paper stack. Its `form` is `index` (the h1 in the margin),
`document` (breadcrumbs and meta in the margin) or `wide` (no margin). `Breadcrumbs` renders
`nav aria-label="Breadcrumb"`.

## Movement

Two systems move things and they do not know each other. **Motion** (`app/motion.css`,
`lib/scroll/`, `components/ui/motion-root.tsx`) is a few small CSS behaviours asked for by
attributes: entrances, the ninety, the change of page, the pointer's light. **Ink** is a real-time
fluid simulation on one WebGL2 canvas behind a few headlines. The rules for both are in "Motion" and
"Ink" of `design-system.md`; this section is how they are built.

Under `prefers-reduced-motion: reduce` neither starts: there is no cover, no engine and no
entrance, `document.getAnimations()` is empty on every route, and the stills stand in for the ink.

## The ink layer

One canvas, many stages. At most one `<canvas>` exists in the document, with one WebGL2 context. It is
created by script, never rendered by React, and owned by the layer.

- **`InkBackdrop`** (`components/ink/ink-backdrop.tsx`, server): where ink may appear. It renders
  `<div data-ink-backdrop data-scene data-edges data-ink-state aria-hidden>` holding a `<picture
  data-ink-still>` (the still, wide from 68em and tall below; none for the cover) and an empty
  `<div data-ink-slot>`, then a `<div data-ink-control>` where the pause button is placed. The
  backdrop is `position: absolute; inset: 0; z-index: 0; overflow: clip`, its parent must be
  positioned, and whatever follows it in the stage is lifted above it with a zero-specificity
  `position: relative; z-index: 1`. A still is `display: none` unless `:root:not([data-ink="live"])`,
  or the route is calm, or its backdrop is `rest`: a visitor with live ink never downloads it.
  `(prefers-contrast: more)` and `(forced-colors: active)` hide the backdrop altogether.
- **Stage markup**: children of a stage mark themselves with attributes only:
  `data-ink-calm="text" | "display" | "veil"` (copy the ink keeps clear of) and
  `data-ink-anchor="open" | "tenth"` (a rectangle a scene aims at). The footer's veil is the whole
  footer edge to edge, because a still is scaled with the width of the window and a veil that stopped
  at the page column would leave margins that scaling moves under the words.
- **`InkLayer`** (`components/ink/ink-layer.tsx`, client): mounted once by `app/(site)/layout.tsx`,
  after the footer, and by `app/not-found.tsx` and the lab page. It is a singleton (`html[data-ink-layer]`);
  its cleanup destroys the engine and removes the canvas and the attributes it set. The logic is in
  `ink-controller.ts`; the React shell only portals the pause button into the control holder of the
  chosen stage.
- **What the controller does**: reads the mode from `<html data-ink>`; on a calm route (`isCalmRoute`)
  stops there; observes every backdrop with one `IntersectionObserver` (root margin `150% 0px`);
  imports the engine chunk (`import("@/lib/ink/engine")`, never statically) when a backdrop first
  comes near, at once if it is on screen, else when idle (and before hydration while the cover is
  up); chooses the backdrop that matters most (`lib/ink/stage.ts`: the topmost wins if at least 40% of
  it is in view, except that a backdrop in view whole beats a topmost one that is only partly there,
  so the foot of a page belongs to the footer; otherwise the largest visible area times weight, and a
  challenger must beat the holder by a quarter); creates the engine once, moves the canvas into the
  slot of the chosen backdrop (the old slot fades out first), measures the stage's calm rectangles, edges
  and anchors and hands them over as zones, and runs the scene. After a scene's run window
  (`runMs`: 30s for the hero) it calls `rest()` and the loop stops; a pointer move, a click drop or a
  scroll impulse starts it again for up to 12s. A click inside the canvas that is not on a control
  leaves a light-blue drop, at most one every 250ms, and a touch only if the finger moved under 8px
  and stayed under 300ms.
- **Failure**: a lost context makes the backdrop `rest` (its still shows) and a restored one brings the
  ink back; a second loss, a failed import, `unsupported` or a `slow` event sets `data-ink="still"`
  and stores `off` for the session. `pagehide` stops the loop; `pageshow` with `persisted` chooses
  again; a switch to reduced motion stops the engine. The engine itself pauses in a hidden tab and
  off screen.
- **States** on `<html>`: `data-ink` (`live`, `paused`, `still`), `data-ink-route="calm"`,
  `data-ink-layer`, `data-ink-ready`, `data-ink-paused`, `data-motion`, `data-timeline`,
  `data-intro`. On a backdrop: `data-ink-state` (`idle`, `live`, `rest`). On the canvas:
  `data-ink-canvas`, `data-ink-tier` and `data-ink-running`, which is `"true"` only once the engine is
  ready and the loop runs.
- **The pause control** is one `<button type="button" data-ink-toggle aria-label="Pause ink">`
  portaled into the control holder of the live stage and renamed "Play ink" when paused. A press stops
  the loop at once (`stop()`), sets `data-ink-paused` and stores `paused` in
  `sessionStorage["advanta365.ink.v1"]`; pressed again it starts and stores the tier. After a
  reload the boot script sets `data-ink="paused"`: stills, no engine, the same button. There is no
  button in `still` mode, on calm routes or during the cover.
- **Where it runs**: `intro` (the cover), `hero`, `ninety`, `bloom` (the home page), `wisps` (every
  footer), `title` (the title blocks that pass `ink`, from 68em) and `spill` (both 404 files). The
  buying pages never load the engine. The ninety's scene waits for `fire("tenth")`: the layer
  fires it when the band's progress passes 0.47 on a view timeline, or on the tenth block's
  `animationend` without one (the tally puts `data-ink-anchor="tenth"` on that block).

## The engine

`lib/ink/engine/` is the project's own port of the prototype (`.qa-shots/lab/ink/ink.js`) to
TypeScript, behind the API of `lib/ink/types.ts`. It has no dependency, and the engine and the scenes
are one chunk of at most 40KB gzip that is never among a page's initial scripts.

- **Files**: `index.ts` (`createInk`, `isSupported`), `gl.ts` (programs, formats and targets),
  `shaders.ts` (the GLSL, numbers only, no colours), `defaults.ts` (tiers, budgets, simulation and
  look defaults). Beside them: `scenes.ts` (the seven scenes as functions of the canvas and its
  anchors; they call only `drop`, `stream` and `clear`, so unit tests run them against a recorder),
  `stage.ts` (weight, run window, ground and trigger per scene, and the choice rule), `zones.ts` (rects
  to zones and anchors, pure), `pigments.ts` (reads the six `--pigment-*` tokens by setting each as
  the `color` of a detached probe element), `stills.json` and `stills.ts` (the manifest) and
  `test-hook.ts`.
- **The technique**: a 2D incompressible fluid at a fixed step of 1/60s on half-float targets (dye in
  four channels, black and blue each on a near and a far layer; velocity; pressure, divergence and
  curl). Each step adds the scene's drops and streams as splats, computes curl, applies forces
  (vorticity confinement, the weight of the ink, ambient currents, drag in calm zones), advects the
  velocity, projects it with warm-started Jacobi pressure and advects the dye. One composite pass in
  linear light draws ink over the band's own ground, with a self-shadow, a faint ground shadow and a
  dither; empty water is exactly the ground colour, so no seam can show. The calm zones thin and slow
  the ink and carry the cap of the legibility guarantee in the composite itself. It is deterministic:
  fixed step, seeded generator, `step(n)`.
- **Tiers** (cells and pixels, so the cost is the same for any aspect):

  | Tier     | Simulation cells | Dye pixels | Pressure iterations | Ratio cap | Canvas pixels | Shadow taps |
  | -------- | ---------------- | ---------- | ------------------- | --------- | ------------- | ----------- |
  | `high`   | 112,000          | 1,300,000  | 26                  | 2         | 2,400,000     | 5           |
  | `medium` | 62,000           | 760,000    | 20                  | 1.75      | 1,700,000     | 4           |
  | `low`    | 34,000           | 420,000    | 16                  | 1.5       | 1,000,000     | 3           |

  `quality: "auto"` runs a probe (median of seven real frames, stepping down while a tier costs more
  than 9ms at `high` or 10ms at `medium`); the cover starts at a fixed `medium` and the layer
  probes when it ends. While running, 75 net frames over 24ms drop a tier, and at `low` the engine
  emits `slow`, which sends the session to stills. The tier is stored for the session. Measured on
  the development machine (Intel Iris Xe, 1440x900): `high` costs 3 to 3.6ms a frame (the cover 6 to
  6.6ms), under the budgets of 6 and 8ms.
- **API** (`lib/ink/types.ts`): `createInk(canvas, { pigments, quality, maxDpr, interactive,
  scrollImpulse, ... })` never throws; the `Ink` it returns has `preset`, `start`, `stop`, `rest`,
  `step`, `still`, `drop`, `stir`, `stream`, `impulse`, `fire`, `setCalmZone`, `clear`, `set`,
  `setQuality`, `probe`, `resize`, `render`, `measureCost`, `stats`, `on`, `off` and `destroy`. Every
  method is a safe no-op while the context is lost or after `destroy()`. `resize()` keeps the picture
  and redraws in the same task, also while the loop is stopped.
- **Context**: `alpha: false, antialias: false, depth: false, stencil: false,
  preserveDrawingBuffer: false, powerPreference: "default", failIfMajorPerformanceCaveat: true`.
  Programs are compiled with `KHR_parallel_shader_compile` where it exists; without it the cover's ink
  is not attempted. The boot script and the engine both refuse a software renderer by name.
- **Realism items** of the specification: the light-blue look, the leaning spill and the larger third
  drip shipped. The two optional items, S1 (diffuse shading of dense bodies from the gradient of dye
  mip 3) and S2 (a coordinate field advected with the flow for a fine fibre texture in thin veils),
  were not built.
- **The spill on a tall stage** drops slightly smaller and lower than the specification's figures (r
  0.058, not 0.062; `A.open.y + 0.08`, not `+ 0.03`). At the specified figures the first three drops
  merged at 2s into one dense body that the calm zone cut flat and that read as a head in profile.
- **The lab**: `/ink-lab` (`app/(lab)/ink-lab/page.tsx`, `components/ink/ink-lab.tsx`) shows every
  scene on a mock stage; it answers 404 unless `NODE_ENV` is `development`.

## The boot script and the cover

`lib/boot/boot-script.ts` exports the string `BOOT_SCRIPT` (at most 1.5KB gzip); `lib/boot/state.ts`
holds the names (`INTRO_FLAG` `"advanta365.intro.v1"`, `INTRO_SEEN`, `INK_KEY`
`"advanta365.ink.v1"`, `INK_OFF`, `INK_PAUSED`, `INK_TIERS`) and the pure decisions the script mirrors
(`shouldPlayIntro`, `inkMode`, `isCalmRoute`, `isSoftwareRenderer`); `boot-script.test.ts` runs the
script against stand-ins for the globals it touches and compares it with the pure versions.
`components/intro/intro-script-tag.tsx` keeps the export `IntroScript`, which prints the script as the
HTML of a `<div hidden>` (a `<script>` element that React makes in the browser never runs and logs an
error); `app/layout.tsx` renders it first in `<body>`, and `<html>` has `suppressHydrationWarning`.
All storage access is in try/catch. In order, the script:

1. under `(prefers-reduced-motion: reduce)` sets `data-ink="still"` and stops;
2. sets `data-motion="on"`, and `data-timeline="on"` when `CSS.supports("animation-timeline: view()")`;
3. chooses the ink: on a calm route it sets `data-ink-route="calm"`; `still` when
   `(prefers-contrast: more)`, `(forced-colors: active)`, `(prefers-reduced-data: reduce)` or
   `navigator.connection.saveData` holds or the stored value is `off`; `paused` when it is `paused`;
   `live` when it names a tier; otherwise probes once with a throw-away canvas (WebGL2 with
   `failIfMajorPerformanceCaveat`, a float colour-buffer extension, not a software renderer) and
   stores `off` on failure;
4. 6000ms later turns `live` without `data-ink-layer` into `still`;
5. plays the cover: only on `/`, with `INTRO_FLAG` unset and storage readable and the document
   visible, it writes the flag and sets `data-intro="play"`. The first `pointerdown`, `keydown`, `wheel`
   or `touchstart` sets `data-intro="leave"`; an `animationend` whose target is the cover itself
   removes the attribute and the listeners; a timer removes it 4500ms after the script ran, whatever
   else happened.

`IntroCover` (`components/intro/intro-cover.tsx`) is a static server component rendered by the home
page: `<div data-intro-cover aria-hidden="true">`, `display: none` unless `html[data-intro]`, fixed,
full viewport, `z-index: var(--layer-cover)`, ground `--paper`; it takes the pointer while it is
opaque, so a click that ends it never lands on a link under it. Inside: an `InkBackdrop scene="intro"`
(no still), the mark as three paths from `lib/brand/mark.ts`, the name, and "Skip". Its timings
live in `intro-cover.module.css`:

| ms from first paint | Always (CSS)                                                   | With ink                                                                                                                                  |
| ------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 120 to 800          | The legs, the crossbar and the tail (`--mark`) are written     |                                                                                                                                           |
| 500 to 900          | The name fades in; the hint at 600                             |                                                                                                                                           |
| at most 1050        |                                                                | The layer finds the cover's own exit animation and, if its time is at most 1050 and the engine is ready in the cover's slot, sets `data-intro="ink"` (cancelling the CSS exit), then `preset("intro")` and `start()` |
| 1200 to 1650        | The cover fades and stops taking the pointer                   |                                                                                                                                           |
| T to T + 2800       | In `ink`: the signature fades, then the ground fades           | A black drop at T, a light-blue one at T + 600, mist from T + 1750, clean at T + 2800                                                      |
| after               | The cover's `animationend` removes `data-intro`                | The layer probes, moves the canvas to the hero and starts `hero`                                                                          |

While `html[data-intro]` is set every load entrance of the page is switched off (it ends at once, so
nothing starts from hidden when the cover leaves). Longest runs: 1650ms without ink, T + 2800
with it (at most 3850ms), 200ms after any input, never past 4500ms. Fail-safes, in order of how
little they trust each other: the cover's exit is CSS and does not need the layer; the state
`ink` carries its own CSS exit; the layer that stops leaves the CSS exit to finish; the timer of the
boot script removes the attribute whatever happened. The cover never plays on any page but `/`, twice in
a session, under reduced motion, without JavaScript, with storage blocked, in a tab that loads hidden
or on a back-forward restore.

## Motion

`app/motion.css` is imported first by `app/globals.css`, and everything in it hangs on hooks
(see "The system" in `design-system.md`). The parts:

- `components/ui/motion-root.tsx` (client, rendered by `app/layout.tsx` after the children) arms the
  observer path (`data-io="armed"`), marks `[data-watch]` elements `data-seen` as they arrive, and
  calls `trackLight()` from `lib/scroll/pointer.ts` (the light and tilt of a lit sheet);
  `lib/scroll/observe.ts` exports `watchSeen`, `whenSeen`, `hasArrived`, `WATCHED` and `MOVED`.
- `Appear`, `Sentences`, `CountUp`, `Odometer`, `Tally`, `PaperSheet`, `PaperStack`, `Folder` and
  `PageShift` (see "Wet Ink primitives").
- **Change of page**: view transitions need no configuration in Next 16. `TransitionLink` is a
  `next/link` wrapper; `PageShift` names the first block of a page (page-out 140ms, page-in 260ms) and a
  template's cover and a bundle's folder carry `view-transition-name` `cover-<slug>` and
  `folder-<slug>`, each used once on a page (`share={false}` where a template could appear twice).
  A filter, sort or search change under the same address starts no view transition. The fallback, if
  they prove unstable, is one edit in `components/ui/page-shift.tsx` (return the children) plus
  dropping the `ViewTransition` wrapper in `template-cover.tsx` and `folder.tsx`. In the browser suite
  they were stable.
- The paper grain is `public/paper/grain.png`, generated by `scripts/paper-grain.mjs`.

## Stills, and the stills script

A still is a settled frame of the real engine, captured on the real page so its composition matches the
layout, served from `public/ink/` and listed in `lib/ink/stills.json` (the one list: the script, the
file test and `InkBackdrop` all read it). It is shown without JavaScript, under reduced motion, when
paused, on calm routes, after a failure and on a software renderer.

| Name                         | Captured on     | Window (CSS px, ratio) | Scene    |
| ---------------------------- | --------------- | ---------------------- | -------- |
| `hero-wide`                  | `/`             | 1440 x 900, 1          | `hero`   |
| `hero-tall`                  | `/`             | 320 x 700, 2           | `hero`   |
| `ninety-wide`, `ninety-tall` | `/`             | 1440 x 900; 320 x 700  | `ninety` |
| `bloom-wide`                 | `/`             | 1920 x 900, 1          | `bloom`  |
| `bloom-tall`                 | `/`             | 390 x 844, 2           | `bloom`  |
| `wisps-wide`                 | `/about`        | 1920 x 900, 1          | `wisps`  |
| `wisps-tall`                 | `/about`        | 390 x 844, 2           | `wisps`  |
| `title`                      | `/about`        | 1088 x 900, 1          | `title`  |
| `spill-wide`, `spill-tall`   | `/nope`         | 1440 x 900; 320 x 700  | `spill`  |

The windows differ from the 1440 and 390 of the specification on purpose. A still is scaled to other
widths, so it is captured where scaling moves ink away from the words, not onto them: scenes that
start at the top of their band are captured in the narrowest window they are shown in (every wider
window scales them up and ink moves lower), scenes that rise from the foot in the widest. The `title`
still carries a `borrow` entry in the manifest: the phase page's numeral is a calm zone the other
title blocks do not have, so its rectangle is laid over the `/about` capture. Each still is scaled by
the width of its backdrop and by nothing else (the title one stands at its own size in its corner);
the picture below 68em is the tall one.

`scripts/ink-stills.mjs` (plain Node, no dependency; Node runs the TypeScript it imports from `lib/ink`)
starts the built site on port 3100 unless `--base=<url>` names a running one, and opens Chromium with
`--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu`:

| Command                             | What it does                                                                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/ink-stills.mjs`       | Captures the eleven stills through `window.__inkTest.still(scene)` into `public/ink/*.webp`, lowering the quality from 0.86 in steps of 0.04 to 0.70 until a file is at most 90KB (all together at most 600KB) |
| `... --only=hero-wide,title`        | Captures only these                                                                                                                                                        |
| `... --check`                       | Loads 12 routes at 320, 390, 768, 1088, 1280, 1440 and 1920 with `data-ink` forced to `still` and fails if a pixel of a still under a calm zone breaks its cap (tolerance 0.02). `--widths=` and `--routes=` narrow it |
| `... --blue`                        | Measures the light blue: the darkest 1% of saturated blue pixels of the hero at 8s and 30s and of the cover at 1.3s must have a luminance of at least 0.25 and a hue between 205 and 216 |
| `... --sheets`                      | Saves contact sheets of every scene (hero at 3, 8, 16 and 30s; the cover at six times; ninety, bloom, wisps, title; spill at 2, 4 and 9s) at 1440x900 and 390x844 into `.qa-shots/final/` |

Exit codes: 0, 1 (a check failed) and 2 (usage, or an environment that cannot run the engine). Under Git
Bash, `--routes=/x` is mangled by path conversion: set `MSYS_NO_PATHCONV=1`.
`tests/unit/stills-files.test.ts` holds `public/ink/` to exactly the files the manifest names and to
the budgets.

## Budgets

`scripts/check-budgets.mjs <baseUrl> [--record]` sums the gzip size of the scripts in the server HTML
of `/` and compares it with `tests/budgets/baseline.json` (recorded before this edition: 143,786
bytes): at most 12KB more. It also finds every chunk under `.next/static` that contains the shader
marker: together at most 40KB gzip and none among the initial scripts of `/`, `/about` or `/catalog`.
The boot script is held to 1.5KB gzip by `boot-script.test.ts`, the stills by the file test and the
grain (at most 4KB) by `kit-grain.test.ts`.

## Test hooks

Tests and the cross-unit code locate elements by these attributes. Keep them stable.

| Attribute                                  | Element                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `data-band`                                | `Band` roots and the footer. The value is the surface: `desk`, `paper`, `wash`, `ink` or `binder`                             |
| `data-tally`, `data-block`                 | `Tally` root; each block: `ink`, `mark` or `empty` (position from 0 is `--i`). An unfilled block has a transparent background |
| `data-blank`, `data-caret`                 | The `Blank` field, and its caret (not in the hero)                                                                            |
| `data-phase-rail`, `data-nav-drawer`       | The phase rail `nav`; the `<dialog>` of the phone menu                                                                        |
| `data-bar`                                 | The header root: the bar's shadow is drawn on its `::after`                                                                   |
| `data-specimen`                            | Root of the specimen sheet (was `data-hero-sheet`)                                                                            |
| `data-label`, `data-open`                  | A reflowing table cell's label; a `FaqList` item (`"true"` or `"false"`)                                                      |
| `data-move`, `data-when`, `data-seen`      | An entrance and its kind; `load` for one run by the clock; set on arrival. `data-watch` asks to be marked seen                |
| `data-ninety`                              | The band whose figure and tally follow the scroll (`#solution`)                                                               |
| `data-odometer`, `data-odometer-wheel`     | The figure (with `data-value`) and its wheel, whose resting `translate` is one em up per ten                                  |
| `data-ledger`                              | A ledger root (its hairlines grow on a timeline)                                                                              |
| `data-paper`, `data-lit`                   | A paper object, and one that catches the light under the pointer                                                              |
| `data-paper-stack`, `data-folder`          | A stack of sheets; a bundle folder                                                                                            |
| `data-cover`, `data-format`                | A printed template page and its format (`docx`, `xlsx`, `pptx`); `data-layout` is on the two article cards                   |
| `data-intro-cover`                         | The cover of a first visit (home page only)                                                                                   |
| `data-intro`                               | On `<html>`, by the boot script: `play`, `ink` or `leave` while the cover is up, else absent                                  |
| `data-ink`                                 | On `<html>`: `live`, `paused` or `still`                                                                                      |
| `data-ink-route`, `data-ink-layer`         | On `<html>`: `calm` on a route with no engine; set while the layer is mounted                                                 |
| `data-ink-ready`, `data-ink-paused`        | On `<html>`: the engine runs; the loop was paused by the visitor                                                              |
| `data-motion`, `data-timeline`, `data-io`  | On `<html>`: movement is wanted; view timelines exist; the observer path is armed                                             |
| `data-ink-backdrop`, `data-scene`          | A backdrop and its scene (`intro`, `hero`, `title`, `ninety`, `bloom`, `wisps`, `spill`); `data-edges` lists its edges       |
| `data-ink-state`                           | A backdrop: `idle`, `live` or `rest`                                                                                          |
| `data-ink-still`, `data-ink-slot`          | The picture of a backdrop; the empty slot the canvas moves into                                                               |
| `data-ink-control`, `data-ink-toggle`      | The holder of the pause button; the button itself                                                                             |
| `data-ink-canvas`, `data-ink-tier`, `data-ink-running` | On the canvas: its mark, the tier it runs at, `"true"` while the loop runs                                         |
| `data-ink-calm`, `data-ink-anchor`         | A calm zone (`text`, `display`, `veil`); a rectangle a scene aims at (`open`, `tenth`)                                        |

### The ink test hook

With `window.__INK_TEST__ = true` set before the page loads (an init script), the layer imports
`lib/ink/test-hook.ts` at mount and `window.__inkTest` exists:

| Member                              | Returns                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `still(scene)`                      | The settled frame of a scene, in its own backdrop, as a WebP data URL                                                |
| `hold(scene)`                       | Puts the canvas in that scene's backdrop (zones and anchors measured) without starting the loop                      |
| `zoneExtremes()`                    | For each calm zone under the canvas: `kind`, `cap`, `dark` and the lowest (light) or highest (dark) luminance         |
| `cost(frames)`, `stats()`           | Mean milliseconds of one step and one draw; the engine's counters (`steps`, `running`, `preset`, `tier`, ...)        |
| `loseContext()`, `restoreContext()` | Take the WebGL context away and give it back                                                                         |
| `engine()`                          | The engine itself, for frame-by-frame checks                                                                         |

## Test contract

- **Unit** (Vitest, `tests/unit/**/*.test.ts`): the logo geometry (`brand-mark`), compound splitting,
  `phaseCoverage`, the catalog, cart, query, search-params, format, pricing and validation tests, and
  `content.test.ts` (the sample catalog: the seven phases in order, and that no text names a
  methodology or a client). For this edition: `design-gate.test.ts` (see `design-system.md`);
  `ink-scenes` (every scene, wide and tall, run against a recorder: the scripted events at their times,
  coordinates inside -0.05 to 1.05, the leaning spill, `runMs` at most 30000), `ink-zones`, `ink-stage`
  (the choice rule, including a short page on a tall window and the foot of a page);
  `boot-script` (every branch of the script against stand-ins, storage that throws, at most 1.5KB
  gzip, printed as a hidden wrapper) and `boot-cover` (the cover's markup, a backdrop's markup and
  the stills manifest); `kit-motion` and `kit-grain`; `stills-files` (exactly the eleven files, each at
  most 90KB, 600KB together); and `intro.test.ts`, which only keeps anything from depending on the
  retired `components/intro/intro-script.ts` (the file and its old test should be deleted by someone
  who may; it is unused).
- **Browser** (Playwright, `tests/e2e/`): `browse`, `cart`, `cart-keyboard`, `catalog`, `console` (no
  console error on any route), `header`, `menu` and `not-found`, unchanged; and for this edition:
  `identity` (the look where it is computed, on every route: grounds and faces, five bands, at most one
  canvas and only in a slot, the server HTML without a canvas, nothing that loops, the name at most
  28px, no article boxed on four sides, nothing moving 5.5 seconds after load, the home page's
  headline at 73.9px and 40px, the 3px ring, 44px targets, 320px without sideways scroll),
  `reduced-motion` (no `data-motion`, no `data-intro`, `data-ink="still"`, no canvas, no animation, every
  `[data-move]` at opacity 1, the hero still loaded, the odometer at 90), `ink-fallback` (no WebGL2,
  software rendering, `prefers-contrast: more`, no JavaScript: no canvas, stills, a clean console),
  `intro` (the cover: before first paint, an opaque headline under it, a largest paint under a second,
  gone within 1.9s without ink, within 400ms of a click or key, never navigating, never twice, never
  under reduced motion, blocked storage or no JavaScript), `motion` (entrances and the ninety with
  view timelines and, with `CSS.supports` stubbed, without; a change of page runs a view transition
  with a `cover-<slug>` group, still works without the API and a filter change starts none) and
  `ink-live` (on a graphics card: see below).
- **Clocks**: times are read in the page (`performance.now()`, observers installed by an init script
  before the page's own scripts) and waited for with `expect.poll`; there are no fixed sleeps.
  Helpers scroll with `behavior: "instant"`. `tests/e2e/helpers.ts` keeps `introSeen` and
  `NAVIGATION_TIMEOUT`; `tests/e2e/support/ink.ts` holds the helpers of the ink specs.
- **Projects** (`playwright.config.ts`): `chromium` (desktop, 1280 x 800), `mobile` (Pixel 7), `gpu` (desktop
  Chromium at 1440 x 900 with `--ignore-gpu-blocklist --enable-gpu` and, on Windows,
  `--use-angle=d3d11`; only `ink-live.spec.ts`; one test at a time and after every other project
  has finished, so frame costs and clocks are not those of a busy machine; the spec skips itself when
  `data-ink` is not `live`) and `firefox` (`browse`, `console`, `reduced-motion`, `ink-fallback`,
  `motion`: the browser that really has no view timelines). The first two ignore `ink-live`. The
  firefox project is registered only where the installed Firefox starts (set `PW_FIREFOX=1` to
  require it); on a machine whose copy cannot start it is left out and the observer path is exercised
  in Chromium with `CSS.supports` stubbed. WebKit is not installed and nothing is downloaded.
- **The cover in tests**: every test starts a browser session of its own, so its first load of `/` is a
  first visit and opens under the cover. A spec that opens the home page for another reason calls
  `introSeen(page)` before its first `goto`. `intro`, `reduced-motion`, `ink-fallback`'s
  JavaScript-off cases and `console` do not, and `ink-live` does only where it looks at a repeat visit.
- **`ink-live` checks**: within 2.5s of a repeat visit one canvas, `aria-hidden`, in the hero's slot,
  running, its corner pixel exactly white; the "Pause ink" button in the hero, reachable by keyboard,
  stopping the loop within 100ms, renamed "Play ink" and surviving a reload as `data-ink="paused"`
  with stills and no canvas; the loop stopping by itself within 40s and a pointer move starting it;
  one canvas moving through ninety, bloom and wisps, the footer's corner exactly `rgb(13, 15, 21)`;
  every cap held within 0.02 for 20 seconds on the hero, the closing, the footer and the 404; a client
  navigation to `/about` keeps one canvas and to `/catalog` leaves none; a lost context shows the still
  and a restored one brings the ink back; a resize while stopped leaves ink on the canvas; no task over
  200ms in the first five seconds; a frame at `high` at most 6ms; on a first visit the cover gone within
  4.1s and the hero running 600ms later; a clean console.
- **Server**: `playwright.config.ts` builds and starts the production server on port 3100 and reuses a
  running one unless `CI` is set.
- **Locators**: every link or button locator is scoped to its landmark (`banner`, the `Primary` or
  `Phases` navigation, the `Site menu` dialog, `main`, `contentinfo`). The bar, the drawer and the
  footer repeat link names. Match `Phases` with `exact: true`: the footer navigation "Rollout phases"
  contains the same word.
- **Hydration**: the Menu button works only once the bar has hydrated. The cart link beside it tells
  when that is: its name gains the count ("Cart, 0 items") at that moment.
- **Invariants the markup keeps** (the specs above check most of them): one `banner`, one `main` and
  one `contentinfo`; one `h1` with the exact title text; the skip link is the first focusable element;
  the beta text appears once while the catalog is sample content; exactly one navigation named
  "Rollout phases" (the footer); exactly one searchbox named "Search templates" (the catalog); the cart
  link is named "Cart, N items" once the stored cart is known; `role="status"` only on the catalog
  result count and the add-to-cart confirmation; `article` only for template cards and bundle cards;
  every `data-band` is one of the five surfaces, `binder` is the footer alone, `ink` is on the home page
  and `/about` only and `wash` appears at most once per page; the server HTML never has a canvas.

Before a merge, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e`, and
`node scripts/check-budgets.mjs http://localhost:3100` against `next start -p 3100`. After a
production build, `curl` the unknown routes (`/nope`, `/templates/nope/extra`) to confirm they answer
404. After a change to a layout that has ink in it, run `node scripts/ink-stills.mjs`, then `--check`,
and commit the new stills.

## Failure and fallback matrix

| Situation                                  | What the visitor sees                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript disabled                        | Full content and the same look. `data-ink` is never set, so the stills show; no cover; every `[data-move]` is drawn; the odometer reads 90 and the tally is full. The desktop bar and rail work as links. Search, result links and pagination work. Filters, sort, the cart and the phone Menu button need JavaScript                       |
| Reduced motion                             | No cover, no engine, no entrance, no view transition: `document.getAnimations()` is empty. The stills stand in for the ink. Dialogs open without an entrance                                                                                                                                                                              |
| `(prefers-contrast: more)`, forced colours | No ink, no still and no grain; objects get a 1px ring and the bar a hairline; system colours keep every state visible                                                                                                                                                                                                                     |
| No WebGL2, a software renderer, `saveData` | Stills. The boot script probes once, stores `off` for the session and sets `data-ink="still"`; the engine is never loaded                                                                                                                                                                                                                  |
| Engine chunk fails, context lost twice     | The still of the stage (`data-ink-state="rest"`), then stills for the session                                                                                                                                                                                                                                                             |
| A slow device                              | The engine drops a tier after 75 net frames over 24ms; at `low` it reports `slow` and the session falls back to stills                                                                                                                                                                                                                    |
| Ink paused by the visitor                  | Stills and a "Play ink" button, for the rest of the session, also after a reload                                                                                                                                                                                                                                                         |
| Calm routes                                | `/catalog`, `/cart`, `/templates/*` and `/bundles/*` never load the engine; their footer shows the wisps still                                                                                                                                                                                                                            |
| The cover cannot be taken over by ink      | It leaves by itself at 1.65s. The boot script's timer removes `data-intro` at 4.5s whatever happened                                                                                                                                                                                                                                      |
| Storage blocked or disabled                | The cart works in memory for the current page. The cover is not played, and the probe's result is not remembered                                                                                                                                                                                                                          |
| A page that is not found                   | The 404 page inside the site shell. The server answers 404 with an empty document and React builds the page in the browser, so this one page needs JavaScript. `LateBoot` (`components/not-found/late-boot.tsx`) runs the boot script there as an appended script element, so the spill is live and the load is not counted as a first visit |
| Stored cart has lines for removed records  | `CartSync` removes them on the next page                                                                                                                                                                                                                                                                                                  |
| Menu open and Back pressed                 | The pathname changes, so the drawer closes                                                                                                                                                                                                                                                                                                |
| Menu open and the window widened past 68em | The drawer closes; the inline navigation and the rail take over                                                                                                                                                                                                                                                                           |

## Known failure modes

These are the failures most likely to appear when the code changes. Check them first.

- **Unknown routes return 200**: a `<Suspense>` or `loading.tsx` sits above the page content in
  `app/(site)`.
- **A closed dialog is visible**: a module sets `display` on a bare dialog class. Set it on
  `.x[open]`.
- **A class from another file does nothing**: a module uses a `@keyframes` name defined in another module.
  Keyframe names are scoped per file.
- **A primitive's style loses to a caller's**: override it by doubling the selector (`.x.x`), not by
  relying on stylesheet order.
- **An anchor or focus target hides under the bar**: `html` carries `scroll-padding-top` from
  `--bar-h`. Do not drop it, and keep the token in step with the bar's height.
- **Hydration warnings**: a component reads `window`, `matchMedia` or `Date` during render. Read them in
  an effect, or through `useSyncExternalStore` with a server snapshot (`AskedPath` does this).
- **The cart count jumps**: `CartButton` shows the count in its accessible name only after the store has
  been read. Keep it that way.
- **The design gate fails on a comment**: it reads files as text, so a retired word in a comment counts.
- **Ink under the words after a layout change**: the stills were captured on the old layout. Run
  `node scripts/ink-stills.mjs`, then `--check`. A new page that uses a stage must mark its copy with
  `data-ink-calm`, and a still's caps are only as good as the zones that were on the page it was
  captured on.
- **A page is blank with a scroll-linked entrance**: a full-page screenshot taken at scroll 0 shows
  every `[data-move]` below the fold hidden on the view timeline path. That is the timeline, not a bug;
  scroll to it.
- **A tall page never reaches its last entrance**: ranges are capped by a length for that reason;
  keep the cap when adding a range.
- **A browser test of the home page cannot click anything**: its first load is a first visit and the
  page is under the cover. Call `introSeen(page)` before the first `goto`.
- **`data-intro` stays on `<html>`**: the cover's own `animationend` never came. The boot script's timer
  removes it after 4.5s; nothing on the cover may be removed from the page while it plays.
- **Two canvases, or a canvas outside a slot**: the layer is a singleton. A second instance must be a
  no-op (`html[data-ink-layer]`); never create a canvas anywhere else.
- **A 404 shows no ink**: the root layout's boot script does not run on a page React builds in the
  browser. `LateBoot` covers it and relies on the layer being a later sibling of `MissingPage` in the
  tree, so its effect runs first.
- **A 404 logs "Encountered a script tag" in development**: a layout renders a `<script>` element,
  and React is building the page in the browser (see the 404 rules). Print it as `IntroScript` does.
- **`next start` and the dev server together**: `next build` writes `.next`, the dev server `.next/dev`;
  both can run at once, on ports 3100 and 3000.

