# Product

<!-- impeccable:product-schema 1 -->

<!--
How this record was made (2026-10-11): the owner delegated the init interview ("Answer the
questions for me"). Facts come from his pitch and messaging document (2026-10-10), what he said in
session, and the repository (README.md, lib/site.ts, the pages under app/(site)/, docs/). Anything
marked "(inferred)" was decided on his behalf and is waiting for his confirmation. Unmarked lines
are stated by the owner or are the state of the code.
-->

## Platform

web

## Users

Advanta365 is bought by people responsible for a Microsoft 365 or SharePoint Online rollout. The
owner names five buyers and what each cares about:

| Buyer                                     | What they care about                                     |
| ----------------------------------------- | -------------------------------------------------------- |
| Change management leads and practitioners | Saving time, looking credible                            |
| IT and M365 project managers              | Hitting cutover dates, avoiding a rollout no one uses    |
| IM and records leads                      | Governance, metadata, avoiding a mess of duplicate sites |
| CIOs and sponsors                         | Return on the M365 investment, risk                      |
| Public sector and Crown corporations      | Governance, accountability (Canadian public sector)      |

- **Primary user (inferred):** the change management lead or practitioner. The pitch lists the five
  buyers without ranking them; this one is listed first and is the person who opens, adapts and
  delivers the files.
- **Situation (inferred):** they are in the middle of a rollout, under deadline, and need a specific
  deliverable for the phase they are on (a business case, a comms plan, a cutover playbook, training).
  They arrive from a working desk, on a desktop or a phone, and are weighing the toolkit against two
  alternatives: building it themselves with AI, or hiring a consultant.
- **Job:** get a credible, complete starting point they can adapt the same day, instead of starting
  from a blank prompt.
- The audiences _inside_ the content are different from the buyers: training exists for end users,
  Site Owners and IM Representatives, and templates are tagged for sponsors, change leads, people
  managers, end users, Site Owners, IM Reps and IT admins.

## Product Purpose

Advanta365 sells field-tested change management and user adoption content for Microsoft 365 and
SharePoint Online. It is a product of EchoFive. This repository is its storefront.

- **Mission:** help every organization moving to Microsoft 365 get real adoption, not just a launch.
- **Why it exists:** every rollout needs the same core pieces, and organizations keep paying to
  reinvent them. The toolkit is what was built, delivered, revised and re-delivered with real clients.
- **The promise:** it gets an organization 90 percent of the way there before AI or a practitioner
  finishes the last 10 percent.
- **Success for the buyer:** users who want the change, not users who were told to comply; a rollout
  that is used, not just launched.
- **Success for the storefront (inferred):** a visitor understands what the toolkit holds, believes
  it comes from real delivery, tries the free samples for the phase they are on, and buys the
  complete toolkit or gets in touch. Until a payment provider is connected, an order sent by email
  from the checkout, or getting in touch, is the only completed outcome the site can produce.

## Positioning

Tagline: "Don't start from a blank prompt."

- The content has met real users, sponsors and skeptical records managers. It was refined across
  client rollouts over 30+ years by a Prosci-certified practitioner. AI output is plausible but
  unproven; a consultant's playbook is proven but rented.
- It is built to be fed into AI tools. The judgment is already in the material; AI or a practitioner
  handles the tailoring. Advanta365 is the starting material for AI, not a competitor to it.
- It is complete: the whole rollout lifecycle from making the case through sustainment, plus training,
  a worked example and Copilot readiness material.
- "Proven experience at a template price": one purchase, files the buyer keeps and adapts, reused
  across every wave.
- SharePoint-first out of the box. The change management core applies to almost any technology
  rollout.

## Operating Context

- **The toolkit:** 59 playbooks, 130 templates, 4 field guides, training for three audiences (end
  users, Site Owners, IM Representatives) with 58 job aids, a worked example, and Copilot readiness
  material. The counts live in `TOOLKIT` in `lib/site.ts` and describe the whole toolkit, not the
  number of catalog listings.
- **Rollout phases:** the catalog is organized in seven phases in rollout order (Make the case, Plan,
  Design, Prepare, Communicate, Execute, Sustain), two steps each. Buyers find content by the phase
  they are on.
- **Files:** templates are editable Word, PowerPoint and Excel files, with a few print-ready PDFs.
  Buyers edit them by hand or feed them to their AI tools.
- **Microsoft 365 products covered:** SharePoint, Teams, OneDrive, Outlook and Copilot.
- **Ways to buy:** one: the complete toolkit, $1,499.99 CAD, a single purchase. The price is the owner's
  decision. It is set and shown in Canadian dollars, and always printed with its code ("CAD") so it
  cannot be read as US dollars. Six templates, one for each of the first six phases, are free samples. Every
  other template is listed in the catalog and locked until the toolkit is bought. Templates are not
  sold one at a time and there are no bundles.
- **The worked example:** a full change management strategy for the fictional Meridian Group, an
  organization of about 10,000 employees, showing how the pieces fit together.
- **Alternatives the buyer weighs:** build it yourself with AI, or hire a change management
  consultant.
- **Public-sector buying:** government buyers ask about purchase orders, invoicing and licensing for
  the organization.
- **Devices:** desktop and phone.

## Capabilities and Constraints

What the storefront does today:

- A home page whose first screen answers the tagline with the six free samples, shown as finished
  documents.
- Browse a catalog by phase, deliverable type, app, audience and format, with search, a "Free samples
  only" filter and a sort (free samples first, phase order, or by title). The filters that are on show as
  removable chips above the results, and a search that finds nothing names itself and offers the seven
  phases. Catalog state lives in the URL, so every view can be shared. The six free samples open in a pop-up (from the catalog, a phase page or the home
  page); every other template shows a locked cover and answers a press with "Included with the
  toolkit."
- One Purchase page (`/purchase`): the toolkit as a folder with its price on a tag and, beside it from
  68em (under it below), a contents leaf: what is inside, the Checkout button, the way to write to us
  (for a purchase order, or a question) and the note that the catalog is sample content. The page has
  no title block: it opens on the folder. There are no questions on the page. There is no cart and no
  pricing page. The old addresses of those pages, of the bundle
  pages and of the template pages redirect.
- A checkout, in a pop-up over the Purchase page (`/purchase?checkout=details`), in three steps beside
  an order summary that is always in view (the toolkit, what it holds, the price in Canadian dollars,
  tax "calculated at payment", the total before tax): the buyer's details (name, work email,
  organization, country, region, an optional purchase order number and note), a review with agreement
  to the Terms and the Refund policy, and payment. No payment provider is connected, so the last step
  says so, shows the order with its reference, and offers to send the order by email (so the owner
  can invoice) or to copy it.
