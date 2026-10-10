# Advanta365

Beta storefront for change management and user adoption templates for Microsoft 365
rollouts. The catalog shown is **sample content**; checkout, accounts and file
delivery are not built yet.

Design: `docs/superpowers/specs/2026-10-10-beta-storefront-design.md`

## Commands

Uses pnpm (`corepack enable` if `pnpm` is not on your PATH).

| Command          | What it does                                               |
| ---------------- | ---------------------------------------------------------- |
| `pnpm install`   | Install dependencies                                       |
| `pnpm dev`       | Run the site at http://localhost:3000                      |
| `pnpm lint`      | ESLint                                                     |
| `pnpm typecheck` | Generate route types, then TypeScript                      |
| `pnpm test`      | Unit tests (Vitest)                                        |
| `pnpm test:e2e`  | Browser tests (Playwright; builds and serves on port 3100) |
| `pnpm build`     | Production build                                           |
| `pnpm format`    | Prettier                                                   |

First run of the browser tests needs `pnpm exec playwright install chromium`.

## Layout

```
app/            Routes. Thin: they load data and compose components.
components/
  ui/           Buttons, badges, inputs, pagination
  layout/       Header, footer, container, breadcrumbs
  catalog/      Template and bundle cards, filters, search, results
  cart/         Cart hook, button, add-to-cart, cart contents
content/        The catalog itself: phases, templates, bundles, taxonomy
lib/
  catalog/      Schemas, validation, repository, query, URL state, pricing
  cart/         Cart logic
tests/unit      Vitest
tests/e2e       Playwright
proxy.ts        Redirects mixed-case URLs to lower-case
```

Rules the code relies on:

- Pages and components never import from `content/` (ESLint enforces it). They
  call `lib/catalog/repository.ts`. The one exception is `content/taxonomy.ts`,
  which holds enum values and labels.
- Catalog search, filters, sort and page live in the URL, so every view is
  shareable and server-rendered.
- Every color is a token in `app/globals.css`.
- Prices are integer cents.

## Replacing the sample content

1. Edit `content/phases.ts` to change phase and step names.
2. Replace the entries in `content/templates/` and `content/bundles.ts`. Real
   entries set `isSample: false` (do not use the `sample()` helper).
3. Run `pnpm test`. The build fails with the record and field named if an entry
   is invalid, a slug is duplicated, or a bundle points at a missing template.

The beta banner disappears once no record has `isSample: true`. Some tests in
`tests/unit/content.test.ts` and `tests/e2e` assert on the sample catalog and
will need updating with the real one.

## Path to production

| Need                   | Where it plugs in                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Real catalog           | Replace files in `content/`                                                                                               |
| Database or CMS        | New implementation of `lib/catalog/repository.ts` (its functions are already async)                                       |
| Payments               | A checkout route and server action that read the cart; replace the disabled button in `components/cart/cart-contents.tsx` |
| Accounts and downloads | A new route group; `Template` gains file references                                                                       |
| Analytics, SEO extras  | `app/layout.tsx` and page metadata                                                                                        |

Before public launch: confirm the licensing position for describing the
templates as aligned with Prosci methodology, and replace the provisional copy
on the Pricing and About pages.
