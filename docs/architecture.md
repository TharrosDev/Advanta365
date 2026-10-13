# Architecture

Advanta365 is a Next.js 16 App Router site written in React 19 and TypeScript. Pages are server
components that read a validated catalog and compose UI primitives. Styling uses CSS Modules on top of
global design tokens. The site ships HTML, CSS and inline SVG, plus one client-side visual: a WebGL2 ink
simulation drawn on a canvas behind selected headlines and during the first-visit cover. The engine is
loaded only where it is shown and not on the calm routes of section 6.1 (`CALM_ROUTE_SOURCE`).

Runtime dependencies are limited to `next`, `react`, `react-dom` and `zod`. Fonts come from
`next/font/google`: Besley for display type and Atkinson Hyperlegible Next for text, both exposed as CSS
variables (`--font-besley`, `--font-atkinson`).

Related documents: `design-system.md` covers the visual rules and component usage.

## Contents

1. Routes
2. Server and client boundaries
3. Content, validation and data flow
4. Site shell
5. Design tokens and primitives
6. Load-in sequence and the cover
7. Ink layer
8. Motion and page transitions
9. Catalog URL state
10. Test hooks and test contract
11. Budgets
12. Failure modes

## 1. Routes

| Path | Source | Rendering | Notes |
|---|---|---|---|
| `/` | `app/(site)/page.tsx` | Server, reads phases, templates and the free samples | Renders the first-visit cover, then the home sections |
| `/purchase` | `app/(site)/purchase/page.tsx` | Dynamic (awaits `searchParams`); reads phases, templates and the free samples | Title `Purchase`; the one place a sale starts (section 3.5), and `?checkout=<step>` opens the checkout in a pop-up over it (section 3.7) |
| `/catalog` | `app/(site)/catalog/page.tsx` | Dynamic (awaits `searchParams`) | Title `Catalog`; filters live in the URL, and `?view=<slug>` opens a free sample in a pop-up (section 9) |
| `/why-advanta` | `app/(site)/why-advanta/page.tsx` | Server; reads the phases for the phase links | Title `Why Advanta` (the page was `/about`, which redirects here); sections `#promise`, `#made`, `#who`, `#compare` (whose cost cell for the toolkit is the one price from `OFFER`) and `#state` |
| `/contact` | `app/(site)/contact/page.tsx` | Server, static | Title `Contact`; one section (`ContactSection`) and nothing else: the `h1`, the address `SITE.contactEmail` as a `mailto:` link, and four subjects to write about, each the same address with `?subject=`. No form and no endpoint |
| `/privacy`, `/terms`, `/refunds`, `/accessibility` | `app/(site)/<name>/page.tsx` | Server, static | The four legal pages, the routes of `LEGAL_LINKS` in `lib/site.ts`: the privacy policy (with the cookies and browser storage as its section `#cookies`, and what is planned for the checkout under `#when-checkout-opens`), the terms of use and licence, the refund policy and the accessibility statement. Each page renders `LegalPage` with one `LegalDocument` from `lib/legal` and takes its title and description from it (section 5.3) |
| `/sample` | `app/(site)/sample/page.tsx` | Server, reads phases and the worked example's contents | Title `Sample` |
| `/phases/[phase]` | `app/(site)/phases/[phase]/page.tsx` | Static params for the 7 phases | `notFound()` for other slugs |
| `/ink-lab` | `app/(lab)/ink-lab/page.tsx` | Development only | Calls `notFound()` unless `NODE_ENV` is `development` |
| Unmatched paths | `app/(site)/[...rest]/page.tsx`, `app/(site)/not-found.tsx`, `app/not-found.tsx` | 404 | Site 404 keeps the shell; the root 404 renders `MissingPage` and `InkLayer` without it |

Metadata: the root layout (`app/layout.tsx`) sets the title template `%s · Advanta365` and the default
title `Advanta365 · Don’t start from a blank prompt.` The description is built from the toolkit counts in
`lib/site.ts`. The home route exports no metadata of its own. The catalog page sets
`alternates.canonical` to `/catalog`, so every address of the catalog (a search, a filter, a page of results, a
template in `view`) names the plain catalog as the canonical one. No `metadataBase` is set and the site has no
origin of its own in the source, so the link is written as that path.

`next.config.ts` redirects the retired addresses, each with a permanent redirect (308):

| From | To |
|---|---|
| `/bundles`, `/bundles/:slug`, `/pricing`, `/cart` | `/purchase` |
| `/about` | `/why-advanta` |
| `/templates/:slug` | `/catalog?view=:slug` |

`view` opens the pop-up only for a free sample. For a locked template nothing opens and its tile says no (or,
where its tile is not on the page of results, a line above them does), and for any other value the catalog
shows as it is (section 9.3).

Page layouts:

- `/catalog` has no title block. It opens on the catalogue band (`pad="tight"`, 42px under the bar or the
  phase rail) with a visually hidden `h1` "Catalog" (`type-banner visually-hidden`), and the line under
  the result count (shown while there are results) says the listings are sample content.
- `/phases/[phase]`: the step bands alternate desk and paper, and the foot band carries the alternation on. It
  holds "View all <phase> templates" and `PhasePager`, a navigation named "Previous and next phase" whose
  links read "Previous phase <name>" and "Next phase <name>" (`adjacentPhases`); the first phase has no
  previous link and the last no next one. A tile on a phase page gets no `phaseName`, so it names its
  deliverable type alone.
- `/why-advanta`: two headlines stand at the statement size, the `h1` and the black `#promise` band. `#who` and
  `#compare` open with `SectionHead` at `banner`; `#made` and `#state` use `page` (`#made` because its head
  stands in a narrow column that stays under the bar, held inside a slot as tall as the ledger because a
  sticky grid item is held by the grid container, not its row).
  `#compare` is three `PaperSheet`s on a six-row subgrid;
  `#who` is a ruled register (`PaperStack`, `PaperSheet`, `BandedList`).
- `/contact`: one `section` in `main` and nothing else (`ContactSection`, a paper band named by its `h1`). The
  `h1` "Contact" is at the banner size, in the margin from 68em; beside it the lead, the address as the one
  plain `mailto:` link at the statement size, and a sentence on what to expect (the email program opens, no
  form, replies by email; no reply time is promised). Under them an `h2` "What to write about" and a
  `BandedList` of four `RowLink`s (a question before buying, purchase orders and invoices, licence questions,
  accessibility feedback), each `mailto:` with a `subject`. The page has no client code and no endpoint.
- `/sample`: after the statement, a paper band "Contents" holds the worked example's table of contents
  (`getWorkedExampleContents`) as a numbered `BandedList as="ol"` labelled by its heading: each section's
  title in `type-item`, then its place ("Template: …", "Step: …" or "Phase: …"). A free sample's place is a
  link to `/catalog?view=<slug>`, where it opens in the pop-up; a locked template's is its title in plain
  text. While `content/worked-example.ts` sets `placeholder`, a beta note heads
  the list and every section reads "Placeholder". The phase ledger follows on the desk.

`proxy.ts` runs before routing. Any path containing an uppercase letter receives a 308 redirect to the
lowercase path. Its matcher skips `_next/` and any path containing a dot.

## 2. Server and client boundaries

Layouts and pages are server components. They read the catalog through the repository, then pass plain
values (strings, numbers, arrays of plain objects) to components. A component runs in the browser when its
file carries the `"use client"` directive or a client component imports it.

Client components (files with `"use client"`):

| Area | Files | Why they are client |
|---|---|---|
| Catalog | `components/catalog/filter-panel.tsx`, `sort-select.tsx` | Update the URL with `router.replace` |
| Catalog tiles and pop-up | `components/catalog/locked-tile.tsx`, `components/ui/page-dialog.tsx` | The locked tile owns the denied state and its live line; the page dialog (which `TemplateDialog` and `CheckoutDialog` both render) is made modal in a layout effect and closes through the router |
| Checkout | `components/checkout/checkout-dialog.tsx` (and the steps it imports) | Reads the step from `useSearchParams` and the order's draft from session storage with `useSyncExternalStore`; owns validation state, focus on a step change and the polite announcement. `OrderSummary` is a server component, rendered by the page and passed in |
| Shell | `components/layout/primary-nav.tsx`, `purchase-button.tsx`, `phase-rail.tsx`, `nav-drawer.tsx` | Read `usePathname`; the drawer owns a native dialog |
| Not found | `components/not-found/asked-path.tsx`, `late-boot.tsx` | Read `window.location`; add the boot script when needed |
| UI | `components/ui/motion-root.tsx` | Observers and the `data-hydrated` signal |
| Catalog | `components/catalog/active-filters.tsx`, `phase-strip.tsx` | The filter chips (the router, and focus after a removal); the phase strip (below 68em) scrolling its lit card into view |
| Ink | `components/ink/ink-layer.tsx` | Singleton that starts the controller; it renders nothing |
| Home | `components/home/hero-landing.tsx` | Marks the hero's stage `data-landed` when the ink is not running, or stops (section 8.7) |

The ink controller itself (`components/ink/ink-controller.ts`) is plain TypeScript created by `InkLayer`.
`InkBackdrop` (`components/ink/ink-backdrop.tsx`) is server-renderable: it outputs a `<picture>` with the
still image, and the canvas is added later on the client.

The engine (`lib/ink/engine/index.ts`) is reached only through a dynamic `import()` from the controller, so
it loads only on pages that show ink.

The cover is server-rendered markup (`components/intro/intro-cover.tsx`). What switches it on is an inline
script rendered by `IntroScript` at the start of `<body>`, before any other content. See section 6.

## 3. Content, validation and data flow

```
content/*.ts  ->  lib/catalog/schema.ts (zod)  ->  lib/catalog/validate.ts
              ->  lib/catalog/repository.ts (getters)  ->  pages and layouts  ->  components
```

### 3.1 Content files

| File | Holds |
|---|---|
| `content/phases.ts` | The seven phases and their steps |
| `content/templates/index.ts` | Concatenates the seven per-phase template lists in phase order |
| `content/templates/make-the-case.ts`, `plan.ts`, `design.ts`, `prepare.ts`, `communicate.ts`, `execute.ts`, `sustain.ts` | Templates per phase |
| `content/templates/sample.ts` | The `sample()` helper |
| `content/taxonomy.ts` | Labels for deliverable types, apps, audiences and formats, and the list of ADKAR stage keys (stored on templates, never shown) |
| `content/worked-example.ts` | The worked example's table of contents: placeholder sections (`placeholder: true`, a `TODO(owner)`), each pointing at a template, a step or a phase |

`sample(phase, entries)` adds `phase`, `free` (default `false`) and `isSample: true` to each entry.
The per-phase files mark their entries as sample content, so `hasSampleContent()` is true (it is used only by
the unit tests now; the beta strip is gone).

### 3.2 Schema and validation

`lib/catalog/schema.ts` defines the zod schemas. Slugs match `^[a-z0-9]+(-[a-z0-9]+)*$`. Text fields are
trimmed and non-empty. A template has no price: the one price is `OFFER` (section 3.5).

| Kind | Required fields |
|---|---|
| Step | `slug`, `name`, `summary`, `order` (integer) |
| Phase | `slug`, `name`, `summary`, `order` (integer), `steps` (at least one) |
| Template | `slug`, `title`, `summary`, `description`, `phase`, `step`, `deliverableType`, `apps` (at least one), `audiences` (at least one), `format`, `adkar` (may be empty), `includes` (at least one), `free` (boolean: one of the six samples given away), `isSample`; optional `pageCount` (positive integer) |

`lib/catalog/validate.ts` parses each record, sorts phases by `order` and steps by `order` within each
phase, and keeps the file order of templates. It then checks:

- slugs are unique within phases, templates, and steps of one phase;
- each template's `phase` exists and its `step` belongs to that phase;
- exactly `FREE_SAMPLE_COUNT` (6) templates have `free: true`.

A failure throws `CatalogError` with the message `Invalid <kind> "<slug>" — <path>: <msg>` for a record, or a
message such as `Expected exactly 6 free templates, found 5`. The check runs when `repository.ts` is first
imported, so an invalid record stops every route that imports the repository.

### 3.3 Repository

`lib/catalog/repository.ts` is the only module in `app/` and `components/` that reads the phases and templates.
ESLint enforces this: imports of `@/content/*` are rejected in `app/**` and `components/**`, except
`@/content/taxonomy`.

| Getter | Returns |
|---|---|
| `getPhases()`, `getPhase(slug)` | Phases in order |
| `getTemplates()`, `getTemplate(slug)` | Templates in file order |
| `getFreeTemplates()` | The six free samples, in phase order |
| `getRelatedTemplates(slug, limit = 4)` | Templates in the same phase: same step first, then the rest of the phase; excludes the template itself |
| `hasSampleContent()` | `true` when any template is marked as sample (used by tests only) |
| `getWorkedExampleContents()` | `{ placeholder, sections }`: the worked example's sections resolved with `contentsRows` |

Helpers used by pages and components:

| Helper | Behaviour |
|---|---|
| `phaseCoverage(phases, templates)` | One entry per phase, sorted by `order`, with `covered` set when any template belongs to it |
| `adjacentPhases(phases, slug)` | `{ previous, next }` in `order`; either is undefined at an end, both for an unknown slug |
| `contentsRows(entries, templates, phases)` (`lib/catalog/worked-example.ts`) | Each contents section with its link: a free sample links into the catalog (`/catalog?view=<slug>`) under the template's title, a locked template is named by its title with no link, a step links to its anchor on its phase page, a phase to its page; no link when the catalog lacks the target |
| `formatLength(count, format)` (`lib/format.ts`) | A template's Length fact: slides for a `pptx` deck ("16 slides"), pages for every other format |
| `intoViewOffset(row, item, padding)`, `scrollCurrentIntoView(row)` (`lib/scroll/into-view.ts`) | How far a sideways row must scroll so one item stands clear of its scroll padding (0 when it already does), and the call that scrolls a row to its `aria-current` item without moving the page |
| `createScrimPress()` (`lib/scrim.ts`) | Tells a click on a dialog's dimmed page from a drag that merely ended there: it closes only when the press, the release and the click all have the dialog itself as their target. `PageDialog` and `NavDrawer` use it |
| `previousEntryIs(navigation, href, origin)` (`lib/history.ts`) | Whether the history entry before the current one is `href`, in any order of its parameters; false whenever it cannot tell (no Navigation API, no earlier entry, another site). `PageDialog` closes with `router.back()` on true |
| `formatPrice(cents, currency)` and `formatPriceParts(cents, currency)` (`lib/format.ts`) | Canadian-English formatting with the narrow symbol, so a dollar currency prints a bare `$`, followed by the currency code after a no-break space; whole amounts drop `.00` and other amounts keep their cents, so `149999` and `"CAD"` print `$1,499.99 CAD`. The currency is always passed in (`OFFER.currency`). `formatPriceParts` returns `{ amount, currency }` for a place that sets the code smaller than the amount (the price tag) |
| `countWord(count, form)` (`lib/format.ts`) | A count as copy writes it: a word up to twelve, digits beyond; `"capital"` for the first word of a sentence. The catalog's key line and the home page's toolkit section print `FREE_SAMPLE_COUNT` with it |

### 3.4 Catalog contents

Seven phases, each with two steps (14 steps in total):

| Order | Slug | Name | Steps | Templates |
|---|---|---|---|---|
| 1 | `make-the-case` | Make the case | `build-the-business-case`, `secure-sponsorship` | 8 |
| 2 | `plan` | Plan | `assess-impact-and-readiness`, `set-the-change-strategy` | 12 |
| 3 | `design` | Design | `design-governance`, `design-the-adoption-approach` | 6 |
| 4 | `prepare` | Prepare | `build-the-champion-network`, `train-each-audience` | 9 |
| 5 | `communicate` | Communicate | `announce-the-change`, `equip-sponsors-and-managers` | 8 |
| 6 | `execute` | Execute | `go-live`, `run-hypercare` | 7 |
| 7 | `sustain` | Sustain | `measure-adoption`, `reinforce-and-hand-over` | 17 |

There are 67 templates. Their formats are docx (32), xlsx (19), pptx (12) and pdf (4). `pageCount` is set on
43 templates; it is printed as slides for a deck and pages otherwise (`formatLength`). Six are free samples, one for each of the first six phases (the Sustain phase has none):