- A Why Advanta page (`/why-advanta`; it was About, and `/about` redirects to it): the 90 percent
  promise, how the toolkit was made, the five buyers, the comparison of
  alternatives (`#compare`) and a plain note on the state of the site (`#state`).
- A Contact page (`/contact`): one section with the one email address (`hello@advanta365.com`) as a
  link that starts an email, and what to write about (questions before buying, purchase orders and
  invoices, licence questions, accessibility feedback). It has no form, promises no reply time and
  names no other channel.
- A sample page with the worked example's
  table of contents (placeholder sections, labelled as placeholders, until its file is published).

Constraints future work must respect:

- **The catalog is sample content.** Phases, steps and templates are placeholders, and the site says
  so in plain words where a visitor meets them, not in a banner: the footer's status line, the note
  on the Purchase page, the "Free sample" tags, the line under the catalog's result count and the
  note on the state of the site on Why Advanta (`#state`). No page may imply that the catalog lists the
  full toolkit. The price is written once, in `lib/site.ts`, and printed from there.
- **Checkout stops at payment.** No payment provider is connected: the checkout takes an order as far
  as the Payment step, which says so and offers the order by email. Nothing can be paid for on the
  site yet, locked templates stay locked for every visitor, and there are no accounts. The seam a
  provider plugs into is `lib/checkout/provider.ts` (docs/architecture.md, section 3.7).
- **An order never leaves the browser on its own.** There is no backend. The checkout keeps the order
  in the tab's session storage, never writes it into an address, sends it nowhere, and asks for no
  card details of any kind.
- **The worked example's file cannot be downloaded yet.**
- **English only.** The job aids are English only today. No bilingual or French claim.
- **Runtime dependencies are fixed** at `next`, `react`, `react-dom` and `zod`; the design gate in
  `pnpm test` fails if that list changes.
- **Light scheme only.** The site sets `color-scheme: light` and has no dark mode.

Terminology: "playbooks", "templates", "field guides", "job aids", "phases" and "steps"; "the
complete toolkit"; "free samples"; "Site Owners" and "IM Representatives" (IM Reps); "user adoption";
"M365" as the short form of Microsoft 365; "30+ years".

Decided: the toolkit is sold as one purchase at $1,499.99 CAD.

Explicitly undecided:

- Licence terms. The stated intent is one licence per organization, reused across every wave.
- Whether buyers receive updates, and how.
- Purchase orders and invoicing for government buyers (planned, not available).
- Whether the worked example is a free sample, a product, or both. (The six free samples are one
  template for each of the first six phases; the worked example is not among them.)
- Which source files are the owner's to sell (rebuilt from his own know-how, as opposed to client
  deliverables under contract). This decides which real entries may replace the sample catalog.
