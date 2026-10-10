# Advanta365 Beta Storefront — Design

Date: 2026-10-10
Status: awaiting review

## Purpose

Advanta365 sells change management and user adoption templates for Microsoft 365
rollouts, mostly SharePoint. The catalog will hold 300–500 templates grounded in
Prosci methodology, for private and public-sector organizations.

The beta exists so the owner can click through a realistic storefront and judge
its look, structure and taxonomy. It is not for paying customers. Its code must
be a foundation the production site grows from without a rewrite.

## Success criteria

- Every page listed below renders with realistic content on desktop and phone.
- A visitor can find a template three ways: by rollout phase, by search, by filter.
- The catalog UI stays usable at 500 items (pagination, URL-driven filters).
- Replacing sample data with the real catalog touches only `content/`.
- Adding payments, accounts or a database later touches only the data layer and
  the cart module, not pages or components.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.

## Out of scope

Payments, customer accounts, file delivery, CMS, database, analytics, email,
admin UI. The cart is visible but checkout is a marked "coming soon" state.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict (existing).
- Tailwind CSS v4 with design tokens as CSS variables.
- In-house UI primitives in `components/ui` (no component library dependency).
- Zod for catalog schemas.
- ESLint, Prettier.
- Vitest for unit tests, Playwright for a small set of browser tests.
- pnpm; deploys to the already-linked Vercel project.

## Structure

```
app/                     routes only; thin, compose components
  (site)/                layout with header and footer
    page.tsx             home
    catalog/page.tsx
    phases/[phase]/page.tsx
    templates/[slug]/page.tsx
    bundles/page.tsx
    bundles/[slug]/page.tsx
    pricing/page.tsx
    about/page.tsx
    contact/page.tsx
    cart/page.tsx
components/
  ui/                    button, badge, card, input, select, checkbox, pagination
  layout/                header, footer, container, breadcrumbs
  catalog/               template-card, bundle-card, filter-panel, search-box,
                         sort-select, result-list, phase-nav
  cart/                  cart-provider, cart-button, cart-line
content/                 catalog data (sample data in beta)
  phases.ts  taxonomy.ts  templates/*.ts  bundles.ts
lib/
  catalog/
    schema.ts            Zod schemas and inferred types
    repository.ts        the only module that reads content/
    query.ts             pure filter, search, sort, paginate
    search-params.ts     parse and serialize catalog URL state
  cart/store.ts          cart state, localStorage persistence
  format.ts              price and text formatting
  site.ts                site name, nav, metadata defaults
```

### Boundaries

- Pages and components never import from `content/`. They call
  `lib/catalog/repository.ts`, whose functions are async so a database or CMS
  can replace the file source later with no caller changes.
- `query.ts` is pure: `(templates, criteria) -> { items, total, facets }`.
- Catalog state lives in the URL (`?q=&phase=&type=&app=&audience=&format=&sort=&page=`),
  so results are shareable and server-rendered.
- The cart is a client-side store behind a provider; nothing else is client state.

## Data model

```
Phase     { slug, name, prosciPhase, summary, order, steps: Step[] }
Step      { slug, name, summary, order }
Template  { slug, title, summary, description, phase, step,
            deliverableType, apps[], audiences[], format, adkar[],
            priceCents, pageCount?, includes[], featured, isSample }
Bundle    { slug, title, summary, description, templateSlugs[],
            priceCents, featured, isSample }
```

Enumerations (in `content/taxonomy.ts`):

- deliverableType: communication, training, assessment, plan, stakeholder,
  sponsor, resistance, measurement, governance
- app: sharepoint, teams, onedrive, outlook, copilot, m365-general
- audience: sponsor, change-lead, manager, end-user, it-admin
- format: docx, pptx, xlsx, pdf
- adkar: awareness, desire, knowledge, ability, reinforcement

The repository validates all content with Zod at load and fails the build on:
invalid records, duplicate slugs, unknown phase or step references, and bundles
referencing missing templates. Bundle savings are computed, never stored.

## Taxonomy

Primary navigation is three rollout phases, labeled in plain language and
mapped to Prosci's three phases:

| Label   | Prosci phase       | Steps |
|---------|--------------------|-------|
| Prepare | Prepare Approach   | Define success, Assess impact, Build the strategy |
| Manage  | Manage Change      | Plan and communicate, Train and enable, Launch and support |
| Sustain | Sustain Outcomes   | Measure adoption, Reinforce, Transfer ownership |

Labels and steps are working names, editable in `content/phases.ts`. ADKAR is
stored per template but not exposed as a filter in the beta.

Trademark note: "Prosci" and "ADKAR" are registered trademarks. The beta uses
plain-language labels and mentions Prosci only descriptively ("aligned with").
Licensing must be checked before public launch.

## Pages

- **Home:** hero with positioning; three phase entry cards; featured bundles;
  featured templates; credibility section (30 years, sectors served); CTA.
- **Catalog:** search box, filter panel (phase, deliverable type, app,
  audience, format) with result counts, sort (featured, title, price), 24 per
  page, empty state with "clear filters". Filter panel collapses to a drawer on
  phones.
- **Phase:** phase summary, then templates grouped by step, with a link into
  the catalog pre-filtered by that phase.
- **Template detail:** breadcrumbs, title, summary, description, what's
  included, format and page count, where it fits (phase and step), price, Add
  to cart, bundles containing it, related templates (same step, then phase).
- **Bundles list / detail:** contents, total value versus bundle price, Add to cart.
- **Pricing:** how singles and bundles work, sample price points, FAQ.
- **About, Contact:** static; contact shows an email link, no form.
- **Cart:** line items, remove, subtotal, disabled checkout marked "coming soon".
- **Not found** pages for unknown template, bundle and phase slugs.

A slim banner marks the site as a beta with sample content while any
`isSample` record exists.

## Visual direction

Trusted consultancy: calm and editorial. Serif display type with a clean
sans-serif for text, generous whitespace, a restrained neutral palette with one
deep accent color, thin rules rather than heavy shadows. Light theme only in
the beta; colors are tokens so a dark theme can be added. WCAG 2.1 AA contrast,
visible focus states, full keyboard access.

## Sample content

About 60 templates and 5 bundles, distributed across all nine steps, all with
`isSample: true` and plausible titles, descriptions and prices. They are
placeholders, not the owner's real collateral.

## Error handling

- Invalid content fails the build with the record and field named.
- Unknown slugs return the 404 page.
- Unrecognized or malformed URL parameters are ignored, not errors.
- A corrupted cart in localStorage is discarded; cart lines whose slug no
  longer exists are dropped on load.

## Testing

- Vitest: schema validation and integrity checks, `query.ts` (each filter,
  combined filters, search, sort, pagination bounds, facet counts),
  `search-params.ts` round-trip, cart store, price formatting.
- Playwright: home to phase to template detail; catalog search plus filter
  updates URL and results; add to cart and see it in the cart; unknown slug 404.

## Path to production (not built now)

| Need | Where it plugs in |
|---|---|
| Real catalog | replace files in `content/` |
| Database or CMS | new implementation of `repository.ts` |
| Payments | checkout route plus server action reading the cart store |
| Accounts and downloads | new route group; `Template` gains file references |
| Analytics, SEO extras | `app/` layout and metadata |
