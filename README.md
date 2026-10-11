# Advanta365

Beta storefront for change management and user adoption templates for Microsoft 365 and
SharePoint rollouts. The catalog is **sample content**; checkout, accounts and file delivery are
not built yet.

Original design spec (written before the rebuild):
`docs/superpowers/specs/2026-10-10-beta-storefront-design.md`

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict), pnpm via corepack.
- Styling: CSS Modules next to each component, reading design tokens defined as CSS custom
  properties in `app/globals.css`. No Tailwind.
- Type: Instrument Sans (variable font) through `next/font/google`.
- Graphics: raw WebGL2 for the hero ribbons, the metallic swirl, the chrome logo and the sheen
  text. No three.js, GSAP or smooth-scroll library. Every canvas has a non-WebGL fallback.
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
| `pnpm test`      | Unit tests (Vitest)                                        |
| `pnpm test:e2e`  | Browser tests (Playwright; builds and serves on port 3100) |
| `pnpm build`     | Production build                                           |
| `pnpm format`    | Prettier                                                   |

First run of the browser tests needs `pnpm exec playwright install chromium`. The browser tests
reuse a server already running on port 3100 unless `CI` is set, so stop a stale server first.

## Layout

```
app/
  layout.tsx              Root html and body, font, pre-paint entry script, no-JS reveal fallback
  globals.css             Design tokens, theme scopes, base rules, global utility classes
  (site)/                 Public pages inside the site shell (skip link, beta bar, header, main, footer)
    page.tsx              Home
    catalog/ phases/[phase]/ templates/[slug]/ bundles/ bundles/[slug]/ cart/
    pricing/ about/ contact/
    [...rest]/            Calls notFound(), so unknown paths keep the site shell
  not-found.tsx           404 outside the site group
components/
  ui/                     Primitives: Text, Container, SectionShell, DetailCard, Button, WipeButton, ...
  motion/                 Reveal, RevealGroup, GatherReveal, PageFade, TransitionLink, ThemeScroll
  graphics/               hero-liquid, metallic-swirl, chrome-symbol, sheen-text (WebGL2, loaded after hydration)
  entry/                  First-load overlay and its inline script
  layout/                 Header, Menu, Footer, BetaBar, PageTitle, not-found content
  home/                   Home page sections
  catalog/ cart/ product/ company/   Feature components
content/                  The catalog: phases, templates, bundles, taxonomy
lib/
  catalog/                Schemas, validation, repository, query, URL state, pricing
  cart/                   Cart store (pure logic)
  motion/                 Page-ready gate, reduced motion, theme requests, durations, word splitting
  gl/                     Shared WebGL2 program helpers
  brand/mark.ts           The logo mark (single source of truth)
  cx.ts                   cx() and cssVars()
tests/unit                Vitest
tests/e2e                 Playwright
proxy.ts                  Redirects mixed-case URLs to lower-case
docs/                     Design system, architecture, graphics tuning
```

Rules the code relies on:

- Pages and components never import from `content/` (ESLint enforces it). They call
  `lib/catalog/repository.ts`. The one exception is `content/taxonomy.ts`.
- Catalog search, filters, sort and page live in the URL, so every view is shareable and
  server-rendered.
- Colours, spacing, type, and motion come from tokens in `app/globals.css`. Component CSS and TSX
  contain no raw colour values.
- Internal links use `TransitionLink` (or a primitive built on it). Only
  `components/motion/transition-link.tsx` imports `next/link`.
- Each page has exactly one `<h1>`. Decorative repeated text is drawn with CSS `attr()` inside an
  `aria-hidden` element, never duplicated in the DOM.
- The catalog result count and the add-to-cart confirmation are the only `role="status"` elements.
  Only template and bundle cards are `<article>`.
- Any `localStorage` or `sessionStorage` access is wrapped in try/catch.
- WebGL code is never in the first route chunk. Canvases load their renderer with `import()` after
  hydration, and every canvas has an SVG or CSS fallback.
- Prices are integer cents.

## Documentation

- [`docs/design-system.md`](docs/design-system.md): tokens, themes, primitives, reveal and wipe
  conventions.
- [`docs/architecture.md`](docs/architecture.md): server and client boundaries, the load sequence,
  route transitions, the theme controller, test hooks, fallbacks.
- [`docs/graphics-tuning.md`](docs/graphics-tuning.md): where to change the ribbons, the swirl, the
  logo, the sheen and the reduced-motion behaviour.

## Replacing the sample content

1. Edit `content/phases.ts` to change phase and step names.
2. Replace the entries in `content/templates/` and `content/bundles.ts`. Real entries set
   `isSample: false` (do not use the `sample()` helper).
3. Run `pnpm test`. The build fails with the record and field named if an entry is invalid, a slug
   is duplicated, or a bundle points at a missing template.

The beta banner disappears once no record has `isSample: true`. Some tests in
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

Before public launch: confirm the licensing position for describing the templates as aligned with
Prosci methodology, and replace the provisional copy on the Pricing and About pages.
