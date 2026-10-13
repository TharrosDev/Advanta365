# Single-purchase redesign

Date: 2026-10-11. Status: awaiting owner review.

## Goal

Advanta365 stops selling templates and bundles one at a time. It sells one thing: the complete
toolkit, for $499.99. The site is cut down around that single sale. The current visual language
(paper, ink, the folder "portfolio") stays; nothing here is a restyle.

Success: a first-time visitor sees what the toolkit is in the hero, can open six free samples, sees
that everything else is locked behind one purchase, and reaches the one Purchase page from anywhere.

## Decisions made with the owner

- Purchase and Catalog are two pages.
- Purchase page: option A, "the portfolio on the desk".
- Home hero: option 4, "blank prompt to finished work".
- Six templates are free samples. All others are visible but locked.
- Pricing, Contact and Cart pages are deleted. Contact merges into About.
- The logo holds longer on the load-in cover.
- The logo gains a small blue "365" on the crossbar's arm.

Decisions made on the owner's behalf (he may overrule any):

- The price is shown in US dollars, as the site formats prices today.
- Checkout is still not built. The Purchase button stays disabled and labelled as coming soon, with
  the contact address beside it. Locked templates are locked for every visitor until a payment
  provider exists. No accounts, no unlock state.
- The six free samples, one per phase for phases 1 to 6: `executive-sponsor-kickoff-deck`,
  `change-management-strategy`, `sharepoint-governance-framework`,
  `sharepoint-end-user-training-deck`, `master-communications-plan`, `go-live-readiness-checklist`.
- The "arm" of the A is the crossbar's overshoot, which is on the right of the letter.
- The favicon keeps the plain A: a "365" there would be about 3px tall.

## 1. Product model

- `lib/site.ts` gains `OFFER = { name: "The complete toolkit", priceCents: 49999 }`. It is the only
  place the price is written.
- Template schema: remove `priceCents`; replace `featured` with `free: boolean`. Validation fails
  unless exactly six templates are free.
- Delete: `content/bundles.ts`, the Bundle schema and its validation, the bundle getters,
  `lib/catalog/pricing.ts`, `lib/cart/`, `components/cart/`, `components/product/purchase-panel.*`,
  `components/catalog/bundle-card.*`, `components/company/bundle-price-table.*`,
  `components/company/ways-to-buy.*`, and the price sort option.
