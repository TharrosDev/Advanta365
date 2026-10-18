# Design records

The files in `specs/` and `plans/` are dated records of how three pieces of work were designed and
planned. Each was written before the work and has not been edited since, so each describes the
site as it was meant to be on that day. They are kept for the reasoning and the decisions made
with the owner, not as a description of the site today. For how the site works now, read
[`../architecture.md`](../architecture.md), [`../design-system.md`](../design-system.md) and
[`../testing.md`](../testing.md).

| Record | Status |
| --- | --- |
| [Single-purchase redesign](specs/2026-10-11-single-purchase-redesign-design.md) and [its plan](plans/2026-10-11-single-purchase-redesign.md) | Built, then much of it replaced (see below). |
| [Template file delivery](specs/2026-10-13-template-file-delivery-design.md) and [its plan](plans/2026-10-13-template-file-delivery.md) | Built. The library page was dropped later. |
| [The toolkit's real folders as the site's phases](specs/2026-10-17-real-folder-phases-design.md) | Built. Two parts changed later. |

The status lines inside the files ("awaiting owner review") and the unticked boxes in the plans are
as they were written. They do not mean the work is open.

## Single-purchase redesign (2026-10-11)

Still true: one offer (`OFFER` in `lib/site.ts`), the six free samples, locked tiles that say
"Included with the toolkit.", the `?view=` pop-up, the "Free samples only" filter, the redirects
from the retired bundle, pricing, cart and template addresses, and the hero's two buttons and proof
strip.

Replaced since:

- The price is $1,499.99 CAD, not $499.99 USD.
- The disabled "Checkout coming soon" button is now a checkout in a pop-up, built up to payment.
- The Purchase page has no questions section.
- Contact is its own page (`/contact`), and the About page is now Why Advanta (`/why-advanta`),
  rebuilt around one answer.
- The "365" on the logo and the load-in timings gave way to the two-tone ribbon "A" and a new
  cover.
- The hero's blank-prompt box is gone: the headline's last word is a split-flap board, with a
  Pause control.
- The bar is Catalog, Roadmap and Why Advanta, and the seven phases are now thirteen sections.
- Unlocking and downloadable files, out of scope then, were built by the file delivery work.

## Template file delivery (2026-10-13)

Still true: file records on templates, the `FileStore` seam with a local-disk driver, signed
licences, the rate limits, the security headers, the privacy policy's wording and
`scripts/mint-licence.mjs`.

Replaced since: the `/library` page and its components were removed. `/licence` now goes to
`/catalog` (or `/catalog?link=invalid`), and a licence unlocks the tiles of the catalog and the
phase pages in place. `components/catalog/file-downloads.tsx` from that work remains. Still not
built: the payment webhook, a production file store and a download log.

## The toolkit's real folders as the site's phases (2026-10-17)

Still true: the thirteen sections in folder order, numbers 1 to 11, the redirects from the seven
old phase addresses, "Phase N of 11", "Before phase 1" and "Alongside phases 1 to 11", the phase
cards and the "Jump to a phase" drop-down.

Replaced since: the bar's "Phases" drop-down is called "Roadmap", and the line of eleven phases on
Why Advanta went with that page's rebuild, so a phase's `label` is no longer shown anywhere.
