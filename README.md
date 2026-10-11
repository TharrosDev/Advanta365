# Advanta365

Beta storefront for Advanta365, an EchoFive product: the change management and user adoption
toolkit for Microsoft 365 and SharePoint Online rollouts. The toolkit is playbooks, templates, field
guides and training, not templates alone. The catalog is still **sample content** (placeholder
listings); checkout, accounts and file delivery are not built yet.

Original design spec (written before the rebuild; its visual design is superseded by
[`docs/design-system.md`](docs/design-system.md)):
`docs/superpowers/specs/2026-10-10-beta-storefront-design.md`

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict), pnpm via corepack.
- Styling: CSS Modules next to each component, reading design tokens defined as CSS custom
  properties in `app/globals.css`. No Tailwind.
- Design: "Wet Ink", one light theme: black ink on white paper, a single light-blue highlighter and
  a near-black footer, with sheets of paper on a light table and real-time ink in water behind a few
  headlines. See `docs/design-system.md`.
- Type: Besley and Atkinson Hyperlegible Next (variable fonts) through `next/font/google`.
- Ink: a fluid simulation of our own on one WebGL2 canvas (`lib/ink/`, `components/ink/`), moved
  between a few stages as the page scrolls. It runs on the home page, the page titles, the footer
  and the 404, never on the catalog, a template, a bundle or the cart; a pause button stands in the
  stage. Where it cannot run (no JavaScript, reduced motion, software rendering, raised contrast)
  settled frames of the same engine, the stills in `public/ink/`, stand in. See
  `docs/architecture.md`.
- Motion: CSS (`app/motion.css`) for entrances that follow the scroll, the ninety, the change of
  page (view transitions) and the pointer's light, asked for by attributes. A first visit to the
  home page opens under a cover on which the mark is signed (1.65 seconds, 3.85 with ink), switched on
  by a small inline boot script, once per browser session.
- Graphics: HTML, CSS and inline SVG, and the one canvas. No animation, 3D or scroll library; the
  dependencies are `next`, `react`, `react-dom` and `zod`.
- Catalog records are validated with zod when the catalog loads.
- Tests: Vitest (unit) and Playwright (browser).

## Commands

Uses pnpm (`corepack enable` if `pnpm` is not on your PATH).

| Command          | What it does                                               |
| ---------------- | ---------------------------------------------------------- |
| `pnpm install`   | Install dependencies                                       |
| `pnpm dev`       | Run the site at http://localhost:3000                      |
| `pnpm lint`      | ESLint (React Compiler rules are errors)                   |
| `pnpm typecheck` | Generate route types, then TypeScript                      |
| `pnpm test`      | Unit tests (Vitest), including the design gate             |
| `pnpm test:e2e`  | Browser tests (Playwright; builds and serves on port 3100) |
| `pnpm build`     | Production build                                           |
| `pnpm format`    | Prettier                                                   |

And the scripts:

| Command                                                | What it does                                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `node scripts/ink-stills.mjs`                          | Captures the eleven stills into `public/ink/` (needs a build and a GPU)                  |
| `node scripts/ink-stills.mjs --check`                  | Checks the stills keep their caps under every calm zone at seven widths                  |
| `node scripts/ink-stills.mjs --blue`                   | Checks that the light blue stays light                                                   |
| `node scripts/ink-stills.mjs --sheets`                 | Saves contact sheets of every scene into `.qa-shots/final/`                              |
| `node scripts/check-budgets.mjs http://localhost:3100` | Checks the first-load scripts and the engine chunk against `tests/budgets/baseline.json` |
| `node scripts/paper-grain.mjs`                         | Writes `public/paper/grain.png`                                                          |

First run of the browser tests needs `pnpm exec playwright install chromium`. The browser tests
reuse a server already running on port 3100 unless `CI` is set, so stop a stale server first. There
are four projects: `chromium`, `mobile`, `gpu` (the live ink, on a graphics card, after the others)
and `firefox` (registered only where the installed Firefox starts). The ink and its specs need
Chromium's GPU arguments (`--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu` on Windows); the
config sets them for `gpu`.

## Layout

