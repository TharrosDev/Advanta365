# Advanta365 Beta Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browsable beta storefront for ~60 sample change-management templates, on a code base that grows into the production site.

**Architecture:** Next.js App Router pages are thin server components that read the catalog only through an async repository. Filtering, search, sorting and pagination are pure functions driven by URL parameters. The cart is the only client state, a small store behind a provider.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, Zod, ESLint, Prettier, Vitest, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-10-beta-storefront-design.md`

## Global Constraints

- Pages and components never import from `content/`; only `lib/catalog/repository.ts` does. Enforced by ESLint `no-restricted-imports` on `app/**` and `components/**`. (`content/taxonomy.ts` is exempt: it holds enum values and labels.)
- All repository functions are `async`.
- No component-library dependency; UI primitives live in `components/ui`.
- Import alias `@/*` maps to the repo root.
- Prices are integer cents, displayed in USD.
- Catalog page size is 24.
- Light theme only; every color comes from a CSS variable token.
- WCAG 2.1 AA contrast, visible focus rings, full keyboard access.
- "Prosci" appears only descriptively ("aligned with Prosci methodology"). "ADKAR" does not appear in UI copy.
- Every sample record has `isSample: true`.
- Each task ends with `pnpm lint && pnpm typecheck && pnpm test` passing, then a commit ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Search text containing regex characters (`(`, `*`, `\`) or 500+ characters is matched literally and never throws. → Task 3.
2. Hand-edited URLs: unknown filter values, repeated keys, `page=abc`, `page=-3`, `page=9999` are ignored or clamped, never a 500. → Tasks 3, 4.
3. Filters that combine to zero results show the empty state with a working "Clear filters" link, and facet counts still render. → Tasks 3, 12.
4. `localStorage` throws (private mode) or holds garbage or stale slugs: the cart still works in memory and drops bad lines. → Task 6, 11.
5. Unknown, upper-cased or URL-encoded slugs on `/templates/[slug]`, `/bundles/[slug]`, `/phases/[phase]` return the 404 page. → Task 12.

## File Map

```
eslint.config.mjs  .prettierrc  vitest.config.ts  playwright.config.ts  postcss.config.mjs
app/globals.css  app/layout.tsx  app/not-found.tsx
app/(site)/layout.tsx  page.tsx  catalog/  phases/[phase]/  templates/[slug]/
           bundles/  bundles/[slug]/  pricing/  about/  contact/  cart/
components/ui/{button,badge,card,input,checkbox,select,pagination}.tsx
components/layout/{header,footer,container,breadcrumbs,beta-banner}.tsx
components/catalog/{template-card,bundle-card,filter-panel,search-box,sort-select,result-list,phase-nav}.tsx
components/cart/{cart-provider,cart-button,add-to-cart,cart-contents}.tsx
content/{taxonomy,phases,bundles}.ts  content/templates/{prepare,manage,sustain,index}.ts
lib/catalog/{schema,validate,query,search-params,pricing,repository}.ts
lib/cart/store.ts  lib/format.ts  lib/site.ts
tests/unit/*.test.ts  tests/e2e/*.spec.ts
```

---

### Task 1: Tooling baseline

**Files:** Create `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `postcss.config.mjs`, `app/globals.css`, `tests/unit/smoke.test.ts`. Modify `package.json`, `tsconfig.json`, `app/layout.tsx`, `.gitignore`.

**Produces:** scripts `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `format` (`prettier --write .`); alias `@/*`; Tailwind v4 active.

- [ ] **Step 1:** `pnpm add zod` and `pnpm add -D tailwindcss @tailwindcss/postcss eslint eslint-config-next prettier prettier-plugin-tailwindcss vitest`.
- [ ] **Step 2:** `tsconfig.json`: confirm `"strict": true`, add `"noUncheckedIndexedAccess": true` and `"paths": { "@/*": ["./*"] }`.
- [ ] **Step 3:** `eslint.config.mjs`: flat config extending `eslint-config-next` (core-web-vitals + typescript); add `no-restricted-imports` for files `app/**` and `components/**` forbidding patterns `@/content/*` except `@/content/taxonomy`. Ignore `.next`, `node_modules`, `playwright-report`, `test-results`.
- [ ] **Step 4:** `postcss.config.mjs` with `@tailwindcss/postcss`; `app/globals.css` containing `@import "tailwindcss";`; import it in `app/layout.tsx` and remove the inline body styles.
- [ ] **Step 5:** `vitest.config.ts`: `include: ["tests/unit/**/*.test.ts"]`, alias `@` to repo root. Add `tests/unit/smoke.test.ts` asserting `1 + 1 === 2`.
- [ ] **Step 6:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: all exit 0.
- [ ] **Step 7:** Commit `chore: add tailwind, lint, format and test tooling`.

