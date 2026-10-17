# Architecture

Advanta365 is a Next.js 16 App Router site written in React 19 and TypeScript. Pages are server
components that read a validated catalog and compose UI primitives. Styling uses CSS Modules on top of
global design tokens. The site ships HTML, CSS and inline SVG, and draws nothing on a canvas.

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
7. Motion and page transitions
8. Catalog URL state
9. Test hooks and test contract
10. Budgets
11. Failure modes

## 1. Routes

| Path | Source | Rendering | Notes |
|---|---|---|---|
| `/` | `app/(site)/page.tsx` | Server, reads phases, templates and the free samples | Renders the first-visit cover, then the home sections |
| `/purchase` | `app/(site)/purchase/page.tsx` | Dynamic (awaits `searchParams`); reads phases, templates and the free samples | Title `Purchase`; the one place a sale starts (section 3.5), and `?checkout=<step>` opens the checkout in a pop-up over it (section 3.7) |
| `/catalog` | `app/(site)/catalog/page.tsx` | Dynamic (awaits `searchParams`) | Title `Catalog`; filters live in the URL, and `?view=<slug>` opens a free sample in a pop-up (section 8) |
| `/why-advanta` | `app/(site)/why-advanta/page.tsx` | Server; reads the phases for the phase links | Title `Why Advanta` (the page was `/about`, which redirects here); sections `#promise`, `#made`, `#who`, `#compare` (whose cost cell for the toolkit is the one price from `OFFER`) and `#state` |
| `/contact` | `app/(site)/contact/page.tsx` | Server, static | Title `Contact`; one section (`ContactSection`) and nothing else: the `h1`, the address `SITE.contactEmail` as a `mailto:` link, and four subjects to write about, each the same address with `?subject=`. No form and no endpoint |
| `/privacy`, `/terms`, `/refunds`, `/accessibility` | `app/(site)/<name>/page.tsx` | Server, static | The four legal pages, the routes of `LEGAL_LINKS` in `lib/site.ts`: the privacy policy (with the cookies and browser storage as its section `#cookies`, and what is planned for the checkout under `#when-checkout-opens`), the terms of use and licence, the refund policy and the accessibility statement. Each page renders `LegalPage` with one `LegalDocument` from `lib/legal` and takes its title and description from it (section 5.3) |
| `/sample` | `app/(site)/sample/page.tsx` | Server, reads phases and the worked example's contents | Title `Sample` |
| `/phases/[phase]` | `app/(site)/phases/[phase]/page.tsx` | Params for the 13 sections; dynamic, because it reads the licence cookie | `notFound()` for other slugs; every tile opens for a browser holding a licence (section 3.8) |
| `/licence` | `app/licence/route.ts` | Route handler (`GET`) | Checks `t`, sets the licence cookie, 303 to `/catalog` (or `/catalog?link=invalid`, which the catalog answers with a line above the results) |
| `/api/samples/[slug]/[fileId]` | `app/api/samples/[slug]/[fileId]/route.ts` | Route handler (`GET`) | A free sample's file; 404 for any other |
| `/api/library/[slug]/[fileId]` | `app/api/library/[slug]/[fileId]/route.ts` | Route handler (`GET`) | Any file, with a valid licence cookie; 404 without |
| Unmatched paths | `app/(site)/[...rest]/page.tsx`, `app/(site)/not-found.tsx`, `app/not-found.tsx` | 404 | Site 404 keeps the shell; the root 404 renders `MissingPage` without it |

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
| `/phases/make-the-case`, `/phases/plan`, `/phases/design`, `/phases/prepare`, `/phases/communicate`, `/phases/execute`, `/phases/sustain` (the seven retired phases) | `/phases/define-the-change`, `/phases/assess-the-impact`, `/phases/design-the-platform`, `/phases/build-the-training`, `/phases/plan-communications`, `/phases/go-live-and-support`, `/phases/make-it-stick`, in that order (`OLD_PHASES`) |

Any other unknown `/phases/<slug>` is a 404.

`view` opens the pop-up only for a free sample. For a locked template nothing opens and its tile says no (or,
where its tile is not on the page of results, a line above them does), and for any other value the catalog
shows as it is (section 8.3).

Page layouts:

- `/catalog` has no title block. It opens on the catalogue band (`pad="tight"`, 42px under the bar) with a visually hidden `h1` "Catalog" (`type-banner visually-hidden`), and the line under
  the result count (shown while there are results) says the listings are sample content.
- `/phases/[phase]`: the title block's aside holds, for a numbered phase, the numeral at the poster size,
  "Phase N of 11" and an 11-block `Tally` with the blocks before it inked and its own marked; Start here says
  "Before phase 1" and Used at every step "Alongside phases 1 to 11" instead, with no numeral or tally. The
  templates follow as tiles on one desk band, and the foot band on paper holds "View all <name> templates" and
  `PhasePager`, a navigation named "Previous and next phase" whose links read "Previous <name>" and "Next
  <name>" (`adjacentPhases`, in folder order); Start here has no previous link and Used at every step no next
  one. A tile on a phase page gets no `phaseName`, so it names its deliverable type alone.
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
  title in `type-item`, then its place ("Template: …" or "Phase: …"). A free sample's place is a
  link to `/catalog?view=<slug>`, where it opens in the pop-up; a locked template's is its title in plain
  text. While `content/worked-example.ts` sets `placeholder`, a beta note heads
  the list and every section reads "Placeholder". The phase ledger follows on the desk: all 13 sections, each a `RowLink` captioned "Phase N of 11" with an
  11-block tally, or "Before phase 1" / "Alongside phases 1 to 11" with no numeral or tally.

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
| Shell | `components/layout/primary-nav.tsx`, `phases-menu.tsx`, `purchase-button.tsx`, `nav-drawer.tsx` | Read `usePathname` (`PhasesMenu` also the search); the drawer owns a native dialog |
| Not found | `components/not-found/asked-path.tsx`, `late-boot.tsx` | Read `window.location`; add the boot script when needed |
| UI | `components/ui/motion-root.tsx` | Observers and the `data-hydrated` signal |
| Catalog | `components/catalog/active-filters.tsx` | The filter chips (the router, and focus after a removal) |
| Phases drop-down | `components/ui/step-menu.tsx` | Closes its `<details>` on Escape, a click outside, a link and a change of page |

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
| `content/phases.ts` | The 13 sections, one per toolkit folder (00 to 12) |
| `content/templates/index.ts` | Concatenates the 13 per-section template lists in folder order |
| `content/templates/<slug>.ts` (`start-here.ts` to `used-at-every-step.ts`) | Templates per section |
| `content/templates/sample.ts` | The `sample()` helper |
| `content/taxonomy.ts` | Labels for deliverable types, apps, audiences and formats, and the list of ADKAR stage keys (stored on templates, never shown) |
| `content/worked-example.ts` | The worked example's table of contents: placeholder sections (`placeholder: true`, a `TODO(owner)`), each pointing at a template or a phase |

`sample(phase, entries)` adds `phase`, `free` (default `false`) and `isSample: true` to each entry.
The per-section files mark their entries as sample content, so `hasSampleContent()` is true (it is used only by
the unit tests now; the beta strip is gone).

### 3.2 Schema and validation

`lib/catalog/schema.ts` defines the zod schemas. Slugs match `^[a-z0-9]+(-[a-z0-9]+)*$`. Text fields are
trimmed and non-empty. A template has no price: the one price is `OFFER` (section 3.5).

| Kind | Required fields |
|---|---|
| Phase | `slug`, `name` (the plain name), `label` (the short one, for the line of phases on Why Advanta), `summary`, `order` (integer: the folder number, 0 to 12); optional `number` (positive integer: the phase number, on 01 to 11 only) |
| Template | `slug`, `title`, `summary`, `description`, `phase`, `deliverableType`, `apps` (at least one), `audiences` (at least one), `format`, `adkar` (may be empty), `includes` (at least one), `free` (boolean: one of the six samples given away), `isSample`; optional `pageCount` (positive integer) |

`lib/catalog/validate.ts` parses each record, sorts phases by `order`, and keeps the file order of
templates. It then checks:

- slugs are unique within phases and within templates;
- the phase numbers, in `order`, run 1, 2, 3 and on (`Phase numbers must run 1 to N in order, found …`);
  the unnumbered sections can stand anywhere;
