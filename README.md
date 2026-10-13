# Advanta365

Advanta365 is the storefront for a change management and user adoption toolkit for Microsoft 365 and
SharePoint Online rollouts. It is an EchoFive product. The toolkit is playbooks, templates, field guides
and training. The site sells one thing: the complete toolkit, for $1,499.99 CAD, shown in Canadian dollars. Six
templates are free samples; every other template in the catalog is shown locked. There is one Purchase page
and no cart.

The catalog in this repository is sample content. The phases, steps and templates are placeholders, and the
site labels them as a beta. The Checkout button on the Purchase page opens a checkout in a pop-up, which is
built up to payment: no payment provider is connected, so its last step offers the order by email and nothing
can be paid for yet. The bar's "Get the toolkit" button is a link to the Purchase page.

## Stack

- Next.js 16 with the App Router, React 19 and TypeScript in strict mode. Packages are installed with pnpm,
  through corepack.
- Styling is CSS Modules, one module beside each component. Components read the design tokens that
  `app/globals.css` defines as CSS custom properties.
- Type is Besley for display and Atkinson Hyperlegible Next for text, loaded with `next/font/google` into
  `--font-besley` and `--font-atkinson`.
- Motion is CSS in `app/motion.css`, switched on by attributes. A small inline boot script
  (`lib/boot/boot-script.ts`) sets the root attributes before the first paint.
- The ink is one WebGL2 canvas running a fluid simulation (`lib/ink/`, `components/ink/`). Where it cannot
  run, the stills in `public/ink/` stand in. They are settled frames of the same engine.
- Catalog records are validated with zod when the catalog loads.
- The runtime dependencies are `next`, `react`, `react-dom` and `zod`. The design gate fails `pnpm test`
  if that list changes.
- Tests use Vitest for units and Playwright for the browser.

## Commands

Install with `pnpm install`. If `pnpm` is not on the PATH, run `corepack enable` first.

| Command          | What it does                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm install`   | Installs the dependencies                                                 |
| `pnpm dev`       | Runs the development server at http://localhost:3000                      |
| `pnpm build`     | Builds the production site (`next build`)                                 |
| `pnpm start`     | Serves the production build (`next start`)                                |
| `pnpm lint`      | Runs ESLint over the repository                                           |
| `pnpm typecheck` | Generates the route types, then runs `tsc --noEmit`                       |
| `pnpm test`      | Runs the unit tests with Vitest, including the design gate                |
| `pnpm test:e2e`  | Runs the Playwright browser tests; the config builds and serves port 3100 |
| `pnpm format`    | Runs Prettier over the repository                                         |

The scripts in `scripts/` have no package script. Run them by path from the repository root.

| Command                                                | What it does                                                                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/gen-icon.mjs`                            | Writes `app/icon.svg` from the mark in `lib/brand/mark.ts` (run it after any change to the mark)                                   |
| `node scripts/ink-stills.mjs`                          | Captures the thirteen stills into `public/ink/` (needs a production build and a graphics card)                                     |
| `node scripts/ink-stills.mjs --check`                  | Checks that each still keeps its contrast caps under the calm zones, at seven widths                                               |
| `node scripts/ink-stills.mjs --blue`                   | Checks that the light blue of the ink stays light                                                                                  |
| `node scripts/ink-stills.mjs --sheets`                 | Saves contact sheets of every scene into `.qa-shots/final/`                                                                        |
| `node scripts/check-budgets.mjs http://localhost:3100` | Checks the home page's scripts and the ink shader chunks against `tests/budgets/baseline.json` (needs a running production server) |
| `node scripts/paper-grain.mjs`                         | Writes `public/paper/grain.png`                                                                                                    |

The browser tests need Chromium once, from `pnpm exec playwright install chromium`. They reuse a server
already running on port 3100 unless `CI` is set, so stop a stale server first. The Playwright projects are:

- `chromium`: desktop Chrome at 1280 by 800.
- `mobile`: Pixel 7.
- `quiet` and `quiet-mobile`: the tests tagged `@quiet`, one at a time once the two above have finished.
- `gpu`: the live ink on a graphics card. It runs after the others and sets Chromium's GPU arguments
  (on Windows, `--use-angle=d3d11` with `--ignore-gpu-blocklist` and `--enable-gpu`).