### Task 2: Taxonomy, schemas and validation

**Files:** Create `content/taxonomy.ts`, `lib/catalog/schema.ts`, `lib/catalog/validate.ts`, `tests/unit/validate.test.ts`.

**Produces:**
```ts
// content/taxonomy.ts — each: readonly tuple of values + Record<value, label>
DELIVERABLE_TYPES = ["communication","training","assessment","plan","stakeholder","sponsor","resistance","measurement","governance"]
APPS = ["sharepoint","teams","onedrive","outlook","copilot","m365-general"]
AUDIENCES = ["sponsor","change-lead","manager","end-user","it-admin"]
FORMATS = ["docx","pptx","xlsx","pdf"]
ADKAR = ["awareness","desire","knowledge","ability","reinforcement"]
DELIVERABLE_TYPE_LABELS, APP_LABELS, AUDIENCE_LABELS, FORMAT_LABELS

// lib/catalog/schema.ts — Zod schemas + inferred types, fields exactly as the spec's data model
StepSchema, PhaseSchema, TemplateSchema, BundleSchema
type Step, Phase, Template, Bundle, DeliverableType, App, Audience, Format
type Catalog = { phases: Phase[]; templates: Template[]; bundles: Bundle[] }

// lib/catalog/validate.ts
class CatalogError extends Error
validateCatalog(input: { phases: unknown[]; templates: unknown[]; bundles: unknown[] }): Catalog
```
Schema rules: `slug` matches `/^[a-z0-9]+(-[a-z0-9]+)*$/`; `priceCents` positive integer; `apps`, `audiences`, `includes` non-empty; `templateSlugs` at least 2. `validateCatalog` returns phases sorted by `order` (steps too).

- [ ] **Step 1: Failing tests** in `tests/unit/validate.test.ts`, built from a small valid fixture:
  - valid fixture returns a `Catalog` with phases sorted by `order`
  - template with `priceCents: 0` → throws `CatalogError` whose message contains the template slug and `priceCents`
  - two templates with the same slug → message contains `duplicate` and the slug
  - bundle and template sharing a slug is allowed
  - template with `phase: "nope"` → message contains `nope`
  - template whose `step` belongs to a different phase → throws
  - bundle referencing `missing-template` → message contains `missing-template`
  - template with `deliverableType: "poster"` → throws