- each template's `phase` exists;
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
| `getFreeTemplates()` | The six free samples, in folder order |
| `getRelatedTemplates(slug, limit = 4)` | Templates of the same section, in file order; excludes the template itself |
| `hasSampleContent()` | `true` when any template is marked as sample (used by tests only) |
| `getWorkedExampleContents()` | `{ placeholder, sections }`: the worked example's sections resolved with `contentsRows` |

Helpers used by pages and components:

| Helper | Behaviour |
|---|---|
| `phaseCoverage(phases, templates)` | One entry per numbered phase (`number`, `slug`, `name`), sorted by `number`, with `covered` set when any template belongs to it; Start here and Used at every step are left out |
| `numberedPhases(phases)` | The numbered phases alone, sorted by `number` |
| `adjacentPhases(phases, slug)` | `{ previous, next }` in `order` (folder order, numbered or not); either is undefined at an end, both for an unknown slug |
| `contentsRows(entries, templates, phases)` (`lib/catalog/worked-example.ts`) | Each contents section with its link: a free sample links into the catalog (`/catalog?view=<slug>`) under the template's title, a locked template is named by its title with no link, a phase links to its page (`phaseHref`, `/phases/<slug>`) under kind "Phase"; no link when the catalog lacks the target |
| `formatLength(count, format)` (`lib/format.ts`) | A template's Length fact: slides for a `pptx` deck ("16 slides"), pages for every other format |
| `intoViewOffset(row, item, padding)`, `scrollCurrentIntoView(row)` (`lib/scroll/into-view.ts`) | How far a sideways row must scroll so one item stands clear of its scroll padding (0 when it already does), and the call that scrolls a row to its `aria-current` item without moving the page |
| `createScrimPress()` (`lib/scrim.ts`) | Tells a click on a dialog's dimmed page from a drag that merely ended there: it closes only when the press, the release and the click all have the dialog itself as their target. `PageDialog` and `NavDrawer` use it |
| `previousEntryIs(navigation, href, origin)` (`lib/history.ts`) | Whether the history entry before the current one is `href`, in any order of its parameters; false whenever it cannot tell (no Navigation API, no earlier entry, another site). `PageDialog` closes with `router.back()` on true |
| `formatPrice(cents, currency)` and `formatPriceParts(cents, currency)` (`lib/format.ts`) | Canadian-English formatting with the narrow symbol, so a dollar currency prints a bare `$`, followed by the currency code after a no-break space; whole amounts drop `.00` and other amounts keep their cents, so `149999` and `"CAD"` print `$1,499.99 CAD`. The currency is always passed in (`OFFER.currency`). `formatPriceParts` returns `{ amount, currency }` for a place that sets the code smaller than the amount (the price tag) |
| `countWord(count, form)` (`lib/format.ts`) | A count as copy writes it: a word up to twelve, digits beyond; `"capital"` for the first word of a sentence. The catalog's key line and the home page's toolkit section print `FREE_SAMPLE_COUNT` with it |

### 3.4 Catalog contents

Thirteen sections, one for each of the toolkit's folders, in folder order. Only 01 to 11 are numbered phases; Start
here is orientation and Used at every step holds the tools used throughout, so neither has a `number`:

| Order | Number | Slug | Name | Label | Templates |
|---|---|---|---|---|---|
| 0 | | `start-here` | Start here | Start here | 1 |
| 1 | 1 | `define-the-change` | Define the change | Define | 5 |
| 2 | 2 | `assess-the-impact` | Assess the impact | Assess | 8 |
| 3 | 3 | `set-the-strategy` | Set the strategy | Strategize | 4 |
| 4 | 4 | `engage-leaders` | Engage leaders | Engage | 8 |
| 5 | 5 | `plan-communications` | Plan communications | Communicate | 6 |
| 6 | 6 | `design-the-platform` | Design the platform | Design | 3 |
| 7 | 7 | `plan-the-training` | Plan the training | Plan training | 2 |
| 8 | 8 | `build-the-training` | Build the training | Build training | 5 |
| 9 | 9 | `deliver-training` | Deliver training | Train | 1 |
| 10 | 10 | `go-live-and-support` | Go live and support | Go live | 6 |
| 11 | 11 | `make-it-stick` | Make it stick | Sustain | 15 |
| 12 | | `used-at-every-step` | Used at every step | Every step | 3 |

There are 67 templates. Their formats are docx (32), xlsx (19), pptx (12) and pdf (4). `pageCount` is set on
43 templates; it is printed as slides for a deck and pages otherwise (`formatLength`). Six are free samples, each
in a different phase:

| Phase | Free sample | Format |
|---|---|---|
| 3 | `change-management-strategy` | docx |
| 4 | `executive-sponsor-kickoff-deck` | pptx |
| 5 | `master-communications-plan` | xlsx |
| 6 | `sharepoint-governance-framework` | docx |
| 8 | `sharepoint-end-user-training-deck` | pptx |
| 10 | `go-live-readiness-checklist` | xlsx |

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
(56px from 68em), holding the `Portfolio` at the left (columns 1 to 6 from 68em: the toolkit as one folder at page
size, the price on the tag that hangs from it, the tally of the eleven numbered phases under it) and the `ContentsLeaf`
at the right (columns 8 to 12; column 7 is the room the tag hangs into): the h2 "What is inside", a ledger
read from `TOOLKIT`, the Checkout link, the line that leads to the contact page (for a purchase order, or a
question) and the note that the catalog is sample content. The heading on the folder's front, "Eleven phases
in one folder.", is the page's one `h1` (`Portfolio` at `size="page"`). Below 68em it is one column, the folder first, until a window is about 1010px wide: the grid is then
two columns of at least 28rem, so a landscape tablet has the two side by side, the tag lying on the folder. From
68em, on a large monitor, the folder and the leaf are drawn larger together with CSS `zoom` (`--grow`, section
5.1), and the leaf stands on the page's right edge as the folder stands on the left. Checkout is the leaf's main action: a `Button` link to
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
`/purchase`, the same `PageDialog` as the pop-up of the catalog (section 8.3): the page renders
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
   orders and a way to deliver the files. Delivery exists (section 3.8): the webhook calls
   `signLicence(order.reference, LICENCE_SECRET)` and emails the buyer `/licence?t=<licence>`.
8. **Update what the site says**: the Payment step's copy if needed, the Checkout entry of `SiteState`, the
   footer's status line, and the privacy policy's "When checkout opens" section (`lib/legal/privacy.ts`).
   Add the provider's origins to the content security policy in `next.config.ts` (`script-src`,
   `connect-src` and `frame-src`, as its documentation lists them), or its script and frame are blocked.
9. **Test it.** `tests/unit/checkout-provider.test.ts` already runs `startPayment` and `PaymentStep` against
   a fake provider; add a browser spec that walks to a paid order in the provider's test mode.

### 3.8 Files and licences

| Module | Holds |
|---|---|
| `lib/files/types.ts` | `FILE_TYPES` (each allowed extension and its content type: docx, dotx, pptx, potx, xlsx, xltx, pdf, zip) and `extensionOf` |
| `lib/catalog/schema.ts` | `TemplateFileSchema` (`id` a slug, `name` safe characters and an allowed extension, `key` lower-case segments with no `.` or `..`, `bytes`, `sha256`); `files` on a template, default `[]` |
| `lib/files/store.ts` | `FileStore` (`stat`, `open`, optional `signedUrl`) and `getFileStore()`, read from the environment on every call: `FILE_STORE=local` and `FILE_STORE_DIR`, else `null` |
| `lib/files/local-store.ts` | `createLocalStore(root)`: resolves a key with `realpath` and refuses anything outside the root, symbolic links included |
| `lib/files/respond.ts` | `serveFile` (a 302 to `signedUrl` when the store has one, else the stream with `Content-Disposition: attachment`, `nosniff`, `noindex`, and `public, max-age=3600` for a free file or `private, no-store` for a licensed one), `notFound`, `tooMany`, `unavailable`, `contentDisposition` |
| `lib/licence/token.ts` | `signLicence`, `verifyLicence`, `licenceEnv`, `ORDER_CODE`. Imports only `node:crypto`, so `scripts/mint-licence.mjs` runs it directly |
| `lib/licence/session.ts` | `hasLicence()`: whether the request's cookie holds a valid licence (`next/headers`); the catalog and the phase pages call it |
| `lib/licence/cookie.ts` | `LICENCE_COOKIE` (`__Host-a365-licence`), `LICENCE_COOKIE_MAX_AGE` (400 days), `readCookie` |
| `lib/http/rate-limit.ts` | `createRateLimiter` (a fixed window per client, in memory, capped) and `clientKey` |

