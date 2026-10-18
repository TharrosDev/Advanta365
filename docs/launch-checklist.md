# Before public launch

What has to be settled before the site takes its first sale. The first five items come from the
owner's pitch and messaging document (2026-10-10), in the owner's words; the second is given without
the names it lists. Under each item is where the site stands today. The rest are about the site
itself. None of this is legal advice.

Tick an item here, in the same change that settles it.

## From the pitch and messaging document

- [ ] **Prosci wording.** Prosci and ADKAR are Prosci's trademarks. "Built by a Prosci-certified
      practitioner" describes the owner, which is fine if the certification is current.
      "Prosci-aligned" or "Prosci-approved content" suggests an endorsement Prosci hasn't given.
      Keep Prosci on the person, not the product, and check Prosci's trademark-use guidance at
      prosci.com.
  - On the site: Prosci appears only as "built by a Prosci-certified practitioner" and the
    footer's non-affiliation and trademark notice; the design gate (`tests/unit/design-gate.test.ts`)
    fails on any other line that names Prosci. ADKAR appears in no visible copy; the `adkar` field
    on a template is data and is not rendered.
- [ ] **Old product branding.** Client references (department names and terms, client platform
      names) were removed from the source material. The earlier product name is now Advanta365
      throughout, and the content for the other earlier product and for the provisioning tool has
      been removed. One government platform name stays only in labelled government examples.
  - On the site: none of these names appears. This page does not spell them out either; the
    list is the `banned` pattern in `tests/unit/content.test.ts`, which checks every phase and
    template text. Run the same search over the real files before they are offered.
- [ ] **Ownership of the source material.** Confirm which files were rebuilt from the owner's own
      know-how and which began as client deliverables under contract. Only the first group is
      clearly the owner's to sell.
  - On the site: nothing to change until this is settled. It decides which real entries may
    replace the sample catalog.
- [ ] **"30+ years" and "used with real clients."** Both are true. Keep the wording general
      ("refined across client rollouts") rather than suggesting named clients endorse it.
  - On the site: the experience is always written "30+ years", and no client, department or
    platform is named. Public-sector copy says "proven in Canadian public-sector environments" and
    does not claim a bilingual or French product (the job aids are English only today).
- [ ] **Counts on the site.** 59 / 130 / 4 / 58 (playbooks, templates, field guides, job aids)
      match the folder as of the date of that document.
  - On the site: the counts are read from `TOOLKIT` in `lib/site.ts`. Recount the folder before
    launch and change them there ([`content.md`](content.md#toolkit-counts)).

## The site

- [ ] **The worked example's file.** `/sample` describes the Meridian Group worked example and
      says its file cannot be downloaded in this beta. It needs the real file, and its real table
      of contents: `content/worked-example.ts` lists placeholder sections (the pieces `/sample`
      names; a free sample links to its template in the catalog, a locked template is named in
      plain text with no link, and a phase links to its page) that the page marks "Placeholder";
      replace them and set `placeholder` to false. The sample catalog also lists the worked example
      as a locked template; decide whether it is a free sample, a product, or both.
- [ ] **Why Advanta copy and cost estimates.** The costs of the two alternatives on Why Advanta
      (8 to 14 person-months, $150K to $400K per rollout) were carried over from the earlier page
      as the owner's estimates and are labelled Estimate; confirm or replace them in
      `components/about/compare-section.tsx`. The three reasons
      (`components/about/reasons-band.tsx`) restate "built, delivered, revised and re-delivered"
      and "reuse on every wave", which rests on the licence terms; the owner should read them.
- [ ] **Legal pages.** `/privacy`, `/terms`, `/refunds` and `/accessibility` are owner-drafted
      and written from what the code does today; a lawyer should read all four before the first
      sale. The facts and decisions they need are the one object `LEGAL` in `lib/legal/facts.ts`,
      and a page says only what is true without a value that is still `undefined`. Open: the
      seller's legal name with its suffix (`entity`, now the bare company name) and postal address
      (`address`); the governing province (`governingProvince`); the refund window in days
      (`refundWindowDays`) and whether the default policy stands (an order not yet downloaded is
      refunded, a faulty or misdescribed file is replaced or refunded, otherwise final after
      download); whether consultants may use the toolkit for clients (`clientWorkAllowed`, now
      no); a named privacy contact (`privacyContactName`); the host (`hostingProvider`, now
      "Vercel", to confirm); the date (`effectiveDate`), to move on every change to the pages; and
      an accessibility audit (`accessibilityAuditDate`). Also to confirm: that the licence is
      perpetual and for one organization, that sales tax is added before payment, and that
      liability is capped at the price paid.
  - On the site: the privacy policy describes what is there now (one cookie, for buyers only;
    Vercel Web Analytics and Speed Insights, which set no cookie; two session storage entries, the
    checkout's draft among them; and contact by email) and keeps what is planned for the checkout
    under "When checkout opens" without naming a processor. Rewrite that part, and the refund
    policy's last section, when a payment provider is connected. `tests/unit/legal.test.ts`
    checks the wording for set and unset facts.
- [ ] **Checkout.** It is built up to payment. Connect a payment provider
      ([`architecture.md`](architecture.md#37-checkout-and-the-payment-seam), section 3.7), and
      have its webhook mint the licence (`signLicence`) and email the link. Until then the Payment
      step offers the order by email, and the owner mints each link by hand
      ([`operations.md`](operations.md#issuing-a-licence)).
- [ ] **A production file store.** Only the local-disk driver exists, and on Vercel a function
      cannot answer with more than 4.5 MB. Add a driver that signs short-lived addresses (R2 or
      S3), set `LICENCE_SECRET` in the host's settings, and run the stored-files check against the
      real files ([`operations.md`](operations.md#checking-the-real-files)).
- [ ] **"Not downloaded" in the refund policy.** The site keeps no record of downloads, so it
      cannot tell whether an order's files were downloaded, which is the test the refund policy
      uses. Decide whether to keep a download log or change the policy's wording.
- [ ] **Firewall rule.** Add a Vercel Firewall rate-limit rule on `/licence` and `/api/`
      ([`operations.md`](operations.md#rate-limits)).