- [ ] **Step 2:** Run `pnpm test validate`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement the three files.
- [ ] **Step 4:** Run `pnpm test validate`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: catalog schemas and integrity validation`.

### Task 3: Catalog query

**Files:** Create `lib/catalog/query.ts`, `tests/unit/query.test.ts`.

**Consumes:** `Template`, enum types (Task 2).

**Produces:**
```ts
export const PAGE_SIZE = 24
export type SortKey = "featured" | "title" | "price-asc" | "price-desc"
export type FacetKey = "phase" | "type" | "app" | "audience" | "format"
export type CatalogCriteria = {
  q: string; phase: string[]; type: DeliverableType[]; app: App[];
  audience: Audience[]; format: Format[]; sort: SortKey; page: number
}
export const DEFAULT_CRITERIA: CatalogCriteria   // q "", empty arrays, sort "featured", page 1
export type CatalogResult = {
  items: Template[]; total: number; page: number; pageCount: number;
  facets: Record<FacetKey, Record<string, number>>
}
export function queryTemplates(templates: Template[], criteria: CatalogCriteria): CatalogResult
```
Semantics: values within one facet are OR, facets are AND. `q` is split on whitespace; every term must appear, case-insensitively, as a literal substring of `title + summary + description`. `featured` sort: featured first, then title A–Z. `pageCount` is at least 1; `page` is clamped to `[1, pageCount]`. Each facet's counts are computed with every other filter and `q` applied but that facet's own selection ignored.

- [ ] **Step 1: Failing tests** over a fixture of ~30 generated templates:
  - default criteria: `total` 30, `items.length` 24, `pageCount` 2
  - single filter per facet (five tests), each returning only matching items
  - `app: ["sharepoint","teams"]` returns items having either
  - `phase` + `type` together returns only items matching both
  - `q: "kickoff DECK"` matches a title "Sponsor Kickoff Deck"; `q: "kickoff zzz"` matches none
  - `q: "(a*\\"` and a 600-character `q` return `total: 0` without throwing
  - each sort key yields the expected first three slugs
  - `page: 2` returns the remaining 6; `page: 0`, `-3`, `9999` clamp to 1, 1, 2
  - zero-result criteria: `items: []`, `total: 0`, `page: 1`, `pageCount: 1`, facets object still has all five keys
  - facet rule: with `type: ["training"]` selected, `facets.type.communication` equals the count of communication items matching the other filters, and `facets.phase` counts only training items
- [ ] **Step 2:** Run `pnpm test query`. Expected: FAIL.
- [ ] **Step 3:** Implement `queryTemplates`.
- [ ] **Step 4:** Run `pnpm test query`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: catalog filter, search, sort and pagination`.

### Task 4: URL state

**Files:** Create `lib/catalog/search-params.ts`, `tests/unit/search-params.test.ts`.

**Consumes:** `CatalogCriteria`, `DEFAULT_CRITERIA`, `SortKey` (Task 3); enums (Task 2).

**Produces:**
```ts
export function parseCatalogParams(
  sp: Record<string, string | string[] | undefined>, phaseSlugs: string[]
): CatalogCriteria
export function serializeCatalogParams(c: CatalogCriteria): string  // "" or "q=...&phase=a,b"
```
Multi-value facets are comma-separated in one key. Serialization omits defaults and emits keys in the order `q, phase, type, app, audience, format, sort, page`. `q` is trimmed and capped at 200 characters.

- [ ] **Step 1: Failing tests:**
  - `{}` → `DEFAULT_CRITERIA`
  - `{ type: "training,plan", app: "teams" }` parses to both arrays
  - unknown values dropped: `{ type: "training,poster", phase: "nope" }` → `type: ["training"]`, `phase: []`
  - repeated keys `{ app: ["teams","sharepoint,teams"] }` → `["teams","sharepoint"]` (merged, de-duplicated)
  - `page`: `"abc"`, `"-3"`, `"0"`, `"2.5"` → 1; `"3"` → 3
  - `sort: "random"` → `"featured"`
  - `q` of 500 characters is cut to 200; `"  hi  "` → `"hi"`
  - `serializeCatalogParams(DEFAULT_CRITERIA) === ""`
  - round trip: `parse(Object.fromEntries(new URLSearchParams(serialize(c))))` deep-equals `c` for a criteria object using every field
- [ ] **Step 2:** Run `pnpm test search-params`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: catalog URL state parsing and serialization`.

### Task 5: Sample content, pricing and repository

**Files:** Create `content/phases.ts`, `content/templates/{prepare,manage,sustain,index}.ts`, `content/bundles.ts`, `lib/catalog/pricing.ts`, `lib/catalog/repository.ts`, `tests/unit/content.test.ts`, `tests/unit/pricing.test.ts`.

**Consumes:** `validateCatalog`, types (Task 2).

**Produces:**
```ts
// lib/catalog/pricing.ts
bundleValueCents(templates: Template[]): number
bundleSavingsCents(bundle: Bundle, templates: Template[]): number   // never below 0