**A licence** is `v1.<payload>.<signature>`: the payload is base64url JSON `{"o":"<order code>","i":<issued>}`
and the signature HMAC-SHA256 over `v1.<payload>` with `LICENCE_SECRET`. It verifies against that secret or
`LICENCE_SECRET_PREVIOUS`, compared in constant time, and fails for an order in `LICENCE_REVOKED`. Every
failure is the same `null`. It holds no name or email address, because it travels in an address once, and
it does not expire.

**The flow.** The buyer opens `/licence?t=<licence>`. A good licence is set as an `HttpOnly; Secure;
SameSite=Lax` cookie on the whole host and the answer is a 303 to `/catalog`, so the licence leaves the address
bar; both answers carry `Referrer-Policy: no-referrer`. The catalog and the phase pages read the cookie on
each request (`hasLicence`, `lib/licence/session.ts`): with a licence every tile opens (`unlocked` on
`TemplateTile`), `view` opens any template, and the pop-up (`licensed` on `TemplateDetail`) drops the sample
tag and the purchase button and links its files to `/api/library`. That only decides what the page shows. A file
route checks, in order: the rate limit (429), the licence for `/api/library` (404), the store (503), the
template and file (404, and for `/api/samples` a template that is not free is 404 too), then serves the file.

**Limits.** `/licence` takes 10 requests a minute per client, each file route 60, counted per server instance.

## 4. Site shell

`app/(site)/layout.tsx` is an async server layout. It reads the phases, then renders this tree, in order:

1. A skip link (`Button` with `href="#main"`, text "Skip to content"), fixed at the top left and shown
   on keyboard focus.
2. A `.frame` element (`position: relative`, flex column, `min-height: 100svh`, `overflow-x: clip`) containing:
   - `Header`, with `PurchaseButton` in its tools area and the phases for its Phases drop-down and drawer;
   - `<main id="main">` holding the route's children;
   - `Footer`.

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
- Centre: `PrimaryNav`, shown from 68em, in a grid of equal columns: Catalog, the Phases drop-down
  (`PhasesMenu`, section 4.3) and Why Advanta (`NAV`). The current link has `aria-current="page"`, or `"true"`
  when the current path is nested under it; on `/phases/<slug>` the current item is Phases. One ink
  underline (`data-nav-underline`, decoration only) stands under the current item and slides to the next
  one when movement is wanted; with no current item it is not displayed.
- Right: `PurchaseButton`, then the Menu button of `NavDrawer` (shown below 68em only). `PurchaseButton` is
  one link to `/purchase` with one accessible name at every width: "Get the toolkit · $1,499.99 CAD" from 68em,
  "Get the toolkit" below it, where the price is `display: none`. On `/purchase` it carries
  `aria-current="page"` and drops to a quiet look (the wash and an ink edge), so the page does not ask to
  be bought twice.

The bar is `position: sticky` at `top: 0`, height `var(--bar-h)`, and is a container for two container
queries that hide the menu word at 27.4em and below and the brand name at 24.3em and below, in that order,
so that at 320px the mark, the button and the Menu button all stay, each a 44px target. Container queries
are used only in `header.module.css`, `nav-drawer.module.css` and `components/about/phase-line.module.css`
(the line of phases on Why Advanta draws its tally from 72rem of its own width).

### 4.2 Nav drawer

`components/layout/nav-drawer.tsx` (client) renders the "Menu" button and a native `<dialog>` opened with
`showModal()`.

- The dialog is labelled "Site menu". It contains a `nav` labelled "Menu" with the three primary links (Purchase, Catalog, Why Advanta) and the Contact page (`MENU_LINKS`: `PRIMARY_LINKS`, then `CONTACT_LINK`), and a
  group labelled "Phases" with the 13 section links in folder order, each with its numeral tile (empty, and not
  drawn, for Start here and Used at every step).
- It shows the contact address as a `mailto:` link taken from `SITE.contactEmail`.
- Escape and the Close button close it. A click on the backdrop closes it when the event target is the
  dialog itself and the press began there too (`createScrimPress`), so a selection dragged out of the panel
  does not.
- The dialog closes on a pathname change unless it was opened on that same pathname.
- It closes when the viewport reaches `(min-width: 68em)`, where the inline navigation takes over.
- The drawer is 88vw wide at most and 23.625rem at most, anchored to the right edge.

### 4.3 Phases drop-down

There is no rail under the bar. `components/layout/phases-menu.tsx` (`PhasesMenu`, client) renders
`StepMenu` (`components/ui/step-menu.tsx`) with `label="Phases"` and `variant="bar"` as the middle item of
`PrimaryNav`, so it shows from 68em only. `StepMenu` is a native `<details data-step-menu>` whose panel is a
navigation named "Toolkit phases": a list of links to `/phases/<slug>` (`phaseHref`), each a numeral tile and
the plain name, Start here first and Used at every step last, neither numbered. It works without script; with
it, the panel also closes on Escape (focus back on the button), on a click outside it, on a link and on any
change of page. The phase being shown is marked in the list: `aria-current="page"` on `/phases/<slug>`, and
`aria-current="true"` on `/catalog` while the `phase` parameter names exactly one known phase
(`singleCatalogPhase`); no other page belongs to a phase. `currentPhase()` in `nav-links.ts` computes it.
`PhasesMenu` reads the search inside a Suspense boundary whose fallback is the menu drawn from the pathname
alone. Below 68em the catalog renders its own `StepMenu` (section 8.4) and the drawer lists the phases.

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

## 5. Design tokens and primitives

### 5.1 Tokens

Tokens live in `app/globals.css` under `:root`. The file also imports `app/motion.css` first. Only
`app/globals.css` and `app/icon.svg` contain raw colour values. Components read the semantic layer.

| Group | Tokens |
|---|---|
| Paper and ink | `--desk`, `--paper`, `--desk-deep`, `--rule`, `--rule-firm`, `--ink`, `--ink-soft`, `--ink-faint` |
| Mark | `--mark` (#86c1ff), `--mark-deep` (#5fa8f5), `--mark-wash` (#eaf4ff), `--on-mark` (ink), `--on-ink` |
| Binder (footer) | `--binder`, `--binder-rise`, `--on-binder`, `--on-binder-soft`, `--rule-on-binder` |
| Errors | `--alert`, `--alert-wash` (`--alert` is also the ring on the well of a locked tile that says no) |
| Page-size folder | `--card-light`, `--pocket-shade` |
| Overlays | `--scrim`, `--bar-shadow` |
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
`--s-7` from 40em), `--bar-h` (3.5rem, 4.375rem from 68em). Controls use `--tap` (2.75rem, the minimum target below 68em),
`--control-sm` (2.5rem, desktop bar only), `--control` (3rem) and `--control-lg` (3.5rem). Shapes use
`--round-1` to `--round-3`, `--edge` (2px) and `--hair` (1px). Layers are
`--layer-bar` (50), `--layer-skip` (90) and `--layer-cover` (100).