| Phase | Free sample | Format |
|---|---|---|
| 1 | `executive-sponsor-kickoff-deck` | pptx |
| 2 | `change-management-strategy` | docx |
| 3 | `sharepoint-governance-framework` | docx |
| 4 | `sharepoint-end-user-training-deck` | pptx |
| 5 | `master-communications-plan` | xlsx |
| 6 | `go-live-readiness-checklist` | xlsx |

Every other template is part of the toolkit and shown locked.

### 3.5 The offer

The site sells one thing. `lib/site.ts` holds it:

| Name | Value |
|---|---|
| `OFFER` | `{ name: "The complete toolkit", priceCents: 149999, currency: "CAD" }`. The only place the price and its currency are written; the tag, the bar's button and the Purchase page print them with `formatPrice` as `$1,499.99 CAD`, in Canadian dollars |
| `TOOLKIT` | The counts of the whole toolkit (59 playbooks, 130 templates, 4 field guides, 58 job aids, three training audiences, "30+ years"). They are not counts of the catalog |
| `PURCHASE_LINK` | `{ href: "/purchase", label: "Purchase" }`, first in the primary links |
| `NAV` | Catalog and Why Advanta |
| `CONTACT_LINK` | `{ href: "/contact", label: "Contact" }`. The menu below 68em lists it after the primary links (`MENU_LINKS` in `components/layout/nav-links.ts`) and the footer links to it; the bar's inline row does not |

`/purchase` shows the offer. It has no title block: it opens on one stage on paper, 42px under the bar
(56px from 68em), over a `bloom` ink backdrop, holding the `Portfolio` at the left (columns 1 to 6 from 68em: the toolkit as one folder at page
size, the price on the tag that hangs from it, the tally of all seven phases under it) and the `ContentsLeaf`
at the right (columns 8 to 12; column 7 is the room the tag hangs into): the h2 "What is inside", a ledger
read from `TOOLKIT`, the Checkout link, the line that leads to the contact page (for a purchase order, or a
question) and the note that the catalog is sample content. The heading on the folder's front, "Seven phases
in one folder.", is the page's one `h1` (`Portfolio` at `size="page"`). Below 68em it is one column, the folder first, until a window is about 1010px wide: the grid is then
two columns of at least 28rem, so a landscape tablet has the two side by side, the tag lying on the folder. From
68em, on a large monitor, the folder and the leaf are drawn larger together with CSS `zoom` (`--grow`, section
5.1), and the leaf stands on the page's right edge as the folder stands on the left. Below 68em the stage's
ink is faded in over its first 6rem. Checkout is the leaf's main action: a `Button` link to
`/purchase?checkout=details` with `scroll={false}`, which opens the checkout over the page (section 3.7). No
payment provider is connected, so nothing can be paid for yet. Locked templates are locked for every visitor;
there are no accounts.

### 3.6 Taxonomy

| Facet | Values (label) |
|---|---|
| Deliverable type | `communication` (Communications), `training` (Training), `assessment` (Assessments), `plan` (Plans), `stakeholder` (Stakeholder tools), `sponsor` (Sponsor tools), `resistance` (Resistance management), `measurement` (Measurement), `governance` (Governance) |
| App | `sharepoint` (SharePoint), `teams` (Teams), `onedrive` (OneDrive), `outlook` (Outlook), `copilot` (Copilot), `m365-general` (Microsoft 365 (general)) |
| Audience | `sponsor` (Sponsors), `change-lead` (Change leads), `manager` (People managers), `end-user` (End users), `site-owner` (Site Owners), `im-rep` (IM Representatives), `it-admin` (IT admins) |
| Format | `docx` (Word), `pptx` (PowerPoint), `xlsx` (Excel), `pdf` (PDF) |
| ADKAR | `awareness`, `desire`, `knowledge`, `ability`, `reinforcement` |

### 3.7 Checkout and the payment seam

The checkout is complete up to the point where a payment provider is wired in. It is a pop-up over
`/purchase`, the same `PageDialog` as the pop-up of the catalog (section 9.3): the page renders
`CheckoutDialog` only while the address says `checkout=<step>`, the server sends `<dialog open>`, and it
closes (Escape, Close, a click on the dimmed page, Back) to `/purchase` with focus back on the Checkout link.

| Module | Holds |
|---|---|
| `content/countries.ts` | `COUNTRIES` (ISO 3166-1 alpha-2 code and name, Canada first, then alphabetical), `CANADIAN_PROVINCES`, `US_STATES`. Read through `lib/checkout/places.ts`, because components may not import `@/content/*` |
| `lib/checkout/places.ts` | `isCountry`, `countryName`, `regionsOf` (a list for `CA` and `US` only), `regionLabel` ("Province or territory", "State", "Region"), `regionProblem`, `regionName` |
| `lib/checkout/schema.ts` | The zod schemas, written with `zod/mini` because they run in the browser: `detailsSchema` (full name, work email, organization, country; a listed region for Canada and the United States, free text or empty elsewhere; an optional PO or reference number and note; every message is the line the form prints), `parseDetails` (one message per field), `orderSchema` and the `Order` type (`reference`, `createdAt`, `item` pinned to `OFFER` by literals, `details`, `agreedToTerms: true`). No field for a card exists |
| `lib/checkout/draft.ts` | The `Draft` (details as typed, `agreed`, `reference`, `createdAt`), `readDraft` (anything missing or malformed becomes empty), and `draftStore`: session storage under `DRAFT_KEY` (`advanta365:checkout`) as a `useSyncExternalStore` source, with `save` and `clear`. Where storage is blocked the draft lasts as long as the page |
| `lib/checkout/steps.ts` | The step machine: `CHECKOUT_STEPS` (`details`, `review`, `payment`), `parseCheckoutStep`, `checkoutHref`, `furthestStep`, `resolveStep` (never a step the order has not reached), `stepState`, `stepAnnouncement` |
| `lib/checkout/order.ts` | `orderCode` (`A365-YYMMDD-XXXXXX`, six characters from six random bytes, no 0, 1, I or O), `buildOrder`, `includedLines` (from `TOOLKIT`), `orderAmounts`, `TAX_LINE`, `detailRows`, `orderText` and `orderMailto` |
| `lib/checkout/provider.ts` | The seam: `PaymentProvider`, `PaymentStart`, `getPaymentProvider()` (returns `null` today) and `startPayment` |
| `lib/checkout/links.ts` | `legalLink(href)`: one of `LEGAL_LINKS` by its address, checked by the compiler |
| `components/checkout/` | `CheckoutDialog` (the client entry), `DetailsStep`, `ReviewStep`, `PaymentStep`, `Field`, `FieldError`, `ErrorSummary` and `OrderSummary` (server) |

**Steps and the address.** The address carries the name of the step and nothing else. `checkout` with any
other value opens nothing. Moving between steps calls `window.history.replaceState` (which Next.js syncs to
`useSearchParams`), so the checkout is one history entry whatever step it is on: Back closes it, and the
page is not fetched again between steps. A link to a step the order has not reached shows the furthest step
it has (`resolveStep`) and corrects the address. On a step change focus moves to the step's `h3` (or to
the field an "Edit" on the review named), a visually hidden `role="status"` line says "Step 2 of 3: Review",
and the step settles in (`data-checkout-step` with `data-enter`).

1. **Your details**: one form. A field is checked when focus leaves it and all of them on submit; an error
   stands under its field (`aria-invalid`, `aria-describedby`), and a failed submit puts focus on an
   `ErrorSummary` that links to each field. Country is a native select; the region is a select for Canada
   and the United States and a free line otherwise.
2. **Review**: every field read back with an "Edit" each, links to `/terms` and `/refunds` (new tab), and
   a required checkbox. Confirming gives the order its code and time once (`orderCode`), kept from then on.
3. **Payment**: `PaymentStep` with `getPaymentProvider()`. With `null` it says online payment is not
   connected, shows the order's code and the order, and offers "Send this order by email" (`orderMailto`, a
   `mailto:` to `SITE.contactEmail`) and "Copy order details" (`orderText`), plus "Start over", which
   clears the draft. With a provider it shows the provider's pay button and runs `startPayment`.

**Data handling.** There is no backend. The draft is read while rendering (the server snapshot is `null`,
"not known yet": the first step is then an empty form and a later one a line that says the order is being
opened) and saved on every change. Nothing is sent anywhere: the only way an order leaves the browser today
is the email the buyer chooses to send from their own mail program. No personal data is written into an
address. Without JavaScript the first step is shown open with a notice; its form has `method="dialog"`, so
submitting it closes the pop-up and puts nothing in the address.

**Wiring a payment provider.** Nothing below is implemented. In order:

1. **Choose the shape.** A hosted payment page (Stripe Checkout or any hosted page) answers `start` with
   `{ kind: "redirect", redirectUrl }`. An embedded payment element answers with
   `{ kind: "embedded", clientSecret }` and supplies the `Embedded` component that draws it.
2. **Add the server half.** A route handler at `app/api/checkout/route.ts` (`POST`), or a server action in
   `lib/checkout/actions.ts` (`"use server"`). It parses the body with `orderSchema` (the schema pins the
   item, price and currency to `OFFER`, so an altered amount is rejected), creates the provider's session or
   payment with the amount and currency read from `OFFER` on the server, never from the request, puts
   `order.reference` in the provider's metadata, turns on the provider's tax calculation (the summary
   promises "Calculated at payment"), and returns the redirect address or the client secret. The success
   address should be a page of its own (step 6); the cancel address is `/purchase?checkout=payment`, where the
   draft still is. A hosted page can be created with `fetch` against the provider's REST API, which needs no
   new dependency.