// lib/catalog/repository.ts — validates once at module load
getPhases(): Promise<Phase[]>
getPhase(slug: string): Promise<Phase | undefined>
getTemplates(): Promise<Template[]>
getTemplate(slug: string): Promise<Template | undefined>
getBundles(): Promise<Bundle[]>
getBundle(slug: string): Promise<Bundle | undefined>
getBundleTemplates(bundle: Bundle): Promise<Template[]>
getBundlesContaining(templateSlug: string): Promise<Bundle[]>
getRelatedTemplates(slug: string, limit?: number): Promise<Template[]>  // default 4; same step first, then same phase; never the template itself
hasSampleContent(): Promise<boolean>
```

Content decisions:
- Phases and steps exactly as the spec's taxonomy table; phase slugs `prepare`, `manage`, `sustain`; step slugs are the kebab-cased step names (e.g. `define-success`, `train-and-enable`, `transfer-ownership`). `prosciPhase` holds "Prepare Approach", "Manage Change", "Sustain Outcomes".
- 60 templates: at least 6 per step. Titles are concrete rollout deliverables (e.g. "SharePoint Migration Impact Assessment", "Executive Sponsor Kickoff Deck", "Teams Champion Network Charter", "90-Day Adoption Scorecard"). Each has a one-sentence `summary`, a 2–3 sentence `description`, 3–5 `includes` bullets, `priceCents` of 1900 plus a multiple of 500, up to 7900 ($19, $24 … $79). About 10 are `featured`. At least half include `sharepoint` in `apps`.
- 5 bundles: `prepare-phase-kit`, `manage-phase-kit`, `sustain-phase-kit` (8–12 templates each from that phase), `sharepoint-rollout-complete` (20 templates across all phases), `sponsor-essentials` (6 sponsor-audience templates). Each priced 30–40% below the sum of its templates. Three are `featured`.

- [ ] **Step 1: Failing tests:**
  - `pricing.test.ts`: value sums prices; savings = value − price; savings is 0 when the bundle price exceeds value
  - `content.test.ts` (through the repository): `getTemplates()` length ≥ 60; every step of every phase has ≥ 6 templates; every value of `DELIVERABLE_TYPES`, `APPS`, `AUDIENCES`, `FORMATS` is used by at least one template; every template and bundle has `isSample === true`; 5 bundles; every bundle has positive savings; `getTemplate("does-not-exist")` is `undefined`; `getRelatedTemplates(slug)` returns ≤ 4 items, excludes `slug`, and lists same-step items before others; `getBundlesContaining` of a template in `sharepoint-rollout-complete` includes that bundle; `hasSampleContent()` is `true`
- [ ] **Step 2:** Run `pnpm test content pricing`. Expected: FAIL.
- [ ] **Step 3:** Write the content files, then `pricing.ts` and `repository.ts`.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: sample catalog content and repository`.

### Task 6: Formatting and cart store

**Files:** Create `lib/format.ts`, `lib/cart/store.ts`, `tests/unit/format.test.ts`, `tests/unit/cart-store.test.ts`.

**Produces:**
```ts
// lib/format.ts
formatPrice(cents: number): string        // 4900 -> "$49", 4950 -> "$49.50", 120000 -> "$1,200"

// lib/cart/store.ts
export const CART_STORAGE_KEY = "advanta365.cart.v1"
export type CartLine = { kind: "template" | "bundle"; slug: string }
parseCart(raw: string | null): CartLine[]                 // anything invalid -> []
addLine(lines: CartLine[], line: CartLine): CartLine[]    // no duplicates, returns new array
removeLine(lines: CartLine[], line: CartLine): CartLine[]
hasLine(lines: CartLine[], line: CartLine): boolean
pruneLines(lines: CartLine[], known: { templates: Set<string>; bundles: Set<string> }): CartLine[]
```
Digital goods: no quantities.