```
app/
  layout.tsx              Root html and body, the two fonts, the boot script, MotionRoot
  globals.css             Design tokens, the five [data-band] surfaces, base rules, the type classes
  motion.css              The motion system (entrances, the ninety, the change of page, the light)
  icon.svg                The site icon (with globals.css, the only file that holds raw colour)
  (site)/                 Public pages inside the site shell (skip link, beta strip, sticky bar,
                          phase rail, main, footer, the ink layer)
    page.tsx              Home: the array of sections, in order
    catalog/ phases/[phase]/ templates/[slug]/ bundles/ bundles/[slug]/ cart/
    pricing/ about/ contact/
    sample/               /sample: the worked example, described (its file is not offered in this beta)
    [...rest]/            Calls notFound(), so unknown paths keep the site shell
  (lab)/ink-lab/          The ink on a mock stage, in development only
  not-found.tsx           404 outside the site group
components/
  ui/                     Primitives: Band, Wrap, Split, Sheet, BandedList (a ledger), RowLink, Button,
                          Tally, Blank, Tag, Icon, TransitionLink, and the motion and paper ones:
                          Appear, MotionRoot, PageShift, CountUp, Odometer, PaperSheet, PaperStack,
                          Folder
  layout/                 Header, PrimaryNav, NavDrawer, PhaseRail, Footer, BetaStrip, TitleBlock,
                          Breadcrumbs
  not-found/              MissingPage (the 404 content) and AskedPath
  ink/                    The ink layer: InkBackdrop, InkLayer, the controller, the lab
  intro/                  The cover of a first visit to the home page, and the tag that prints the
                          boot script
  home/                   Home page sections, top to bottom: hero, #featured, #inside (with the
                          specimen), #bundles, #problem and #solution (the ninety), #practice,
                          #values, the built-for row, #closing
  catalog/ cart/ product/ Feature components
  company/                About, Pricing, Contact and Sample pieces: statement section, AI statement,
                          comparison table, buyer list, ways to buy, FAQ
content/                  The sample catalog: seven phases, one template file per phase, bundles, taxonomy
lib/
  site.ts                 Site name, parent company, tagline, and the toolkit counts (TOOLKIT)
  catalog/                Schemas, validation, repository, query, URL state, pricing, phase coverage
  cart/                   Cart store (pure logic)
  brand/mark.ts           The logo mark (single source of truth)
  cx.ts                   cx() and cssVars()
  ink/                    The ink: the engine (engine/), the seven scenes, stage choice, calm zones,
                          pigments, the stills manifest, the test hook
  boot/                   The boot script and the decisions it mirrors
  scroll/                 The observer for entrances and the pointer's light
  compounds.ts            Finds the hyphenated compounds of a title (kept unbroken in card titles)
public/ink/               The eleven stills (WebP, at most 90KB each), captured by scripts/ink-stills.mjs
public/paper/             The paper grain
scripts/                  ink-stills, check-budgets, paper-grain
tests/unit                Vitest, including the design gate
tests/e2e                 Playwright (specs, helpers.ts, support/)
tests/budgets             The first-load baseline check-budgets compares with
proxy.ts                  Redirects mixed-case URLs to lower-case
docs/                     Design system, architecture
```

Rules the code relies on:

- Pages and components never import from `content/` (ESLint enforces it). They call
  `lib/catalog/repository.ts`. The one exception is `content/taxonomy.ts`.
- Catalog search, filters, sort and page live in the URL, so every view is shareable and
  server-rendered.
- Colours, spacing, type, and motion come from tokens in `app/globals.css`. Component CSS, TSX and
  shaders contain no raw colour values: raw colour lives in `app/globals.css` and `app/icon.svg`
  only (the engine reads its six pigments from `--pigment-*`).
- At most one canvas, created by the ink layer, inside an ink slot; a page marks the copy ink must
  keep clear of with `data-ink-calm`. Nothing animates a shadow or a custom property, nothing
  repeats, and every animation sits in the no-preference query. Layout
  space is a step of the 7px scale (`--s-1` to `--s-9`), and the only layout breakpoints are `40em`
  and `68em`.
- Internal links use `TransitionLink` (or a primitive built on it). Only
  `components/ui/transition-link.tsx` imports `next/link`.
- Each page has exactly one `<h1>`, whose text is the page title, and the shell has one `banner`, one
  `main` and one `contentinfo`. Exactly one navigation is named "Rollout phases" (the footer), and
  exactly one searchbox is named "Search templates" (the catalog).
- The catalog result count and the add-to-cart confirmation are the only `role="status"` elements.
  Only template and bundle cards are `<article>`.
- Any `localStorage` or `sessionStorage` access is wrapped in try/catch.
- Prices are integer cents.

`pnpm test` includes a design gate (`tests/unit/design-gate.test.ts`) that enforces the raw-colour,
breakpoint, `next/link`, dependency, `infinite` and scoped-technique rules above (a canvas, WebGL,
`requestAnimationFrame` and scroll listeners only where the ink and the motion live), and keeps the
retired design's names and techniques out of the source.

### What was and was not tested

Tested: Chromium on desktop and as a Pixel 7, with and without view timelines, with the live ink on a
graphics card (Intel Iris Xe, Direct3D) and on a software renderer, under reduced motion, raised
contrast, without WebGL2 and without JavaScript. Not tested: Safari and WebKit (not installed, and
nothing is downloaded), Firefox on this machine (its copy cannot start; the same code path is
exercised in Chromium with `CSS.supports` stubbed) and real phones. Of the specification's two optional
realism items for the ink, neither shipped.

## Documentation

- [`docs/design-system.md`](docs/design-system.md): the Wet Ink design: concept, colour and the
  `data-band` surfaces, type, the 7px scale, the motion system, depth and paper objects, the ink
  (stages, legibility, the pause control, stills, the cover), primitives, CSS Modules rules, the
  design gate and the accessibility floor.