3. **Set the environment variables** in the host's settings and in `.env.local` (never committed): the
   provider's secret key and its webhook signing secret, server only (for Stripe `STRIPE_SECRET_KEY` and
   `STRIPE_WEBHOOK_SECRET`), and, for an embedded element only, the publishable key with the `NEXT_PUBLIC_`
   prefix (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`). Use the provider's test keys until the flow has been walked
   end to end.
4. **Write the provider object** in `lib/checkout/providers/<name>.ts`: `id`, `label` (the words on the pay
   button), `start(order)` (call the route or action from step 2 and map its answer to a `PaymentStart`) and,
   for an embedded element, `Embedded`, which should load the provider's script only when it mounts, so the
   script is fetched on the Payment step and nowhere else. A provider SDK is a new runtime dependency: the
   design gate pins the dependencies to four, so change that rule in the same change, with the reason.
5. **Return it from `getPaymentProvider()`** in `lib/checkout/provider.ts`. Nothing else in the interface
   changes: `PaymentStep` draws the pay button, and `startPayment` re-checks the order, follows a redirect
   only to an `https:` address or one on the site's own origin, hands a client secret to `Embedded`, and
   turns anything else into one failure message the buyer can retry.
6. **Confirm and clear.** Add the page the provider returns to after payment (for example
   `app/(site)/purchase/thanks/page.tsx`): it says the payment went through and calls `draftStore.clear()`.
   Treat it as a courtesy, not as proof of payment.
7. **Fulfil from the webhook.** A route handler at `app/api/checkout/webhook/route.ts` verifies the
   provider's signature over the raw body with the webhook secret, ignores an event id it has already
   handled, and on the paid event (Stripe: `checkout.session.completed`) fulfils the order named by the
   reference in the metadata. Fulfilment itself is undecided (PRODUCT.md): it needs somewhere to record
   orders and a way to deliver the files, and neither exists.
8. **Update what the site says**: the Payment step's copy if needed, the Checkout entry of `SiteState`, the
   footer's status line, and the privacy policy's "When checkout opens" section (`lib/legal/privacy.ts`).
9. **Test it.** `tests/unit/checkout-provider.test.ts` already runs `startPayment` and `PaymentStep` against
   a fake provider; add a browser spec that walks to a paid order in the provider's test mode.

## 4. Site shell

`app/(site)/layout.tsx` is an async server layout. It reads the phases, then renders this tree, in order:

1. A skip link (`Button` with `href="#main"`, text "Skip to content"), fixed at the top left and shown
   on keyboard focus.
2. A `.frame` element (`position: relative`, flex column, `min-height: 100svh`, `overflow-x: clip`) containing:
   - `Header`, with `PurchaseButton` in its tools area;
   - `PhaseRail`;
   - `<main id="main">` holding the route's children;
   - `Footer`;
   - `InkLayer`, which renders no DOM.

Do not wrap route children in an error boundary: a `notFound()` call inside a page must still set the
404 status.

### 4.1 Header

`components/layout/header.tsx` is a server component that renders `<header data-bar>` with a `Wrap`
inside it. From 68em the row is a grid of three zones, `1fr auto 1fr`, so the middle zone is centred on the
bar itself and not on the room the other two leave. DOM and tab order follow the picture: brand, links,
button, Menu.

- Left: the brand, a link to `/` containing `BrandLockup`, made by `BrandLink` (`components/layout/brand-link.tsx`), a
  small client component so that the bar itself stays a server component. The accessible name is "Advanta365".
  From any other page it is a plain link to `/`. On the home page it is a return-to-top button: a plain left click
  is prevented and the page scrolls to its top (`behavior: "smooth"`, `"instant"` under `prefers-reduced-motion`),
  with no navigation and no history entry, and a query or hash in the address stays. A click with a modifier key,
  a middle click or a link that opens elsewhere is left to the browser. The drawer's brand is not a link, so it is
  unchanged.
- Centre: `PrimaryNav`, the links to Catalog and Why Advanta (`NAV`), shown from 68em, in a grid of equal columns.
  The current link has `aria-current="page"`, or `"true"` when the current path is nested under it. One ink
  underline (`data-nav-underline`, decoration only) stands under the current link and slides to the next
  one when movement is wanted; with no current link it is not displayed.
- Right: `PurchaseButton`, then the Menu button of `NavDrawer` (shown below 68em only). `PurchaseButton` is
  one link to `/purchase` with one accessible name at every width: "Get the toolkit · $1,499.99 CAD" from 68em,
  "Get the toolkit" below it, where the price is `display: none`. On `/purchase` it carries
  `aria-current="page"` and drops to a quiet look (the wash and an ink edge), so the page does not ask to
  be bought twice.

The bar is `position: sticky` at `top: 0`, height `var(--bar-h)`, and is a container for two container
queries that hide the menu word at 27.4em and below and the brand name at 24.3em and below, in that order,
so that at 320px the mark, the button and the Menu button all stay, each a 44px target. Container queries
are used only in `header.module.css` and `nav-drawer.module.css`.

### 4.2 Nav drawer

`components/layout/nav-drawer.tsx` (client) renders the "Menu" button and a native `<dialog>` opened with
`showModal()`.

- The dialog is labelled "Site menu". It contains a `nav` labelled "Menu" with the three primary links (Purchase, Catalog, Why Advanta) and the Contact page (`MENU_LINKS`: `PRIMARY_LINKS`, then `CONTACT_LINK`), and a
  group labelled "Rollout phases" with the seven phase links, each with a numeral.
- It shows the contact address as a `mailto:` link taken from `SITE.contactEmail`.
- Escape and the Close button close it. A click on the backdrop closes it when the event target is the
  dialog itself and the press began there too (`createScrimPress`), so a selection dragged out of the panel
  does not.
- The dialog closes on a pathname change unless it was opened on that same pathname.
- It closes when the viewport reaches `(min-width: 68em)`, where the inline navigation takes over.
- The drawer is 88vw wide at most and 23.625rem at most, anchored to the right edge.

### 4.3 Phase rail

`components/layout/phase-rail.tsx` renders the phases as a `PhaseTabs` row labelled "Phases". It is
hidden below 68em. It scrolls with the page. Its tabs use `aria-current="page"` on `/phases/<slug>`,
and `aria-current="true"` on `/catalog` while the `phase` parameter names exactly one known phase
(`singleCatalogPhase`); no other page belongs to a phase. `currentPhase()` in `nav-links.ts` computes it. The
rail reads the search inside a Suspense boundary whose fallback is the rail drawn from the pathname alone.

### 4.4 Footer

`components/layout/footer.tsx` renders `<footer data-band="binder">`, which sets the binder band. It is a server
component. Its contents, in order:

The footer is short on purpose and takes no props. It sits under a 2px highlighter edge, in three rows:

1. the bare brand lockup and a `Button` link "Get the toolkit" to `PURCHASE_LINK.href` (the highlighter fill with
   ink text on the binder);
2. one `nav` labelled "Footer" with two lists: `NAV` (Catalog, Why Advanta) and `CONTACT_LINK`, then
   `LEGAL_LINKS` (Privacy, Terms, Refunds, Accessibility) in the quieter, smaller type. All come from
   `lib/site.ts`; nothing is written out in the component;
3. the fine print: the copyright line and the non-affiliation notice (the `NOTICE` constant, one sentence to a
   line so the design gate can read each Prosci line).

Below 40em it is one column with the button across it; from 40em the lockup and the button share a row and the
two lists share a line; from 68em the copyright stands in columns 1 to 4 of the twelve and the notice in 5 to
12. Every link is in an item at least 44px tall (`--tap`) at every width. The rows are separated by hairlines.

The footer has no ink: no `InkBackdrop`, no calm zone. The `wisps` scene, its two stills and its stage entry
remain, because the ink lab still plays it, but no page of the site mounts it, so the ninety band of the home
page is the last stage of the page.

## 5. Design tokens and primitives

### 5.1 Tokens

Tokens live in `app/globals.css` under `:root`. The file also imports `app/motion.css` first. Only
`app/globals.css` and `app/icon.svg` contain raw colour values. Components read the semantic layer.

| Group | Tokens |
|---|---|
| Paper and ink | `--desk`, `--paper`, `--desk-deep`, `--rule`, `--rule-firm`, `--ink`, `--ink-soft`, `--ink-faint` |
| Mark | `--mark` (#86c1ff), `--mark-deep` (#5fa8f5), `--mark-wash` (#eaf4ff), `--on-mark` (ink), `--on-ink` |
| Binder (footer) | `--binder`, `--binder-rise`, `--on-binder`, `--on-binder-soft`, `--rule-on-binder` |
| Errors | `--alert`, `--alert-wash` (also the outline and the wash over the well of a locked tile that says no) |
| Page-size folder | `--card-light`, `--pocket-shade` |
| Overlays | `--scrim`, `--bar-shadow` |
| Pigments (read by the ink engine) | `--pigment-paper`, `--pigment-binder`, `--pigment-black`, `--pigment-blue`, `--pigment-blue-dark`, `--pigment-pale` |
| Elevation | `--depth-0` to `--depth-4` |
| Semantic | `--ground`, `--surface`, `--stripe`, `--tile`, `--text`, `--text-soft`, `--text-faint`, `--line`, `--line-firm`, `--line-ink`, `--focus-ring` |

The semantic layer is redefined per band. `[data-band]` sets `background: var(--ground)` and
`color: var(--text)`. The bands are `desk`, `paper`, `wash`, `ink` and `binder`. `ink` and `binder` share
one block: binder ground with binder-rise surfaces and on-binder text. `components/ui/band.tsx` sets
`data-band` from its `surface` prop (default `desk`).

The page sets `color-scheme: light`.

Type faces and classes:

| Class | Face | Weight / line height |
|---|---|---|
| `.type-poster` | Display | 800 / 0.86 |
| `.type-hero` | Display | 600 / 1.04 |
| `.type-statement` | Display | 600 / 1.06 |
| `.type-banner` | Display | 600 / 1.12 |
| `.type-page` | Display | 600 / 1.16 |
| `.type-section` | Display | 600 / 1.24 |
| `.type-item` | Display | 600 / 1.3 |
| `.type-amount` | Display | 700 / 1.1 |
| `.type-lead` | Text | 400 / 1.5 |
| `.type-copy` | Text | 400 / 1.58 |
| `.type-ui` | Text | 600 / 1.375 |
| `.type-note` | Text | 400 / 1.43 |
| `.type-eyebrow` | Text | 700 / 1.385, uppercase, tracking 0.08em |
| `.type-tag` | Text | 700 / 1.333, uppercase, tracking 0.06em |

Display classes reset letter-spacing and turn off tabular figures. Size tokens are `clamp()` values
(for example `--size-hero` runs from 2.5rem to 5rem). `.tabular` and `.visually-hidden` are utilities.

Spacing uses a 7px module: `--s-1` (0.4375rem) through `--s-9` (10.5rem). Page layout uses `--page-max`
(`max(77rem, min(72vw, 120rem))`, see below), `--over`, `--page-pad`, `--col-gap`, `--band-pad` (`--s-6`,
`--s-7` from 40em), `--bar-h` (3.5rem, 4.375rem from 68em) and `--rail-h` (2.625rem). Controls use `--tap` (2.75rem, the minimum target below 68em),
`--control-sm` (2.5rem, desktop bar only), `--control` (3rem) and `--control-lg` (3.5rem). Shapes use
`--round-1` to `--round-3`, `--edge` (2px) and `--hair` (1px). Layers are
`--layer-bar` (50), `--layer-skip` (90) and `--layer-cover` (100).

Media queries in use: `(min-width: 40em)`, `(min-width: 68em)`, `(hover: hover)`,
`(prefers-reduced-motion: no-preference)`, `(prefers-reduced-motion: reduce)`, `(prefers-contrast: more)`
and `(forced-colors: active)`. Nothing else is allowed (section 10.4).

A large monitor is scaled, not given a breakpoint. `--over` is `max(0px, 100vw - 1600px)`, and `html` sets
`font-size: min(140%, calc(100% + var(--over) * 0.005))`: the browser's own size (the 100%) up to a 1600px
window, then 0.5% of every pixel past it, to 140% (22.4px) from about 2880px. The sizes and spaces in the
stylesheets are in rem (the module, the type, the controls, the caps on a band, and since this change the
icons, the lifts of the folder, the blur over a locked cover and the padding of a tag), so one root size
scales the whole page together. Hairlines (`--hair`), edges (`--edge`), the radii and shadows stay in pixels. The
em media queries are read at the browser's own size, not at the root size the page sets, so `40em` and `68em`
do not move, and the design gate's list does not grow. `--page-max` is 77rem up to a 1600px window, so the
grid is twelve 77px columns and eleven 28px gaps (1232px) as it was; past it the column is 72% of the
window (from about 1840px, where that is more than 77rem) to a ceiling of 120rem, which is 2688px at the
largest root size. Surfaces whose sizes are in rem and would stand lost in a wider column read the window or
the column themselves, in `--page-max` or `--over`: the home hero (`--hero-cap`, `--hero-type`,
`--stage-bleed`, `--prompt-w` and the proof strip's width), the toolkit's folder and the specimen on the
home page, the minimum height of the ninety band, and the ink stills (section 7.9). Two
use CSS `zoom` with a number, `--grow`, which is how many times wider the column is than 77rem at the root
size in use, held to what the height of the window leaves room for (`tan(atan2(...))` turns a ratio of two
lengths into a number): the Purchase page's folder and leaf from 68em, and the worked example's page.
A few measures stay fixed on purpose: the ledgers of the Sample page and the next steps hold to 64rem, the
404's ledger to `--wrap-lead`, and the filter sheet to 40rem.

Base rules: border-box sizing; `html` with `scroll-padding-top` set to the bar height plus `--s-3`;
`html:has(dialog[open])` disables page scroll; headings and paragraphs have no margins; headings use
`text-wrap: balance`; `:focus-visible` draws a 3px outline in `--focus-ring`; `::selection` uses the mark
colour. The forced-colors block maps `[data-block]`, `[data-blank]` and focus to system colours.

### 5.2 Primitives (`components/ui`)

Primitives are the building blocks for pages. Each one has a CSS module unless noted.

| Primitive | Purpose |
|---|---|
| `Band` | A full-width section with `surface` (desk, paper, wash, ink, binder), `pad` (none, title, tight, regular, roomy), an optional `backdrop`, and an inner `Wrap` |
| `Wrap` | Page column: `max-width: var(--page-max)` on the content box, centred, with `--page-pad` outside it |
| `PaperSheet` | A sheet of paper with grain, `ratio` (free, portrait 5/7, landscape 4/3, slide 16/9), `size`, `depth`, and `lit` for pointer light |
| `PaperStack` | Sheets placed behind a top sheet, each with a small offset and turn |
| `Folder` | A folder shape with a tab and sheets that lift on hover or focus: `size` (`card`, or `page` for the portfolio, which measures itself in `cqi`), `sheets` (a number, or the sheets themselves as nodes), optional `slug` |
| `Button` | `variant` (mark, outline, ink, text), `size` (sm, md, lg), `href` (root-relative links use `TransitionLink`), `arrow`. `aria-disabled="true"` looks like `disabled` and stays focusable |
| `TransitionLink` | `next/link` with prefetch on. The only file that imports `next/link` |
| `TextLink`, `RowLink` | Inline and row-style links |
| `BandedList`, `BandedRow` | Ruled lists (also exported as `Ledger`, `LedgerRow`) |
| `FactList` | Label and value rows built on `BandedList` |
| `Split` | Two-column layout from 68em with a margin column, optional sticky margin and a rule |
| `ShelfHead` | Section heading with eyebrow, title, body and action |
| `Eyebrow` | Uppercase label with an optional square marker |
| `Tag` | `format`, `saving` or `plain` labels |
| `Tally` | A row of blocks for counts. `animate` fills the blocks on scroll |
| `Blank` | A blinking or steady caret bar |
| `Note` | A short paragraph on the wash ground |
| `Input`, `Select`, `Checkbox` | Form controls |
| `Pagination` | Previous, numbered pages and next |
| `PhaseTabs` | Phase tabs in `rail` or `large` size. `large` is two across on a phone; from 40em one row where the list is 42rem wide, each card as wide as its name needs, and four across where it is not |
| `Icon` | Inline SVG glyphs: arrow, chevron, plus, minus, close, tick, bars, search. `size` is pixels at the 16px root and the icon is set in rem, so it grows with the root on a large monitor |
| `LogoMark`, `BrandLockup` | The mark, as a tile or bare lockup. `LogoMark` draws the 365 on the arm in `tone="two"` unless `digits={false}`; `BrandLockup` shows it on the bar's tile from 68em and on the bare `md` lockup |
| `KeepCompounds` | Keeps hyphenated compounds from breaking across lines |
| `Sentences` | Splits text into sentences, optionally animated in one at a time |
| `Appear` | Wrapper that sets the entrance hook (`data-move`) |
| `PageShift` | `ViewTransition` wrapper for route changes |
| `MotionRoot` | Client component that sets up the scroll observer (renders nothing) |

Helpers: `lib/cx.ts` exports `cx` (joins truthy class names) and `cssVars` (builds a style object and
drops `undefined` values). `lib/brand/mark.ts` holds the logo geometry in two forms: the full one, `MARK_VIEWBOX` (36 by 24) with the long
tail `MARK_TAIL_D`, and the compact one, `MARK_VIEWBOX_COMPACT` (30 by 24) with the short tail
`MARK_TAIL_COMPACT_D` and no digits. Both share `MARK_STROKE_WIDTH` (3.8), the three segments, and the path
strings `MARK_LEGS_D`, `MARK_BAR_D` and `MARK_BODY_D`; `MARK_PATH_D` is the compact form as one path. The 365 on
the crossbar's arm is `MARK_DIGITS` (three open strokes, one per digit, each `M`, lines and curves only),
`MARK_DIGITS_D` (the three as one path), `MARK_DIGITS_STROKE_WIDTH` (1.4) and `MARK_DIGITS_BOX` (x 19.37 to
34.3, y 3.48 to 9.5, inside the viewBox). They are drawn last, in the ink of the tail, and only where they are
at least 7px high, which takes a mark 28px high: the bar's tile from 68em (a 49px tile with the full mark 28.4px
high), the bare footer mark (36px, so the digits are 9px) and the cover of a first visit, which writes them on
the arm after the mark (section 6). The 28px tile below 68em, the drawer, the folder's tile and the favicon
draw the compact form. `app/icon.svg` is generated from this file by `scripts/gen-icon.mjs` and uses the same
colours as the tokens: a #0B0D12 tile, the body in #FFFFFF and the tail in #86C1FF, and has no digits.

### 5.3 Feature components

Components built from the primitives for one part of the site. Each has a doc comment that says what it does.

| Component | File | Props | What it is |
|---|---|---|---|
| `Portfolio` | `components/purchase/portfolio.tsx` | `size` (`page`, `section`), `covers`, `phases` | The toolkit as a folder: the six sample covers in its pocket, the maker's lockup, a heading and the file formats, the `PriceTag` on its corner, and under it a tally of the phases (a text calm zone) |
| `PriceTag` | `components/purchase/price-tag.tsx` | `className` | The price from `OFFER` and "one purchase" on a paper tag hung on a string from the corner of the folder. Swings once when first seen and a little when the folder is hovered; still under reduced motion |
| `ContentsLeaf` | `components/purchase/contents-leaf.tsx` | `className` | The toolkit's contents as a loose paper leaf with a dog-eared corner: a ledger (dl) of counts from `TOOLKIT`, then the Checkout link (to `/purchase?checkout=details`), the line to the contact page and the sample note. Opaque, so it needs no calm zone |
| `ContactSection` | `components/contact/contact-section.tsx` | none | The whole Contact page as one paper band (a `section` named by its `h1`): the title in the margin from 68em, the lead on its baseline, the address as a `mailto:` link at the statement size, a sentence on what to expect, then a `BandedList` of four `RowLink`s, each the address with a subject. No script |
| `PromiseBand`, `MakingSection`, `BuyersSection`, `CompareSection`, `SiteState` | `components/about/` | none (`MakingSection` takes `phases`) | The sections of the Why Advanta page, in page order (section 1); `SectionHead` is the head they share and `PhaseLine` the seven phase links inside `MakingSection` |
| `TemplateTile`, `TileGrid` | `components/catalog/template-tile.tsx` | `template`, `phaseName`, `phaseOrder`, `href`, `headingLevel`, `scroll`, `denied` | One template in a grid, an `<article data-tile>` with exactly one control: a link (free sample) or a button (locked). The grid has as many columns of at least 11rem (176px at the 16px root) as fit, never fewer than two; the home page's six free samples set their own columns (`featuredGrid`: three across from 40em, six from 68em), so a row is never one tile short |
| `LockedTile` | `components/catalog/locked-tile.tsx` | `title`, `headingLevel`, `initialDenied` | The button of a locked tile, named "<title>, locked", and the line it answers with (section 9.3) |
| `TemplateDialog` | `components/catalog/template-dialog.tsx` | `closeHref`, `labelledBy` | The pop-up of the catalog: `PageDialog` with `name="template"` (section 9.3) |
| `PageDialog` | `components/ui/page-dialog.tsx` | `name` (`template`, `checkout`), `closeHref`, `labelledBy`, `bar`, `fill` | The dialog both pop-ups share: a native modal `<dialog>` that is open while the page renders it and closes to `closeHref`. `bar` stands before Close; `fill` makes it the whole window below 40em and one fixed height from there |
| `CheckoutDialog` | `components/checkout/checkout-dialog.tsx` | `panel`, `disclosure` (the two forms of `OrderSummary`) | The checkout (section 3.7) |
| `OrderSummary` | `components/checkout/order-summary.tsx` | `variant` (`panel`, `disclosure`) | The offer, what it holds, the price, the tax line and the total before tax, on the binder: a column from 68em, a native `<details>` row below it |
| `ActiveFilters` | `components/catalog/active-filters.tsx` | `criteria`, `phases`, `fallbackFocusId` | The filters that are on, as a row of chips above the results (section 9.4) |
| `PhaseStrip` | `components/catalog/phase-strip.tsx` | `label`, `current`, `className` | The `nav` around the catalog's row of phases below 68em; scrolls the row to its lit card once drawn, when the fonts arrive and when the phase changes |
| `PhasePager` | `components/catalog/phase-pager.tsx` | `previous`, `next`, `className` | The phase before and the phase after, at the foot of a phase page |
| `TemplateDetail` | `components/catalog/template-detail.tsx` | `template`, `phase`, `titleId` | The content of the pop-up: large cover, "Free sample" tag, title, summary, description, facts, what is included, and the button to `/purchase` |
| `Hero`, `HeroStage` | `components/home/hero.tsx`, `hero-stage.tsx` | `samples`, `phases` | The first screen of the home page: headline, lead and two buttons over the `prompt` ink; the stage where an empty prompt box becomes the six free samples as a hand of documents (section 8.7) |
| `HeroLanding` | `components/home/hero-landing.tsx` | none | Client. Renders nothing; sets `data-landed` on the stage when the ink is not running at mount, or stops running later, which ends the sequence for that stage (section 8.7) |
| `ProofStrip` | `components/home/proof-strip.tsx` | none | The band's foot: 30+ years, 59 playbooks, 130 templates, one purchase, on opaque paper |
| `PortfolioSection` | `components/home/portfolio-section.tsx` | `covers`, `phases` | `#toolkit` on the home page: words and the button to `/purchase`, the `Portfolio` at section size |
| `PurchaseButton` | `components/layout/purchase-button.tsx` | `className` | The bar's call to action (section 4.1) |
| `TitleBlock` | `components/layout/title-block.tsx` | `title`, `lead`, `form` (`index`, `document`, `wide`), `crumbs`, `meta`, `children`, `ink`, `aside` | The band that opens every inner page but the catalog, holding its one `h1`. One column below 40em. With an `aside` (the phase numeral and its count, the worked example's page), from 40em the words and the aside stand side by side (`.paired`: the aside's column is `clamp(16rem, 25vw + 6rem, 18rem)`), so a tablet's first screen is not a column of words over an object; from 68em the twelve columns take over. The `index` form's grid is a size container (`.measure`), and from 68em its title is held to the three margin columns by `cqi` (the banner size is wider than they are up to about 1280px). The `ink` frame is 28.1875rem wide (451px at the 16px root), so it grows with the root size |
| `LegalPage` | `components/legal/legal-page.tsx` | `document` (a `LegalDocument`) | The one layout of the four legal pages. The title block in its `document` form with the date the page last changed in the margin, then one paper band under an ink rule holding, in DOM order, the table of contents (`nav` "On this page", `data-legal-toc`, plain anchors), the `article` (the page in a few points on the wash, then one `<section id data-legal-section>` per numbered section with its `h2`, subsections as `<h3 id>`) and the `aside` "Policies" (the four pages as a ledger of `RowLink`s with `aria-current`, and the contact address). From 68em the contents stand in columns 1 to 3 and the policies in columns 10 to 12, both sticky under the bar, with the article in columns 4 to 9 at a measure of 40rem; below it the contents are a ledger across the top (two columns from 40em). A server component with no script. The words are data, not markup: `lib/legal/privacy.ts`, `terms.ts`, `refunds.ts` and `accessibility.ts` each build a `LegalDocument` (`lib/legal/types.ts`) from the facts in `lib/legal/facts.ts`. That file's `LEGAL` object is the one place the owner sets the seller's legal name and address, the governing province, the date of the pages, the privacy contact, the host, the refund window, whether client work is licensed and the date of an accessibility audit; a value left `undefined` is an open item, and each page then says only what is true without it |



## 6. Load-in sequence and the cover

The sequence is driven by one inline script, `BOOT_SCRIPT` (`lib/boot/boot-script.ts`). It is generated
from constants in `lib/boot/state.ts` and runs before first paint. `IntroScript` prints it inside a hidden
`div`, so a client-rendered 404 does not log an error.

### 6.1 Constants

| Name | Value | Use |
|---|---|---|
| `INTRO_FLAG` | `advanta365.intro.v1` | sessionStorage flag for the cover |
| `INTRO_SEEN` | `1` | Value of the flag once the session has loaded |
| `INTRO_PATH` | `/` | Only the home route plays the cover |
| `INTRO_SKIP_EVENTS` | `pointerdown`, `keydown`, `wheel`, `touchstart` | Any of these ends the cover early |
| `INTRO_BACKSTOP_MS` | 5500 | The cover is ended at this time regardless |
| `INTRO_CLICK_GUARD_MS` | 600 | After a touch or a pen ended the cover, the first click is swallowed for this long |
| `INTRO_TAKEOVER_MS` | 1600 | The latest moment of the cover's own timeline at which the ink may still take it over |
| `INK_KEY` | `advanta365.ink.v1` | sessionStorage key for the ink mode and tier |
| `INK_BACKSTOP_MS` | 6000 | A live ink mode that no layer claims becomes still |
| `CALM_ROUTE_SOURCE` | `^/catalog(/\|$)` | The catalog and whatever lies under it: ink is swapped for stills |

### 6.2 Script order

1. If `prefers-reduced-motion: reduce` matches, set `data-ink="still"` and return. Nothing else is set, so
   no motion, no cover and no ink run.
2. Set `data-motion="on"`.
3. Set `data-timeline="on"` when `CSS.supports("animation-timeline: view()")` is true.
4. Set `data-ink-route="calm"` on calm routes.
5. Decide the ink mode. `data-ink` becomes `still` when `prefers-contrast: more`, `forced-colors: active`,
   `prefers-reduced-data: reduce`, `navigator.connection.saveData`, or the stored value is `off`. It becomes
   `live` when the stored value is a tier name. Any other stored value (such as the `paused` an earlier version
   wrote) counts as no value, and a probe runs: a throwaway `webgl2` context with `failIfMajorPerformanceCaveat` must provide
   `EXT_color_buffer_float` or `EXT_color_buffer_half_float`, and its renderer name must not match the
   software pattern (SwiftShader, llvmpipe, softpipe, "software", "basic render"). The probe context is
   lost afterwards. On failure, `data-ink` is `still` and `off` is stored.
6. A `live` ink mode that no layer has claimed after 6000 ms becomes `still`.
7. The cover decision: read `INTRO_FLAG`. If storage throws, nothing runs. Otherwise the flag is written as
   `1` on every first load of the session, on any path and in a hidden tab. The cover plays only when the
   stored value was not `1`, the path is `/`, and `document.visibilityState` is `visible`.
8. When the cover plays: set `data-intro="play"`, listen for `INTRO_SKIP_EVENTS` (capture and passive) to
   set `data-intro="leave"` (a touch or pen press also arms the click guard of section 6.5), listen for
   `animationstart` and `animationend` on the cover, and start a 5500 ms timer.

Pure equivalents of these decisions (`shouldPlayIntro`, `inkMode`, `isSoftwareRenderer`, `isCalmRoute`)
live in `lib/boot/state.ts`. The unit tests run the inline script against them, so the two stay equal.

### 6.3 Attributes set on `<html>` before first paint

| Attribute | Values | Set by |
|---|---|---|
| `data-motion` | `on` | Boot script |
| `data-timeline` | `on` | Boot script, when view timelines are supported |
| `data-ink` | `live`, `still` | Boot script, then the controller |
| `data-ink-route` | `calm` | Boot script and controller |
| `data-intro` | `play`, `ink`, `leave`; absent when done | Boot script (`play`, `leave`), controller (`ink`), boot script on the end event |
| `data-io` | `armed` | `MotionRoot`, in a layout effect on each pathname change |

### 6.4 Timeline of the cover

Milliseconds from the cover's own clock, which starts at first paint (the boot script runs a little before
that). The selectors do not name a state, so a change of state never restarts a stroke.