Media queries in use: `(min-width: 40em)`, `(min-width: 68em)`, `(hover: hover)`,
`(prefers-reduced-motion: no-preference)`, `(prefers-reduced-motion: reduce)`, `(prefers-contrast: more)`
and `(forced-colors: active)`. Nothing else is allowed (section 9.3).

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
`--stage-bleed` and the proof strip's width), and the toolkit's folder and the specimen on the home page. Two
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
| `Band` | A full-width section with `surface` (desk, paper, wash, ink, binder), `pad` (none, title, tight, regular, roomy), and an inner `Wrap` |
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
| `PhaseTabs` | The sections as large index cards, numeral over name (none for an unnumbered section): two across on a phone, from 40em as many across as fit (12.5rem at least). Used on the home page ("Browse the sample catalog by phase") and in the catalog's empty search ("Browse by phase") |
| `StepMenu` | The sections as a `<details>` drop-down of links (`data-step-menu`), its panel named "Toolkit phases". The button names the current phase ("Phase 10 Go live and support") or says "Jump to a phase"; `label` replaces both ("Phases" in the bar), `variant` is `field` or `bar` (section 4.3) |
| `Icon` | Inline SVG glyphs: arrow, chevron, plus, minus, close, tick, bars, search. `size` is pixels at the 16px root and the icon is set in rem, so it grows with the root on a large monitor |
| `LogoMark`, `BrandLockup` | The mark, as a tile or bare lockup. `LogoMark` fills the whole "A" in one ink, or its right half in `--logo-half` with `tone="two"`; `BrandLockup` draws it on the tile or bare |
| `KeepCompounds` | Keeps hyphenated compounds from breaking across lines |
| `Sentences` | Splits text into sentences, optionally animated in one at a time |
| `Appear` | Wrapper that sets the entrance hook (`data-move`) |
| `PageShift` | `ViewTransition` wrapper for route changes |
| `MotionRoot` | Client component that sets up the scroll observer (renders nothing) |

Helpers: `lib/cx.ts` exports `cx` (joins truthy class names) and `cssVars` (builds a style object and
drops `undefined` values). `lib/brand/mark.ts` holds the logo geometry: one form, `MARK_VIEWBOX` (48 by 44),
as two filled halves that meet on the seam `MARK_SEAM_X`: `MARK_INK_D`, the arm, and `MARK_HUE_D`, the leg
(which runs half a unit under the arm so no hairline shows); `MARK_PATH_D` is the whole "A" as one shape, and
`MARK_ASPECT` its width over height. `LogoMark` fills it as one shape or as two (the leg in `--logo-half`),
`BrandLockup` draws it on the bar's tile, bare in the footer and on the drawer's and the folder's small tile, and
the cover of a first visit draws the halves one after the other (section 6). `app/icon.svg` is generated from this
file by `scripts/gen-icon.mjs` and uses the same colours as the tokens: a #0B0D12 tile, the arm in #FFFFFF and the
leg in #86C1FF.

### 5.3 Feature components

Components built from the primitives for one part of the site. Each has a doc comment that says what it does.

| Component | File | Props | What it is |
|---|---|---|---|
| `Portfolio` | `components/purchase/portfolio.tsx` | `size` (`page`, `section`), `covers`, `phases` | The toolkit as a folder: the six sample covers in its pocket, the maker's lockup, a heading and the file formats, the `PriceTag` on its corner, and under it a tally of the eleven numbered phases (`phaseCoverage`), labelled "Phases: …" |
| `PriceTag` | `components/purchase/price-tag.tsx` | `className` | The price from `OFFER` and "one purchase" on a paper tag hung on a string from the corner of the folder. Swings once when first seen and a little when the folder is hovered; still under reduced motion |
| `ContentsLeaf` | `components/purchase/contents-leaf.tsx` | `className` | The toolkit's contents as a loose paper leaf with a dog-eared corner: a ledger (dl) of counts from `TOOLKIT`, then the Checkout link (to `/purchase?checkout=details`), the line to the contact page and the sample note |
| `ContactSection` | `components/contact/contact-section.tsx` | none | The whole Contact page as one paper band (a `section` named by its `h1`): the title in the margin from 68em, the lead on its baseline, the address as a `mailto:` link at the statement size, a sentence on what to expect, then a `BandedList` of four `RowLink`s, each the address with a subject. No script |
| `PromiseBand`, `MakingSection`, `BuyersSection`, `CompareSection`, `SiteState` | `components/about/` | none (`MakingSection` takes `phases`) | The sections of the Why Advanta page, in page order (section 1); `SectionHead` is the head they share and `PhaseLine` the phase links inside `MakingSection`: "The whole rollout, in eleven phases", the eleven numbered phases (a tally with their short labels under it where the line is 72rem wide, otherwise rows with their plain names), then "Plus Start here and Used at every step" |
| `TemplateTile`, `TileGrid` | `components/catalog/template-tile.tsx` | `template`, `phaseName`, `phaseNumber`, `href`, `headingLevel`, `scroll`, `denied` | One template in a grid, an `<article data-tile>` with exactly one control: a link (free sample) or a button (locked). The grid has as many columns of at least 11rem (176px at the 16px root) as fit, never fewer than two; the home page's six free samples set their own columns (`featuredGrid`: three across from 40em, six from 68em), so a row is never one tile short |
| `LockedTile` | `components/catalog/locked-tile.tsx` | `title`, `headingLevel`, `initialDenied` | The button of a locked tile, named "<title>, locked", and the line it answers with (section 8.3) |
| `TemplateDialog` | `components/catalog/template-dialog.tsx` | `closeHref`, `labelledBy` | The pop-up of the catalog: `PageDialog` with `name="template"` (section 8.3) |
| `PageDialog` | `components/ui/page-dialog.tsx` | `name` (`template`, `checkout`), `closeHref`, `labelledBy`, `bar`, `fill` | The dialog both pop-ups share: a native modal `<dialog>` that is open while the page renders it and closes to `closeHref`. `bar` stands before Close; `fill` makes it the whole window below 40em and one fixed height from there |
| `CheckoutDialog` | `components/checkout/checkout-dialog.tsx` | `panel`, `disclosure` (the two forms of `OrderSummary`) | The checkout (section 3.7) |
| `OrderSummary` | `components/checkout/order-summary.tsx` | `variant` (`panel`, `disclosure`) | The offer, what it holds, the price, the tax line and the total before tax, on the binder: a column from 68em, a native `<details>` row below it |
| `ActiveFilters` | `components/catalog/active-filters.tsx` | `criteria`, `phases`, `fallbackFocusId` | The filters that are on, as a row of chips above the results (section 8.4) |
| `PhasePager` | `components/catalog/phase-pager.tsx` | `previous`, `next`, `className` | The section before and the section after, in folder order, at the foot of a phase page ("Previous and next phase") |
| `TemplateDetail` | `components/catalog/template-detail.tsx` | `template`, `phase`, `titleId` | The content of the pop-up: large cover, "Free sample" tag, title, summary, description, facts, what is included, and the button to `/purchase` |
| `Hero`, `HeroStage` | `components/home/hero.tsx`, `hero-stage.tsx` | `samples`, `phases` | The first screen of the home page: headline, lead and two buttons; the stage, where the six free samples land as a hand of documents |
| `SplitFlap` | `components/home/split-flap.tsx` | `words` | The headline's last word on a split-flap board: the first of `words` stands (and is what a screen reader reads); where movement is wanted it turns through the rest, each changed letter flipping once to its new one, passing over a word that would not fit its line |
| `ProofStrip` | `components/home/proof-strip.tsx` | none | The band's foot: 30+ years, 59 playbooks, 130 templates, 58 job aids, on opaque paper |
| `PortfolioSection` | `components/home/portfolio-section.tsx` | `covers`, `phases` | `#toolkit` on the home page: words and the button to `/purchase`, the `Portfolio` at section size |
| `PurchaseButton` | `components/layout/purchase-button.tsx` | `className` | The bar's call to action (section 4.1) |
| `TitleBlock` | `components/layout/title-block.tsx` | `title`, `lead`, `form` (`index`, `document`, `wide`), `crumbs`, `meta`, `children`, `aside` | The band that opens every inner page but the catalog, holding its one `h1`. One column below 40em. With an `aside` (the phase numeral and its count, the worked example's page), from 40em the words and the aside stand side by side (`.paired`: the aside's column is `clamp(16rem, 25vw + 6rem, 18rem)`), so a tablet's first screen is not a column of words over an object; from 68em the twelve columns take over. The `index` form's grid is a size container (`.measure`), and from 68em its title is held to the three margin columns by `cqi` (the banner size is wider than they are up to about 1280px). |
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

### 6.2 Script order

1. If `prefers-reduced-motion: reduce` matches, return. Nothing is set, so no motion and no cover run.
2. Set `data-motion="on"`.
3. Set `data-timeline="on"` when `CSS.supports("animation-timeline: view()")` is true.
4. The cover decision: read `INTRO_FLAG`. If storage throws, nothing runs. Otherwise the flag is written as
   `1` on every first load of the session, on any path and in a hidden tab. The cover plays only when the
   stored value was not `1`, the path is `/`, and `document.visibilityState` is `visible`.
