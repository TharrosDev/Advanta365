# Single-Purchase Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the storefront into a one-product site: the complete toolkit for $499.99, six free samples, everything else visible but locked, one Purchase page.

**Architecture:** The catalog model loses prices and bundles and gains a `free` flag; one `OFFER` constant carries the price. Server pages keep reading the repository; three small client components are added (locked tile, template dialog, nothing else). The hero sequence is CSS timed against a new ink scene, with no script coupling between them.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, zod, Vitest, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-11-single-purchase-redesign-design.md`. Read it with this plan.

## Global Constraints

- Read `docs/design-system.md` and `docs/testing.md` before writing UI. `tests/unit/design-gate.test.ts` enforces them; a gate failure is fixed in the code, not by loosening the gate, unless a task says to change the gate.
- Runtime dependencies stay exactly `next`, `react`, `react-dom`, `zod`.
- Raw colour values only in `app/globals.css`. Components use semantic tokens. Red is `--alert` / `--alert-wash`.
- Every keyframe and animated property lives in `app/motion.css` inside `@media (prefers-reduced-motion: no-preference)`, hung on `data-*` hooks.
- Media queries allowed: `(min-width: 40em)`, `(min-width: 68em)`, `(hover: hover)`, the two reduced-motion queries, `(prefers-contrast: more)`, `(forced-colors: active)`. Nothing else.
- Only `components/ui/transition-link.tsx` imports `next/link`. `app/**` and `components/**` never import `@/content/*` except `@/content/taxonomy`.
- Copy: Canadian spelling, typographic quotes, no exclamation marks, no hype. Never imply the catalog is the full toolkit; sample content stays labelled. Prosci describes the practitioner only.
- The price is written once: `OFFER.priceCents = 49999` in `lib/site.ts`, printed with `formatPrice` as `$499.99`.
- Checkout is not built: the Purchase button is disabled and says "Checkout coming soon".
- One `h1` per page, visible focus, 44px targets below 68em, WCAG AA contrast.
- Each task ends green on `pnpm lint && pnpm typecheck && pnpm test`. E2E (`pnpm test:e2e`) is green at the end of every task that touches a spec file.
- Match the surrounding code: a doc comment on each component saying what it is, in the existing voice.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. `/catalog?view=<slug>` where the slug is locked, unknown or malformed (`?view=../x`, `?view=`, repeated param): the page renders normally with no dialog and no error. Test in Task 4.
2. `?view=` combined with filters or a page that do not contain that template: the dialog still opens, and closing it keeps every other parameter. Test in Task 4.
3. A locked card clicked repeatedly and fast: the denied state restarts, one message line exists, and it is announced once per press, never stacked. Test in Task 4.
4. Old deep links with a query string or an unknown slug (`/templates/nope`, `/bundles/x?y=1`, `/Pricing`): each lands on a 200 page. Test in Task 2.
5. The bar at 320px wide with the purchase button: no horizontal scroll, brand and Menu still reachable. Test in Task 5.

---

### Task 1: Product model

**Files:**
- Modify: `lib/site.ts`, `lib/format.ts` (no change expected; keep its test), `lib/catalog/schema.ts`, `lib/catalog/validate.ts`, `lib/catalog/repository.ts`, `lib/catalog/query.ts`, `lib/catalog/search-params.ts`, `content/templates/*.ts`, `content/templates/sample.ts`
- Delete: `content/bundles.ts`, `lib/catalog/pricing.ts`, `lib/cart/`, `components/cart/`, `components/product/`, `components/catalog/bundle-card.*`, `components/company/bundle-price-table.*`, `components/company/ways-to-buy.*`, `components/home/bundles-section.tsx`, `app/(site)/bundles/`, `app/(site)/cart/`, `app/(site)/pricing/` (move its FAQ data first, see below), `tests/unit/cart-store.test.ts`, `tests/unit/pricing.test.ts`, `tests/e2e/cart.spec.ts`, `tests/e2e/cart-keyboard.spec.ts`
- Create: `lib/purchase/questions.ts` holding the pricing page's questions, rewritten for one purchase (in `lib/`, because pages may not import `content/`)
- Modify consumers so the build passes: `app/(site)/layout.tsx` (no cart), `app/(site)/page.tsx` (no bundles), `app/(site)/templates/[slug]/page.tsx` (no purchase panel, no bundles), `components/catalog/template-card.tsx` (no price), `components/catalog/sort-select.tsx`, `components/layout/header.tsx` (no `cart` prop), `components/layout/footer.tsx`, `components/not-found/missing-page.tsx`, `components/ink/ink-lab.tsx`, `tests/unit/fixtures/catalog.ts`
- Test: `tests/unit/content.test.ts`, `validate.test.ts`, `query.test.ts`, `search-params.test.ts`, `format.test.ts`

**Interfaces — Produces:**
- `lib/site.ts`: `export const OFFER = { name: "The complete toolkit", priceCents: 49999 } as const`
- `TemplateSchema`: `priceCents` and `featured` removed; `free: z.boolean()` added. `sample()` defaults `free: false`. `Catalog = { phases, templates }`.
- `lib/catalog/validate.ts`: `export const FREE_SAMPLE_COUNT = 6`; throws `CatalogError` unless exactly six templates have `free: true`.
- Free slugs: `executive-sponsor-kickoff-deck`, `change-management-strategy`, `sharepoint-governance-framework`, `sharepoint-end-user-training-deck`, `master-communications-plan`, `go-live-readiness-checklist`.
- `repository.ts`: `getFreeTemplates(): Promise<Template[]>` (phase order); bundle getters gone; `hasSampleContent()` reads templates only.
- `query.ts`: `SortKey = "samples" | "title"` (default `"samples"`: free first, then title); `CatalogCriteria` gains `free: boolean` (default `false`; `true` keeps only free templates).
- `search-params.ts`: `free=1` round-trips; `parseView(sp: RawParams): string | undefined` returns the first `view` value only if it matches the slug pattern; `catalogHref(criteria: CatalogCriteria, view?: string): string` returns `/catalog` plus the query, with `view` last.
- `lib/purchase/questions.ts`: `export const PURCHASE_QUESTIONS: readonly { question: string; answer: string }[]`

- [ ] **Step 1:** Rewrite the unit tests first: content (`exactly 6 free`, each named slug is free, no template has `priceCents`), validate (five or seven free throws `CatalogError`), query (`free: true` returns only free; default sort puts the six first; no price sorters), search-params (`free=1`; `parseView` accepts `change-management-strategy`, rejects `""`, `"../x"`, `"A"`, takes the first of a repeated param; `catalogHref` drops defaults), format (`formatPrice(49999) === "$499.99"`).
- [ ] **Step 2:** Run `pnpm test` and see them fail.
- [ ] **Step 3:** Change the model and content, delete the files listed, fix each consumer the smallest way that compiles (remove the price or the bundle block; do not redesign anything yet).
- [ ] **Step 4:** `pnpm lint && pnpm typecheck && pnpm test` pass. `pnpm build` passes.
- [ ] **Step 5:** Commit: `feat: one offer, six free samples; remove prices, bundles and the cart`.

### Task 2: Routes, About with Contact, link lists

**Files:**
- Modify: `next.config.ts`, `lib/site.ts` (`NAV`), `components/layout/nav-links.ts`, `components/layout/primary-nav.tsx` (comment only), `components/layout/nav-drawer.tsx`, `components/layout/footer.tsx`, `app/(site)/about/page.tsx` + module, `lib/boot/state.ts` (`CALM_ROUTE_SOURCE = "^/catalog(/|$)"`), `lib/boot/boot-script.ts` if it embeds the pattern separately
- Create: `app/(site)/purchase/page.tsx` (a plain page for now: `TitleBlock` "Purchase", the price, the disabled button; Task 3 replaces the body)
- Delete: `app/(site)/contact/`
- Test: `tests/unit/boot-script.test.ts`, `tests/e2e/browse.spec.ts`, `header.spec.ts`, `menu.spec.ts`, `not-found.spec.ts`, `console.spec.ts`, `identity.spec.ts`, `reduced-motion.spec.ts`; create `tests/e2e/redirects.spec.ts`

**Interfaces — Produces:**
- `NAV = [{ href: "/catalog", label: "Catalog" }, { href: "/about", label: "About" }]`; `export const PURCHASE_LINK = { href: "/purchase", label: "Purchase" }` in `lib/site.ts`. `PRIMARY_LINKS = [PURCHASE_LINK, ...NAV]`.
- About has a section with `id="contact"` and an `h2` "Contact" carrying the Contact page's content.
- Permanent redirects in `next.config.ts` `redirects()`: `/bundles` and `/bundles/:slug` → `/purchase`; `/pricing` → `/purchase`; `/cart` → `/purchase`; `/contact` → `/about#contact`. (`/templates/:slug` is added in Task 4.)

- [ ] **Step 1:** Write `redirects.spec.ts`: each old path, plus `/bundles/x?y=1` and `/Pricing`, ends on a 200 page at the expected pathname. Update the other specs to the three links and no cart. Update the calm-route unit expectations (`/cart`, `/bundles/x`, `/templates/x` are no longer calm; `/catalog` is).
- [ ] **Step 2:** Run and see them fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Unit and e2e pass.
- [ ] **Step 5:** Commit: `feat: purchase route, contact merged into about, old URLs redirect`.

### Task 3: Purchase page and the home portfolio

**Files:**
- Create: `components/purchase/portfolio.tsx` + module, `components/purchase/price-tag.tsx` + module, `components/home/portfolio-section.tsx`
- Modify: `app/(site)/purchase/page.tsx` + new `page.module.css`, `components/ui/folder.tsx` + module (a `size="page"` variant and real covers as sheets, if the existing `sheets` cannot carry them), `app/(site)/page.tsx`, `components/home/home.module.css`, `app/motion.css` (tag swing, hook `data-price-tag`)
- Test: create `tests/e2e/purchase.spec.ts`

**Interfaces — Consumes:** `OFFER`, `TOOLKIT`, `PURCHASE_QUESTIONS`, `getFreeTemplates`, `phaseCoverage`, `Folder`, `Tally`, `FactList`, `FaqList`, `InkBackdrop scene="wisps"`.
**Produces:** `Portfolio({ size: "page" | "section", covers: Template[], phases: PhaseCoverage[] })` rendering the folder with tab "The complete toolkit", the `PriceTag`, and the tally; `PriceTag()` printing `formatPrice(OFFER.priceCents)` and "one purchase"; `PortfolioSection()` for home (`id="toolkit"`, replaces `#bundles`) with a button to `/purchase`.

Page order (spec section 3): title (`h1` "Purchase"), the portfolio centred, the "what is inside" ledger from `TOOLKIT`, the disabled button "Checkout coming soon" with the `mailto:` address, a note that the catalog shown is sample content, then the questions.

- [ ] **Step 1:** Write `purchase.spec.ts`: one `h1`; the text `$499.99` appears exactly once inside `[data-price-tag]`; the button is disabled and named "Checkout coming soon"; the seven-block tally is labelled with all seven phase names; the ledger shows 59, 130, 4 and 58; no horizontal scroll at 320px; home has `#toolkit` linking to `/purchase`.
- [ ] **Step 2:** Run and see it fail.
- [ ] **Step 3:** Build it. The folder is the page's centrepiece: at 68em about 34rem wide, centred, the tag hanging from its top right corner on a hairline string, turned about 6 degrees. Hover or focus lifts the sheets as `Folder` already does.
- [ ] **Step 4:** Unit, e2e and `pnpm build` pass. Look at `/purchase` at 1440px and 390px in the preview and fix what looks wrong.
- [ ] **Step 5:** Commit: `feat: the purchase page as one portfolio with its price tag`.

### Task 4: Catalog tiles, locks and the pop-up

**Files:**
- Create: `components/catalog/template-tile.tsx` + module, `components/catalog/locked-tile.tsx` (client) + module, `components/catalog/chain-lock.tsx`, `components/catalog/template-dialog.tsx` (client) + module, `components/catalog/template-detail.tsx` (server: the dialog's content)
- Modify: `components/catalog/result-list.tsx` + module (grid), `components/catalog/filter-panel.tsx` (the "Free samples only" checkbox), `components/catalog/sort-select.tsx`, `app/(site)/catalog/page.tsx`, `app/(site)/phases/[phase]/page.tsx`, `components/home/featured-section.tsx`, `app/motion.css` (hook `data-denied`: `tile-shake`, `lock-rattle`, `denied-pulse`), `next.config.ts` (`/templates/:slug` → `/catalog?view=:slug`), `components/layout/nav-links.ts` (`currentPhase` drops the templates branch), `docs/architecture.md` is left for Task 9
- Delete: `app/(site)/templates/`, `components/catalog/template-card.*` once nothing imports it
- Test: rewrite `tests/e2e/catalog.spec.ts`; create `tests/e2e/locked.spec.ts`, `tests/e2e/template-dialog.spec.ts`; extend `redirects.spec.ts`

**Interfaces — Consumes:** `parseView`, `catalogHref`, `getTemplate`, `Template.free`.
**Produces:**
- `TemplateTile({ template, phaseName, phaseOrder, href, headingLevel })`: an `<article data-tile data-free|data-locked>`. Free: one link (`href`) stretched over it, a `Tag` "Free sample". Locked: renders `LockedTile`.
- `LockedTile`: a `<button aria-describedby>` named `"<title>, locked"`. On activation it sets `data-denied` on the article (removing and re-adding it so the animation restarts), clears it after 600 ms, and shows one line `Included with the toolkit.` with a link to `/purchase` inside an `aria-live="polite"` region that exists from first render.
- `ChainLock()`: decorative inline SVG, `aria-hidden`, chain across the cover and a padlock at centre (`data-lock`).
- `TemplateDialog({ closeHref, children, labelledBy })`: native `<dialog>`, `showModal()` in a layout effect, closes on Escape, the Close button and a click whose target is the dialog itself; closing calls `router.replace(closeHref, { scroll: false })`. Rendered by the page only when `view` names a free template.
- The catalog page renders `<TemplateDialog>` with `<TemplateDetail template>` when `parseView` gives a free slug; a locked slug renders the grid with that tile carrying `data-denied` once; unknown is ignored.
- Without JavaScript the dialog markup is `<dialog open>` so the content shows.

- [ ] **Step 1:** Write the specs. Catalog: grid of `[data-tile]`, six `[data-free]` on the default first page before any locked one, no `$` anywhere on the page, "Free samples only" leaves six. Locked: click sets `data-denied` then clears it, the message line appears with a link to `/purchase`, Enter and Space do the same, five fast clicks leave one message line, under reduced motion the computed `animation-name` is `none` and the outline colour is the alert token. Dialog: clicking a free tile opens `dialog[open]` and the URL has `view=`; Escape, Close and a backdrop click each close it and remove `view` while keeping `q` and `phase`; Back closes it; focus returns to the tile; `?view=<locked>`, `?view=nope`, `?view=../x`, `?view=` open nothing and return 200; `?view=<free>&phase=<other phase>` still opens. Redirects: `/templates/change-management-strategy` → dialog open; `/templates/nope` → 200 catalog.
- [ ] **Step 2:** Run and see them fail.
- [ ] **Step 3:** Build it. Tile grid: `repeat(auto-fill, minmax(11rem, 1fr))`. Locked cover: `filter: blur(6px)` on the cover only, never on text. Shake: 6px left and right, 5 swings in 420 ms; padlock rattles ±12 degrees; outline pulses `--alert` twice.
- [ ] **Step 4:** Unit, e2e and build pass. Check the catalog and a dialog in the preview at 1440px and 390px.
- [ ] **Step 5:** Commit: `feat: catalog tiles with locked templates and a pop-up for the free six`.

### Task 5: Navigation bar

**Files:**
- Create: `components/layout/purchase-button.tsx` (client, reads the pathname) + module
- Modify: `components/layout/header.tsx` + module, `components/layout/primary-nav.tsx` + module, `components/layout/nav-drawer.tsx`, `app/(site)/layout.tsx`, `app/motion.css` (sliding underline)
- Test: `tests/e2e/header.spec.ts`, `menu.spec.ts`

**Produces:** a three-zone bar from 68em: brand at the left, `PrimaryNav` (Catalog, About only) centred on the bar with `gap: var(--s-5)`, and `PurchaseButton` at the right reading `Get the toolkit · $499.99`. One underline element under the list moves to the current link (CSS anchor positioning is not allowed to be required: position it from a `--i` index set on the list, and with no current link it is hidden). Below 68em the button reads `Get the toolkit` and sits before Menu. On `/purchase` the button has `aria-current="page"`.

- [ ] **Step 1:** Update the specs: link names and order; the button's text at 1440px and at 390px; `aria-current` on `/purchase`; at 320px `document.documentElement.scrollWidth <= innerWidth` and both the brand link and Menu are visible; the nav's centre is within 2px of the bar's centre at 1440px.
- [ ] **Step 2:** Run and see them fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Unit and e2e pass; check both widths in the preview.
- [ ] **Step 5:** Commit: `feat: three-zone bar with the purchase button`.

### Task 6: The 365 on the mark

**Files:**
- Modify: `lib/brand/mark.ts`, `components/ui/logo-mark.tsx`, `components/ui/brand-lockup.tsx` + module, `components/intro/intro-cover.tsx` + module
- Test: `tests/unit/brand-mark.test.ts`, `tests/e2e/identity.spec.ts`

**Produces:** `MARK_DIGITS_D: string`, stroked digits "365" (monoline, round caps, stroke width 1.3) whose bounding box is x 18.6 to 30.9, y 6.4 to 10.6, so they stand on the tail's top edge (11.4) with a gap. `MARK_DIGITS_STROKE_WIDTH = 1.3`. `LogoMark` gains `digits?: boolean` (default `true` when `tone="two"`, never drawn for `tone="one"`), drawn in `var(--logo-tail, currentColor)`. The bar's tile grows so the digits are at least 7 CSS px tall from 68em. `app/icon.svg` unchanged. The cover draws the digits as a fourth pen path from 800 to 1000 ms.

- [ ] **Step 1:** Unit tests: the digits path parses, its bounds are inside the viewBox and inside the box above, and it does not overlap the legs' stroke area. E2E: the bar's mark contains a path with `data-mark-digits` at least 7px tall at 1440px; the favicon response is byte-identical to before.
- [ ] **Step 2:** Run and see them fail.
- [ ] **Step 3:** Implement; check the lockup in the bar, footer and cover in the preview.
- [ ] **Step 4:** All tests pass.
- [ ] **Step 5:** Commit: `feat: 365 on the arm of the mark`.

### Task 7: Load-in timing

**Files:**
- Modify: `lib/boot/state.ts` (`INTRO_BACKSTOP_MS = 5500`), `lib/boot/boot-script.ts` (a `<link rel="modulepreload">` is not possible for a hashed chunk; instead start the engine import as the controller's first act when `data-intro` is set, before any other work), `components/ink/ink-controller.ts` (takeover limit 1050 → 1600; intro run 2800 → 3500), `lib/ink/scenes.ts` (`intro`: black at 0 s, blue at 0.5 s, clear at 2.45 s over 1.05 s, duration 3.5 s), `lib/ink/stage.ts` (`intro` run 3500), `components/intro/intro-cover.module.css`, `app/motion.css` if the cover keyframes live there
- Test: `tests/unit/boot-cover.test.ts`, `boot-script.test.ts`, `ink-scenes.test.ts`, `ink-stage.test.ts`, `tests/e2e/intro.spec.ts`

**Produces (spec section 8):** mark drawn 120–800 ms, digits 800–1000 ms; `cover-leave` 2500–2950 ms; `cover-ink` 2700–3500 ms; backstop 5500 ms. Skip unchanged.

- [ ] **Step 1:** Change the expected numbers in the tests; add an e2e check that the cover is still fully opaque at 2300 ms and gone by 4000 ms without ink, and that a key press at 500 ms removes it within 400 ms.
- [ ] **Step 2:** Run and see them fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** All tests pass.
- [ ] **Step 5:** Commit: `feat: earlier ink and a longer hold on the cover`.

### Task 8: Hero, blank prompt to finished work

**Files:**
- Create: `components/home/hero-stage.tsx` + module (server), `components/home/proof-strip.tsx`
- Modify: `components/home/hero.tsx`, `components/home/home.module.css`, `app/(site)/page.tsx`, `lib/ink/scenes.ts` (`prompt` replaces `hero`), `lib/ink/stage.ts`, `lib/ink/types.ts`, `lib/ink/stills.json`, `lib/ink/stills.ts`, `scripts/ink-stills.mjs`, `public/ink/` (`prompt-wide.webp`, `prompt-tall.webp` replace the hero pair), `components/ink/ink-lab.tsx`, `app/motion.css` (hook `data-hero-stage`)
- Test: `tests/unit/ink-scenes.test.ts`, `ink-stage.test.ts`, `stills-files.test.ts`, `tests/e2e/ink-live.spec.ts`, `ink-fallback.spec.ts`, `motion.spec.ts`, `reduced-motion.spec.ts`; create `tests/e2e/hero.spec.ts`

**Interfaces — Consumes:** `getFreeTemplates`, `catalogHref`, `TemplateCover`, `TOOLKIT`, `OFFER`.
**Produces:**
- `Hero({ samples: Template[], phases: Phase[] })`: full-width band; centred `h1` (same words), lead, buttons "Get the toolkit" (`/purchase`) and "See the free samples" (`/catalog?free=1`); then `HeroStage`; then `ProofStrip` (30+ years, 59 playbooks, 130 templates, one purchase).
- `HeroStage({ samples })`: `<div data-hero-stage>` holding the prompt box (`data-hero-prompt`, `aria-hidden`, a `Blank` caret) and a list of six links (`data-hero-doc`, each to `catalogHref(DEFAULT_CRITERIA, slug)`, each a lit `TemplateCover` with its title), fanned: turns −9, −5, −2, 2, 5, 9 degrees, overlapping, the middle two highest. `data-ink-anchor="open"` is on the stage.
- Sequence, CSS only, under `html[data-motion="on"]:not([data-intro])`: box holds 0–400 ms, dissolves 400–1600 ms; documents settle from 2400 ms, 110 ms apart, 560 ms each. Without `data-motion` (reduced motion, no JavaScript) the box is `display: none` and the documents are in place.
- Ink scene `prompt` (paper, no end): black drop at the `open` anchor's centre at 0 s, blue at 0.5 s, clear at 2.2 s over 1.2 s, ambient drips from 9 s as the old `hero` had. Stage weight 3, run 30000. The text block keeps `data-ink-calm="text"`; the stage has `data-ink-calm="display"` after the sequence so the documents stay readable.
- Stills: `prompt-wide` (1440×900, DPR 1) and `prompt-tall` (320×700, DPR 2) at the scene's rest, generated with `node scripts/ink-stills.mjs`; within `STILL_MAX_BYTES`.

- [ ] **Step 1:** Write the tests: scene determinism and timeline for `prompt`; no `hero` scene or stills remain; `hero.spec.ts`: six `[data-hero-doc]` links with the six free titles, each opening its dialog; after 4500 ms the prompt box has `opacity: 0` and every document `opacity: 1`; under reduced motion the documents are visible at load and the box is not rendered visible; the hero band's height is at least 85% of the viewport at 1440×900; no element in the hero overflows at 320px; headline contrast holds over the still.
- [ ] **Step 2:** Run and see them fail.
- [ ] **Step 3:** Implement the scene and the markup, regenerate the stills, tune in `/ink-lab` and on `/`.
- [ ] **Step 4:** All unit and e2e pass; `node scripts/check-budgets.mjs` passes (update `tests/budgets/baseline.json` only for the measured new values, and say so in the commit).
- [ ] **Step 5:** Commit: `feat: the hero turns a blank prompt into finished work`.

### Task 9: Records and final gate

**Files:**
- Modify: `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` if it lists removed components, `README.md`, `docs/architecture.md`, `docs/design-system.md`, `docs/testing.md`

- [ ] **Step 1:** Rewrite every statement the change made false: routes table, section 9 (Cart) removed, catalog URL state (`free`, `view`), the header, the cover timeline, scenes and stills tables, "Ways to buy", capabilities, the undecided list (price is now decided at $499.99; currency still shown as US dollars pending confirmation).
- [ ] **Step 2:** `grep -rniE "bundle|cart|/pricing|/contact|priceCents" app components lib docs *.md` returns only intended mentions (redirects, history).
- [ ] **Step 3:** `pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e` all pass.
- [ ] **Step 4:** Commit: `docs: records follow the single-purchase site`.