| Time (ms) | Event |
|---|---|
| 0 | `data-intro="play"`. The cover (`[data-intro-cover]`, fixed, `z-index: var(--layer-cover)`) shows over the page |
| 120 to 480 | Both legs of the mark are drawn (`pen-stroke` on `.legs`) |
| 420 to 600 | Bar is drawn |
| 500 to 900 | The name (`.name`) fades in |
| 560 to 800 | Tail is drawn, in the highlighter |
| 600 | Skip hint fades in |
| 800 to 1000 | The 365 is written on the tail in a finer pen (stroke 1.1): the 3 from 800 to 900, the 6 from 850 to 950, the 5 from 900 to 1000 |
| 1000 to 2500 | The finished mark stands |
| 2500 to 2680 | The signature and the hint fade on the still opaque paper (`sign-leave`, 180 ms) when no ink took over |
| 2500 to 2950 | Cover leaves (`cover-leave`, 450 ms, `--curve-leave`) when no ink took over: its opacity holds at 1 until 40%, 2680, so the mark never lies over the hero |
| 2500 to 2800 | The signature (mark and name) fades on the ink path, whenever the ink took over |
| T + 2700 to T + 3500 | Cover ink leave (`cover-ink`, 800 ms), when the ink took over at T (T is 1600 at the latest) |
| 5500 | Backstop: the `data-intro` attribute is unset |

The signature's fade is `calc(var(--ink-sign-at) - var(--taken, 0ms))`: the controller writes `--taken`, the
cover's own time at the takeover, so the mark stands to 2500 ms on both paths. Where the ink is live, the
hero's sequence starts when `data-intro` is gone (section 8.7).

The mark is drawn with `pathLength={1}` and dash offsets. The pen curve is `--curve-pen`.

### 6.5 Skip, takeover and end

- Skip: any `INTRO_SKIP_EVENTS` input sets `data-intro="leave"`, which runs `cover-skip` (200 ms). The
  skip listeners are detached as soon as the cover's own animation starts, which is after its delay (2500 ms for
  `play`), so a press ends the cover through the whole hold. Child animations do not count.
- Skip and the pointer: `cover-skip` sets no `pointer-events`, so the cover takes the pointer for all 200 ms and
  `visibility: hidden` ends the hit-testing on its last frame. A touch's click is aimed where the finger lifts, not
  where it came down, so a cover that let the pointer through at once would give the click to the link under it. A
  tap held past the 200 ms would do the same, so a press by touch or pen (`touchstart`, or `pointerdown` whose
  `pointerType` is not `mouse`) also arms a one-shot, capture-phase `click` listener on `window` that stops and
  cancels the first click, and is dropped by that click or after `INTRO_CLICK_GUARD_MS`. A mouse, a key and the
  wheel arm nothing. The guard outlives the cover: the end of the cover does not remove it. `cover-leave` and
  `cover-ink` still turn the pointer off from their first frame, since by then the page is the visitor's.
- End: an `animationend` event whose target is the cover itself, or the 5500 ms backstop, removes the
  `data-intro` attribute and detaches the listeners.
- Takeover by ink: the ink controller fetches the engine module as soon as the controller module is evaluated
  (and again as the first act of `createController`), when `data-intro` and `data-ink="live"` are present,
  with no wait for an idle moment. When the engine reports ready while the cover is up, the controller checks
  four things: `data-intro` is `play`, the cover element exists, the cover's own animation `currentTime` is at
  most `INTRO_TAKEOVER_MS` (1600 ms), and the WebGL2 context of the ink canvas offers
  `KHR_parallel_shader_compile`. If all four pass, it writes `--taken` on the cover, sets `data-intro="ink"`,
  marks the cover backdrop `live`, presets the `intro` scene, and runs it for 3500 ms. The cover's exit and the
  scene both run from that moment and both last 3500 ms, so the cover is gone as the last of the clear is, by
  5100 ms of the cover's time at the latest. The first drop falls when the engine is ready: about 0.8 to
  1.1 s on the machine it was measured on, the shader compile being the floor. Otherwise the cover runs alone
  and the ink starts after the cover is gone.
- After the cover: when `data-intro` is unset, the controller probes the tier if none is stored and then
  chooses the backdrop to run.
- Load entrances finish under the cover. Under `:root[data-intro][data-motion="on"]`, load entrances use
  `animation-duration: 1ms` and no delay, so headings are visible when the cover goes.

The `/ink-lab` page has its own cover script that ignores the session flag, the path and reduced motion. It
exists for development only.

## 7. Ink layer

The ink layer is a WebGL2 fluid simulation. Dye is dropped into the water, advected by a velocity field
and rendered as ink over the ground colour. A backdrop is a region of a page where the ink runs. Pages place
backdrops; the controller decides which backdrop runs at a time.

### 7.1 Parts

| Part | File | Role |
|---|---|---|
| Types | `lib/ink/types.ts` | Public types of the engine, safe for first-load code |
| Engine | `lib/ink/engine/index.ts` | `createInk(canvas, options)` and `isSupported()`. Loaded by dynamic import |
| Tiers and budgets | `lib/ink/engine/defaults.ts` | `TIERS`, `TIER_ORDER`, `BUDGET`, simulation and look defaults |
| GL | `lib/ink/engine/gl.ts` | Programs, render targets, double buffers, draw calls |
| Shaders | `lib/ink/engine/shaders.ts` | GLSL ES 3.00 vertex and fragment programs (copy, curl, force, advectVel, divergence, jacobi, project, advectDye, splatVel, splatDye, impulse, composite) |
| Pigments | `lib/ink/pigments.ts` | Reads the `--pigment-*` tokens as RGB values |
| Scenes | `lib/ink/scenes.ts` | The seven scenes and the timeline helpers |
| Stages | `lib/ink/stage.ts` | Stage weights, run lengths and the choice rule |
| Zones | `lib/ink/zones.ts` | Calm zones around text and edge strips |
| Stills | `lib/ink/stills.ts`, `lib/ink/stills.json` | Still manifest and paths |
| Test hook | `lib/ink/test-hook.ts` | Installs `window.__inkTest` (section 10.2) |
| Controller | `components/ink/ink-controller.ts` | Lifecycle, stages, pointer, failure handling and the cover takeover |
| Layer | `components/ink/ink-layer.tsx` | Singleton client component: starts the controller and renders nothing |
| Backdrop | `components/ink/ink-backdrop.tsx` | Server-renderable region with the still and the slot for the canvas |
| Lab | `components/ink/ink-lab.tsx` | Development page for the scenes |

Other pieces: `components/intro/intro-cover.tsx` (the cover, which hosts an intro backdrop),
`lib/boot/state.ts`, `lib/boot/boot-script.ts`, and `public/ink/` (the thirteen stills).

### 7.2 Engine interface

`createInk(canvas, options)` never throws. Without WebGL2, without `EXT_color_buffer_float` or half-float
targets, or without renderable RGBA16F, `supported` is `false` and an `unsupported` event fires on the
next microtask.

| Method | Effect |
|---|---|
| `preset(name, overrides?)` | Clears the water, applies the scene's simulation and look, arms its timeline |
| `fire(name)` | Runs a named trigger once until the next clear (the ninety scene uses `tenth`) |
| `still(name?, steps?)` | Stops the loop, applies the preset, fires all triggers, runs `steps` steps in batches of 24, then renders |
| `start()`, `stop()` | Frame loop on and off |
| `rest({ duration })` | Eases the water to standstill and emits `rest` |
| `step(n)`, `render()`, `resize()` | Deterministic stepping and drawing |
| `drop(drop)`, `stir(stir)`, `stream(stream)`, `impulse({dx, dy})` | Input. `stream` returns `{ stop() }` |
| `setCalmZone(zones)` | Calm zones: a zone, an array, a function (re-run after each resize), or `null` |
| `clear({ duration? })` | Mist and fade over `duration`; `0` drains at once. Called from outside it empties the scene's timeline; a clear in a scene's own script keeps the rest of the script, so a scene may clear its water and go on (the `prompt` scene does) |
| `set({ sim?, look? })` | Changes physics and look |
| `setQuality(tier)`, `probe()`, `measureCost(frames)` | Tier control, self-measurement and timing |
| `stats()` | Tier, running state, step count, time, fps, frame time, canvas size, pixel sizes |
| `on(event, fn)`, `off(event, fn)` | Events: `ready`, `restored`, `end`, `cleared`, `quality`, `lost`, `unsupported`, `slow`, `rest` |
| `destroy()` | Frees targets, programs, buffers and listeners |

Context options: `alpha: false`, `antialias: false`, `depth: false`, `stencil: false`,
`preserveDrawingBuffer: false`, `failIfMajorPerformanceCaveat: true`.

The controller passes these options: pigments read from the tokens, a quality (the stored tier if any,
otherwise `medium` during the cover, otherwise `auto`), `maxDpr` (1.5 when `(pointer: coarse)`, else 2),
`interactive: true` and `scrollImpulse: true`. Defaults include `seed: 365`, `stepsPerSecond: 60`,
`autoPause: true` and `adapt: true`.

### 7.3 Time and randomness

- The simulation step is fixed at 1/60 s. Each animation frame adds the elapsed time capped at 100 ms and
  runs at most two steps. Extra time is dropped. The frame is rendered once after its steps. A frame with no
  step does not render.