- `firefox`: registered only where the installed Firefox starts.

`tests/e2e/viewports.spec.ts` runs in `chromium` and sets its own window sizes: seven routes at sixteen
sizes, from a 320px phone through the tablets to a 3840px monitor. It checks that nothing is drawn past
the window's edge and that, from 1280px up, the words of a page span more than half of the window. Run
only the specs a change touches (see `docs/testing.md`); this one is the guard for any change to layout
or CSS.

The unit tests cover catalog validation and the six free samples, queries, URL state, phase coverage, price
formatting, the mark and its 365, the ink's scenes, stages and calm zones, the boot script and the cover's
timings, the motion stylesheet, the stills and the design gate.

## Folder layout

```
app/
  layout.tsx          Root html and body: the two fonts, the boot script and MotionRoot
  globals.css         Design tokens, the data-band surfaces, base rules and the type classes
  motion.css          Motion: entrances, the ninety, page changes and the pointer's light
  icon.svg            The site icon (generated: `node scripts/gen-icon.mjs`)
  not-found.tsx       The 404 page outside the site group, with the ink layer
  (site)/             Public pages inside the site shell
    layout.tsx        Skip link, header, phase rail, main, footer, ink layer
    page.tsx          Home: an array of sections, in order
    purchase/ catalog/ phases/[phase]/ about/ sample/
    privacy/ terms/ refunds/ accessibility/
                      The four legal pages, each one LegalDocument in the shared LegalPage layout
    [...rest]/        Calls notFound(), so unknown paths keep the site shell
  (lab)/ink-lab/      The ink on a mock stage, in development only
components/
  ui/                 Primitives (see Design system)
  layout/             Header, PrimaryNav, PurchaseButton, NavDrawer, PhaseRail, TitleBlock, Breadcrumbs,
                      Footer
  home/               Home sections: hero (HeroStage, ProofStrip), featured (the six samples), inside, the
                      portfolio, solution
  catalog/            Template covers, tiles (TemplateTile, LockedTile), the pop-up
                      (TemplateDialog, a PageDialog from ui/, and TemplateDetail), filters and their chips, search, sort, result
                      list, the phone's phase strip, step nav, the phase pager
  purchase/           Portfolio (the toolkit as a folder), PriceTag and the contents leaf (ContentsLeaf)
  checkout/           The checkout over the Purchase page: CheckoutDialog, its three steps, the order
                      summary and the form fields
  about/              The Why Advanta page's sections: promise, how it was made, who it is for,
                      comparison,
                      state of the site
  contact/            ContactSection, the whole Contact page as one section
  legal/              LegalPage, the one layout of the four legal pages: contents, article, policies
  company/            NextSteps (Why Advanta and Sample), StatementSection and WorkedExample (Sample)
  ink/                InkBackdrop, InkLayer, the controller and the lab
  intro/              The cover of a first visit, and the tag that prints the boot script
  not-found/          MissingPage, AskedPath and LateBoot
content/              The sample catalog: phases, one template file per phase, taxonomy, and the worked
                      example's table of contents
lib/
  site.ts             Name, parent company, tagline, contact address, TOOLKIT counts, OFFER (the one
                      price) and NAV
  format.ts           formatPrice (integer cents and a currency as "$1,499.99 CAD"), formatLength (slides or pages) and
                      countWord
  cx.ts               cx() for class names and cssVars() for custom properties
  compounds.ts        Hyphenated compounds, kept whole in titles
  brand/mark.ts       The logo mark geometry, the single source of truth
  catalog/            Schemas, validation, repository, query, URL state, phase coverage and neighbours,
                      the worked example's contents
  checkout/           The order's schemas (zod/mini), the draft kept in session storage, the step
                      machine, the order's code, text and mailto, and provider.ts: the payment seam
  ink/                The engine (engine/), scenes, stage choice, calm zones, pigments, stills, test hook
  boot/               The boot script and the pure decisions it mirrors
  legal/              The four legal pages as data (privacy, terms, refunds, accessibility), their types,
                      and facts.ts: LEGAL, the one object of facts and decisions the owner fills in
  scroll/             The observer for entrances, the pointer's light, and a sideways row's current item
                      brought into view
public/ink/           The thirteen stills (WebP)
public/paper/         The paper grain
scripts/              ink-stills, check-budgets and paper-grain
tests/unit/           Vitest, including the design gate
tests/e2e/            Playwright specs, helpers.ts and support/
tests/budgets/        The baseline that check-budgets compares with
docs/                 The design system and the architecture
proxy.ts              Redirects mixed-case paths to lower case
next.config.ts        Redirects the retired addresses (bundles, pricing, cart, about, template pages)
```