- `phaseCoverage` stays (the portfolio's tally uses it with all templates).
- `formatPrice` keeps cents when they are not zero, so the offer prints as `$499.99`.

## 2. Routes

| Path | State |
|---|---|
| `/` | Kept. New hero; bundles section replaced; featured row becomes the six samples |
| `/purchase` | New. Built from the Bundles page |
| `/catalog` | Kept. Card grid, locks, pop-up via `?view=<slug>` |
| `/about` | Kept. Gains a `#contact` section with the Contact page's content |
| `/sample`, `/phases/[phase]` | Kept. Prices and bundle links removed; phase pages use the new cards |
| `/bundles`, `/bundles/[slug]`, `/pricing`, `/cart` | Deleted. Permanent redirect to `/purchase` |
| `/contact` | Deleted. Permanent redirect to `/about#contact` |
| `/templates/[slug]` | Deleted. Permanent redirect to `/catalog?view=<slug>` |

Redirects live in `next.config.ts`.

## 3. Purchase page

One `Folder` at page scale, centred on a paper band.

- Tab: "The complete toolkit". Sheets (real template covers) stand out of the top.
- A paper price tag hangs from the folder's corner on a string: `$499.99`, "one purchase". It
  swings once when it arrives and on hover; still under reduced motion.
- Hover or focus lifts the cover and fans the sheets (the existing folder behaviour, enlarged).
- Below: the seven-block phase tally, all filled; one "what is inside" ledger from `TOOLKIT`
  (59 playbooks, 130 templates, 4 field guides, 58 job aids, training for three audiences); the
  Purchase button (disabled, "Checkout coming soon") and the contact address.
- Then the licence and buying questions from the old pricing page (`FaqList`), with every answer
  about single templates and bundles rewritten or removed.
- The page states that the catalog shown is sample content, as the beta rule requires.

## 4. Catalog

- Title block and left rail (search, sort, filters) unchanged, minus the price sort. A new filter:
  "Free samples only".
- Results: a responsive grid of small cards. Each card is an `<article>` with one control: the
  cover (`TemplateCover`), the title, phase and type, the format tag. No price.
- Free card: a "Free sample" tag. It is a link to `?view=<slug>`, keeping the other parameters.
- Locked card: the cover is blurred; a chain crosses it with a padlock at the centre. It is a
  `<button>` named "<title>, locked". Activating it:
  - sets a `data-denied` state for 600 ms: red outline pulse (`--alert`), a horizontal shake of the
    card, a sharper rattle of the padlock;
  - shows a line under the card, announced politely: "Included with the toolkit." with a link to
    `/purchase`;
  - under reduced motion: the red outline and the line, no movement.
  Locked titles and summaries stay readable; only the cover is blurred.
- Pop-up: a native `<dialog>` opened with `showModal()` when `view` names a free template. Large
  cover, title, summary, description, the fact list (phase, step, type, format, length), "includes",
  and a button to `/purchase`. Closes on Escape, the Close button and a backdrop click; closing
  removes `view` from the URL, and Back closes it. `view` naming a locked or unknown template opens
  nothing and, for a locked one, plays that card's denied state.
- Without JavaScript, a free card's link renders the same content open on the page.
- The same cards and pop-up are used on phase pages and for the six samples on the home page.

## 5. Home hero: blank prompt to finished work

A full-width paper band about as tall as the window; the old empty right-hand column is removed.

- Headline (unchanged words, `h1`), lead and two buttons, centred: "Get the toolkit" (to
  `/purchase`) and "See the free samples" (to `/catalog?free=1`).
- Under them, the stage: an empty prompt box with a blinking caret.
- Sequence, once per page view, starting when the cover is gone:
  1. The box stands empty for a moment, its caret blinking.
  2. The box dissolves.
  3. Where the box stood, the six sample documents stand fanned and lit, their own titles on their
     covers, settling one after another.
- Each document opens its pop-up (links to `/catalog?view=<slug>`).
- A proof strip on the band's bottom edge: 30+ years, 59 playbooks, 130 templates, one purchase.
- Reduced motion or no JavaScript: the fanned documents show from the start; no box.
- Below 40em the documents are a short overlapping row; the box is narrower.

Rest of home: the featured section lists the six samples; `BundlesSection` becomes one portfolio
section (the folder, the price, a link to Purchase); other sections keep their content with prices
and bundle mentions removed.

## 6. Navigation bar

Three zones on one row from 68em:

- Left: the brand lockup with the new mark.
- Centre: Catalog and About, spaced wider, with one ink underline that slides to the current link.
- Right, where the cart was: a solid button, "Get the toolkit · $499.99", to `/purchase`. On
  `/purchase` it is marked current and not repeated as a call to action.

Below 68em: brand, the same button without the price, Menu. The drawer lists Purchase, Catalog,
About, the phases and the contact address. The phase rail stays. The footer loses Cart, Bundles,
Pricing and Contact links and gains Purchase.

## 7. Logo

`lib/brand/mark.ts` gains the three digits as path data, sitting on top of the tail
(x 18.5 to 31, baseline on the stroke's top edge), drawn in the tail's ink (the mark blue). The
viewBox widens if needed so nothing clips. `LogoMark` draws them in `tone="two"` unless
`digits={false}`. The bar's mark is enlarged so the digits are at least 7px tall. `app/icon.svg`
is unchanged. The cover draws the digits last, after the tail.

## 8. Load-in

Today the mark finishes drawing at 800 ms and the cover starts leaving at 1200 ms.

| | Now | New |
|---|---|---|
| Mark drawn | 120 to 800 ms | 120 to 800 ms, digits 800 to 1000 ms |
| Mark held, fully drawn | about 400 ms | about 1500 ms |
| Cover leaves | 1200 to 1650 ms | 2500 to 2950 ms |
| Backstop | 4500 ms | 5500 ms |

Skip on any input stays. The hero sequence starts when the cover is gone.

## 9. Documents and tests

- `PRODUCT.md`, `DESIGN.md`, `README.md`, `docs/architecture.md`, `docs/design-system.md`,
  `docs/testing.md` updated to the single-purchase model. The owner's memory note on the business
  is updated too.
- Unit: content (six free, no prices), validation, query (free filter, no price sort), format,
  boot script, brand mark, design gate.
- E2E: cart specs deleted; new specs for redirects, the locked card (state, message, keyboard,
  reduced motion), the pop-up (open, three ways to close, URL, Back), the nav bar, the hero's rest
  state, the cover timings.
- Gates: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, budgets. Runtime dependencies
  stay `next`, `react`, `react-dom`, `zod`.

## Out of scope

Checkout, payment, accounts, real unlocking, downloadable files, real catalog entries, dark mode.
