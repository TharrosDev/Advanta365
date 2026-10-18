# Catalog content

The catalog in this repository is sample content: its sections follow the toolkit's real folders, and
its templates are placeholders that the site labels as a beta. This page covers how the records are
shaped, how they are checked, and every place to change when the real records replace them. The
schema and the repository are described in [`architecture.md`](architecture.md#3-content-validation-and-data-flow).

## Contents

- [The sections](#the-sections)
- [Replacing the sample content](#replacing-the-sample-content)
- [Toolkit counts](#toolkit-counts)
- [Words written by hand](#words-written-by-hand)
- [Tests that pin the sample catalog](#tests-that-pin-the-sample-catalog)

## The sections

The catalog has 13 sections, one for each of the toolkit's folders 00 to 12, in folder order: Start here
(`start-here`); then eleven numbered phases, Define the change (`define-the-change`), Assess the impact
(`assess-the-impact`), Set the strategy (`set-the-strategy`), Engage leaders (`engage-leaders`), Plan
communications (`plan-communications`), Design the platform (`design-the-platform`), Plan the training
(`plan-the-training`), Build the training (`build-the-training`), Deliver training (`deliver-training`), Go
live and support (`go-live-and-support`) and Make it stick (`make-it-stick`); and last Used at every step
(`used-at-every-step`). Start here and Used at every step have no number.

## Replacing the sample content

1. **Phases.** Edit `content/phases.ts`. Each section has a slug, a plain `name` (menus, lists, the
   catalog), a summary, an `order` (its folder's number, 0 to 12) and, on the numbered phases only, a
   `number` (1 to 11). Slugs are lower-case words joined by hyphens. The tally of the phases on the Purchase page and in the home
   portfolio follows the numbered phases by itself; the word "eleven" in the copy does not (see
   [Words written by hand](#words-written-by-hand)).
2. **Templates.** Each section has one file in `content/templates/`, named by its slug
   (`start-here.ts` to `used-at-every-step.ts`). `index.ts` joins them in folder order. A template gives
   its phase, deliverable type, apps, audiences, format, ADKAR stages (`adkar`, stored and not shown),
   an optional page count (shown as slides for a PowerPoint deck and pages for every other format), what
   it includes, `free` (true for a free sample) and `files`, the files it is delivered as (an id, the
   name the buyer saves, the store key, the size and the SHA-256; [`operations.md`](operations.md#files-and-licences)).
   Real records are written out in full with `isSample: false`, and a real record must list at least
   one file. The `sample()` helper in `content/templates/sample.ts` adds `isSample: true` (and
   `free: false` unless the entry says otherwise) and belongs only in the sample files. There is no
   price on a template: the one price is `OFFER` in `lib/site.ts`.
3. **Free samples.** Exactly six templates have `free: true` (`FREE_SAMPLE_COUNT` in
   `lib/catalog/validate.ts`). In the sample catalog each is in a different phase; that is a convention,
   and validation checks only the count. They are the six on the home page, the ones that open in the
   pop-up for anyone, the covers in the folder on the Purchase page, and the only files
   `/api/samples` serves.
4. **Validation.** `lib/catalog/repository.ts` validates the catalog when it loads. `pnpm test` and
   `pnpm build` fail with the record and field named if a record is invalid, a slug repeats, a template
   names a phase that is missing, the phase numbers do not run 1, 2, 3 and on in order, the number of
   free templates is not six, a file key or id repeats, or a real record has no files.
5. **Files.** Put the real files in the store and check them against the records before they are
   offered ([`operations.md`](operations.md#checking-the-real-files)).
6. **The worked example.** It is the fictional Meridian Group. The name appears in
   `app/(site)/sample/page.tsx`, `app/(site)/sample/opengraph-image.tsx`,
   `content/templates/start-here.ts`, `content/worked-example.ts` and `lib/seo/llms.ts`.
   `content/worked-example.ts` holds the example's table of contents on `/sample`: placeholder
   sections, labelled as such on the page, until the real file is published; then replace them and set
   `placeholder` to false. The example's 10,000 figure also appears in `app/(site)/sample/page.tsx`,
   `app/(site)/sample/opengraph-image.tsx`, `components/home/inside-section.tsx`,
   `components/home/pitch-spread.tsx` and `lib/seo/llms.ts`.
7. **Home page.** The home page is the `sections` array in `app/(site)/page.tsx`, top to bottom: the
   hero, `#featured`, `#inside`, `#toolkit` and `#solution`. Reordering the page means reordering that
   array. The specimen in `#inside` shows the first free sample. The hero's documents, `#featured` and
   the covers in the folder of `#toolkit` are the six free samples. The phase coverage in the folder
   comes from `phaseCoverage()` in `lib/catalog/coverage.ts`.

## Toolkit counts

`TOOLKIT` in `lib/site.ts` holds the counts for the whole toolkit: playbooks, templates, field guides,
job aids, training audiences and years of experience. They describe the whole toolkit, not the number
of catalog listings, and no page may imply that the catalog lists that many. Pages, the shared-link
cards, the structured data and `llms.txt` read them from there; the Purchase page's "What is inside"
ledger and the hero's proof strip among them.

Two of them need a second edit:

- `trainingAudiences` is a word (`"three"`), because copy prints it. `components/purchase/contents-leaf.tsx`
  maps it to a figure with a typed table (`AUDIENCES`), so a new value needs a row there too; the
  compiler says so.
- `experience` is set in sentences: the hero lead (`components/home/hero.tsx`), the first reason on Why
  Advanta (`components/about/reasons-band.tsx`), the Why Advanta page's description, the shared-link
  cards (`app/opengraph-image.tsx`, `app/(site)/why-advanta/opengraph-image.tsx`) and
  `lib/seo/llms.ts`. Read those sentences again after a change.

## Words written by hand

Nothing on a page reads `isSample` (only the unit tests call `hasSampleContent()`), so nothing changes
by itself when the real records arrive. Edit each of these by hand.

**The sample labels:**

- the catalog's metadata description and the line under its result count
  (`app/(site)/catalog/page.tsx`);
- the "Browse the sample catalog" link on the home page (`components/home/featured-section.tsx`);
- `PHASES_LABEL`, "Browse the sample catalog by phase", the name of the phase links (and a visible
  eyebrow) in `components/home/inside-section.tsx` and `app/(site)/sample/page.tsx`;
- the two beta notes on `/sample` (`app/(site)/sample/page.tsx`);
- the sample note on the Purchase page (`components/purchase/contents-leaf.tsx`);
- the Why Advanta page's note on the state of the site (`STATE` in `app/(site)/why-advanta/page.tsx`);
- the sample-content wording in `lib/seo/llms.ts`.

**The phase count, written as "eleven":** the catalog's metadata description
(`app/(site)/catalog/page.tsx`), `components/home/inside-section.tsx`,
`components/home/portfolio-section.tsx`, the folder's heading "Eleven phases in one folder."
(`components/purchase/portfolio.tsx`) and `lib/seo/llms.ts`.

**The free sample count, written as "six":** the catalog's metadata description and `lib/seo/llms.ts`.
Elsewhere copy prints `FREE_SAMPLE_COUNT` with `countWord`.

## Tests that pin the sample catalog

`tests/unit/content.test.ts` and the browser specs in `tests/e2e/` check the sample catalog by name and
count (the thirteen sections, the six free templates by slug, the routes they visit), so they need
updating with the real catalog, in the same change as the data.