5. When the cover plays: set `data-intro="play"`, listen for `INTRO_SKIP_EVENTS` (capture and passive) to
   set `data-intro="leave"` (a touch or pen press also arms the click guard of section 6.5), listen for
   `animationstart` and `animationend` on the cover, and start a 5500 ms timer.

The pure equivalent of the cover decision (`shouldPlayIntro`) lives in `lib/boot/state.ts`. The unit tests run the inline script against it, so the two stay equal.

### 6.3 Attributes set on `<html>` before first paint

| Attribute | Values | Set by |
|---|---|---|
| `data-motion` | `on` | Boot script |
| `data-timeline` | `on` | Boot script, when view timelines are supported |
| `data-intro` | `play`, `leave`; absent when done | Boot script, which also removes it on the end event |
| `data-io` | `armed` | `MotionRoot`, in a layout effect on each pathname change |

### 6.4 Timeline of the cover

Milliseconds from the cover's own clock, which starts at first paint (the boot script runs a little before
that). The selectors do not name a state, so a change of state never restarts a stroke.

| Time (ms) | Event |
|---|---|
| 0 | `data-intro="play"`. The cover (`[data-intro-cover]`, fixed, `z-index: var(--layer-cover)`) shows over the page |
| 120 to 620 | The arm of the mark rises from its foot to the peak (`arm-rise` on `.arm`, `--curve-pen`) |
| 600 | Skip hint fades in |
| 620 to 1000 | The leg drops from the peak (`leg-drop` on `.leg`): an ease-in fall that lands at about 850, then a squash and spring back (`scaleY`, from its foot) |
| 900 to 1150 | The name (`.name .write`) is written in from the left (`write`, a clip) |
| 1100 to 1400 | "An EchoFive product" (`.byline .write`) is written in the same way |
| 1400 to 2500 | The finished signature stands |
| 2500 to 2680 | The signature and the hint fade on the still opaque paper (`sign-leave`, 180 ms) |
| 2500 to 2950 | Cover leaves (`cover-leave`, 450 ms, `--curve-leave`): its opacity holds at 1 until 40%, 2680, so the mark never lies over the hero |
| 5500 | Backstop: the `data-intro` attribute is unset |

The two halves of the mark are filled shapes hidden by an animated `clip-path`; the writing of the text is a `clip-path` that opens from the left. The arm's curve is `--curve-pen`.

### 6.5 Skip and end

- Skip: any `INTRO_SKIP_EVENTS` input sets `data-intro="leave"`, which runs `cover-skip` (200 ms). The
  skip listeners are detached as soon as the cover's own animation starts, which is after its delay (2500 ms for
  `play`), so a press ends the cover through the whole hold. Child animations do not count.
- Skip and the pointer: `cover-skip` sets no `pointer-events`, so the cover takes the pointer for all 200 ms and
  `visibility: hidden` ends the hit-testing on its last frame. A touch's click is aimed where the finger lifts, not
  where it came down, so a cover that let the pointer through at once would give the click to the link under it. A
  tap held past the 200 ms would do the same, so a press by touch or pen (`touchstart`, or `pointerdown` whose
  `pointerType` is not `mouse`) also arms a one-shot, capture-phase `click` listener on `window` that stops and
  cancels the first click, and is dropped by that click or after `INTRO_CLICK_GUARD_MS`. A mouse, a key and the
  wheel arm nothing. The guard outlives the cover: the end of the cover does not remove it. `cover-leave` still
  turns the pointer off from its first frame, since by then the page is the visitor's.
- End: an `animationend` event whose target is the cover itself, or the 5500 ms backstop, removes the
  `data-intro` attribute and detaches the listeners.
- Load entrances finish under the cover. Under `:root[data-intro][data-motion="on"]`, load entrances use
  `animation-duration: 1ms` and no delay, so headings are visible when the cover goes.

## 7. Motion and page transitions

Motion is in `app/motion.css`, which is imported first by `app/globals.css`. Every keyframe and every
animated property sits inside `@media (prefers-reduced-motion: no-preference)`. Behaviour hangs on hooks
(attributes), not on class names.