- [ ] **Step 1: Failing tests:** the three `formatPrice` examples; `parseCart` of `null`, `""`, `"not json"`, `"{}"`, `'[{"kind":"x","slug":"a"}]'`, `'[{"kind":"template"}]'` each → `[]`, and of a valid array → that array; `addLine` twice with the same line keeps one and does not mutate its input; a template and a bundle with the same slug are distinct lines; `removeLine` of an absent line returns an equal array; `pruneLines` drops lines whose slug is not in the matching set.
- [ ] **Step 2:** Run `pnpm test format cart-store`. Expected: FAIL.
- [ ] **Step 3:** Implement both files.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: price formatting and cart store`.

### Task 7: Design tokens, UI primitives and site shell

**Files:** Modify `app/globals.css`, `app/layout.tsx`. Create `lib/site.ts`, `components/ui/*`, `components/layout/*`, `app/(site)/layout.tsx`, `app/not-found.tsx`. Move `app/page.tsx` to `app/(site)/page.tsx` (still a stub).

**Consumes:** `hasSampleContent`, `getPhases` (Task 5).

**Produces:**
- Tokens in `:root`, exposed to Tailwind via `@theme inline`: `--color-bg #FBFAF7`, `--color-surface #FFFFFF`, `--color-ink #1B1F23`, `--color-muted #5A6068`, `--color-rule #E3DFD6`, `--color-accent #1F4B43`, `--color-accent-hover #17392F`, `--color-accent-ink #FFFFFF`, `--color-accent-soft #E8EFEC`. Fonts via `next/font/google`: Source Serif 4 (`--font-display`, headings) and Inter (`--font-sans`, text).
- `lib/site.ts`: `SITE = { name: "Advanta365", tagline, description, contactEmail: "hello@advanta365.com" }`, `NAV = [{ href, label }]` for Catalog, Bundles, Pricing, About.
- `components/ui`: `Button` (`variant: "primary" | "secondary" | "ghost"`, `size: "md" | "lg"`, renders `<a>` via `next/link` when `href` is given), `Badge`, `Card`, `Input`, `Checkbox` (label + optional count), `Select`, `Pagination` (`page`, `pageCount`, `hrefFor(page): string`; renders nothing when `pageCount` is 1).
- `components/layout`: `Container` (max width 72rem, 1rem gutters on phones), `Header` (logo, `NAV`, phase links, cart slot; nav collapses to a menu button below `md`), `Footer`, `Breadcrumbs` (`items: { href?: string; label: string }[]`), `BetaBanner` (text: "Beta preview — templates shown are samples.").
- `app/(site)/layout.tsx`: skip-to-content link, `BetaBanner` when `hasSampleContent()`, `Header`, `<main id="main">`, `Footer`.
- `app/not-found.tsx`: heading "Page not found", links to home and catalog.
- Root `metadata`: `title: { default: SITE.name, template: "%s · Advanta365" }`, `description: SITE.description`.

- [ ] **Step 1:** Implement tokens, fonts, `lib/site.ts`, primitives, layout components and the two layouts.
- [ ] **Step 2:** Run `pnpm dev`; load `/` and `/nope` at 375px and 1280px. Expected: banner, header, footer render; no horizontal scroll; Tab reaches the skip link first and every nav item shows a focus ring; `/nope` shows "Page not found".
- [ ] **Step 3:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: exit 0.
- [ ] **Step 4:** Commit `feat: design tokens, UI primitives and site shell`.

### Task 8: Catalog page

**Files:** Create `components/catalog/{template-card,filter-panel,search-box,sort-select,result-list}.tsx`, `app/(site)/catalog/page.tsx`.

**Consumes:** `queryTemplates`, `CatalogCriteria`, `CatalogResult` (Task 3); `parseCatalogParams`, `serializeCatalogParams` (Task 4); `getTemplates`, `getPhases` (Task 5); `formatPrice` (Task 6); taxonomy labels (Task 2); UI primitives (Task 7).

**Produces:**
- `TemplateCard({ template, phaseName })`: title links to `/templates/[slug]`; shows summary, phase, deliverable type and format badges, price.
- `FilterPanel({ criteria, facets, phases })` (client): five checkbox groups with counts; any change calls `router.replace("/catalog?" + serializeCatalogParams({...next, page: 1}))`; options with count 0 that are not selected are disabled. Inline sidebar from `lg` up; below `lg` a "Filters" button opens it in a native `<dialog>`.
- `SearchBox({ defaultValue })`: a GET form to `/catalog` preserving other parameters as hidden inputs; label "Search templates".
- `SortSelect` (client): options Featured, Title A–Z, Price low to high, Price high to low.
- `ResultList({ result, criteria, phases })`: "N templates" count, card grid, `Pagination`, and an empty state with the text "No templates match these filters." and a "Clear filters" link to `/catalog`.
- Page: `searchParams` is awaited, parsed, queried; `metadata.title` "Catalog".

- [ ] **Step 1:** Implement the components and page.
- [ ] **Step 2:** Run `pnpm dev` and check: `/catalog` shows 24 cards and 3 pages; ticking Training then SharePoint updates the URL to `?type=training&app=sharepoint` and the count; reloading that URL shows the same state; `?q=zzzz` shows the empty state; `?page=9999&type=poster` renders the last page with no error; at 375px the Filters button opens the dialog and Escape closes it.
- [ ] **Step 3:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: exit 0.
- [ ] **Step 4:** Commit `feat: catalog page with search, filters and pagination`.

### Task 9: Home and phase pages

**Files:** Create `components/catalog/{phase-nav,bundle-card}.tsx`, `app/(site)/phases/[phase]/page.tsx`. Replace `app/(site)/page.tsx`.

**Consumes:** repository (Task 5), `bundleSavingsCents`, `TemplateCard`, primitives.

**Produces:**
- `PhaseNav({ phases })`: three numbered cards (name, summary, step names) linking to `/phases/[slug]`.
- `BundleCard({ bundle, templateCount, savingsCents })`: links to `/bundles/[slug]`; shows price and "Save $X".
- Home sections in order: hero (h1 "Change management templates for Microsoft 365 rollouts", supporting line mentioning 30 years of practice and alignment with Prosci methodology, buttons "Browse the catalog" and "See bundles"); `PhaseNav`; featured bundles (3); featured templates (6); credibility strip (30 years · private and public sector · municipal to federal · SharePoint-first); closing CTA.
- Phase page: `generateStaticParams` from `getPhases()`; `notFound()` for an unknown slug; `generateMetadata` title = phase name; breadcrumbs; summary; one section per step (step name, summary, its templates); link "View all {name} templates" to `/catalog?phase={slug}`.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Run `pnpm dev`: home shows all six sections; each phase card opens its phase page; every step section lists ≥ 6 templates; `/phases/nope` shows the 404 page.
- [ ] **Step 3:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: exit 0.
- [ ] **Step 4:** Commit `feat: home and phase pages`.

### Task 10: Template and bundle pages

**Files:** Create `app/(site)/templates/[slug]/page.tsx`, `app/(site)/bundles/page.tsx`, `app/(site)/bundles/[slug]/page.tsx`, `components/cart/add-to-cart.tsx` (stub button for now, wired in Task 11).

**Consumes:** repository, pricing, `formatPrice`, `TemplateCard`, `BundleCard`, `Breadcrumbs`.

**Produces:**
- Template detail: `generateStaticParams`, `notFound()`, `generateMetadata` (title = template title, description = summary). Layout: breadcrumbs Home / phase / title; h1; summary; description; "What's included" list; facts (format, page count when present, apps, audiences); "Where it fits" (phase and step, linking to the phase page); purchase panel with price and `AddToCart`; "Included in these bundles" (hidden when none); "Related templates".
- Bundles list: all bundles as `BundleCard`s, featured first; `metadata.title` "Bundles".
- Bundle detail: same static/404/metadata pattern; h1; description; "Total value $X · Bundle price $Y · You save $Z"; `AddToCart`; contents grouped by phase as `TemplateCard`s.
- `AddToCart({ line: CartLine, label?: string })` (client).

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Run `pnpm dev`: open a template from the catalog, follow its bundle link, then a related template; bundle totals add up against the listed templates; `/templates/nope` and `/bundles/nope` show the 404 page.
- [ ] **Step 3:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: exit 0, and the build output lists the template and bundle routes as statically generated.
- [ ] **Step 4:** Commit `feat: template and bundle pages`.

### Task 11: Cart and static pages

**Files:** Create `components/cart/{cart-provider,cart-button,cart-contents}.tsx`, `app/(site)/cart/page.tsx`, `app/(site)/pricing/page.tsx`, `app/(site)/about/page.tsx`, `app/(site)/contact/page.tsx`. Modify `components/cart/add-to-cart.tsx`, `app/(site)/layout.tsx`, `components/layout/header.tsx`.

**Consumes:** cart store (Task 6), repository, `formatPrice`, `SITE`.

**Produces:**
- `CartProvider` (client) and `useCart(): { lines: CartLine[]; add(line): void; remove(line): void; has(line): boolean; count: number; ready: boolean }`. Loads from `localStorage` after mount (`ready` becomes true); every storage read and write is wrapped in try/catch so a throwing `localStorage` leaves an in-memory cart that works.
- `CartButton`: header link to `/cart` with an accessible label "Cart, N items"; shows the count once `ready`.
- `AddToCart`: "Add to cart", switching to "In cart — view cart" (link to `/cart`) when present.
- Cart page (server) passes `items: { kind, slug, title, priceCents, href }[]` for every template and bundle to `CartContents` (client), which prunes unknown lines, lists lines with Remove buttons, shows the subtotal, a disabled button "Checkout — coming soon" with a note that purchasing is not available in the beta, and an empty state linking to the catalog.
- Pricing: how singles and bundles work, the single-template price range and bundle prices computed from the repository, and a 5-question FAQ (file formats, licensing per organization, customization, updates, public-sector purchasing) with answers marked as provisional beta copy.
- About: the founder's 30 years in change management and user adoption, the M365/SharePoint focus, and the methodology alignment statement. Contact: `mailto:` link from `SITE.contactEmail`, no form.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Run `pnpm dev`: add a template and a bundle, see "Cart, 2 items" in the header and both lines on `/cart` with the correct subtotal; reload and they persist; remove one; in DevTools set the storage key to `garbage` and reload — the cart is empty with no console error; set it to `[{"kind":"template","slug":"gone"}]` — the cart is empty.
- [ ] **Step 3:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: exit 0.
- [ ] **Step 4:** Commit `feat: cart, pricing, about and contact pages`.

### Task 12: Browser tests and handover

**Files:** Create `playwright.config.ts`, `tests/e2e/{browse,catalog,cart,not-found}.spec.ts`. Modify `package.json`, `README.md`, `.gitignore`.

**Produces:** script `test:e2e` (`playwright test`); config with `webServer: { command: "pnpm build && pnpm start", url: "http://localhost:3000", reuseExistingServer: true }`, projects `chromium` (1280×800) and `mobile` (Pixel 7).

- [ ] **Step 1:** `pnpm add -D @playwright/test` and `pnpm exec playwright install chromium`.
- [ ] **Step 2: Write the tests:**
  - `browse`: home → click the "Prepare" phase card → first template card → the detail page h1 equals the card title and an "Add to cart" button is visible; the beta banner is visible on home.
  - `catalog`: on `/catalog`, check Training → URL contains `type=training` and the count text changes; search "sponsor" → URL contains `q=sponsor`; `/catalog?q=zzzzqqq` shows "No templates match these filters." and "Clear filters" returns to 24 cards; `/catalog?page=9999&type=poster&page=abc` returns status 200.
  - `cart`: add a template, header shows "Cart, 1 item", `/cart` lists its title, the checkout button is disabled; with `localStorage` set to `"garbage"` before load, `/cart` shows the empty state.
  - `not-found`: `/templates/nope`, `/templates/NOPE`, `/templates/a%20b`, `/bundles/nope`, `/phases/nope` each return 404 and show "Page not found".
- [ ] **Step 3:** Run `pnpm test:e2e`. Expected: all pass in both projects. Fix any page defects found.
- [ ] **Step 4:** Rewrite `README.md`: what the beta is, commands (`dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`), the folder map, "Replacing sample content" (edit `content/`, run `pnpm test`), and the path-to-production table from the spec.
- [ ] **Step 5:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`. Expected: exit 0.
- [ ] **Step 6:** Commit `test: browser tests and README`.
