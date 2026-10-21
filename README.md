# Advanta365

Advanta365 is the storefront for a change management and user adoption toolkit for Microsoft 365 and
SharePoint Online rollouts. It is an EchoFive product. The toolkit is playbooks, templates, field guides
and training. The site sells one thing: the complete toolkit, for $1,499.99 CAD. Six templates are free
samples; every other template in the catalog is shown locked. There is one Purchase page and no cart.

## Where it stands

- **The catalog is sample content.** Its sections follow the toolkit's real folders; its templates are
  placeholders, and the site labels them as a beta. [`docs/content.md`](docs/content.md) covers
  replacing them.
- **Checkout is built up to payment.** The Checkout button on the Purchase page opens a checkout in a
  pop-up. No payment provider is connected, so its last step offers the order by email and nothing can
  be paid for yet.
- **Delivery works by hand.** The owner turns a paid order's code into a licence link
  (`scripts/mint-licence.mjs`). The link unlocks every template and its files in the buyer's browser.
  Only a local-disk file store exists so far.
- **Before the first sale**, the items in [`docs/launch-checklist.md`](docs/launch-checklist.md) must
  be settled.

## Stack

- Next.js 16 with the App Router, React 19 and TypeScript in strict mode. Packages are installed with
  pnpm. The scripts in `scripts/` need Node 22.18 or later, which runs TypeScript modules directly.
- Styling is CSS Modules, usually one beside each component (the home sections share
  `components/home/home.module.css`). Components read the design tokens that `app/globals.css`
  defines as CSS custom properties.
- Type is Besley for display and Atkinson Hyperlegible Next for text, loaded with `next/font/google`.
- Motion is CSS in `app/motion.css` and the component modules, switched on by attributes. A small
  inline boot script (`lib/boot/boot-script.ts`) sets the root attributes before the first paint.
- Catalog records and the checkout's order are validated with zod.
- The runtime dependencies are `next`, `react`, `react-dom`, `zod`, `@vercel/analytics` and
  `@vercel/speed-insights` (the last two render only on a Vercel deployment). The design gate fails
  `pnpm test` if that list changes.
- Tests use Vitest for units and Playwright for the browser.

## Getting started

```bash
corepack enable
```

```bash
pnpm install
```

```bash
pnpm dev
```