### 7.1 Hooks

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
| `data-lit-scope` | Read by `lib/scroll/pointer.ts` and `app/motion.css` | Scopes the pointer light to an ancestor that stands where the lit sheet rests, so a lifted sheet does not flicker at its lower edge (the Purchase page's contents leaf, the Why Advanta page's toolkit slot, the pop-up's cover and each hero document carry it) |
| `data-folder`, `data-folder-scope` | `Folder`, an element around one | The folder whose sheets rise under the pointer; the scope in which keyboard focus raises them too |
| `data-nav-underline` | `PrimaryNav` | The bar's underline slides to the current link (`translate`, `--time-lift`), and grows when it first appears |
| `data-price-tag` | `PriceTag` | Swings once when first seen (1700 ms, after 240 ms), and its contents again when the folder is hovered (1200 ms) |
| `data-tile` with `data-denied` | `TemplateTile`, `LockedTile` | A locked tile saying no for 600 ms: `tile-shake` (sideways only, five swings from 6px to rest on `ease-in-out`, 440 ms), `denied-ring` (opacity of the well's `::before`, a 2px `--alert` border, 560 ms, fill forwards). They play only where `html[data-motion="on"]`; under reduced motion and without a script the static ring stands for as long as the state does. The tile's outline is never animated, so it stays the focus ring |
| `data-page-dialog` with `data-enter` | `PageDialog` (the pop-up of the catalog and the checkout) | The pop-up rises 14px as the page dims (`dialog-in` 320 ms, `scrim-in`) when a link inside the site opened it |
| `data-checkout-step` with `data-enter`, `data-checkout-progress` | `CheckoutDialog` | A step the visitor moved to settles 10px into place (`checkout-step-in`, `--time-enter`); the line under the bar grows to the current step |
| `data-hero-stage`, `data-hero-doc` | `HeroStage` | The documents land (section 7.7); a document under the pointer or keyboard straightens over `--time-lift` |
| `data-flap`, `data-flap-cell` | `SplitFlap` | A letter of the headline's last word falling to the next: the old top half drops to the split (`flap-fall`, darkening) and the new bottom half comes down from it (`flap-land`), half of `--flip` (240ms) each; the cell's width moves to the new letter's over `--run`, from the moment it flips (section 7.7) |

### 7.2 Entrances

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

### 7.3 Paper, pointer light and tilt

`PaperSheet` renders `[data-paper]` with a grain image (`--grain`) and a radial sheen (`--sheet-light`) on
its `::before`, and a lifted shadow on its `::after`. The `::after` fades in over 420 ms.

With `lit`, the sheet gets `data-lit`. `lib/scroll/pointer.ts` (`trackLight`) runs only where
`(hover: hover)` matches. It ignores touch pointers and writes `--lx` and `--ly` (position, in percent) and
`--tx` and `--ty` (tilt, up to 1.2 degrees) on the sheet under the pointer, with one `requestAnimationFrame`
per frame. On hover the sheet moves up 6 px (`translate: 0 -6px`) and tilts from `--tx` and `--ty`. On keyboard focus within the sheet it moves up 6 px without the tilt. The lift takes `--time-lift` (260 ms).

### 7.4 Figures and tally

- Figures never count or roll. The `#inside` counts and the 90% of the ninety band are printed as plain text
  with their final value, so a reader scrolling past never sees a wrong number. The 90% is `aria-hidden`; the
  heading beside it carries the figure in visually hidden words.
- `Tally` renders blocks. With `animate`, blocks start empty and fill from the left with `tally-fill`, delayed
  by `--time-enter` plus `--i` times `--time-fill-gap`. The blocks are held empty only while `data-io` is
  `armed`.

### 7.5 Page transitions

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
reduce block (section 7.6) cancels the group, old and new animations and hides the old snapshots, so the
change is a plain swap.

### 7.6 Reduced motion and other media

Reduced motion is handled at three levels:

1. The boot script returns early, so `data-motion`, `data-timeline` and `data-intro` are never set. Motion
   hooks in CSS do nothing and `MotionRoot` exits.
2. Every animation and transition rule sits inside `(prefers-reduced-motion: no-preference)`. View
   transition groups under `reduce` have `animation: none !important`, and outgoing views are `display: none`.
3. `app/globals.css` has a global safety net under reduce: animation and transition durations are set to
   `0.01ms` with one iteration.

The boot script reads the media query only at load. The CSS rules follow live changes.

`(prefers-contrast: more)`: the bar gets a 1px ink bottom border, and its shadow is hidden. Sheets get a 1px
solid border and no shadow. `(forced-colors: active)`: tally blocks and focus use system colours.

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
`scrim-in` (the filter sheet), `sheet-up`, `sign-leave`, `tally-fill`, `cover-leave` and `cover-skip`.

### 7.7 The hero

The hero (`components/home/hero.tsx`) is a paper band about as tall as the window. Its headline ends
"from a blank prompt.", and the prompt is only the first of the blanks it names: the last word is a
`SplitFlap` board (`data-split-flap`, decoration, beside a visually hidden "prompt" that the heading is read
with) that turns through prompt, sheet, project, document, plan, design and idea. Where movement is wanted it
turns 3.6s after the stage's clock starts and every 2.6s after its last letter is down; each letter that
changes flips once, straight to its new one (240ms, 45ms after the letter to its left), a letter that stays
does not move, and the highlighter's width follows the word. Before a turn the board measures the room left on its line and passes over a word
that would not fit, so the headline never gains a line ("document" shows only where the line has room). It
holds still while out of sight or in a hidden tab, and under reduced motion or without a script it stands at
"prompt". Centred, top to bottom:
the headline and the lead, two buttons ("Get the toolkit" to `/purchase`, "See the free samples" to
`/catalog?free=1`), the stage and the proof strip. `HeroStage` (`data-hero-stage`) holds the six free samples
as a list of six links (`data-hero-doc`, each named by its template's title and leading to
`/catalog?view=<slug>`), each a lit `TemplateCover` fanned from -9 to 9 degrees and overlapping so that no title
or format tag lies under a neighbour. Where movement is wanted the documents land from 0ms, the middle two
first, 110ms apart and 560ms each (`hero-doc-in`, `hero-doc-show`), on a clock that starts at load or when the
cover of a first visit has gone; under the cover the documents wait out of sight. It plays again on each mount
of the stage. Under reduced motion or without a script the documents stand from the start. Under the
pointer or keyboard focus a document straightens, comes to the front and lifts. Below 40em the six are two hands
of three. From 68em the band's height follows the window's, so the proof strip is above the fold down to a
window 720px tall. The band is as tall as the window leaves (the bar taken off), at most
`--hero-cap`, which is `max(56rem, 57vw)`: 56rem up to a 1600px desktop and then 57% of the window's width, so
a 16:9 and a 16:10 monitor are filled to the fold at any size. On a large monitor the headline grows with the
column (`--hero-type` is `max(--size-hero, --page-max / 16.2)`; `--hero-size` is that, or what 12svh or the
column's own width, in `cqi` of `.heroInner`, a size container, allow if less), the lead with it (a quarter of
the headline), the stage stands `--stage-bleed` past the column on each side so the hand keeps the height the
window gives it, and the proof strip is four fifths of the column where that is more than 64rem.

## 8. Catalog URL state

The catalog's filters, search, sort and page live in the URL. A search URL is the full state of the page.

### 8.1 Parameters

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
| `view` | a template slug | Not a filter: asks for one template (section 8.3). `parseView` takes the first value if it has the shape of a slug, reading mixed case as lowercase (an old `/Templates/Change-Management-Strategy` link keeps its case through the redirect) |

Facet values accept repeated keys and comma-separated lists. They are deduplicated, and unknown values are
dropped silently. `parseCatalogParams` (`lib/catalog/search-params.ts`) returns the criteria.
`serializeCatalogParams` writes `q`, then each facet comma-joined, then `free=1` when it is on, then `sort` only
when it is not the default, then `page` only when it is above 1. Keys appear in that fixed order, and empty
values are omitted. `catalogHref(criteria, view?)` writes the same address with `view` last.

### 8.2 Query

`queryTemplates` (`lib/catalog/query.ts`) returns the matching templates for a page.

- Facets are OR within a facet and AND across facets. The free filter, when on, narrows everything.
- Search splits the query on whitespace. Every term must appear in the title, summary or description.
  Matching is case-insensitive, straight and curly quotes and apostrophes are treated as equal, and regex
  characters are literal. Phase names, apps and audiences are not searched.
- Facet counts are computed with each facet's own selection cleared, so a count shows what ticking that box
  would return. Search, the free filter and the other facets still apply.
- Sort: `samples`, the default, puts the free templates first and then follows the rollout inside each
  group: the section's `order` (folder order, Start here first), then the order the content lists the
  templates in. `phase` is that order alone, with a free sample standing where its section is. Both need the
  phases, so the catalog page passes them as the third argument of `queryTemplates`; without them they keep the
  given order, and a template of an unknown section goes last. `title` sorts by title with `localeCompare`. There is no
  price sort. The select labels them "Free samples first", "Phase order" and "Title A–Z".
- Pagination: `PAGE_SIZE` is 24. The page is clamped to between 1 and the page count (at least 1). The catalog
  page passes the clamped page back into its criteria, so links never point past the last page.

### 8.3 Tiles, locks and the pop-up

The results are a grid of `TemplateTile`s (`TileGrid`), one `<article data-tile>` per template with exactly one
control and no price.

- A free tile (`data-free`) has a "Free sample" tag and its title is a link to `catalogHref(criteria, slug)`,
  stretched over the tile, with `scroll={false}` and `prefetch={false}`. The tiles of the six samples on the
  home page and of a free template on a phase page link to `/catalog?view=<slug>`.
- A locked tile (`data-locked`) has a blurred, desaturated cover with nothing drawn over it; only the cover is
  blurred, the title and summary stay readable. Its control is a `<button>` named "<title>, locked" (`LockedTile`).
  Pressing it sets `data-denied` on the tile for 600 ms (a press while it is set takes it away and puts it
  back) and puts one line in a polite live region under the tile: "Included with the toolkit." with a link to
  `/purchase`. Each press renders that line anew, so it is announced once per press and never stacked. The line
  stands in the row gap (56px), so nothing moves when it arrives. The red is a ring on the cover well, not
  the tile's outline, so a tile that holds keyboard focus keeps its focus ring. Under reduced motion the
  ring and the line remain and nothing moves; under `prefers-contrast: more` and forced colours the blur stays (it is the one mark of a locked tile) and the
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

### 8.4 Controls

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
- Layout of the rail below 68em: a `StepMenu` drop-down, "Jump to a phase", on a row of its own (its button
  names the phase the catalog is filtered on, and that phase's link is `aria-current="true"`, under the same
  rule as the bar's Phases drop-down). Below 40em the search and the
  "Filters" button share the row under it; from 40em the search has its own row with the sort and Filters
  under it. The catalog page renders `SortSelect` twice: once in the rail, hidden below 40em, and once as
  `FilterPanel`'s `sort`, hidden from 40em. Only one is ever displayed. From 68em the drop-down is not displayed:
  the bar's Phases drop-down has the phases.
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
  (the same criteria without `q`), and from 68em a navigation labelled "Browse by phase" shows the 13 sections as
  `PhaseTabs` (below 68em it is not displayed: the drop-down above the sheet is that way in). With a filter on (`hasFilters`: a facet value or the free filter) it is "No templates match
  these filters." with "Clear filters" (or "Clear search and filters" when a term is also set), linking to
  `/catalog`.
- `Pagination` renders links to `/catalog` with the same criteria and the new page. It renders nothing when
  there is one page.

## 9. Test hooks and test contract

### 9.1 Commands

| Command | Runs |
|---|---|
| `corepack pnpm test` | Vitest over `tests/unit/**/*.test.ts` |
| `corepack pnpm test:e2e` | Playwright over `tests/e2e`, after `npm run build && npm run start -- -p 3100` (or reuses a server on port 3100 outside CI) |
| `corepack pnpm typecheck` | `next typegen` and `tsc --noEmit` |
| `corepack pnpm lint` | `eslint .` |
| `corepack pnpm dev`, `build`, `start` | Development server, production build, production server |

Run the scripts in `scripts/` by path, for example `node scripts/check-budgets.mjs <baseUrl>`: `scripts/gen-icon.mjs`,
`scripts/check-budgets.mjs` and `scripts/paper-grain.mjs`.

### 9.2 Attributes used by tests

| Attribute | Where | Meaning |
|---|---|---|
| `data-intro` | `<html>` | `play`, `leave`; absent when done |
| `data-motion`, `data-timeline`, `data-io` | `<html>` | Motion switches (section 7.2) |
| `data-hydrated` | `<html>` | Set by `MotionRoot` in an effect, whatever the motion setting: the client components of the page have their handlers. Browser specs wait for it before pressing a control a script answers (`hydrated(page)` in `tests/e2e/helpers.ts`). It assumes no `loading.tsx` or Suspense boundary around page content |
| `data-intro-cover` | Cover | The cover element |
| `data-seen`, `data-tally`, `data-block` | Motion elements | Entrance and tally state |
| `data-band` | Band | Ground: desk, paper, wash, ink or binder |
| `data-paper`, `data-lit` | Sheets | Paper and pointer light |
| `data-bar`, `data-nav-drawer` | Shell | Bar and drawer |
| `data-step-menu` | `StepMenu` | A Phases drop-down: the bar's, and the catalog's below 68em |
| `data-ledger`, `data-folder` | Lists, folders | Rule and folder |
| `data-portfolio`, `data-price-tag` | Purchase page, home `#toolkit` | The folder object and its tag |
| `data-tile`, `data-free`, `data-locked`, `data-denied` | Catalog tiles | Tile and its state: free sample, locked, saying no |
| `data-well` | Catalog tiles | The well of a tile; its `::before` is the red wash of a denied tile |
| `data-page-dialog`, `data-template-dialog`, `data-checkout-dialog`, `data-enter` | Pop-ups | Any page dialog, whose it is, and that a link inside the site opened it |
| `data-checkout-step` (`details`, `review`, `payment`), `data-order-summary` (`panel`, `disclosure`), `data-order-code`, `data-error-summary`, `data-field-error`, `data-pay` | Checkout | The step in view, the two forms of the summary, the order's code, the summary of a form's problems, an error under a field, and a provider's pay button |
| `data-hero-stage`, `data-hero-doc` | Hero | The stage and a document |
| `data-split-flap`, `data-flap-cell`, `data-flap`, `data-half` | Hero | The headline's turning word, one of its letters, a falling flap and a still half-letter |
| `data-included` | Catalog | The line above the results for a locked template that has no tile on the page |
| `data-nav-underline` | Bar | The sliding underline |
| `data-cover`, `data-format` | Template covers | Format ratio |
| `data-specimen`, `data-mark` | Home page | Specimen and highlighted phrase |

### 9.3 Standing rules

The design gate (`tests/unit/design-gate.test.ts`) scans every file under `app/`, `components/`, `lib/` and
`tests/`, comments included.

- Raw colour values (hex colours of 3, 4, 6 or 8 digits, and `rgb`, `hsl`, `hwb`, `lab`, `lch`, `oklab`,
  `oklch`, `color` and `color-mix` functions) appear only in `app/globals.css` and `app/icon.svg`.
- No stylesheet contains `prefers-color-scheme`, or the word "infinite".
- `@media` queries are limited to the seven forms in section 5.1.
- `@container` appears only in `header.module.css` and `nav-drawer.module.css`.
- Only `components/ui/transition-link.tsx` imports `next/link`.
- `package.json` dependencies are exactly `next`, `react`, `react-dom` and `zod`.
- `<canvas`, `getContext(` and `webgl` (in any case) appear nowhere.
- `requestAnimationFrame` calls are allowed only in `lib/scroll/`, `lib/boot/` and `components/intro/`. The
  scroll string literal is allowed only in `lib/scroll/`.
- The retired folders do not exist.

### 9.4 Unit tests (Vitest)

Each file below is in `tests/unit/`:

| File | Covers |
|---|---|
| `content.test.ts` | The real catalog: phases, counts, no price on any template, exactly six free templates (named), sample flags, copy rules, search, the default order, related templates, the worked example's contents |
| `query.test.ts` | Filters, the free filter, search, the `samples`, `phase` and `title` sorts (no price sort), facet counts, pagination |
| `search-params.test.ts` | URL parsing and serialisation, `free`, `parseView`, `catalogHref`; `clearFiltersHref`, `hasFilters`, and the active-filter chips and their links |
| `nav-links.test.ts` | The phase a page belongs to (`/phases/<slug>`), including the catalog filtered on one phase |
| `worked-example.test.ts`, `into-view.test.ts` | The worked example's contents resolved against the catalog; how far a sideways row scrolls to show an item |
| `scrim.test.ts`, `history.test.ts` | A click closes a dialog only when its press and release were on the dimmed page too; the entry before the current one is an address (parameters in any order), and never when the history cannot say |
| `checkout-schema.test.ts`, `checkout-order.test.ts`, `checkout-steps.test.ts`, `checkout-provider.test.ts` | The checkout: the places and the details schema with its messages; the order schema; the order's code, summary, text and `mailto:`; the step machine and the stored draft; `getPaymentProvider()` answering `null`, `startPayment` against a fake provider, and the Payment step's markup with and without one |
| `validate.test.ts` | Validation errors and sorting; a catalog with 0, 5, 7 or 8 free templates is rejected |
| `coverage.test.ts`, `format.test.ts` | Helpers; `phaseCoverage` (numbered phases only), `numberedPhases`, `adjacentPhases`; `formatPrice(149999, "CAD")` is `$1,499.99 CAD`; `countWord(6)` is `six`; `formatLength(16, "pptx")` is `16 slides` |
| `compounds.test.ts` | Compound splitting for `KeepCompounds` |
| `brand-mark.test.ts` | Logo geometry (the two halves, the seam, the leans, the ink centred), `LogoMark` in one and two inks, and `app/icon.svg` against `scripts/gen-icon.mjs` |
| `boot-script.test.ts` | Runs `BOOT_SCRIPT` against stand-ins for the document, storage and media queries: reduced motion writing nothing, the motion switches, the cover decision against `shouldPlayIntro`, the skip and its click guard, the 5500 ms backstop, and the script's weight |
| `boot-cover.test.ts` | Cover markup (no picture and no canvas, two filled halves, the name and the line under it) and timings (the arm 120 to 620, the leg 620 to 1000 with its squash, the text written by 1400, leave at 2500 with the signature gone before the paper clears, gone 200 ms after an input) |
| `kit-motion.test.ts` | `motion.css` rules: keyframes and animations inside `no-preference`, timeline ordering, hidden states only under `data-motion="on"`, no blurred entrance, the heading's range ending first |
| `kit-grain.test.ts` | Paper grain image format and size |
| `legal.test.ts` | The four legal documents: the routes of `LEGAL_LINKS` in order; no empty section or block; an anchor of its own for every section and subsection; links only to pages and anchors that exist, and to the contact page and the other three; no placeholder text; the wording for set and unset facts (refund window, province, host, audit); the privacy policy names the two session storage keys (`lib/boot/state.ts`, `lib/checkout/draft.ts`) |
| `design-gate.test.ts` | Section 9.3 |
| `smoke.test.ts` | Test runner check |

### 9.5 End-to-end tests (Playwright)

Projects in `playwright.config.ts`:

- `chromium`: Desktop Chrome at 1280 by 800.
- `mobile`: Pixel 7.
- `quiet` and `quiet-mobile`: the tests tagged `@quiet` (paint times read off the page's clock), in the
  same two browsers, one at a time after the projects above.
- `firefox`: runs a subset of specs when Firefox starts on the machine (`PW_FIREFOX=1` or a successful
  `--version` check).

Specs:

| Spec | Projects | Covers |
|---|---|---|
| `browse.spec.ts` | chromium, mobile, firefox | Home to a phase and on to its free sample; the hero to the six samples; the worked example; no horizontal overflow on 8 routes |
| `catalog.spec.ts` | chromium, mobile | The grid of tiles; six free first, the rest locked; the canonical address; no price anywhere; "Free samples only"; the sort options; filters, chips, URL restore, search, phase order and the one filtered phase marked in the drop-down, empty states, malformed parameters, the sort select keeping the picked option while the server answers, Clear all filters clearing in place with focus kept, the phone's rail (the "Jump to a phase" drop-down) and filter dialog, the sheet closing when the window grows to 68em |
| `locked.spec.ts` | chromium, mobile | A locked tile: its button and its blurred cover with nothing drawn over it; the 600 ms denial and its line; Enter and Space; repeated presses; the shake and the red ring; reduced motion; `?view=` a locked template, on the page of results and off it; a phase page's locked tiles; without JavaScript |
| `template-dialog.spec.ts` | chromium, mobile | The pop-up: opening from a tile, its content, Escape, Close and the dimmed page each closing it and keeping the other parameters, Back, focus, a selection dragged out of the pop-up not closing it, a close after an open from the catalog leaving no entry behind (Back leaves the catalog) and one after an open from another page staying on the catalog, values that open nothing, the home and phase tiles, without JavaScript |
| `purchase.spec.ts` | chromium, mobile | The Purchase page: no title block, one `h1` on the folder, and the price once on the tag; the folder and the tally; the ledger; the Checkout link; no questions section, and the contents leaf beside the folder from 68em; 320px; the tag's swing; reduced motion; the home folder |
| `checkout.spec.ts` | chromium, mobile | The checkout: opening from the link and from the address, the summary, Escape, Close, the dimmed page and Back with focus returned, one history entry for all steps, labels and autocomplete tokens, the region control, validation on blur and on submit, the whole walk to the Payment step, no order data in any address or request, the draft surviving a reload, Start over, the phone and 320px layouts, the step's movement, the catalog's pop-up unchanged, and no JavaScript |
| `redirects.spec.ts` | chromium, mobile | The retired addresses (bundles, pricing, cart, about, template pages, the seven old phase pages) end where they should; the 308; `/contact` answering as a page |
| `contact.spec.ts` | chromium, mobile | The Contact page: one section and one band in `main`, one `h1`, the address as the one plain `mailto:` link, no form or field, the four subject links, the fit at 320 and 1920, the footer's link to it; `/about` redirecting to `/why-advanta`, which holds no contact section |
| `legal.spec.ts` | chromium, mobile | The four legal pages: status 200, one `h1`, the page title, the date and the summary; a table of contents whose links are the sections' ids in order, each section headed by one numbered `h2`; no id twice; links to the contact page and the other three, and the current page marked among the policies; no cookie and no storage beyond the site's own session entries; an entry of the contents brings its section into view and lights its number; the three columns from 68em and the measure; the contents first and 44px tall at 320px |
| `hero.spec.ts` | chromium, mobile | The hero: structure and copy, with no backdrop or canvas behind the words; the six documents as links; their pop-ups; the sequence (the box from 700ms for 800ms, the documents from 1300ms, 110ms apart), once on load, again on a return inside the site, and after the cover of a first visit, under which the box stands and the documents wait; the first screen at several window sizes; no title or tag cut by a neighbour and 44px targets; the band's foot; reduced motion; no JavaScript |
| `console.spec.ts` | chromium, mobile, firefox | Twelve routes load with no console error and no page error |
| `header.spec.ts` | chromium only (skips the mobile project) | The banner; Catalog, the Phases drop-down and Why Advanta and the purchase button; centring; the 68em boundary; the sliding underline (under Phases on a phase page); the drop-down's 13 links, Escape and a click outside; the sticky bar; the brand returning to the top on the home page |
| `identity.spec.ts` | chromium, mobile | Design checks in the browser: landmarks; one `h1` per page; root colours and fonts; band values; no canvas, sent or drawn; the home, Why Advanta and catalog pages at rest 5.5 s after they load; the order of the home sections; focus rings; the 365 on the mark; the tiles' covers; no overflow and minimum touch targets at 320 px |
| `intro.spec.ts` | chromium, mobile | The cover on a first visit: its states; the mark held to 2.5 s and gone by 3.4 s; skip on a click, key press (at any time) or wheel; no cover on reload or on other routes; no cover with reduced motion, blocked storage or JavaScript off |
| `menu.spec.ts` | mobile (in chromium every test skips) | The phone bar and drawer: brand, button and Menu at 390 and 320px; the four pages and the 13 phases; Escape, Close, the dimmed page (a drag that ends there does not close it); navigation closing it |
| `motion.spec.ts` | chromium, mobile, firefox | Entrances hidden until scrolled into view, with timelines and without; the ninety band; a page change runs a view transition; a filter change or a pop-up starts none |
| `reduced-motion.spec.ts` | chromium, mobile, firefox | Reduced motion on 13 routes: no motion attributes, no canvas, no running animations, no cover, every entrance in its final state; the 90% figure and the tally show their final state |
| `not-found.spec.ts` | chromium, mobile | 404 status and content for missing paths; lowercase redirect |
| `viewports.spec.ts` | chromium only (skips the mobile project) | The geometry guard: twelve routes (`/`, `/catalog`, `/phases/assess-the-impact`, `/purchase`, `/why-advanta`, `/contact`, `/privacy`, `/terms`, `/refunds`, `/accessibility`, `/sample`, `/nope`) at sixteen window sizes, 320 by 640 to 3840 by 2160 (192 tests): one `h1`, no element past the window's edge, from 1280 up the words span more than half of the window (not on the 404), no console or page error |

`tests/e2e/support/hero.ts` gives the hero specs their helpers, and `tests/e2e/support/intro.ts` records the
states of `data-intro` with the page clock for the cover's specs.

## 10. Budgets

| Budget | Limit | Enforced by |
|---|---|---|
| Gzip size of the first-load scripts of `/` (scripts and inline code, summed) | Baseline plus 12 KiB | `scripts/check-budgets.mjs` against `tests/budgets/baseline.json` |
| Shader chunks (JavaScript containing `#version 300 es`) | None today. The check stays as a guard: 40 KiB gzip in total, and none may be an initial script of `/`, `/why-advanta` or `/catalog` | `scripts/check-budgets.mjs` |
| Boot script | 1536 bytes gzip; must not contain `</script` or `<!--` | `boot-script.test.ts` |
| Paper grain image | 4 KiB | `kit-grain.test.ts` |

`scripts/check-budgets.mjs <baseUrl> [--record] [--pages=...]` needs a running production server, and a
build in `.next/static` for the shader check, which reports none. `--record` writes
`tests/budgets/baseline.json`, which holds the gzip total, the script list, the shader chunks and the shader
total for `/`.

`scripts/paper-grain.mjs` writes `public/paper/grain.png`: a 128 px indexed PNG with four palette entries
from the ink colour at alphas 0, 0.03, 0.06 and 0.09. It fails above 4 KiB.

## 11. Failure modes

| Failure | Behaviour |
|---|---|
| Invalid catalog record | `CatalogError` on first import of `repository.ts`. Every route that imports it fails to render, and the message names the kind, slug and field |
| Unknown phase slug | `notFound()`. The site 404 page renders with the shell; the root 404 renders without it |
| Malformed catalog query | Unknown values are dropped; a bad `page` becomes `1`; an out-of-range page is clamped. The response is 200 |
| `view` that names no template, or a locked one | Nothing opens. A locked template's tile, if it is on the page of results, is rendered saying no; if it is not, a line above the results says the template is included with the toolkit. The response is 200 |
| Checkout | Built up to payment: no provider is connected (`getPaymentProvider()` returns `null`), so the Payment step offers the order by email and nothing can be paid for; the owner mints a licence by hand (section 3.8). Blocked session storage: the draft lasts for the page only |
| No file store configured | Download buttons are hidden; `/api/samples` and `/api/library` answer 503 |
| Licence missing, changed, revoked, or no `LICENCE_SECRET` | `/licence` sets nothing and goes to `/library?link=invalid`; `/api/library` answers 404; `/library` says how to get a link |
| A catalog file the store does not have | The file routes answer 404; `tests/unit/stored-files.test.ts` fails |
| Too many requests from one client | 429 with `Retry-After` |
| Cover cannot start | No cover; the page loads as normal |
| Cover interrupted | Skip, or the 5500 ms backstop unsets `data-intro` |
| Reduced motion | No cover, no motion |
| High contrast or forced colours | Sheets get explicit borders in place of shadows |
| JavaScript disabled | No cover, content readable |
| Narrow phone with a filter open | The filter dialog is a full bottom sheet with its own scrolling body |
| Drawer open across navigation | Closes on the pathname change unless it was opened on that pathname |