- Randomness comes from one xorshift32 generator (`makeRandom(seed)`, eight warm-up draws), reseeded on
  every preset and probe. The ambient noise seed is `seed % 1000`.
- Every scene is deterministic for a given seed and tier, which the scene tests rely on.

### 7.4 Simulation pipeline

Each substep runs in this order:

1. Timeline: `runTimeline` fires due entries. Streams run. Mipmaps refresh when dirty.
2. Clearing: during a clear, the mist value and fade are computed from the elapsed fraction. At the end,
   the clear drains, emits `cleared` and runs queued triggers.
3. Curl, then force. The force step applies vorticity confinement, gravity (weighted by the near and far
   dye layers), ambient potential currents, and calm drag.
4. Velocity advection (semi-Lagrangian midpoint), damping and viscosity.
5. Divergence (with walls and swell sources), Jacobi pressure iterations, then projection.
6. Dye advection. The near layer uses limited-cubic sampling when the tier allows it. The far layer advects
   at `farLag` and is sharpened only on the high tier. Each channel decays, and calm zones add extra decay.
   A floor is subtracted each step.

Fields: four dye channels in RGBA16F (near black, near blue, far black, far blue) with mipmaps (up to 7
levels), a velocity field (RG), and a pressure field.

Ink mapping: `"blue"` maps to the blue channel, an object with `black` and `blue` maps to both, and
anything else maps to the black channel. The choice between the pale and dark black pigments comes from the
look, not from the engine.

Drops and streams are given in canvas heights for radius and velocity, and as fractions of the canvas for
position, with the origin at the top left. A drop has defaults for position (0.5, 0.2), radius (0.05),
amount (2), depth (0.5, the share sent to the far layer), fiber (0.7) and push (1.25). The stroke stretch
follows the velocity direction up to 1.2.

### 7.5 Tiers and budgets

| Tier | Sim cells | Dye pixels | Dye scale | Pressure iterations | DPR cap | Canvas pixels | Shadow steps | Far sharp |
|---|---|---|---|---|---|---|---|---|
| high | 112,000 | 1,300,000 | 1 | 26 | 2 | 2,400,000 | 5 | yes |
| medium | 62,000 | 760,000 | 0.8 | 20 | 1.75 | 1,700,000 | 4 | no |
| low | 34,000 | 420,000 | 0.62 | 16 | 1.5 | 1,000,000 | 3 | no |

Cubic sampling is on for all tiers. `TIER_ORDER` is `low`, `medium`, `high`.

Frame budgets used by the probe: high 9 ms, medium 10 ms, low unlimited.

Probe (`runProbe`): starts at `medium` when `(pointer: coarse)` matches, otherwise at `high`. Each candidate
tier is sized, seeded with two drops, and timed with the median of up to seven steps after four warm-ups
(stopping at 90 ms total). If the cost is over budget, the probe steps down until it is within budget. If
the starting tier is below `high` and the cost is under 45% of the budget, it tries one tier up. The probe
then clears the water and resets the clock. The probe runs when `quality` is `auto`, and when the cover ends
if no tier is stored. One tier costs about 120 ms of the main thread. At boot (`probeInTurns`) every tier
after the first is tried in a task of its own, and the engine is not usable in between; the probe at the
end of the cover (`probe()`) answers in one task.

Adaptive watch: a frame that is slow adds one to a slow counter, and a normal frame subtracts two (floor 0).
At 75, the engine steps one tier down. At the lowest tier it emits `slow` instead, and the controller turns
the ink off for the session. A frame is slow against the display's own cadence, not against a fixed
figure: the first 30 frames of each run are timed (`CADENCE_FRAMES`), nothing is counted until they are,
and their median is the cadence. A frame is then slow when it is over 24 ms and over 1.5 times the cadence
(`slowFrameMs` in `lib/ink/engine/defaults.ts`), so a display capped at 30 Hz (a low-power mode, a battery
saver, a 30 Hz monitor), whose frames all come 33 ms apart with the GPU idle between them, is not taken for
a machine that cannot keep up. A cadence slower than 36 ms is not taken for a cap: those frames are
judged by the 24 ms alone.

Canvas size: the engine computes simulation size from the aspect ratio and the cell budget, and dye size
from the dye budget and the device pixel ratio capped by `maxDpr` and the tier's `dprCap`. Resizing
reallocates fields only when their sizes change. Existing fields are resampled into the new targets. When
the aspect ratio crosses 0.8 either way (portrait or landscape), the scene is presetted again so it lays out
for the new shape. The controller passes `anchors` to `preset` as a function, which the engine asks each
time it lays the scene out, so the second layout (and the one after a context restore) is aimed at where
the page's anchors stand then, not where they stood when the backdrop was activated.

### 7.6 Scenes

Each scene is a function of a context (`aspect`, `portrait` when the aspect is below 0.8, `width`,
`height`, and `anchors` with the page rectangles). Scripts can only call drop, stream and clear.

| Scene | Ground | Still steps | Duration | Trigger | What happens |
|---|---|---|---|---|---|
| `intro` | paper | 96 | 3.5 s | none | A black drop at 0 s, a blue drop at 0.5 s, a clear at 2.45 s (1.05 s). Narrow on portrait |
| `prompt` | paper | 1560 | no end | none | Nothing falls for 0.7 s, while the page's box stands empty. A black drop at 0.7 s left of the middle of the `open` anchor (the box) and a light-blue one at 1.2 s right of it, opening away from each other and meeting in the middle. A clear at 2.6 s (0.9 s): the water is clean at 3.5 s. From 6 s a drip every 5.5 to 8.5 s (7.5 to 11 s on a tall canvas) from the top of the stage across the band's width, two black to each blue, every third larger |
| `title` | paper | 420 | no end | none | Black at 0 s, blue at 1.6 s, then repeating drips from 9 s. Uses the `tankWater` simulation (which `prompt` shares) |
| `ninety` | binder | 300 | no end | `tenth` | Trigger only. The `tenth` trigger drops blue ink under the `tenth` anchor, then a second drop at 0.5 s. Uses the dark look |
| `bloom` | paper | 720 | no end | none | Blue drops rise from the bottom edge at 0, 2.2 and 4.0 s, then repeat from 9 s |
| `wisps` | binder | 600 | no end | none | Four drops at 0 s alternating pale and blue, then one drop every 4.5 to 7.5 s from 3 s. Uses the dark look. No site page mounts it now (the footer used to); the ink lab plays it |
| `spill` | paper | 480 | no end | none | Six black drops at 0, 0.7, 1.5, 2.6, 4.2 and 6.4 s, then repeats from 10 s |

`prompt` and the page's own sequence (`app/motion.css`, section 8.7) are written to one clock but nothing ties
them together: both start when the cover is gone, and the page's sequence plays only where the ink is live. After a first visit the ink starts within about 20 ms of it;
on a repeat visit the engine has to be fetched and compiled first, so the ink can be up to a few hundred
milliseconds late, which the documents' arrival at 3.7 s allows for.

Dark-ground scenes use `LOOK_DARK`: binder ground, pale black pigment, blue-dark pigment and a higher
ambient light. Light-ground scenes use `LOOK_DEFAULTS`: paper ground and the black and blue pigments.

### 7.7 Stages

`lib/ink/stage.ts` lists the stages the controller runs. Each has a weight, a run length, a ground and an
optional trigger.

| Stage | Weight | Run (ms) | Ground | Trigger |
|---|---|---|---|---|
| `intro` | 9 | 3500 | paper | none |
| `prompt` | 3 | 30000 | paper | none |
| `title` | 2 | 14000 | paper | none |
| `ninety` | 3 | 12000 | binder | `tenth` |
| `bloom` | 2 | 24000 | paper | none |
| `wisps` | 1 | 20000 | binder | none |
| `spill` | 3 | 24000 | paper | none |

Choice rules (`chooseStage`): only candidates that are visible are considered.

0. At the very end of the page (`scrollY + innerHeight >= scrollHeight - 2`, passed in as `atEnd`) the
   lowest candidate wins when at least 95% of it is visible. A footer taller than most of the window
   leaves only a sliver of the band above it, and the footer is what is being looked at.
1. The topmost candidate wins when at least 40% of it is visible. A candidate that is at least 95%
   visible beats it when the topmost candidate is less than 95% visible.
2. Otherwise the candidate with the best score (visible area times weight) wins.
3. The current owner keeps the canvas unless the challenger's score is at least 1.25 times the owner's.

Other constants: `WAKE_MS` is 12000 (a stage woken by input runs for this long at most), `REST_SECONDS` is
2.5 (the ease-out on a stage's end).

Ninety fires at `NINETY_FIRE` (0.47) and re-arms below `NINETY_REARM` (0.2). The progress value runs from 0
when the band's top meets the bottom of the window to 1 when its bottom leaves the top. Without view
timelines, the controller fires at 0.6 instead.

### 7.8 Calm zones and edges

Calm zones keep text readable. The engine lowers density inside a calm zone, and a cap pulls pixels toward
the ground until their luminance is no lower (paper) or no higher (binder) than the cap. Dither noise is
suppressed inside capped zones.

| Kind | Padding | Feather | Floor | Hold | Fade | Cap (paper) | Cap (binder) |
|---|---|---|---|---|---|---|---|
| `text` | 24 | 120 | 0.04 | 1 | 1 | 0.8 | 0.06 |
| `display` | 26 | 110 | 0.42 | 0 | 0 | 0.3 | 0.14 |
| `veil` | 0 | 40 | 1 | 0 | 0 | 0.8 | 0.06 |

Below 1088 px wide, `text` zones use padding 8 and feather 56. Edge strips (`edgeZone`) feather 96 px,
start 200 px outside the canvas and reach 24 px inside. Floor 0, hold 0, fade 1. Calm zones from the page are
merged (the closest pair first) until at most four remain. A merged zone takes the stricter kind. At most
four edges are used. `buildZones` returns the calm zones first and the edges after.

Pages mark calm regions with `data-ink-calm` (`text`, `display` or `veil`). Anchors are marked with
`data-ink-anchor` (`open` for the hero's stage, where the `prompt` scene drops its first ink, `tenth` for the tally block). `data-edges` takes one or more of
`top`, `right`, `bottom`, `left`.

### 7.9 Stills

Stills are WebP images of each scene at a fixed point. They show whenever the root is not `data-ink="live"`,
the route is calm, or the backdrop is in the `rest` state. The manifest in `lib/ink/stills.json` names the
thirteen stills:

| Name | Route | Viewport (CSS px) | DPR | Scene | Borrowed calm zones |
|---|---|---|---|---|---|
| `prompt-wide` | `/` | 1440 by 900 | 1 | prompt | none |
| `prompt-tall` | `/` | 320 by 700 | 2 | prompt | none |
| `ninety-wide` | `/` | 1440 by 900 | 1 | ninety | none |
| `ninety-tall` | `/` | 320 by 700 | 2 | ninety | none |
| `bloom-wide` | `/` | 1920 by 900 | 1 | bloom | none |
| `bloom-tall` | `/` | 390 by 844 | 2 | bloom | none |
| `bloom-purchase-wide` | `/purchase` | 1088 by 900 | 1 | bloom | none |
| `bloom-purchase-tall` | `/purchase` | 320 by 700 | 2 | bloom | none |
| `wisps-wide` | `/why-advanta` | 1920 by 900 | 1 | wisps | none |
| `wisps-tall` | `/why-advanta` | 390 by 844 | 2 | wisps | none |
| `title` | `/why-advanta` | 1088 by 900 | 1 | title | display zones from `/phases/prepare` |
| `spill-wide` | `/nope` | 1440 by 900 | 1 | spill | none |
| `spill-tall` | `/nope` | 320 by 700 | 2 | spill | none |

Constants: `STILL_QUALITY` 0.86, `STILL_MAX_BYTES` 90 KiB per file, `STILLS_MAX_BYTES` 600 KiB in total.
`stillPath(name)` returns `/ink/<name>.webp`. Each `StillPair` has a `wide` still and an optional `tall`
still. The tall still is used at widths below 68em, where the wide one is used from 68em up. Below 68em a still
is scaled by the width of its backdrop; `bloom` and `wisps` frames are anchored at the bottom of their band, the
others at the top.

From 68em the `prompt`, `ninety`, `bloom` and `wisps` frames stand where the page's own grid is, not where the
window's edges are, so the ink lies under the same words and columns at any window: each is
`min(100cqw, max(100rem, var(--keep) * var(--page-max)))` wide, centred, where `cqw` is the backdrop's own width
(`.still` is a size container from 68em) and `--keep` is how much wider than the page the frame was captured
(1.157; 1.378 for `wisps`, captured at 1920px where the page is 1382px). The
frame is scaled with the window up to 100rem (a 1600px desktop, more at a larger root size), is never wider than
the backdrop, and past that stays as wide as the page asks. Its sides are the ground of its band, so what it
does not reach is the same colour. The `ninety` frame rises from the foot of its band, as `bloom` and `wisps`
do. The `prompt` frame is laid out by the window's height as much as its width: it is at least 90rem wide, and
on a wide and low window never taller than the band (`1.851 * 100cqh`), and rests on the band's foot when the
band is taller. The `title` frame stands at its own size in the corner the ink falls from, which from 68em is
the page's corner on a larger window (`inset-inline-end` keeps the 11.5rem that a 1600px desktop leaves beside
the page). The 404's `spill` is not one of these: it runs off the right and the bottom of its frame, so it keeps
the window's width. Its tall frame, below 68em, stays at the size it was captured at (22rem at most) and rises
from the band's foot, at the left below 40em and turned about its middle (`scale: -1 1`) at the right from
40em, so its ink pours in from the window's right edge.

The Purchase page has its own pair of the `bloom` scene. Its one text zone (the tally under the folder, in the
left columns from 68em) stands where the home page's frame holds ink; the contents leaf at the right is opaque
paper and needs no zone. A frame is captured on the page that shows it, with the page's own zones
calm. A zone of fixed size in pixels covers more of a frame the narrower the window, so a frame is captured at
the narrowest window it serves: the wide pair at 1088, the tall one at 320.

The thirteen files in `public/ink/` match the manifest. Together they are about 162 KB.

### 7.10 Backdrops and markup

`InkBackdrop` takes `scene`, an optional `still` pair, optional `edges`, `priority` and a `className`. It renders:

```html
<div data-ink-backdrop data-scene="prompt" data-edges="bottom" data-ink-state="idle" aria-hidden="true">
  <picture data-ink-still>
    <source media="(min-width: 68em)" srcset="/ink/prompt-wide.webp" />
    <img src="/ink/prompt-tall.webp" alt="" loading="lazy" decoding="async" fetchpriority="high" />
  </picture>
  <div data-ink-slot></div>
</div>
```

`fetchpriority` is `high` when `priority` is set (the hero, whose still is the largest paint of a visitor without
live ink) and `low` otherwise; the image stays lazy either way, so a still is never fetched for a visitor whose
ink is live.

The parent element must be positioned. The backdrop is absolutely placed over its parent, does not take
pointer events, and sits under siblings. The slot is transparent until the backdrop is live. `data-ink-state` is `idle` (still shown, no canvas),
`live` (canvas running) or `rest` (the canvas has stopped and the still shows).

Backdrops are placed on the home page (`prompt` in the hero, ninety), on the Purchase page (bloom, with
its own stills), on title blocks (`title`, through `TitleBlock` with `ink`, on Why Advanta,
Sample and the phase pages), on the not-found page (spill) and on the cover (intro, without a still).
`TitleBlock` shows its backdrop only from 68em, with a frame 28.1875rem wide (451px at the 16px root, as captured), so
that on a large monitor the ink keeps its size against the title.

What on a page stands over ink and is marked as a calm zone: on the home page the headline and lead (`text`),
the two buttons (`veil`) and, further down, the figures and copy of the ninety
(`display`, `text`); on the Purchase page the tally under the folder (`text`, in the left columns; the folder, the tag
and the contents leaf are opaque paper). The footer has no ink and no zone. The hero's proof strip is opaque paper, so no ink is ever behind
its words and it needs no zone.

### 7.11 Controller lifecycle

`createController()` returns `route(path)` and `destroy()`. `InkLayer` creates one
controller per page load. It marks the root with `data-ink-layer` so a second mount does nothing.

- Loading: the engine chunk loads when a backdrop nears the viewport (intersection margin 150%), at once when
  the cover is playing with `data-ink="live"` (section 6.5), or during an idle callback after startup.
- Creating: the first use creates a canvas (`data-ink-canvas`, `aria-hidden`) in the backdrop's slot and
  calls `createInk` with the pigments read from the tokens.
- Activating a backdrop: stops the loop, resizes, applies the scene's preset with the backdrop's anchors,
  sets the calm zones (re-read after font loading). A backdrop with the `intro`
  scene under the cover waits for the takeover.
- Running: `run(ms)` starts the loop and calls `rest({ duration: 2.5 })` after `ms`. The intro scene ends
  itself.
- Waking: pointer movement over a resting live stage restarts it for `min(runMs, 12000)`.
- Pointer: pointer down and up on open water (outside interactive elements, inside a live backdrop) drop
  blue ink with amount 1.6 and radius 0.035, throttled to 250 ms. On touch, the tap must move less than 8 px
  and last less than 300 ms.
- Scrolling: each scroll schedules one check on the next frame and wakes the stage when it is resting.
- Moving between backdrops: the current backdrop goes `idle` after 200 ms if it is visible, and the new one
  activates. A backdrop that is not visible activates at once.
- The controller listens for the `prefers-reduced-motion` change and calls `fail(false)`.

Events from the engine map to controller actions: `unsupported` and `slow` call `fail(true)`, `quality`
writes the tier to storage, `rest` sets `running` to false, `end` stops, `lost` and `restored` are handled as
described in section 7.12, and `ready` sets `data-ink-ready` on `<html>`.

### 7.12 Failure handling

| Condition | Result |
|---|---|
| Boot probe finds no usable GPU or software renderer | `data-ink="still"`, `off` stored for the session |
| Engine reports `unsupported` | `fail(true)`: stills for the session, `off` stored |
| Engine chunk fails to load | Stills for this page view. The stored mode is not changed |
| Lowest tier still too slow (`slow`) | `fail(true)`: stills for the session |
| First context loss (`lost`) | Canvas stops; the backdrop goes `rest` and shows the still. A `restored` event brings it back to `live`. A backdrop the canvas moves to before then is activated at `rest` as well, with its still showing and its scene not started; `restored` starts it |
| Second context loss in the session | `fail(true)`: stills for the session |
| `prefers-reduced-motion` changes to reduce | `fail(false)`: stills for this page view |
| Reduced motion at load | Boot script returns early: stills, no cover, no motion |
| `prefers-contrast: more` or `forced-colors: active` | Stills; backdrops and controls are `display: none` |
| `data-ink="still"` on a calm route (`/catalog` and whatever lies under it) | Canvas removed; stills show |
| Page hidden (`pagehide`) | Loop stops; `pageshow` with `persisted` restarts the choice |
| JavaScript disabled | Boot script does not run, so `data-ink` is absent. The stills rule applies to any root that is not live, so stills show. No cover |
| Storage throws | Ink probe and stored reads fall back to in-memory defaults. The cover does not play |

### 7.13 Rest, and no control

The visitor has no control over the ink on the page. There is no pause or play button, no holder for one in
`InkBackdrop`, and no `toggle` in the controller. The ways it stops are its own:

- the scene's run window ends (12 to 30 s depending on the scene: 30 s for the prompt, 12 s for the ninety once it has fired; see
  `STAGES` in `lib/ink/stage.ts`), after which a pointer move over the backdrop, a scroll or a click wakes it
  for `min(runMs, 12000)` and the water eases to rest over 2.5 s;