The site runs at http://localhost:3000 with no environment variables: every page renders, and
downloads are off until a file store is configured ([`docs/operations.md`](docs/operations.md#environment-variables)).
The browser tests need Chromium once:

```bash
pnpm exec playwright install chromium
```

## Commands

| Command          | What it does                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm dev`       | Runs the development server at http://localhost:3000                      |
| `pnpm build`     | Builds the production site (`next build`)                                 |
| `pnpm start`     | Serves the production build (`next start`)                                |
| `pnpm lint`      | Runs ESLint over the repository                                           |
| `pnpm typecheck` | Generates the route types, then runs `tsc --noEmit`                       |
| `pnpm test`      | Runs the unit tests with Vitest, including the design gate                |
| `pnpm test:e2e`  | Runs the Playwright browser tests; the config builds and serves port 3100 |
| `pnpm format`    | Runs Prettier over the repository                                         |

The scripts in `scripts/` have no package script. Run them by path from the repository root.

| Command                                                | What it does                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `node scripts/gen-icon.mjs`                            | Writes `app/icon.svg` from the mark in `lib/brand/mark.ts` (run it after any change to the mark)                    |
| `node scripts/gen-favicon.mjs`                         | Writes `app/favicon.ico`, `app/apple-icon.png` and `public/icons/*.png` from the icon (run it after `gen-icon.mjs`) |
| `node scripts/check-budgets.mjs http://localhost:3100` | Checks the home page's script weight against `tests/budgets/baseline.json` (needs a running production server)      |
| `node scripts/paper-grain.mjs`                         | Writes `public/paper/grain.png`                                                                                     |
| `node scripts/mint-licence.mjs <order code>`           | Prints the licence link for a paid order (needs `LICENCE_SECRET`; see [`docs/operations.md`](docs/operations.md))   |

The full e2e suite takes about six minutes. While working, run only the specs a change touches, and
`viewports.spec.ts` for any change to layout or CSS; run the whole suite once before a merge.
[`docs/testing.md`](docs/testing.md) has the projects, every spec and what each guards.

## Folder layout

```
app/
  layout.tsx          Root html and body: the fonts, the root metadata and site structured data, the boot
                      script, MotionRoot, and Vercel Analytics and Speed Insights (on Vercel only)
  globals.css         Design tokens, the data-band surfaces, base rules and the type classes
  motion.css          Motion: entrances, the ninety, page changes, the pointer's light, the hero
  not-found.tsx       The 404 page outside the site group
  (site)/             Public pages inside the site shell
    layout.tsx        Skip link, header, main, footer
    page.tsx          Home: an array of sections, in order
    purchase/ catalog/ phases/[phase]/ why-advanta/ sample/ contact/
    privacy/ terms/ refunds/ accessibility/
                      The four legal pages, each one LegalDocument in the shared LegalPage layout
    not-found.tsx     The 404 page inside the shell
    [...rest]/        Calls notFound(), so unknown paths keep the site shell
  licence/            The licence link: checks it, sets the cookie, goes on to the unlocked catalog
  api/                The file downloads: samples/ (free samples, for anyone) and library/ (with a licence)
  sitemap.ts robots.ts manifest.ts llms.txt/ llms-full.txt/
                      The files for search engines and AI tools
  opengraph-image.tsx The shared-link card (and one beside each page that has its own)
  icon.svg favicon.ico apple-icon.png
                      The site icons (generated: `gen-icon.mjs`, then `gen-favicon.mjs`)
components/
  ui/                 Primitives (docs/design-system.md, section 9)
  layout/             Header, PrimaryNav, PhasesMenu, PurchaseButton, NavDrawer, BrandLink, TitleBlock,
                      Breadcrumbs, Footer, and nav-links.ts
  home/               The home sections: Hero (HeroHeadline, SplitFlap, HeroStage, ProofStrip), featured,
                      inside, the portfolio and the solution band
  catalog/            Template covers, tiles (TemplateTile, LockedTile), the pop-up (TemplateDialog,
                      TemplateDetail, FileDownloads), filters and their chips, search, sort, the result
                      list, the phase pager
  purchase/           Portfolio (the toolkit as a folder), PriceTag and the contents leaf (ContentsLeaf)
  checkout/           The checkout over the Purchase page: CheckoutDialog, its three steps, the order
                      summary and the form fields
  about/              The Why Advanta page's sections: the reasons, the comparison and who it is for
  company/            StatementSection, WorkedExample and NextSteps (the Sample and Why Advanta pages)
  contact/            ContactSection, the whole Contact page as one section
  legal/              LegalPage, the one layout of the four legal pages
  intro/              The cover of a first visit, and the tag that prints the boot script
  not-found/          MissingPage, AskedPath and LateBoot
  seo/                JsonLd, the structured data tag
content/              The sample catalog: the 13 sections, one template file per section, the sample()
                      helper, the taxonomy, the checkout's countries, and the worked example's contents
lib/
  site.ts             SITE (name, parent company, tagline, summary, contact address), TOOLKIT counts, OFFER (the one
                      price), and the link lists (NAV, PURCHASE_LINK, CONTACT_LINK, LEGAL_LINKS)
  format.ts           formatPrice, formatLength (slides or pages), formatBytes and countWord
  cx.ts               cx() for class names and cssVars() for custom properties
  compounds.ts        Hyphenated compounds, kept whole in titles
  history.ts          Whether the previous history entry is a given address (closing a pop-up)
  scrim.ts            Tells a click on a dialog's dimmed page from a drag that ended there
  brand/mark.ts       The logo mark geometry, the single source of truth
  catalog/            Schemas, validation, repository, query, URL state, phase coverage and neighbours,
                      the worked example's contents
  checkout/           The order's schemas (zod/mini), the draft kept in session storage, the step
                      machine, the order's code, text and mailto, and provider.ts: the payment seam
  boot/               The boot script and the pure decisions it mirrors
  legal/              The four legal pages as data, their types, and facts.ts: LEGAL, the one object of
                      facts and decisions the owner fills in
  scroll/             The observer for entrances, the pointer's light, and a sideways row's current item
                      brought into view
  files/              The file store (FileStore, the local-disk driver), the allowed file types and the
                      download responses
  licence/            Signed licences, the cookie they live in, and hasLicence() for a request
  http/               The in-memory rate limiter
  seo/                SITE_ORIGIN, page metadata, structured data, the shared-link card and llms.txt
public/               The paper grain and the manifest's icons
scripts/              gen-icon, gen-favicon, check-budgets, paper-grain and mint-licence
tests/unit/           Vitest, including the design gate, and fixtures/catalog.ts
tests/e2e/            Playwright specs, helpers.ts and support/
tests/fixtures/files/ Small fixture files the tests serve in place of real templates
tests/budgets/        The baseline that check-budgets compares with
docs/                 The documentation (below)
proxy.ts              Redirects mixed-case paths to lower case
next.config.ts        Redirects the retired addresses and sets the security headers
PRODUCT.md DESIGN.md  The product brief and the design brief (read by the Impeccable design tool, whose
                      settings are in .impeccable/)
CLAUDE.md             Working agreements for Claude Code in this repository
```

## Rules the code relies on

Each rule names the check that enforces it, where there is one.

- **Catalog reads go through the repository.** Pages and components import from
  `lib/catalog/repository.ts`, never from `content/` (ESLint, for `app/` and `components/`). The one
  exception is `content/taxonomy.ts`, which holds the labels and lists of deliverable types, apps,
  audiences, formats and ADKAR stages. Code in `lib/` may read `content/` (the checkout's places do).
- **Catalog state lives in the URL.** Search (`q`), `phase`, `type`, `app`, `audience`, `format`, `free`
  (`1` keeps the free samples), `sort` (`samples`, `phase` or `title`) and `page` are query parameters, and
  `view` (a template's slug) opens a template in the pop-up (a free sample, or any template for a
  licence holder), so every view can be shared and is rendered on the server. Values within one filter
  combine with OR, filters combine with AND, and a page holds 24 templates.
- **Colour, spacing, type and motion are tokens.** Raw colour values (hex and the colour functions)
  appear only in `app/globals.css` and `app/icon.svg` (the design gate, over `app/`, `components/` and
  `lib/`).
- **Layout space is the 7px scale**, `--s-1` (7px) to `--s-9` (168px). The only layout breakpoints are
  `40em` and `68em`.
- **Sizes and spaces are in rem, so a large monitor scales the page as one piece.** Past a 1600px window
  the root font size grows (16px to 1600px, 22.4px from about 2880px), and so do the type, the space,
  the controls and the icons. The breakpoints are in em, which the root size does not move. What stays
  in pixels is hairlines, edges, corner radii and shadows.
- **Media queries come from a fixed list** of seven, and `@container` appears only in the header and
  navigation drawer stylesheets (the design gate). Stylesheets do not use `prefers-color-scheme`; the
  site sets `color-scheme: light` on `:root`.
- **Motion waits for permission.** Every keyframe and animation in `app/motion.css` is inside
  `(prefers-reduced-motion: no-preference)` (`kit-motion.test.ts`); component stylesheets do the same or
  switch off under `reduce`, and the cover exists only when the boot script has allowed motion. No CSS
  animation repeats without end (the design gate bans `infinite`); the one repeat, the hero's
  split-flap word, has a Pause button.
- **No canvas or WebGL; animation frames and scroll listeners have fixed homes.** `<canvas`,
  `getContext(` and `webgl` appear nowhere under `app/`, `components/` or `lib/`.
  `requestAnimationFrame` belongs in `lib/scroll/`, `lib/boot/` or `components/intro/`, and scroll
  listeners in `lib/scroll/` (the design gate).
- **Internal links use `TransitionLink`**, or a primitive built on it. Only
  `components/ui/transition-link.tsx` imports `next/link` (the design gate).
- **Each page has one `h1`**, its title. The shell provides one `banner` (the header), one `main` and one
  `contentinfo` (the footer) (`identity.spec.ts`, `viewports.spec.ts`).
- **Storage access is guarded.** Every `localStorage` or `sessionStorage` access is wrapped in
  try/catch, and the page renders without it (by review; `intro.spec.ts` checks blocked storage).
- **The price is written once.** `OFFER.priceCents` in `lib/site.ts` is integer cents (149999) and
  `OFFER.currency` its currency ("CAD"); `formatPrice` in `lib/format.ts` prints them as $1,499.99 CAD.
- **Exactly six templates are free.** `free: true` marks them, and validation fails with any other
  count.

## Documentation

| Document                                               | What it covers                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)         | How the site works: routes and redirects, metadata and AI search files, server and client boundaries, the catalog's data flow, the checkout and its payment seam, files and licences, the site shell, the boot script and the cover, motion, catalog URL state, test hooks, budgets and failure modes |
| [`docs/design-system.md`](docs/design-system.md)       | The visual system: colour and contrast, bands, type, the 7px scale and layout, depth, motion, every primitive, the logo, and the accessibility floor                                                                                                                                                  |
| [`docs/testing.md`](docs/testing.md)                   | The commands, every unit test and browser spec, the design gate, budgets, and how to add a test                                                                                                                                                                                                       |
| [`docs/operations.md`](docs/operations.md)             | Environment variables, the file store, issuing and revoking licences, deploying on Vercel, security headers, rate limits, and the seams a production build connects to                                                                                                                                |
| [`docs/content.md`](docs/content.md)                   | The catalog's records, replacing the sample content, and every place a count or a sample label is written by hand                                                                                                                                                                                     |
| [`docs/launch-checklist.md`](docs/launch-checklist.md) | What must be settled before the first sale                                                                                                                                                                                                                                                            |
| [`docs/superpowers/`](docs/superpowers/README.md)      | Dated design records of earlier work (specs and plans), kept for their reasoning                                                                                                                                                                                                                      |
| [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md)   | The product brief (buyers, positioning, constraints) and the design brief, read by the Impeccable design tool                                                                                                                                                                                         |