- The payment provider, and how a paid order is fulfilled (where orders are recorded, how the files
  are delivered).

## Brand Commitments

- **Names:** Advanta365, "a product of EchoFive". Contact: `hello@advanta365.com`.
- **Tagline:** "Don't start from a blank prompt."
- **Voice:** plain, practical, credible, experienced. No hype.
- **Prosci describes the practitioner, never the product.** "Built by a Prosci-certified practitioner"
  is allowed. "Prosci-aligned", "Prosci-approved" or anything that suggests endorsement is not. ADKAR
  does not appear in visible copy.
- **Say "30+ years".** Keep the wording general ("refined across client rollouts").
- **Never name clients**, departments or client platforms. Public-sector proof is worded "proven in
  Canadian public-sector environments".
- **No bilingual claim.**
- **Non-affiliation notice:** the site states that Advanta365 and EchoFive are independent of, and
  not endorsed by, Prosci Inc. or Microsoft Corporation, and credits their trademarks.
- **Cost figures for the alternatives in the comparison are the owner's estimates** and are labelled
  as estimates, not market data. The toolkit's own cost cell prints the one price, from `OFFER`.
- **Spelling (inferred):** Canadian English, as the existing copy uses ("organization", "licence",
  "colour"). Copy uses typographic quotes and no exclamation marks.

Visual constraints the owner stated in session. They are recorded as he gave them and not expanded;
visual decisions belong to later design work, not this file.

- Palette: white, black and light blue. He rejected yellow. He rejected royal blue because black text
  on it is hard to read.
- He does not want motion behind the words: it distracts from them.
- He likes the load-in animation.
- The bar: "ultra realistic, high polished", "engineered to be amazing". Not "standard cards", and not
  "a simple coded site anybody could make". When offered choices: "decide and go big".

## Evidence on Hand

Real and usable:

- The toolkit counts (59 / 130 / 4 / 58, three training audiences), in `lib/site.ts`. They matched
  the source folder on 2026-10-10 and need a recount before launch.
- 30+ years of client delivery by a Prosci-certified practitioner (valid while the certification is
  current).
- Proven in Canadian public-sector environments.
- The worked example (Meridian Group, fictional, about 10,000 employees), described on `/sample`.
- Copilot readiness material: Copilot readiness, a Copilot rollout playbook and a Copilot change
  impact assessment.
- The comparison of alternatives on `/why-advanta#compare`, with the owner's cost estimates for the
  alternatives and the toolkit's one price.
- The messaging already written into the pages under `app/(site)/` and `components/home/` and
  `components/about/`.
- The pre-launch checklist: "Before public launch" in `README.md`.

Absent. Future work must not fabricate any of these:

- No testimonials, client names, logos, case studies, press or endorsements.
- No adoption metrics, benchmarks or outcome statistics from real rollouts.
- No real catalog entries or published licence terms.
- No downloadable sample file and no product screenshots or previews of real documents.
- No named author. The practitioner is described, not named, on the site.

## Product Principles

Derived from the answers above (inferred as a set; each rests on a stated fact).

1. **Proof before polish in what is claimed.** Every claim traces to real delivery. Where proof is
   absent, say less instead of inventing it.
2. **Honest about its state.** Sample content is labelled as sample, the beta as a beta, estimates as
   estimates, and what is not built as not built. The labels are plain words in the place a visitor
   meets the thing (the footer's status line, the Purchase page's note, the "Free sample" tags, the
   note under the catalog's result count and the Why Advanta page's note on the state of the site),
   not a
   banner above the page.
3. **Meet the buyer at the phase they are on.** People arrive with one deliverable in mind. The
   rollout phases are the map, and the way to the right piece should be short.
4. **A starting point, not a finished answer.** The toolkit does 90 percent; the buyer, with AI or a
   practitioner, finishes it. Present the content as theirs to adapt.
5. **Experienced, not loud.** The authority comes from plain, practical language. Hype undercuts the
   credibility the product is selling.

## Accessibility & Inclusion

- **Standard (inferred):** WCAG 2.x level AA. The owner has not named a standard. The existing site
  already holds body and heading text to 4.5 : 1 and control borders to 3 : 1, and the public-sector
  and Crown corporation buyers make an accessible site part of being credible to them.
- **Legibility is a stated owner requirement:** he rejected a colour because text on it was hard to
  read.
- All motion is optional. Under reduced motion, raised contrast, forced colours or no JavaScript,
  the site stays complete, and under reduced motion nothing moves by itself.
- Keyboard use, visible focus, a skip link, one `h1` per page, labelled navigation, and targets of at
  least 44px on phones are the floor the site already keeps (`docs/design-system.md`, section 12).
- English only today.