- [`docs/architecture.md`](docs/architecture.md): server and client boundaries, routes, the site
  shell, the ink layer and the engine with its tiers, the boot script and the cover with their
  fail-safes, motion, the stills script, budgets, test hooks, the test contract, fallbacks.

## Replacing the sample content

The catalog is organized by seven phases, in rollout order: Make the case (`make-the-case`), Plan
(`plan`), Design (`design`), Prepare (`prepare`), Communicate (`communicate`), Execute (`execute`)
and Sustain (`sustain`). Each phase has two steps.

1. Edit `content/phases.ts` to change phase and step names. Two places name the phases in plain
   text and do not follow that file: the catalog page writes the count out ("seven") and the
   playbooks row of the toolkit list on the home page (`components/home/inside-section.tsx`) lists
   the phase names.
2. Replace the entries in `content/templates/` and `content/bundles.ts`. There is one template file
   per phase (`make-the-case.ts`, `plan.ts`, and so on); `content/templates/index.ts` joins them in
   phase order. Real entries set `isSample: false` (do not use the `sample()` helper).
3. Run `pnpm test`. The build fails with the record and field named if an entry is invalid, a slug
   is duplicated, or a bundle points at a missing template.

The toolkit counts shown on the site (playbooks, templates, field guides, job aids, training
audiences, years of experience) live in `TOOLKIT` in `lib/site.ts`; pages read them from there.
The one exception is "30+ years" inside three sentences quoted whole from the messaging document
(`components/home/hero.tsx` and `components/home/values-section.tsx`). The counts describe the full
toolkit, not the number of listings in the catalog, and no page may state or imply that the catalog
lists that many.

The home page is one array of sections in `app/(site)/page.tsx`, top to bottom: the hero, `#featured`, `#inside` (with the
specimen), `#bundles`, `#problem` and `#solution`, `#practice`, `#values`,
the built-for row and `#closing`. Reordering the page is reordering that array. Two parts follow the
catalog on their own: the specimen sheet shows the first featured template (the first template if none
is featured), and the phase coverage on each bundle card is worked out from the bundle's templates
(`phaseCoverage()` in `lib/catalog/coverage.ts`).

The beta strip disappears once no record has `isSample: true`. The other places that call the
catalog a sample are plain text and need editing by hand: the catalog lead and its metadata
(`app/(site)/catalog/page.tsx`), the "Browse the sample catalog" links on the home page and on
`/sample`, the footer line, and the note in `components/product/purchase-panel.tsx`. Some tests in
`tests/unit/content.test.ts` and `tests/e2e` assert on the sample catalog and will need updating
with the real one.

## Path to production

| Need                   | Where it plugs in                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Real catalog           | Replace files in `content/`                                                                                               |
| Database or CMS        | New implementation of `lib/catalog/repository.ts` (its functions are already async)                                       |
| Payments               | A checkout route and server action that read the cart; replace the disabled button in `components/cart/cart-contents.tsx` |
| Accounts and downloads | A new route group; `Template` gains file references                                                                       |
| Analytics, SEO extras  | `app/layout.tsx` and page metadata                                                                                        |

## Before public launch

The first five items come from the owner's pitch and messaging document (2026-10-10), in his
words; the second is given without the names it lists. Under each is where the site stands today.
The last two are about the site itself. None of this is legal advice.

- [ ] **Prosci wording.** Prosci and ADKAR are Prosci's trademarks. "Built by a Prosci-certified
      practitioner" describes the owner, which is fine if the certification is current.
      "Prosci-aligned" or "Prosci-approved content" suggests an endorsement Prosci hasn't given.
      Keep Prosci on the person, not the product, and check Prosci's trademark-use guidance at
      prosci.com.
  - On the site: Prosci appears only as "built by a Prosci-certified practitioner", "Prosci
    certification" and the footer's non-affiliation and trademark notice. ADKAR appears in no
    visible copy; the `adkar` field on a template is data and is not rendered.
- [ ] **Old product branding.** Client references (department names and terms, client platform
      names) were removed from the source material. The earlier product name is now Advanta365
      throughout, and the content for the other earlier product and for the provisioning tool has
      been removed. One government platform name stays only in labelled government examples.
  - On the site: none of these names appears. This README does not spell them out either; the
    list is the `banned` pattern in `tests/unit/content.test.ts`, which checks every phase, step,
    template and bundle text. Run the same search over the real files before they are offered.
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
      match the folder as of the date of that document. If the catalog sells pieces separately,
      show the counts per bundle instead.
  - On the site: the counts are read from `TOOLKIT` in `lib/site.ts`. Recount the folder before
    launch and change them there.
- [ ] **The worked example's file.** `/sample` describes the Meridian Group worked example and
      says its file cannot be downloaded in this beta. It needs the real file. The sample catalog
      also lists the worked example with a placeholder price and puts it in two bundles; decide
      whether it is a free sample, a product, or both.
- [ ] **Pricing answers.** The answers on `/pricing` are provisional and say so on the page.
      Licence terms, updates and purchase orders describe the intent only. Replace them, and the
      placeholder prices of the sample catalog, once the commercial terms are set.
