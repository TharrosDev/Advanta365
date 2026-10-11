# Architecture

Advanta365 is a Next.js 16 App Router site. Pages are server components that read a validated catalog
and compose primitives. The look is HTML, CSS and inline SVG; nothing is drawn by script, and the
little client JavaScript there is serves the cart, the catalog filters, the phone menu, the two
navigations that mark the current page and the cover of a first visit. This document describes how
the parts connect. For the visual rules see `design-system.md`.

## Server and client boundaries

- Layouts and pages are server components. They load data and pass plain values down.
- A file with `"use client"` is a client island. It is still rendered to HTML on the server, then
  hydrated, and its hooks run in the browser only. The islands are:
  - the cart: `components/cart/use-cart.ts` (the store), `cart-sync.tsx`, `cart-button.tsx`,
    `add-to-cart.tsx` and `cart-contents.tsx`;
  - the catalog: `components/catalog/filter-panel.tsx` and `sort-select.tsx`;
  - the shell: `components/layout/primary-nav.tsx`, `phase-rail.tsx` and `nav-drawer.tsx`;
  - `components/company/faq-list.tsx` and `components/not-found/asked-path.tsx`.
- The cover of a first visit is not an island. `IntroCover` (`components/intro/intro-cover.tsx`) is
  a static server component, and what switches it on is an inline script that the root layout
  renders first thing in `<body>` (`IntroScript`, from the string in
  `components/intro/intro-script.ts`). The script runs once per page load, before anything is
  painted and long before hydration; no component reads or writes its state. See "The cover".
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
| `/`                 | `app/(site)/page.tsx`                  | Home, product first: hero sheet, shelves, pitch |
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
that array. Before the sections it renders `IntroCover`, which no other page does (see "The
cover"). Top to bottom, with the band each one sits on (`components/home/`):

| Section                                       | File                   | Band  |
| --------------------------------------------- | ---------------------- | ----- |
| Hero: headline, lead, two buttons, hero sheet | `hero.tsx`             | desk  |
| `#featured`: six featured templates           | `featured-section.tsx` | paper |
| `#inside`: what the toolkit holds, phase tabs | `inside-section.tsx`   | desk  |
| `#bundles`: three folders with phase coverage | `bundles-section.tsx`  | paper |
| `#problem` and `#solution`: two facing sheets | `pitch-spread.tsx`     | desk  |
| `#practice`: why it is different              | `practice-section.tsx` | wash  |
| `#values`: four value tiles                   | `values-section.tsx`   | paper |
| Built for Microsoft 365 (no id)               | `built-for-row.tsx`    | paper |
| `#closing`: one bordered sheet                | `closing-section.tsx`  | desk  |

The hero sheet (`hero-sheet.tsx`) is built in `page.tsx` by `buildSpecimen()` from the first featured
template (the first template if none is featured), its phase and step, and the same labelled facts the
template page lists. It is the one place where catalog text is repeated, and it is `aria-hidden`. A
template whose phase is missing yields no specimen, and the hero renders without the sheet. The bundle
cards take their phase coverage from `phaseCoverage()` in `lib/catalog/coverage.ts`.

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
  never runs, and React logs an error about it. The inline script of the cover is therefore printed
  as HTML inside a hidden wrapper (see "The cover"), which is inert and silent on such a page.

`proxy.ts` answers mixed-case paths with a 308 redirect to lower case. Everything else passes through.

## Site shell

`app/(site)/layout.tsx` renders, in order:

1. The skip link ("Skip to content"), a `Button href="#main"`, which is the first focusable element. It
   is parked above the top edge and drops into the corner on keyboard focus.
2. `CartSync` and, while the catalog holds sample content (`hasSampleContent()`), `BetaStrip`: one line
   on the wash, in the flow, which scrolls away.
3. `.frame`, a column at least `100svh` tall that clips sideways (`overflow-x: clip`, so the sticky bar
   keeps working). It holds `Header`, `PhaseRail`, `<main id="main">` with the page, and `Footer`.

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

`footer.tsx` renders `<footer data-band="binder">`, the only dark surface of the site. From 68em it is
the twelve-column grid: the bare brand and the contact address (columns 1 to 4), `nav aria-label="Footer"`
with the primary links and Cart (5 to 7), the site's one navigation named "Rollout phases" under its
visible label (8 to 10), and the two status lines "Sample catalog (beta)" and "Checkout is not
available yet" (11 to 12). Under them: the copyright sentence and the non-affiliation notice. From 40em
it is two columns; below, the two navigations stay side by side and the rest is stacked.

### Page openers

`TitleBlock` (`components/layout/title-block.tsx`) opens every inner page on the desk band and holds the
page's only `<h1>`, whose text is exactly the page title. Its `form` is `index` (the h1 in the margin),
`document` (breadcrumbs and meta in the margin) or `wide` (no margin). `Breadcrumbs` renders
`nav aria-label="Breadcrumb"`.

## Movement

There is no route transition, no fade, no scroll lock and nothing tied to scroll position. First paint
is the page. Four things move, all in CSS (see "Motion" in `design-system.md`):

- state changes (hover, focus, press, current, open) shift colour, border or underline in 120ms;
- panels enter: the phone drawer from the right, the filter sheet from the bottom, the scrim, and the
  FAQ panel growing from zero height. Dialogs close instantly;
- the hero sheet fills its ten-block tally and blinks its caret three times, once, ending 4.5s after
  first paint;
- the cover: on a first visit an ink sheet lies over the home page for 2.3s, is signed and is lifted
  off. The page under it is the same complete page.

Under `prefers-reduced-motion: reduce` the tally and caret animations are `none`, the dialogs drop
their entrance, there is no cover, and `app/globals.css` shortens every other animation and
transition.

### The cover

A first visit is the first page load of a browser session, when that page is the home page. The
parts, all in `components/intro/`:

1. `IntroScript` (`intro-script-tag.tsx`), rendered by `app/layout.tsx` first thing in `<body>`,
   prints the inline script `INTRO_SCRIPT` from `intro-script.ts`, as the HTML of a `<div hidden>`.
   The parser runs it on every page load the server renders, before anything is painted. It reads
   the flag `advanta365.intro.v1` from `sessionStorage` and sets it (in a try/catch; a session whose
   storage cannot be read counts as seen), then decides as
   `shouldPlayIntro({ path, seen, reducedMotion })` does: play only on `/`, only if the flag was not
   set, never under reduced motion. It lives in the layout and not in the page for two reasons: a
   session that starts on an inner page has to be counted, and a script that React creates during a
   change of page is never run, so nothing may depend on one. The one load it does not run on is a
   404 decided at request time, which React builds in the browser (see the 404 rules): that load is
   not counted, so a session that starts there still has its first visit ahead of it.
2. To play, the script sets `data-intro="play"` on `<html>`. That element carries
   `suppressHydrationWarning`, because React did not render the attribute.
3. `IntroCover` (`intro-cover.tsx`), rendered by the home page before its sections, is a fixed
   `aria-hidden` sheet that is `display: none` unless `data-intro` is `play` or `skip`. Its timeline
   is CSS: the mark is written, ten blocks fill, the name fades in, and at 1.68s the sheet slides up
   by its own height and holds that last frame: `display: none`, hidden, `pointer-events: none`.
4. The script keeps the attribute in step. A `pointerdown`, `keydown`, `wheel` or `touchmove` before
   the sheet has begun to lift sets `skip` (the sheet is off in 200ms). The end of the cover's own
   animation, or a backstop 4s after the first frame, sets `done`. When every animation that was
   running at that moment has ended or been cancelled, the attribute is removed. It tells the cover's
   animation events from its children's by the `data-intro-cover` hook.
5. While the attribute is present, `:root[data-intro]` in `app/globals.css` sets `--intro-hold` and
   `--intro-blinks`. `tally.module.css` and `blank.module.css` read them: the hero sheet's fill starts
   as the cover lifts (1.75s) and its caret blinks twice, so the last movement ends 4.91s after first
   paint. That is why the attribute outlives the cover: taking it off earlier would retime animations
   that are still running. `:root[data-intro="play"]` also runs `intro-scrollbar` for the same 1.75s:
   a classic scrollbar is not part of the page, so it is drawn in ink until the page comes into play.

Nothing else knows about the cover. A change of page never plays it (no script runs), and going back
to the home page later in the session finds the cover in the DOM and not displayed.

## Test hooks

Tests and the cross-unit code locate elements by these attributes. Keep them stable.

| Attribute                  | Element                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `data-band`                | `Band` roots and the footer. The value is the surface: `desk`, `paper`, `wash` or `binder`                         |
| `data-tally`               | `Tally` root                                                                                                       |
| `data-block`               | Each block of a tally: `ink`, `mark` or `empty` (the forced-colours rules key on it too)                           |
| `data-blank`, `data-caret` | The `Blank` field, and its caret                                                                                   |
| `data-phase-rail`          | The phase rail `nav`                                                                                               |
| `data-nav-drawer`          | The `<dialog>` of the phone menu                                                                                   |
| `data-hero-sheet`          | Root of the hero sheet                                                                                             |
| `data-label`               | A table cell that reflows below 40em (`ComparisonTable`, `BundlePriceTable`): the label printed before its value   |
| `data-open`                | A `FaqList` item: `"true"` or `"false"`                                                                            |
| `data-intro-cover`         | The cover of a first visit (home page only). The inline script reads this hook too                                 |
| `data-intro`               | On `<html>`, set by the inline script only: `play`, `skip` or `done` while a first visit is in motion, else absent |

## Test contract

- **Unit** (Vitest, `tests/unit/**/*.test.ts`): the logo geometry, the two-ink split of the mark and
  `app/icon.svg` (`brand-mark.test.ts`), compound splitting, `phaseCoverage` (`coverage.test.ts`), the
  design gate (`design-gate.test.ts`, described in `design-system.md`), the cover (`intro.test.ts`:
  the decision, the inline script run against stand-ins for the globals it touches and the way it is
  printed, the time budget worked out from the tokens, and the markup), plus the catalog, cart,
  query, search-params, format, pricing and validation tests. `content.test.ts` checks the sample catalog: the
  seven phases in order, and that no phase, step, template or bundle text names a methodology or a
  client.
- **Browser** (Playwright, `tests/e2e/`): `browse`, `cart`, `cart-keyboard`, `catalog` and `not-found`;
  `console` (no console errors on the main routes); `header` (the desktop bar and rail); `menu` (the
  phone drawer); `identity` (grounds, faces, landmarks and the four bands, computed on every route, plus
  the home order, the hero sheet, the main button and the focus ring); `intro` (the cover of a first
  visit); and `reduced-motion`. `helpers.ts` holds `NAVIGATION_TIMEOUT` and `introSeen(page)`.
- **The cover in tests**: every test starts a browser session of its own, so its first load of `/`
  is a first visit and opens under the cover. A spec that opens the home page for another reason
  calls `introSeen(page)` before its first `goto` (it sets the session flag from an init script):
  `browse`, `cart-keyboard`, `header`, `identity` and `menu` do. `intro` and `reduced-motion` do not,
  and neither does `console`, which checks the home page as a first visit gets it.
- **Projects**: two, both with motion on: desktop Chromium at 1280 x 800 (`chromium`) and Pixel 7
  (`mobile`). Specs that belong to one of them skip on the other with `test.skip(isMobile, ...)`.
  Reduced motion is emulated inside a test with `page.emulateMedia({ reducedMotion: "reduce" })`, not
  with a project.
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
  result count and the add-to-cart confirmation; `article` only for template cards and bundle cards.
  Style and structure checks: every `data-band` is one of the four surfaces, `binder` is the footer
  alone and `wash` appears at most once per page; no `canvas`, no blend mode and, on any load but a
  first visit, no animation outside the hero sheet; no theme or entry attribute on `<html>`, and
  `data-intro` there only while a first visit is in motion; the footer names the brand once, in plain
  text no larger than 28px.

Before a merge, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e`. After a
production build, `curl` the unknown routes (`/nope`, `/templates/nope/extra`) to confirm they answer 404.

## Failure and fallback matrix

| Situation                                  | What the visitor sees                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript disabled                        | Full content and the same look: the hero sheet, covers and tallies are server-rendered HTML and SVG. The desktop bar and rail work as links. Search (a GET form), result links and pagination work. Filters, sort, the cart and the phone Menu button need JavaScript; the footer still links every page. There is no cover |
| Reduced motion                             | Nothing starts by itself: there is no cover and the hero sheet is drawn in its final state. Dialogs open without an entrance. Hover and focus changes are instant                                                                                                                                                           |
| Forced colours                             | Tally blocks, the blank, the current item and the parts of the cover take system colours, so every state stays visible                                                                                                                                                                                                      |
| Storage blocked or disabled                | The cart works in memory for the current page. The cover is not played: a session that cannot be remembered counts as seen                                                                                                                                                                                                  |
| A page that is not found                   | The 404 page inside the site shell. The server answers 404 with an empty document and React builds the page in the browser, so this one page needs JavaScript. The inline script of the cover does not run on it: no cover, and the load is not counted as the start of the session                                         |
| Stored cart has lines for removed records  | `CartSync` removes them on the next page                                                                                                                                                                                                                                                                                    |
| Menu open and Back pressed                 | The pathname changes, so the drawer closes                                                                                                                                                                                                                                                                                  |
| Menu open and the window widened past 68em | The drawer closes; the inline navigation and the rail take over                                                                                                                                                                                                                                                             |

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
- **A browser test of the home page cannot click anything**: its first load is a first visit and the
  page is under the cover. Call `introSeen(page)` before the first `goto`.
- **`data-intro="done"` stays on `<html>`**: an animation that never ends was running when the cover
  left. The attribute comes off when every animation running at that moment has ended, so nothing on
  the home page may animate without end.
- **A 404 logs "Encountered a script tag" in development**: a layout renders a `<script>` element,
  and React is building the page in the browser (see the 404 rules). Print it as `IntroScript` does.