## Rules the code relies on

- **Catalog reads go through the repository.** Pages and components import from
  `lib/catalog/repository.ts`, never from `content/`. ESLint enforces this. The one exception is
  `content/taxonomy.ts`, which holds the labels and lists of deliverable types, apps, audiences and formats.
- **Catalog state lives in the URL.** Search (`q`), `phase`, `type`, `app`, `audience`, `format`, `free`
  (`1` keeps the free samples), `sort` (`samples`, `phase` or `title`) and `page` are query parameters, and `view`
  (a template's slug) opens a free sample in the pop-up, so every view can be shared and is rendered on the
  server. Values within one filter combine with OR, filters combine with AND, and a page holds 24 templates.
- **Colour, spacing, type and motion are tokens.** Raw colour values (hex and the colour functions) appear
  only in `app/globals.css` and `app/icon.svg`. The ink reads its six pigments from the `--pigment-*`
  tokens. `lib/ink/pigments.ts` keeps matching fallbacks as 0 to 255 numbers for when the tokens cannot be
  read.
- **Layout space is the 7px scale**, `--s-1` (7px) to `--s-9` (168px). The only layout breakpoints are
  `40em` and `68em`.
- **Sizes and spaces are in rem, so a large monitor scales the page as one piece.** Past a 1600px window
  the root font size grows (`html` in `app/globals.css`: 16px to 1600px, 22.4px from about 2880px), and so
  do the type, the space, the controls and the icons. The breakpoints are in em, which the root size does
  not move. What stays in pixels is hairlines, edges, corner radii and shadows.
- **Media queries come from a fixed list.** The design gate allows `(min-width: 40em)`,
  `(min-width: 68em)`, `(hover: hover)`, `(prefers-reduced-motion: no-preference)`,
  `(prefers-reduced-motion: reduce)`, `(prefers-contrast: more)` and `(forced-colors: active)`. `@container`
  appears only in the header and navigation drawer stylesheets. Stylesheets do not use
  `prefers-color-scheme`; the site sets `color-scheme: light` on `:root`.
- **Motion sits behind the no-preference query.** Every keyframe and animation is inside
  `(prefers-reduced-motion: no-preference)`, and stylesheets never contain `infinite`. Motion is switched
  by attributes on `<html>` and on elements (see Motion and ink).
- **Canvas, WebGL, animation frames and scroll listeners have fixed homes.** A canvas or WebGL call belongs
  in `lib/ink/`, `components/ink/` or `lib/boot/`. `requestAnimationFrame` and scroll listeners belong in
  those three, or in `lib/scroll/` and `components/intro/`.
- **Internal links use `TransitionLink`**, or a primitive built on it. Only
  `components/ui/transition-link.tsx` imports `next/link`.
- **Each page has one `h1`**, its title. The shell provides one `banner` (the header), one `main` and one
  `contentinfo` (the footer).
- **Storage access is guarded.** Every `localStorage` or `sessionStorage` access is wrapped in try/catch,
  and the page renders without it.
- **The price is written once.** `OFFER.priceCents` in `lib/site.ts` is integer cents (149999) and
  `OFFER.currency` its currency ("CAD"); `formatPrice` in `lib/format.ts` prints them as $1,499.99 CAD.
- **Exactly six templates are free.** `free: true` marks them, and validation fails with any other count.
- **The ink keeps clear of copy it is told about.** Copy marks itself with `data-ink-calm` (`text`,
  `display` or `veil`), and a backdrop's open water is marked with `data-ink-anchor="open"`.

`pnpm test` runs the design gate (`tests/unit/design-gate.test.ts`), which enforces the text-checkable rules
above and blocks a fixed list of names and techniques from the source.

## Design system

The tokens and base rules are in `app/globals.css`, the motion rules in `app/motion.css`, and the primitives
in `components/ui/`. `docs/design-system.md` describes the system in full.

### Surfaces

`Band` (`components/ui/band.tsx`) is a full-width strip of the page on one surface. Its `surface` sets
`data-band`, and the stylesheet sets the semantic tokens for that band.

| `surface`        | Ground                   | Used for                                                      |
| ---------------- | ------------------------ | ------------------------------------------------------------- |
| `desk` (default) | `--desk`, a light table  | Sections on which the paper sheets lie                        |
| `paper`          | `--paper`, white         | Most content sections                                         |
| `wash`           | `--mark-wash`, pale blue | Highlighted sections                                          |
| `ink`            | `--binder`, near black   | The solution band on home and the promise band on Why Advanta |
| `binder`         | `--binder`, near black   | The footer                                                    |

The `ink` and `binder` surfaces share one dark block in the stylesheet, and text on them is `--on-binder`.
Components read the semantic tokens (`--ground`, `--surface`, `--stripe`, `--tile`, `--text`, `--text-soft`,
`--text-faint`, `--line`, `--line-firm`, `--line-ink`, `--focus-ring`), so one component works on every band.

```tsx
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";

export function Example() {
  return (
    <Band id="example" surface="paper" pad="roomy">
      <Button variant="mark" size="lg" href="/catalog" arrow>
        Browse the catalog
      </Button>
    </Band>
  );
}
```

### Colour

The palette has three families. Paper and ink: `--paper`, `--paper-shade`, `--desk`, `--desk-deep`, `--rule`,
`--rule-firm`, `--ink`, `--ink-soft` and `--ink-faint`. The highlighter: `--mark`, `--mark-deep` and
`--mark-wash`, with `--on-mark` as the text colour on it. The binder: `--binder`, `--binder-rise` and
`--on-binder`. Errors use `--alert` and `--alert-wash`. The `--pigment-*` tokens name the six colours the ink
paints with.

### Type

Two faces are set as `--face-display` (Besley) and `--face-text` (Atkinson Hyperlegible Next).

- Display classes, in Besley: `.type-poster`, `.type-hero`, `.type-statement`,
  `.type-banner`, `.type-page`, `.type-section`, `.type-item` and `.type-amount`.
- Text classes, in Atkinson Hyperlegible Next: `.type-lead`, `.type-copy`, `.type-ui`, `.type-note`,
  `.type-eyebrow` and `.type-tag`.
- Utilities: `.tabular` for figures that line up, and `.visually-hidden`.

Display and lead sizes are `clamp()` tokens between a phone value and a desktop value. The fixed sizes are
`--size-ui` (1rem), `--size-note` (0.875rem), `--size-eyebrow` (0.8125rem) and `--size-tag` (0.75rem).

### Spacing, layout and shape

- `--s-1` to `--s-9`: the 7px scale, from 7px to 168px.
- `--page-max` and `--page-pad`: the page column and its side padding. The column is 77rem (1232px) up to a
  1600px window. 77rem grows with the root size past that, and from about 1840px of window the column
  follows 72% of the window, to a ceiling of 120rem. `--over` is how far the window is past 1600px, which
  the root size and some caps read. `--col-gap` is the gap between columns.
- `--bar-h` (56px, 70px from 68em): the sticky header. `--rail-h` (42px): the phase rail.
- `--control-sm` (40px, on the desktop bar), `--control` (48px) and `--control-lg` (56px): control heights.
  `--tap` (44px) is the minimum target below 68em.
- `--round-1` (3px) to `--round-3` (10px), `--edge` (2px) and `--hair` (1px).
- `--depth-0` to `--depth-4`: elevation.
- `--layer-bar` (50), `--layer-skip` (90) and `--layer-cover` (100): stacking order.

### Motion tokens

- Durations: `--time-swap` (120ms), `--time-enter` (240ms), `--time-exit` (160ms),
  `--time-fill` (180ms), `--time-fill-gap` (80ms), `--time-lift` (260ms), `--time-ink` (400ms),
  `--time-settle` (560ms), `--time-count` (1200ms), `--time-morph` (420ms), `--time-page-in` (260ms),
  `--time-page-out` (140ms) and `--stagger` (70ms).
- Curves: `--curve-settle`, `--curve-leave`, `--curve-ink`, `--curve-drop` and `--curve-pen`.

### Primitives

`components/ui/` holds the primitives that pages and feature components are built from.

- Layout: `Band`, `Wrap`, `Split`, `ShelfHead`, `FactList`, `BandedList` and `BandedRow` (the
  ledger), and `Note`.
- Links and actions: `Button`, `TransitionLink`, `TextLink`, `RowLink`, `Pagination` and `PhaseTabs`.
- Paper and objects: `PaperSheet`, `PaperStack`, `Folder`, `Tag`, `Blank` and `Tally`.
- Text and marks: `Eyebrow`, `Sentences`, `KeepCompounds`, `LogoMark`, `BrandLockup` and `Icon`.
- Form controls: `Input`, `Select` and `Checkbox`.
- Motion: `Appear`, `MotionRoot` and `PageShift`.

## Motion and ink

### Attributes that switch motion

| Attribute                                         | Set by                                                 | Effect                                                                    |
| ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `html[data-motion="on"]`                          | Boot script                                            | Switches on the motion rules                                              |
| `html[data-timeline="on"]`                        | Boot script, where the browser supports view timelines | Entrances follow the scroll                                               |
| `html[data-io="armed"]`                           | `MotionRoot`, once the observer starts                 | Entrances on browsers without view timelines                              |
| `html[data-intro]`                                | Boot script and ink controller                         | The cover: `play`, `ink` or `leave`; the attribute is removed at the end  |
| `html[data-ink]`                                  | Boot script                                            | `live` or `still`                                                         |
| `data-move` (`drift`, `ink-in`, `settle`, `grow`) | `Appear`, `Sentences`                                  | The entrance of an element; `data-when="load"` plays it on load instead   |
| `data-paper`, `data-lit`                          | `PaperSheet` (the `lit` prop)                          | The sheet's shadow, its lift and its tilt toward the pointer              |
| `data-bar`                                        | `Header`                                               | The shadow under the sticky bar                                           |
| `data-ledger`                                     | `BandedList`                                           | The rule of a ledger draws in                                             |
| `data-ninety`                                     | The solution band (`components/home/pitch-spread.tsx`) | The ten blocks fill; the 90% figure never moves                           |
| `data-watch`                                      | `Tally` with `animate`, `PriceTag`                     | The blocks fill, or the tag swings, when the element is seen              |
| `data-hero-stage`, `-prompt`, `-doc`              | `HeroStage`                                            | With live ink, the hero's prompt box dissolves and the six documents land |
| `data-tile` `data-denied`                         | `TemplateTile`, `LockedTile`                           | A locked tile says no: it vibrates, its outline and wash hit and fade     |
| `data-page-dialog` `data-enter`                   | `PageDialog` (the catalog's pop-up, the checkout)      | The pop-up rises as the page dims                                         |
| `data-price-tag`                                  | `PriceTag`                                             | The tag swings on its string                                              |
| `data-nav-underline`                              | `PrimaryNav`                                           | The bar's underline slides to the current link                            |
| `data-ink-calm` (`text`, `display`, `veil`)       | Page copy                                              | Copy the ink keeps clear of                                               |
| `data-ink-anchor` (`open`, `tenth`)               | Ink backdrops and the tally                            | Where the open water is, and the block that fires the ninety              |

Entrances follow the scroll where view timelines exist and fall back to an intersection observer elsewhere.
Every animation sits behind the no-preference query, and the stylesheet forces durations to 0.01ms under
reduced motion.

### The cover

A first visit to `/` in a browser session plays a cover. It draws the mark in pen strokes, then the 365 on
the arm of the mark in a finer pen, and shows the site name. The finished mark stands from 1.0 to 2.5
seconds, and the cover is gone at 2.95 seconds, or 3.5 seconds after the ink took over from it (the ink
may take over up to 1.6 seconds in). A press, a key, a wheel turn or a touch ends it. Reduced motion
skips it. When the cover has gone, the hero's sequence starts, where the ink is live; with still ink
the six documents stand from the first frame and there is no box.

### Ink

The ink is one canvas that the ink layer moves between backdrops as the page scrolls. The engine loads
when a backdrop nears the viewport, and it picks a quality tier (high, medium or low) with a short probe,
then steps down when frames run long. It comes to rest by itself after a while without input.

| Scene    | Where it runs                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------- |
| `intro`  | The cover                                                                                       |
| `prompt` | The home page hero: a blank prompt that becomes the six free samples                            |
| `ninety` | The solution band on the home page, which fires when the tenth block of its tally turns in view |
| `bloom`  | The stage of the Purchase page                                                                  |
| `wisps`  | The ink lab only; the footer has no ink                                                         |
| `title`  | The title blocks of Why Advanta, Sample and the phase pages                                     |
| `spill`  | The 404 page                                                                                    |

On the catalog, the backdrops show the stills.

Where the ink cannot run (no JavaScript, reduced motion, a software renderer, raised contrast, or no
WebGL2), the stills stand in. The thirteen WebP files in `public/ink/` are listed in `lib/ink/stills.json`,
each at most 90 KiB and 600 KiB in total. `scripts/ink-stills.mjs` captures them.

## Replacing the sample content

The catalog has seven phases in rollout order: Make the case (`make-the-case`), Plan (`plan`), Design
(`design`), Prepare (`prepare`), Communicate (`communicate`), Execute (`execute`) and Sustain (`sustain`).
Each phase has two steps.

1. **Phases and steps.** Edit `content/phases.ts`. Each phase has a slug, a name, a summary, an `order` and
   its steps. Slugs are lower-case words joined by hyphens. The catalog's metadata description writes the
   phase count out as "seven" (`app/(site)/catalog/page.tsx`), so change it by hand if the count changes.
   The tally of the phases on the Purchase page and in the home portfolio follows the phase list
   automatically.
2. **Templates.** Each phase has one file in `content/templates/`: `make-the-case.ts`, `plan.ts`,
   `design.ts`, `prepare.ts`, `communicate.ts`, `execute.ts` and `sustain.ts`. `index.ts` joins them in
   phase order. A template gives its phase and step, deliverable type, apps, audiences, format, ADKAR
   stages (`adkar`, stored and not shown), an optional page count (shown as slides for a PowerPoint deck
   and pages for every other format), what it includes, and `free` (true for a
   free sample). Real records are written out in full with `isSample: false`. The `sample()` helper in
   `content/templates/sample.ts` adds `isSample: true` (and `free: false` unless the entry says otherwise) and
   belongs only in the sample files. There is no price on a template: the one price is `OFFER` in
   `lib/site.ts`.
3. **Free samples.** Exactly six templates have `free: true` (`FREE_SAMPLE_COUNT` in
   `lib/catalog/validate.ts`): one for each of the first six phases. They are the six on the home page, the
   ones that open in the pop-up and the covers in the folder on the Purchase page.
4. **Validation.** `lib/catalog/repository.ts` validates the catalog when it loads. `pnpm test` and
   `pnpm build` fail with the record and field named if a record is invalid, a slug repeats, a template
   names a phase or step that is missing or belongs to another phase, or the number of free templates is
   not six.
5. **Sample labels.** The sample wording is plain text, edited by hand, in these places: the catalog's
   metadata description and the line under its result count (`app/(site)/catalog/page.tsx`), the "Browse
   the sample catalog" links on the home page (`components/home/featured-section.tsx` and
   `components/home/inside-section.tsx`), the "Browse the sample catalog by phase" name (`PHASES_LABEL`) of
   the phase links in `components/home/inside-section.tsx`, `components/about/phase-line.tsx` and
   `app/(site)/sample/page.tsx` (where it is also the visible eyebrow), the sample note on the Purchase page
   (`components/purchase/contents-leaf.tsx`) and the Why Advanta page's note on the state of the site
   (`components/about/site-state.tsx`). No page reads `isSample` (only the unit tests
   call `hasSampleContent()`), so nothing changes by itself when the real records arrive: edit each of
   these places by hand.
   The worked example is the fictional Meridian Group. The name appears in `app/(site)/sample/page.tsx`,
   `content/templates/plan.ts` and `content/worked-example.ts`. That last
   file holds the example's table of contents on `/sample`: placeholder sections, labelled as such on the
   page, until the real file is published. The 10,000 figure also
   appears on the home page, in `components/home/inside-section.tsx` and `components/home/pitch-spread.tsx`.
   `tests/unit/content.test.ts` and the browser specs in `tests/e2e/` check the sample catalog by name and
   count, so they need updating with the real catalog.
6. **Toolkit counts.** `TOOLKIT` in `lib/site.ts` holds the counts for the whole toolkit: playbooks,
   templates, field guides, job aids, training audiences and years of experience. Pages read them from
   there. The experience is also set in sentences, built from `TOOLKIT.experience`: the hero lead
   (`components/home/hero.tsx`), the promise and "How it was made" sections of Why Advanta
   (`components/about/promise-band.tsx` and `components/about/making-section.tsx`) and the Why Advanta page's
   description. The counts describe the whole
   toolkit, not the number of catalog listings, and no page may imply that the catalog lists that many. The
   Purchase page's "What is inside" ledger and the hero's proof strip read them from there.
7. **Home page.** The home page is the `sections` array in `app/(site)/page.tsx`, top to bottom: the hero,
   `#featured`, `#inside`, `#toolkit` and `#solution`.
   Reordering the page means reordering that array. The specimen in `#inside` shows the
   first free sample. The hero's documents, `#featured` and the covers in the folder of `#toolkit` are the six
   free samples. The phase coverage in the folder comes from `phaseCoverage()` in
   `lib/catalog/coverage.ts`.

## Path to production

The code already has the seams that a production build connects to.

| Concern       | Seam in the code                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog data  | Files in `content/`, read through `lib/catalog/repository.ts`. Its functions are async, so another source can implement the same functions.                                             |
| Record shapes | `lib/catalog/schema.ts` defines the phase, step and template records, and `lib/catalog/validate.ts` checks them.                                                                        |
| The offer     | `OFFER` in `lib/site.ts`: its name and its price in cents. The tag, the bar's button and the Purchase page all print it.                                                                |
| Checkout      | `getPaymentProvider()` in `lib/checkout/provider.ts` returns `null`: a provider is returned from there (`docs/architecture.md`, section 3.7). Nothing unlocks the locked templates yet. |
| Page metadata | The root `metadata` in `app/layout.tsx`, and each page's metadata export.                                                                                                               |

Items to settle before launch, from content and commercial terms to the worked example's file, are in
[Before public launch](#before-public-launch) at the end of this file.

## Documentation

- [`docs/design-system.md`](docs/design-system.md): the design system. It covers the surfaces, colour, type,
  the 7px scale, motion, depth and paper objects, the ink, the primitives, the CSS Modules rules, the design
  gate and the accessibility floor.
- [`docs/architecture.md`](docs/architecture.md): the architecture. It covers the server and client
  boundaries, routes, the site shell, the ink layer and engine, the boot script and the cover, motion, the
  stills script, budgets, test hooks and the test contract.
- [`docs/testing.md`](docs/testing.md): the checks, the browser projects and every spec.

## Before public launch

The first five items come from the owner's pitch and messaging document (2026-10-10), in his
words; the second is given without the names it lists. Under each is where the site stands today.
The rest are about the site itself. None of this is legal advice.

- [ ] **Prosci wording.** Prosci and ADKAR are Prosci's trademarks. "Built by a Prosci-certified
      practitioner" describes the owner, which is fine if the certification is current.
      "Prosci-aligned" or "Prosci-approved content" suggests an endorsement Prosci hasn't given.
      Keep Prosci on the person, not the product, and check Prosci's trademark-use guidance at
      prosci.com.
  - On the site: Prosci appears only as "built by a Prosci-certified practitioner" and the
    footer's non-affiliation and trademark notice; the design gate (`tests/unit/design-gate.test.ts`)
    fails on any other line that names Prosci. ADKAR appears in no visible copy; the `adkar` field
    on a template is data and is not rendered.
- [ ] **Old product branding.** Client references (department names and terms, client platform
      names) were removed from the source material. The earlier product name is now Advanta365
      throughout, and the content for the other earlier product and for the provisioning tool has
      been removed. One government platform name stays only in labelled government examples.
  - On the site: none of these names appears. This README does not spell them out either; the
    list is the `banned` pattern in `tests/unit/content.test.ts`, which checks every phase, step and
    template text. Run the same search over the real files before they are offered.
- [ ] **Ownership of the source material.** Confirm which files were rebuilt from the owner's own
      know-how and which began as client deliverables under contract. Only the first group is
      clearly his to sell.
  - On the site: nothing to change until this is settled. It decides which real entries may
    replace the sample catalog.
- [ ] **"30+ years" and "used with real clients."** Both are true. Keep the wording general
      ("refined across client rollouts") rather than suggesting named clients endorse it.
  - On the site: the experience is always written "30+ years", and no client, department or
    platform is named. Public-sector copy says "proven in Canadian public-sector environments" and
    does not claim a bilingual or French product (the job aids are English only today).
- [ ] **Counts on the site.** 59 / 130 / 4 / 58 (playbooks, templates, field guides, job aids)
      match the folder as of the date of that document.
  - On the site: the counts are read from `TOOLKIT` in `lib/site.ts`. Recount the folder before
    launch and change them there.
- [ ] **The worked example's file.** `/sample` describes the Meridian Group worked example and
      says its file cannot be downloaded in this beta. It needs the real file, and its real table of
      contents: `content/worked-example.ts` lists placeholder sections (the pieces `/sample` names; a
      free sample links to its template in the catalog, a locked template is named in plain text with
      no link, and a step or phase links to its page) that the page marks "Placeholder"; replace them
      and set `placeholder` to false. The sample catalog
      also lists the worked example as a locked template; decide whether it is a free sample, a
      product, or both.
- [ ] **Why Advanta copy and cost estimates.** The costs of the two alternatives on Why Advanta (8 to 14
      person-months, $150K to $400K per rollout) were carried over from the earlier page as the
      owner's estimates and are labelled Estimate; confirm or replace them in
      `components/about/compare-section.tsx`. The four passes under "How it was made"
      (`components/about/making-section.tsx`) restate "built, delivered, revised and re-delivered"
      and name no real revision history; the owner should read them.
- [ ] **Legal pages.** `/privacy`, `/terms`, `/refunds` and `/accessibility` are owner-drafted
      and written from what the code does today; a lawyer should read all four before the first
      sale. The facts and decisions they need are the one object `LEGAL` in `lib/legal/facts.ts`,
      and a page says only what is true without a value that is still `undefined`. Open: the
      seller's legal name with its suffix (`entity`, now the bare company name) and postal address
      (`address`); the governing province (`governingProvince`); the refund window in days
      (`refundWindowDays`) and whether the default policy stands (an order not yet downloaded is
      refunded, a faulty or misdescribed file is replaced or refunded, otherwise final after
      download); whether consultants may use the toolkit for clients (`clientWorkAllowed`, now
      no); a named privacy contact (`privacyContactName`); the host (`hostingProvider`, set from
      the `.vercel` folder of this working copy, to confirm); the date (`effectiveDate`), to move on
      every change; and an accessibility audit (`accessibilityAuditDate`). Also to confirm: that
      the licence is perpetual and for one organization, that sales tax is added before payment,
      and that liability is capped at the price paid.
  - On the site: the privacy policy describes what is there now (no cookies, no analytics, three
    session storage entries, the checkout's draft among them, and contact by email) and keeps what is planned for the checkout under
    "When checkout opens" without naming a processor. Rewrite that part, and the refund policy's
    last section, when a payment provider is connected. `tests/unit/legal.test.ts` checks the
    wording for set and unset facts.
- [ ] **Checkout.** It is built up to payment. Connect a payment provider (`docs/architecture.md`,
      section 3.7), and decide how a paid order is fulfilled and how a purchase unlocks the
      locked templates. Until then the Payment step offers the order by email and the locked
      templates stay locked for every visitor.