- the engine's `autoPause`: the loop does not run while the tab is hidden or the canvas is off screen;
- reduced motion, which the boot script reads before anything is drawn (and a change to it while the page is
  open drops the engine to stills).

The only control a visitor has is the system's reduce-motion setting. The accessibility statement lists that as
a known limit (WCAG 2.2 success criterion 2.2.2, Pause, Stop, Hide).

A stored value of `paused`, which an earlier version of the site wrote, is read like no value: the boot script
and `inkMode` both fall through to the tier check and the probe, and the controller's quality choice ignores a
value that is not a tier.

## 8. Motion and page transitions

Motion is in `app/motion.css`, which is imported first by `app/globals.css`. Every keyframe and every
animated property sits inside `@media (prefers-reduced-motion: no-preference)`. Behaviour hangs on hooks
(attributes), not on class names.

### 8.1 Hooks

| Hook | Set by | Effect |
|---|---|---|
| `data-move="drift" \| "ink-in" \| "settle" \| "grow"` | `Appear` (`move` prop), `Sentences` (`ink-in`) | Entrance animation |
| `data-when="load"` | `Appear` (`when` prop) | Entrance runs on page load, not on scroll |
| `data-seen` | `watchSeen` | Set once the element has arrived in view |
| `data-watch` | `Tally` (`animate`), `PriceTag` | Element to observe. `data-watch="half"` waits for half the element to be visible |
| `data-ninety` | `SolutionSection` | Ninety band: the blocks fill on scroll; the figure never moves |
| `--order` | `Appear`, `Sentences`, drawer items | Stagger index |
| `data-paper`, `data-lit` | `PaperSheet` (`lit` prop) | Paper shadow and pointer tilt |
| `data-bar` | `Header` | Shadow under the bar |
| `data-ledger` | `BandedList` | Rule that grows on scroll |
| `data-block` | `Tally` | Blocks: ink, mark or empty |
| `data-ink-backdrop`, `data-ink-slot` | `InkBackdrop` | Ink region, hidden under contrast or forced colours |
| `data-lit-scope` | Read by `lib/scroll/pointer.ts` and `app/motion.css` | Scopes the pointer light to an ancestor that stands where the lit sheet rests, so a lifted sheet does not flicker at its lower edge (the Purchase page's contents leaf, the Why Advanta page's toolkit slot, the pop-up's cover and each hero document carry it) |
| `data-folder`, `data-folder-scope` | `Folder`, an element around one | The folder whose sheets rise under the pointer; the scope in which keyboard focus raises them too |
| `data-nav-underline` | `PrimaryNav` | The bar's underline slides to the current link (`translate`, `--time-lift`), and grows when it first appears |
| `data-price-tag` | `PriceTag` | Swings once when first seen (1700 ms, after 240 ms), and its contents again when the folder is hovered (1200 ms) |
| `data-tile` with `data-denied` | `TemplateTile`, `LockedTile` | A locked tile saying no for 600 ms: `tile-shake` (3px decaying to rest, 13 keyframes 33 ms apart on a linear timing, 467 ms, with 1px or less of Y and 0.3 degrees or less of rotate), `denied-pulse` (the outline hits `--alert` and fades, 560 ms, fill forwards), `denied-wash` (opacity of the well's `::before`, 560 ms). They play only where `html[data-motion="on"]`; under reduced motion and without a script the static outline and wash stand for as long as the state does |
| `data-page-dialog` with `data-enter` | `PageDialog` (the pop-up of the catalog and the checkout) | The pop-up rises 14px as the page dims (`dialog-in` 320 ms, `scrim-in`) when a link inside the site opened it |
| `data-checkout-step` with `data-enter`, `data-checkout-progress` | `CheckoutDialog` | A step the visitor moved to settles 10px into place (`checkout-step-in`, `--time-enter`); the line under the bar grows to the current step |
| `data-hero-stage`, `data-hero-prompt`, `data-hero-doc`, `data-landed` | `HeroStage`, `HeroLanding` | The hero's sequence, played to live ink only (section 8.7) |

### 8.2 Entrances

Two paths. Which one applies is decided by the root attributes.

Timeline path (`html[data-motion="on"][data-timeline="on"]`): elements are animated by scroll position
through `animation-timeline: view()`.

| Move | Animation | Range |
|---|---|---|
| `drift` | `move-drift` (opacity 0 to 1, moves 12px up) | `entry calc(var(--order) * 4%) cover min(22%, 14rem)` |
| `ink-in` | `move-ink-in` (opacity 0 to 1; no blur, no movement) | `entry calc(order * 4%) cover min(16%, 8rem)`: the shortest range, so a heading is legible before the text around it |
| `settle` | `move-settle` (opacity, arrives from 28px above, scale 1.03). Its paper shadow uses `move-shadow` on the same timeline | `entry calc(order * 4%) cover min(30%, 18rem)` |
| `grow` | `move-grow` (scale 0 to 1) | `entry calc(10% + order * 4%) cover min(28%, 16rem)` |

Ledger rules grow on the `--ledger` timeline. The bar's shadow fades in over the first 84 px of scrolling
(`bar-shadow-in` on `scroll(root block)`). The ninety band uses the `--ninety` timeline: from 20% of the view each block fills across a 3% window that starts 2.6% after the previous block,
and the mark block fills from 44% to 47%.

Observer path (`html[data-motion="on"][data-io="armed"]`, without the timeline): elements start in their
hidden state until they carry `data-seen`, then transition. Drift takes 480 ms on
`--curve-settle`. Settle takes `--time-settle` (560 ms), with `--curve-settle` for opacity and `--curve-drop` for movement and scale; ink-in
takes `--time-ink` (400 ms, opacity only) on `--curve-ink`; grow takes 600 ms. The stagger for every move is
`order * --stagger` (70 ms). Without view timelines the ninety band's blocks fill over
`--time-fill` (180 ms) with delays spread across `--time-count` (1200 ms).

`MotionRoot` (`components/ui/motion-root.tsx`, client) runs before paint on each pathname change. It exits
unless `data-motion` is `on`. It starts `watchSeen` on `[data-watch]` (plus `[data-move]` and `[data-ninety]` when
timelines are off), then sets `data-io="armed"`. The observer uses a root margin of `0px 0px -12% 0px`
and marks elements `data-seen` once they arrive. Arrival means the element's top is above 88% of the
viewport, or, for `data-ninety` and `data-watch="half"`, at least half of it is visible. A
`MutationObserver` watches for elements added to the body. A second effect attaches the pointer light.

Load entrances (`[data-move][data-when="load"]`) play on the clock rather than on scroll. The hero's lead and
buttons, the title block lead, the worked example and the Purchase page's portfolio use them.

### 8.3 Paper, pointer light and tilt

`PaperSheet` renders `[data-paper]` with a grain image (`--grain`) and a radial sheen (`--sheet-light`) on
its `::before`, and a lifted shadow on its `::after`. The `::after` fades in over 420 ms.

With `lit`, the sheet gets `data-lit`. `lib/scroll/pointer.ts` (`trackLight`) runs only where
`(hover: hover)` matches. It ignores touch pointers and writes `--lx` and `--ly` (position, in percent) and
`--tx` and `--ty` (tilt, up to 1.2 degrees) on the sheet under the pointer, with one `requestAnimationFrame`
per frame. On hover the sheet moves up 6 px (`translate: 0 -6px`) and tilts from `--tx` and `--ty`. On keyboard focus within the sheet it moves up 6 px without the tilt. The lift takes `--time-lift` (260 ms).

### 8.4 Figures and tally

- Figures never count or roll. The `#inside` counts and the 90% of the ninety band are printed as plain text
  with their final value, so a reader scrolling past never sees a wrong number. The 90% is `aria-hidden`; the
  heading beside it carries the figure in visually hidden words.
- `Tally` renders blocks. With `animate`, blocks start empty and fill from the left with `tally-fill`, delayed
  by `--time-enter` plus `--i` times `--time-fill-gap`. The blocks are held empty only while `data-io` is
  `armed`.

### 8.5 Page transitions

`PageShift` wraps route content in React's `ViewTransition` with `enter="page-in"` and `exit="page-out"`.
It is used by the home hero, the title block and the not-found page. `TemplateCover` (named `cover-<slug>`) and
`Folder` (named `folder-<slug>`) are shared elements with `share="sheet-morph"` when a caller passes a `slug`;
no page does today, so nothing travels between pages. Opening a free sample in the pop-up is a change inside
one page and starts no view transition.

In `motion.css`, under no-preference: the outgoing page (`.page-out`) fades over 140 ms, the incoming page
(`.page-in`) runs `move-ink-in` (opacity only) over 260 ms with an 80 ms delay, and the
`.sheet-morph` group takes 420 ms on `--curve-settle`, and the outgoing root snapshot is not displayed. The
`::view-transition` layer ignores pointer events whatever the motion setting (its rule stands outside the
query), so a click always reaches the page. Under reduced motion a view transition still starts, and the
reduce block (section 8.6) cancels the group, old and new animations and hides the old snapshots, so the
change is a plain swap.

### 8.6 Reduced motion and other media

Reduced motion is handled at three levels:

1. The boot script returns early, so `data-motion`, `data-timeline` and `data-intro` are never set. Motion
   hooks in CSS do nothing and `MotionRoot` exits.
2. Every animation and transition rule sits inside `(prefers-reduced-motion: no-preference)`. View
   transition groups under `reduce` have `animation: none !important`, and outgoing views are `display: none`.
3. `app/globals.css` has a global safety net under reduce: animation and transition durations are set to
   `0.01ms` with one iteration.

The boot script reads the media query only at load. The CSS rules follow live changes. The ink controller
listens for changes and switches the ink to stills when reduce is selected.

`(prefers-contrast: more)`: backdrops are hidden, the bar gets a 1px ink bottom border, and its shadow is
hidden. Sheets get a 1px solid border and no shadow. `(forced-colors: active)`: backdrops are hidden;
tally blocks and focus use system colours.

Timing and curve tokens (`app/globals.css`):

| Token | Value | Used for |
|---|---|---|
| `--time-swap` | 120ms | Drawer item stagger base |
| `--time-enter` | 240ms | Tally start delay |
| `--time-exit` | 160ms | Scrim fade |
| `--time-fill` | 180ms | Block fill |
| `--time-fill-gap` | 80ms | Gap between blocks |
| `--time-blink` | 1100ms | Caret blink cycle |
| `--time-lift` | 260ms | Sheet lift and hover |
| `--time-ink` | 400ms | Ink-in entrances |
| `--time-settle` | 560ms | Settle entrances |
| `--time-count` | 1200ms | The spread of the ninety's block fill without view timelines |
| `--time-page-out`, `--time-page-in` | 140ms, 260ms | Page transitions |
| `--time-morph` | 420ms | Shared element morph |
| `--stagger` | 70ms | Entrance stagger |
| `--curve-settle` | `cubic-bezier(0.22,0.61,0.36,1)` | General easing |
| `--curve-leave` | `cubic-bezier(0.55,0.06,0.68,0.19)` | Cover leave |
| `--curve-ink` | `cubic-bezier(0.16,0.84,0.3,1)` | Ink entrances |
| `--curve-drop` | `cubic-bezier(0.3,1.25,0.5,1)` | Settling drop |
| `--curve-pen` | `cubic-bezier(0.65,0,0.2,1)` | Pen strokes |

Other keyframes sit in component CSS modules: `caret-blink`, `drawer-in`, `fade-in`, `link-in`, `pen-stroke`,
`scrim-in` (the filter sheet), `sheet-up`, `sign-out`, `tally-fill`, `cover-ink`, `cover-leave` and
`cover-skip`.

### 8.7 The hero's sequence

The hero (`components/home/hero.tsx`) is a paper band about as tall as the window, with the `prompt` ink behind
all of it. Centred, top to bottom: the headline and the lead (`data-ink-calm="text"`), two buttons ("Get the
toolkit" to `/purchase`, "See the free samples" to `/catalog?free=1`; `veil`), the stage and the proof strip.
`HeroStage` (`data-hero-stage`, which is also the `open` anchor of the scene) holds an empty prompt box
(`data-hero-prompt`, `aria-hidden`: an outline, a caret `data-caret`, a "+" key and a send key) and the six free
samples as a list of six links (`data-hero-doc`, each named by its template's title and leading to
`/catalog?view=<slug>`), each a lit `TemplateCover` fanned from -9 to 9 degrees and overlapping so that no title
or format tag lies under a neighbour. Under the pointer or keyboard focus a document straightens, comes to the
front and lifts. Below 40em the six are two hands of three. From 68em the band's height follows the window's,
so the proof strip is above the fold down to a window 720px tall. The band is as tall as the window leaves
(the bar and the rail taken off), at most `--hero-cap`, which is `max(56rem, 57vw)`: 56rem up to a 1600px
desktop and then 57% of the window's width, so a 16:9 and a 16:10 monitor are filled to the fold at any size.
On a large monitor the headline grows with the column (`--hero-type` is `max(--size-hero, --page-max / 16.2)`;
`--hero-size` is that, or what 12svh or the column's own width, in `cqi` of `.heroInner`, a size container, allow
if less), the lead with it (a quarter of the headline), the prompt box stays just over half of the column
(`--prompt-w`), the stage stands `--stage-bleed` past the column on each side so the hand keeps the height the
window gives it, and the proof strip is four fifths of the column where that is more than 64rem.

The sequence is the page's half of the `prompt` ink scene, so it plays only where that scene does. Every rule
of it in `app/motion.css` asks for `html[data-motion="on"][data-ink="live"]` and for a stage that is not marked
`data-landed`. One clock, which starts when the root has no `data-intro` (at load, or when the cover has gone).
The scene is written to the same times:

| Time (ms) | Event |
|---|---|
| 0 to 700 | The box stands empty with its caret blinking (on for 300 ms, off for 200, three times) |
| 700 | The first drop lands in the box (scene `prompt`); the light-blue one follows at 1200 |
| 1100 to 2300 | The box dissolves (`hero-prompt-out`) as the ink opens over it |
| 2600 to 3500 | The ink turns to mist; the water is clean at 3500 |
| 3700 on | The documents land, the middle two first, 110 ms apart, 560 ms each, opaque from their first frames, from 28px above at 1.06 times their size on `--curve-drop`; their lifted shadows come to rest with them |
| 6000 on | Ink keeps arriving, slowly, behind and beside the documents |

Under the cover the page is already in its opening state: the box shown, the documents out of sight and out of
reach of the keyboard.

Everywhere else the box is not displayed and the documents stand where it would have been from the first
frame, visible and within reach of the keyboard, over the still (which shows the scene at rest):

| Case | What decides it |
|---|---|
| No script | The root has neither `data-motion` nor `data-ink` |
| Reduced motion | The boot script sets `data-ink="still"` and no `data-motion` |
| Still ink (no usable GPU or a software renderer, more contrast, forced colours, data saving, `off` stored for the session) | `data-ink="still"` |

`HeroLanding` (`components/home/hero-landing.tsx`) is the script half. Before the first paint of every mount of
the stage it reads the root: ink that is not running (`data-ink` is not `live`)
marks the stage `data-landed` at once. Ink that is running is watched (a `MutationObserver` on `data-ink`), and the first time it stops the stage is marked. The mark is never taken off, so:

- ink that fails half-way through the sequence (`live` becomes `still`) lands the
  documents at once: the rules stop applying and each element is in its own end state;
- ink that starts later runs the scene behind documents that
  stay where they are: the sequence does not start late and take them away;
- a return to the home page inside the site is a new mount without the mark, so with running ink the sequence
  plays again with the scene, and with ink that is not running the documents stand.

## 9. Catalog URL state

The catalog's filters, search, sort and page live in the URL. A search URL is the full state of the page.

### 9.1 Parameters

| Parameter | Format | Rules |
|---|---|---|
| `q` | text | First value, trimmed, capped at 200 characters |
| `phase` | slugs | Validated against `getPhases()` |
| `type` | deliverable types | Validated against the taxonomy |
| `app` | apps | Validated against the taxonomy |
| `audience` | audiences | Validated against the taxonomy |
| `format` | formats | Validated against the taxonomy |
| `free` | `1` | Keeps only the free samples; anything else is off |
| `sort` | `samples` (default), `phase`, `title` | Anything else becomes `samples` |
| `page` | integer | Must match `^[1-9]\d{0,5}$`; otherwise `1` |
| `view` | a template slug | Not a filter: asks for one template (section 9.3). `parseView` takes the first value if it has the shape of a slug, reading mixed case as lowercase (an old `/Templates/Change-Management-Strategy` link keeps its case through the redirect) |

Facet values accept repeated keys and comma-separated lists. They are deduplicated, and unknown values are
dropped silently. `parseCatalogParams` (`lib/catalog/search-params.ts`) returns the criteria.
`serializeCatalogParams` writes `q`, then each facet comma-joined, then `free=1` when it is on, then `sort` only
when it is not the default, then `page` only when it is above 1. Keys appear in that fixed order, and empty
values are omitted. `catalogHref(criteria, view?)` writes the same address with `view` last.

### 9.2 Query

`queryTemplates` (`lib/catalog/query.ts`) returns the matching templates for a page.

- Facets are OR within a facet and AND across facets. The free filter, when on, narrows everything.
- Search splits the query on whitespace. Every term must appear in the title, summary or description.
  Matching is case-insensitive, straight and curly quotes and apostrophes are treated as equal, and regex
  characters are literal. Phase names, apps and audiences are not searched.
- Facet counts are computed with each facet's own selection cleared, so a count shows what ticking that box
  would return. Search, the free filter and the other facets still apply.
- Sort: `samples`, the default, puts the free templates first and then follows the rollout inside each
  group: phase `order`, then step `order`, then the order the content lists the templates in. `phase` is that
  rollout order alone, with a free sample standing where its step is. Both need the phases, so the catalog
  page passes them as the third argument of `queryTemplates`; without them they keep the given order, and a
  template of an unknown phase or step goes last. `title` sorts by title with `localeCompare`. There is no
  price sort. The select labels them "Free samples first", "Phase order" and "Title A–Z".
- Pagination: `PAGE_SIZE` is 24. The page is clamped to between 1 and the page count (at least 1). The catalog
  page passes the clamped page back into its criteria, so links never point past the last page.

### 9.3 Tiles, locks and the pop-up

The results are a grid of `TemplateTile`s (`TileGrid`), one `<article data-tile>` per template with exactly one
control and no price.

- A free tile (`data-free`) has a "Free sample" tag and its title is a link to `catalogHref(criteria, slug)`,
  stretched over the tile, with `scroll={false}` and `prefetch={false}`. The tiles of the six samples on the
  home page and of a free template on a phase page link to `/catalog?view=<slug>`.
- A locked tile (`data-locked`) has a blurred cover with nothing drawn over it; only the cover is
  blurred, the title and summary stay readable. Its control is a `<button>` named "<title>, locked" (`LockedTile`).
  Pressing it sets `data-denied` on the tile for 600 ms (a press while it is set takes it away and puts it
  back) and puts one line in a polite live region under the tile: "Included with the toolkit." with a link to
  `/purchase`. Each press renders that line anew, so it is announced once per press and never stacked. The line
  stands in the row gap (56px), so nothing moves when it arrives. A tile that holds keyboard focus keeps its
  focus ring in place of the red pulse (the tile's outline is its only focus mark). Under reduced motion the red
  outline (the focus ring, on a focused tile), the wash over the well and the line remain and nothing moves; under `prefers-contrast: more` and forced colours the blur stays (it is the one mark of a locked tile) and the
  well gets an edge.
- `view` naming a free sample renders `TemplateDialog` with `TemplateDetail`. The server sends `<dialog open>`,
  drawn where the modal one stands and with the page dimmed around it, so the content shows before the script
  runs and without it; the client makes it modal in a layout effect. It closes on Escape, on Close (a link to
  `closeHref`, the catalog address without `view` and with the clamped page) and on a click on the dimmed page,
  one whose press and release both landed there (`createScrimPress`, `lib/scrim.ts`): a selection dragged out of
  the panel ends there too, and does not close it.
  Every way of closing ends in the dialog's `close` event. When a link inside the site opened the dialog and the
  history entry before it is `closeHref` (`previousEntryIs`, `lib/history.ts`, read from the Navigation API), the open
  was a push and the close is `router.back()`, so the pair leaves no entry behind. In every other case (a direct
  load, a reload, an arrival from another page, a browser without the Navigation API) it is
  `router.replace(closeHref, { scroll: false })`.
  Back closes it, and focus returns to the tile that opened it.
- `view` naming a locked template opens nothing. If its tile is on the page of results it is rendered denied
  (`initialDenied`), with its line, and after hydration it is scrolled into view and denies once. If it is not
  (the results are 24 to a page, and a filter may leave the template out), the page renders one line above the
  results, a `role="status"` paragraph (`data-included`): "<title> is included with the toolkit." and a link to
  `/purchase`.
- Of a repeated `view` the first value counts. A `view` that is not a slug, or names no template, is ignored and
  the page answers 200.

### 9.4 Controls

- `SearchBox` is a plain `GET` form to `/catalog`. Hidden inputs keep the facets, `free` and the sort, and drop the
  page. Its submit button sits inside the far end of the field: a 44px square with the `search` icon and the
  visually hidden name "Search". Enter submits too, with or without script.
- `SortSelect` and `FilterPanel` are client components. A change calls `router.replace` with the new query and
  resets the page to 1. Both update optimistically (`useOptimistic` in a transition): `FilterPanel` its
  checkboxes and `SortSelect` its select, so neither is given back to the old value while the server answers.
  Its first control is "Free samples only" (`free`), and it counts toward "Filters (n)" and the clear link.
- `FilterPanel` disables a checkbox whose count is 0 unless it is already checked. Below 68em the panel is a
  native dialog opened from a "Filters" button, with a "Show results" button that closes it. The dialog also
  closes when the window grows to 68em (a `matchMedia` listener, as in `NavDrawer`): from there the sheet has no
  box, and an open modal dialog would leave the page inert and its scrolling locked. Its `sort` prop
  is drawn at the top of the dialog's body below 40em only.
- Layout of the rail below 68em: `PhaseStrip`, a navigation "Start from a phase" with the seven phases as
  large `PhaseTabs` in one row that scrolls sideways (the card is lit, `aria-current="true"`, under the same
  rule as the phase rail, and scrolled into view by `scrollCurrentIntoView`). Below 40em the search and the
  "Filters" button share the row under it; from 40em the search has its own row with the sort and Filters
  under it. The catalog page renders `SortSelect` twice: once in the rail, hidden below 40em, and once as
  `FilterPanel`'s `sort`, hidden from 40em. Only one is ever displayed. From 68em the strip is not displayed:
  the bar's phase rail has the phases.
- "Clear all filters" links to `/catalog?q=<q>` when a search term exists, or to `/catalog` otherwise. It keeps
  only the search term, so the free filter and the sort also reset (`clearFiltersHref`). With script, a plain
  click clears in place like every other change (`router.replace` without scrolling, optimistically), and
  focus moves to "Free samples only", the first row of its own list, because the link goes when no filter is left.
- `ActiveFilters` (client) lists every filter that is on above the result count as a chip, in a list labelled
  "Active filters": "Free samples only" first when it is on, then every selected facet value. Each chip is a
  link to the catalog without that value, on page 1 (`activeFilters` in `lib/catalog/search-params.ts`), named
  "Remove <facet> filter: <value>" ("Remove filter: Free samples only" for the free filter). "Clear all" ends
  the row and goes where "Clear all filters" goes. With script, a plain click calls `router.replace` without
  scrolling; focus then moves to the chip now at the removed one's position (or the one before), or to the
  result count (`#results-heading`, `tabIndex=-1`) once no chip is left. Nothing renders without filters.
- Empty result: with only a search term, the heading is `No templates match “<q>”.`, the link is "Clear search"
  (the same criteria without `q`), and from 68em a navigation labelled "Browse by phase" shows the phases as large
  `PhaseTabs` (below 68em it is not displayed: the strip above the sheet is that way in). With a filter on (`hasFilters`: a facet value or the free filter) it is "No templates match
  these filters." with "Clear filters" (or "Clear search and filters" when a term is also set), linking to
  `/catalog`.
- `Pagination` renders links to `/catalog` with the same criteria and the new page. It renders nothing when
  there is one page.

## 10. Test hooks and test contract

### 10.1 Commands

| Command | Runs |
|---|---|
| `corepack pnpm test` | Vitest over `tests/unit/**/*.test.ts` |
| `corepack pnpm test:e2e` | Playwright over `tests/e2e`, after `npm run build && npm run start -- -p 3100` (or reuses a server on port 3100 outside CI) |
| `corepack pnpm typecheck` | `next typegen` and `tsc --noEmit` |
| `corepack pnpm lint` | `eslint .` |
| `corepack pnpm dev`, `build`, `start` | Development server, production build, production server |

Run the scripts in `scripts/` by path, for example `node scripts/check-budgets.mjs <baseUrl>`: `scripts/ink-stills.mjs`,
`scripts/check-budgets.mjs` and `scripts/paper-grain.mjs`.

### 10.2 Ink test hook

The hook is installed only when `window.__INK_TEST__` is set before the layer mounts. The controller then
dynamically imports `lib/ink/test-hook.ts` and calls `installInkTest(handle)`, which sets `window.__inkTest`:

| Member | Purpose |
|---|---|
| `still(scene)` | Holds the scene, renders, and returns a WebP data URL at `STILL_QUALITY` |
| `hold(scene)` | Activates the scene with the backdrop pinned and waits for ready (up to 5 s) |
| `preset(name)`, `step(n)`, `render()`, `setQuality(tier)` | Engine control for deterministic tests |
| `loseContext()`, `restoreContext()` | Forces context loss and restore |
| `zoneExtremes()` | Reads back pixels under each calm rectangle and reports the cap and the extreme luminance |
| `cost(frames)` | `measureCost(frames)` in milliseconds per step and draw |
| `stats()`, `engine()` | Engine statistics and the engine object |

The controller also exposes a layer handle with `ink()`, `canvas()`, `scene()`, `hold(scene)` and `calm()`
(the current calm rectangles with their cap).

### 10.3 Attributes used by tests

| Attribute | Where | Meaning |
|---|---|---|
| `data-ink` | `<html>` | `live` or `still` |
| `data-ink-ready` | `<html>` | The engine reported ready |
| `data-ink-route` | `<html>` | `calm` on calm routes |
| `data-ink-layer` | `<html>` | The layer has mounted |
| `data-intro` | `<html>` | `play`, `ink`, `leave`; absent when done |
| `data-motion`, `data-timeline`, `data-io` | `<html>` | Motion switches (section 8.2) |
| `data-hydrated` | `<html>` | Set by `MotionRoot` in an effect, whatever the motion setting: the client components of the page have their handlers. Browser specs wait for it before pressing a control a script answers (`hydrated(page)` in `tests/e2e/helpers.ts`). It assumes no `loading.tsx` or Suspense boundary around page content |
| `data-ink-state` | Backdrop | `idle`, `live` or `rest` |
| `data-ink-running`, `data-ink-tier` | Canvas | Loop state and tier |
| `data-ink-calm`, `data-ink-anchor` | Page elements | Calm regions and anchors |
| `data-scene`, `data-edges` | Backdrop | Scene and edges |
| `data-intro-cover` | Cover | The cover element |
| `data-seen`, `data-tally`, `data-block` | Motion elements | Entrance and tally state |
| `data-band` | Band | Ground: desk, paper, wash, ink or binder |
| `data-paper`, `data-lit` | Sheets | Paper and pointer light |
| `data-bar`, `data-phase-rail`, `data-nav-drawer` | Shell | Bar, rail and drawer |
| `data-ledger`, `data-folder` | Lists, folders | Rule and folder |
| `data-portfolio`, `data-price-tag` | Purchase page, home `#toolkit` | The folder object and its tag |
| `data-tile`, `data-free`, `data-locked`, `data-denied` | Catalog tiles | Tile and its state: free sample, locked, saying no |
| `data-well` | Catalog tiles | The well of a tile; its `::before` is the red wash of a denied tile |
| `data-page-dialog`, `data-template-dialog`, `data-checkout-dialog`, `data-enter` | Pop-ups | Any page dialog, whose it is, and that a link inside the site opened it |
| `data-checkout-step` (`details`, `review`, `payment`), `data-order-summary` (`panel`, `disclosure`), `data-order-code`, `data-error-summary`, `data-field-error`, `data-pay` | Checkout | The step in view, the two forms of the summary, the order's code, the summary of a form's problems, an error under a field, and a provider's pay button |
| `data-hero-stage`, `data-hero-prompt`, `data-hero-doc`, `data-caret`, `data-landed` | Hero | The stage, the box, a document, the box's caret, and the mark that ends the sequence for a stage |
| `data-included` | Catalog | The line above the results for a locked template that has no tile on the page |
| `data-nav-underline` | Bar | The sliding underline |
| `data-mark-digits` | Mark | The 365 on the arm |
| `data-cover`, `data-format` | Template covers | Format ratio |
| `data-specimen`, `data-mark` | Home page | Specimen and highlighted phrase |

### 10.4 Standing rules

The design gate (`tests/unit/design-gate.test.ts`) scans every file under `app/`, `components/`, `lib/` and
`tests/`, comments included.

- Raw colour values (hex colours of 3, 4, 6 or 8 digits, and `rgb`, `hsl`, `hwb`, `lab`, `lch`, `oklab`,
  `oklch`, `color` and `color-mix` functions) appear only in `app/globals.css` and `app/icon.svg`.
- No stylesheet contains `prefers-color-scheme`, or the word "infinite".
- `@media` queries are limited to the seven forms in section 5.1.
- `@container` appears only in `header.module.css` and `nav-drawer.module.css`.
- Only `components/ui/transition-link.tsx` imports `next/link`.
- `package.json` dependencies are exactly `next`, `react`, `react-dom` and `zod`.
- Canvas and WebGL calls are allowed only in `lib/ink/`, `components/ink/` and `lib/boot/`.
- `requestAnimationFrame` calls are allowed only in `lib/ink/`, `components/ink/`, `lib/scroll/`,
  `lib/boot/` and `components/intro/`. The scroll string literal is allowed
  only in `lib/ink/`, `components/ink/` and `lib/scroll/`.

### 10.5 Unit tests (Vitest)

Each file below is in `tests/unit/`:

| File | Covers |
|---|---|
| `content.test.ts` | The real catalog: phases, counts, no price on any template, exactly six free templates (named), sample flags, copy rules, search, the default order, related templates, the worked example's contents |
| `query.test.ts` | Filters, the free filter, search, the `samples`, `phase` and `title` sorts (no price sort), facet counts, pagination |
| `search-params.test.ts` | URL parsing and serialisation, `free`, `parseView`, `catalogHref`; `clearFiltersHref`, `hasFilters`, and the active-filter chips and their links |
| `nav-links.test.ts` | The phase a page belongs to, including the catalog filtered on one phase |
| `worked-example.test.ts`, `into-view.test.ts` | The worked example's contents resolved against the catalog; how far a sideways row scrolls to show an item |
| `scrim.test.ts`, `history.test.ts` | A click closes a dialog only when its press and release were on the dimmed page too; the entry before the current one is an address (parameters in any order), and never when the history cannot say |
| `checkout-schema.test.ts`, `checkout-order.test.ts`, `checkout-steps.test.ts`, `checkout-provider.test.ts` | The checkout: the places and the details schema with its messages; the order schema; the order's code, summary, text and `mailto:`; the step machine and the stored draft; `getPaymentProvider()` answering `null`, `startPayment` against a fake provider, and the Payment step's markup with and without one |
| `validate.test.ts` | Validation errors and sorting; a catalog with 0, 5, 7 or 8 free templates is rejected |
| `coverage.test.ts`, `format.test.ts` | Helpers; `adjacentPhases`; `formatPrice(149999, "CAD")` is `$1,499.99 CAD`; `countWord(6)` is `six`; `formatLength(16, "pptx")` is `16 slides` |
| `compounds.test.ts` | Compound splitting for `KeepCompounds` |
| `brand-mark.test.ts` | Logo geometry, the 365 (three one-stroke digits in their box, clear of the legs, above the arm, evenly set), `LogoMark` with and without digits (the full and the compact form), and `app/icon.svg` against `scripts/gen-icon.mjs` |
| `boot-script.test.ts` | Runs `BOOT_SCRIPT` against stand-ins for the document, storage, media queries and WebGL; the calm routes (`/catalog` only); the 5500 ms backstop and the takeover limit |
| `boot-cover.test.ts` | Cover markup and timings (six pen paths, the digits 800 to 1000, leave at 2500 with the signature gone before the paper clears, ink leave ending with the scene); `InkBackdrop` markup and priority; stills manifest |
| `kit-motion.test.ts` | `motion.css` rules: keyframes and animations inside `no-preference`, timeline ordering, hidden states only under `data-motion="on"`, no blurred entrance, the heading's range ending first |
| `kit-grain.test.ts` | Paper grain image format and size |
| `stills-files.test.ts` | The thirteen stills on disk match the manifest and size limits |
| `ink-scenes.test.ts`, `ink-stage.test.ts`, `ink-zones.test.ts`, `ink-cadence.test.ts` | Scene scripts (the `intro` and `prompt` timelines), stage choice, calm zones and what the adaptive watch counts as a slow frame |
| `legal.test.ts` | The four legal documents: the routes of `LEGAL_LINKS` in order; no empty section or block; an anchor of its own for every section and subsection; links only to pages and anchors that exist, and to the contact page and the other three; no placeholder text; the wording for set and unset facts (refund window, province, host, audit); the privacy policy names the three session storage keys (`lib/boot/state.ts`, `lib/checkout/draft.ts`) |
| `design-gate.test.ts` | Section 10.4 |
| `smoke.test.ts` | Test runner check |

### 10.6 End-to-end tests (Playwright)

Projects in `playwright.config.ts`:

- `chromium`: Desktop Chrome at 1280 by 800. Runs every spec except `ink-live`.
- `mobile`: Pixel 7. Runs every spec except `ink-live`.
- `quiet` and `quiet-mobile`: the tests tagged `@quiet` (paint times read off the page's clock), in the
  same two browsers, one at a time after the projects above.
- `gpu`: runs `ink-live.spec.ts` at 1440 by 900 with `--ignore-gpu-blocklist` and `--enable-gpu`, plus
  `--use-angle=d3d11` on Windows. Runs after every other project.
- `firefox`: runs a subset of specs when Firefox starts on the machine (`PW_FIREFOX=1` or a successful
  `--version` check).

Specs:

| Spec | Projects | Covers |
|---|---|---|
| `browse.spec.ts` | chromium, mobile, firefox | Home to a phase and on to its free sample; the hero to the six samples; the worked example; no horizontal overflow on 8 routes |
| `catalog.spec.ts` | chromium, mobile | The grid of tiles; six free first, the rest locked; the canonical address; no price anywhere; "Free samples only"; the sort options; filters, chips, URL restore, search, phase order and the lit phase, empty states, malformed parameters, the sort select keeping the picked option while the server answers, Clear all filters clearing in place with focus kept, the phone's rail and filter dialog, the sheet closing when the window grows to 68em |
| `locked.spec.ts` | chromium, mobile | A locked tile: its button and its blurred cover with nothing drawn over it; the 600 ms denial and its line; Enter and Space; repeated presses; the vibration, red outline and wash; reduced motion; `?view=` a locked template, on the page of results and off it; a phase page's locked tiles; without JavaScript |
| `template-dialog.spec.ts` | chromium, mobile | The pop-up: opening from a tile, its content, Escape, Close and the dimmed page each closing it and keeping the other parameters, Back, focus, a selection dragged out of the pop-up not closing it, a close after an open from the catalog leaving no entry behind (Back leaves the catalog) and one after an open from another page staying on the catalog, values that open nothing, the home and phase tiles, without JavaScript |
| `purchase.spec.ts` | chromium, mobile | The Purchase page: no title block, one `h1` on the folder, and the price once on the tag; the folder and the tally; the ledger; the Checkout link; no questions section, and the contents leaf beside the folder from 68em; 320px; the tag's swing; reduced motion; the home folder |
| `checkout.spec.ts` | chromium, mobile | The checkout: opening from the link and from the address, the summary, Escape, Close, the dimmed page and Back with focus returned, one history entry for all steps, labels and autocomplete tokens, the region control, validation on blur and on submit, the whole walk to the Payment step, no order data in any address or request, the draft surviving a reload, Start over, the phone and 320px layouts, the step's movement, the catalog's pop-up unchanged, and no JavaScript |
| `redirects.spec.ts` | chromium, mobile | The retired addresses (bundles, pricing, cart, about, template pages) end where they should; the 308; `/contact` answering as a page |
| `contact.spec.ts` | chromium, mobile | The Contact page: one section and one band in `main`, one `h1`, the address as the one plain `mailto:` link, no form or field, the four subject links, the fit at 320 and 1920, the footer's link to it; `/about` redirecting to `/why-advanta`, which holds no contact section |
| `legal.spec.ts` | chromium, mobile | The four legal pages: status 200, one `h1`, the page title, the date and the summary; a table of contents whose links are the sections' ids in order, each section headed by one numbered `h2`; no id twice; links to the contact page and the other three, and the current page marked among the policies; no cookie and no storage beyond the two session entries of the boot script; an entry of the contents brings its section into view and lights its number; the three columns from 68em and the measure; the contents first and 44px tall at 320px |
| `hero.spec.ts` | chromium, mobile | The hero where the ink is still: structure and copy; the six documents as links; their pop-ups; the documents standing and focusable from the first frame with no box (still ink, a return inside the site, a first visit under the cover); the first screen at several window sizes; no title or tag cut by a neighbour and 44px targets; the band's foot; reduced motion; no JavaScript |
| `console.spec.ts` | chromium, mobile, firefox | Twelve routes load with no console error and no page error |
| `header.spec.ts` | chromium only (skips the mobile project) | The banner; Catalog and Why Advanta and the purchase button; centring; the 68em boundary; the sliding underline; the phase rail; the sticky bar; the brand returning to the top on the home page |
| `identity.spec.ts` | chromium, mobile | Design checks in the browser: landmarks; one `h1` per page; root colours and fonts; band values; the ink hooks; the order of the home sections; focus rings; the 365 on the mark; the tiles' covers; no overflow and minimum touch targets at 320 px |
| `intro.spec.ts` | chromium, mobile | The cover on a first visit: its states; the mark held to 2.5 s and gone by 3.4 s; skip on a click, key press (at any time) or wheel; no cover on reload or on other routes; no cover with reduced motion, blocked storage or JavaScript off |
| `ink-fallback.spec.ts` | chromium, mobile, firefox | Without WebGL2, with more contrast, and without JavaScript: still images only, no canvas, no button for the ink, a clean console. The software-renderer case runs in Chromium only |
| `ink-live.spec.ts` | gpu | Live ink: the prompt scene (its script, first frame, frame cost, long tasks, calm caps); the hero's sequence (its timings, the first visit, a fall to still half-way, a return inside the site); a resize with the loop stopped, context loss, the not-found scene, the takeover of the cover (within 1.6 s, gone 3.5 s later) |
| `menu.spec.ts` | mobile (in chromium every test skips) | The phone bar and drawer: brand, button and Menu at 390 and 320px; the four pages and seven phases; Escape, Close, the dimmed page (a drag that ends there does not close it); navigation closing it |
| `motion.spec.ts` | chromium, mobile, firefox | Entrances hidden until scrolled into view, with timelines and without; the ninety band; a page change runs a view transition; a filter change or a pop-up starts none |
| `reduced-motion.spec.ts` | chromium, mobile, firefox | Reduced motion on 13 routes: still ink, no motion attributes, no canvas, no running animations, no cover; the stills load; the 90% figure and the tally show their final state |
| `not-found.spec.ts` | chromium, mobile | 404 status and content for missing paths; lowercase redirect |
| `viewports.spec.ts` | chromium only (skips the mobile project) | The geometry guard: twelve routes (`/`, `/catalog`, `/phases/plan`, `/purchase`, `/why-advanta`, `/contact`, `/privacy`, `/terms`, `/refunds`, `/accessibility`, `/sample`, `/nope`) at sixteen window sizes, 320 by 640 to 3840 by 2160 (192 tests): one `h1`, no element past the window's edge, from 1280 up the words span more than half of the window (not on the 404), no console or page error |

`tests/e2e/support/ink.ts` gives the ink specs helpers for reading pixels, states, timings and console
problems.

## 11. Budgets

| Budget | Limit | Enforced by |
|---|---|---|
| Gzip size of the first-load scripts of `/` (scripts and inline code, summed) | Baseline plus 12 KiB | `scripts/check-budgets.mjs` against `tests/budgets/baseline.json` |
| Shader chunks (JavaScript containing `#version 300 es`) | 40 KiB gzip in total; none may be an initial script of `/`, `/why-advanta` or `/catalog` | `scripts/check-budgets.mjs` |
| Boot script | 1536 bytes gzip; must not contain `</script` or `<!--` | `boot-script.test.ts` |
| Ink stills | 90 KiB each, 600 KiB in total | `scripts/ink-stills.mjs` and `stills-files.test.ts` |
| Paper grain image | 4 KiB | `kit-grain.test.ts` |
| Probe frame budget | 9 ms (high), 10 ms (medium) | Engine probe |
| Ink frame cost at high tier | 6 ms or less (test) | `ink-live.spec.ts` |
| Calm caps | Within 0.02 of the cap | `ink-stills.mjs --check` and `ink-live.spec.ts` |
| Ink blue | Darkest saturated blue at luminance 0.25 or more, hue 205 to 216 | `ink-stills.mjs --blue` |
| Scene drops | Within the canvas (`-0.05` to `1.05`), positive radius and amount | `ink-scenes.test.ts` |

`scripts/check-budgets.mjs <baseUrl> [--record] [--pages=...]` needs a running production server, and a
build in `.next/static` for the shader check. `--record` writes `tests/budgets/baseline.json`, which holds the
gzip total, the script list, the shader chunks and the shader total for `/`.

`scripts/ink-stills.mjs` has four modes, and only one can run at a time:

- capture (default): renders the thirteen stills into `public/ink/`, lowering the WebP quality from 0.86 in steps
  of 0.04 to 0.70 until each file is at most 90 KiB;
- `--check`: reads the calm-zone luminance under each still at seven widths on seven routes (`/`, `/why-advanta`,
  `/purchase`, `/sample`, `/phases/prepare`, `/catalog`, `/nope`) and fails if a zone breaks its cap by more
  than 0.02;
- `--blue`: checks the ink colour in three frames;
- `--sheets`: writes contact sheets of scenes at desktop and phone sizes into `.qa-shots/final`.

Exit codes: 0 when the check passes, 1 when a check or budget fails, 2 for usage or an environment that cannot
run the engine (no GPU, or no build).

`scripts/paper-grain.mjs` writes `public/paper/grain.png`: a 128 px indexed PNG with four palette entries
from the ink colour at alphas 0, 0.03, 0.06 and 0.09. It fails above 4 KiB.

## 12. Failure modes

| Failure | Behaviour |
|---|---|
| Invalid catalog record | `CatalogError` on first import of `repository.ts`. Every route that imports it fails to render, and the message names the kind, slug and field |
| Unknown phase slug | `notFound()`. The site 404 page renders with the shell; the root 404 renders without it |
| Malformed catalog query | Unknown values are dropped; a bad `page` becomes `1`; an out-of-range page is clamped. The response is 200 |
| `view` that names no template, or a locked one | Nothing opens. A locked template's tile, if it is on the page of results, is rendered saying no; if it is not, a line above the results says the template is included with the toolkit. The response is 200 |
| Checkout | Built up to payment: no provider is connected (`getPaymentProvider()` returns `null`), so the Payment step offers the order by email and nothing can be paid for; locked templates stay locked. Blocked session storage: the draft lasts for the page only |
| Cover cannot start | No cover; the page loads as normal |
| Cover interrupted | Skip, or the 5500 ms backstop unsets `data-intro`. The ink takeover is skipped unless its checks pass |
| Ink unsupported or failing | Stills show for the page view or the session, as in section 7.12 |
| Ink engine chunk fails | Stills for this page view |
| Reduced motion | No cover, no motion, stills |
| High contrast or forced colours | No canvas and no backdrops; sheets get explicit borders |
| JavaScript disabled | Stills, no cover, content readable |
| Narrow phone with a filter open | The filter dialog is a full bottom sheet with its own scrolling body |
| Drawer open across navigation | Closes on the pathname change unless it was opened on that pathname |
| Resize across the portrait and landscape boundary | The ink scene is presetted again for the new shape |
| Browser page hidden | The ink loop stops; it resumes on `pageshow` if the page was persisted |
