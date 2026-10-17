# Design system

This document describes the visual system of the Advanta365 site: the concept, the colour and type tokens, the bands and grid, depth, motion, every UI primitive, and the accessibility floor. The source of truth is the code. The token values below are copied from `app/globals.css`, and the primitives are the files in `components/ui/`.

## 1. Concept

Advanta365 sells one thing: the complete change management and user adoption toolkit for Microsoft 365 rollouts, for $1,499.99 CAD. Six templates are free samples and the rest are shown locked. Each template arrives mostly written, so the buyer's work is the last part. The site is drawn as a working copy: white sheets on a cool grey desk, set in near-black type, with a light-blue highlighter that marks the parts that belong to the buyer. Nothing moves behind the text: the grounds are plain paper and dark bands, and the motion that remains belongs to the objects on them.

Six principles guide every decision:

1. **Paper first.** Content sits on sheets. A sheet is a white plane with a grain, a hairline ring, and a soft shadow.
2. **The mark is the buyer's.** The highlight marks what the buyer fills in or owns. It always carries ink: a border, a ring, a tick, or the text itself. The pale blue fill alone is never a signal.
3. **Hard edges on surfaces.** Bands and sheets change ground without a transition. Movement is limited to content arriving and to sheets responding to the pointer.
4. **Type carries the hierarchy.** Two families and one size scale do all the structural work. Colour and depth add emphasis only after type has done its job.
5. **Motion explains or pays off.** Motion announces a state change, reveals a sequence, or rewards a completed step. Every animation and movement is inside the `prefers-reduced-motion: no-preference` query, or starts only from a state the boot script sets when motion is allowed.
6. **Nothing moves behind the text.** A band is a plain ground. What moves is an object on it: a sheet settling or tilting toward the pointer, a rule drawn from the left, a tally filling, the logo signed on a first visit.

## 2. Where the system lives

| Path | What it holds |
| --- | --- |
| `app/globals.css` | Every colour, type, space, depth, shape, layer and motion token; the band definitions; base element rules; the type classes; the reduced-motion safety net; the forced-colours rules. |
| `app/motion.css` | Entrances, view transitions, paper and lift behaviour, the sticky bar's shadow, the bar's sliding underline, the ninety-percent scroll sequence, the price tag's swing, a locked tile saying no (a shake and a ring), the arrival of a pop-up, a step of the checkout settling in and a hero document straightening. Imported first by `globals.css`. |
| `app/layout.tsx` | Font loading (Besley and Atkinson Hyperlegible Next as CSS variables), root attributes, the boot script, and `MotionRoot`. |
| `app/icon.svg` | The site icon: the logo mark on an ink tile. |
| `lib/brand/mark.ts` | The logo geometry, the single source for the mark path data. |
| `components/ui/` | The UI primitives described in section 9. |
| `components/catalog/`, `components/purchase/`, `components/checkout/`, `components/about/`, `components/home/`, `components/layout/` | Feature components built from the primitives (section 9.8): the template tiles, locks and pop-up, the portfolio, its price tag and the contents leaf, the checkout, the sections of the Why Advanta page, the hero, the bar's purchase button and the footer. |
| `lib/boot/` | The inline boot script and the pure functions it mirrors. |
| `lib/scroll/` | The scroll-seen observer and the pointer light tracker. |
| `tests/unit/design-gate.test.ts` | The standing rules: raw colour placement, allowed media queries, the allowed `@container` files, the allowed `next/link` importer, and no canvas or WebGL anywhere. |

Every value a component uses should come from a token. A colour written as a hex value, `rgb()`, `oklch()` or `color-mix()` anywhere in `app`, `components` or `lib` fails the design gate, except in `app/globals.css` and `app/icon.svg`.

## 3. Colour

### 3.1 Raw tokens

Defined on `:root` in `app/globals.css`.

| Token | Value | Role |
| --- | --- | --- |
| `--desk` | `#f4f5f8` | The cool grey desk behind sheets. |
| `--paper` | `#ffffff` | The sheet. The body background. |
| `--desk-deep` | `#e6e8ee` | A tile or well sitting on the desk. |
| `--rule` | `#d2d5de` | Hairline dividers and decorative lines. |
| `--rule-firm` | `#70758a` | Control borders and boundaries that must be seen. |
| `--ink` | `#0b0d12` | Primary text and the ink fill. |
| `--ink-soft` | `#3a3f4c` | Secondary text. |
| `--ink-faint` | `#596072` | Tertiary text, captions, counts. |
| `--mark` | `#86c1ff` | The highlighter. Fills marked blocks and the logo's right-hand leg. |
| `--mark-deep` | `#5fa8f5` | A solid button while pressed; a checked checkbox under the pointer. |
| `--mark-wash` | `#eaf4ff` | The mark diluted to a ground for the wash band and hover rows. |
| `--on-mark` | `var(--ink)` | Text on a mark fill. |
| `--on-ink` | `#ffffff` | Text on an ink fill. |
| `--binder` | `#0d0f15` | The binder: the footer and the ink surface. |
| `--binder-rise` | `#1c202b` | A raised surface on the binder. |
| `--on-binder` | `#f4f5f8` | Text on the binder. |
| `--on-binder-soft` | `#b4b9c7` | Secondary text on the binder. |
| `--rule-on-binder` | `#343947` | Hairlines on the binder. |
| `--alert` | `#a32b1d` | Errors, and the ring on the cover well of a locked tile that says no. |
| `--alert-wash` | `#fbeae5` | The ground behind an error. |
| `--scrim` | `rgb(11 13 18 / 0.5)` | The backdrop behind the menu drawer and dialogs. |
| `--bar-shadow` | `0 10px 21px -14px rgb(11 13 18 / 0.4)` | The shadow under the sticky bar once it is scrolled. |
| `--paper-shade` | `#f1f3f7` | The far corners of a sheet. |
| `--card-light` | `rgb(255 255 255 / 0.62)` | The light on the card stock front of a page-size folder. |
| `--pocket-shade` | `0 -8px 14px -8px rgb(11 13 18 / 0.22)` | The shade that front casts up onto the sheets in its pocket. |
| `--grain` | `url("/paper/grain.png")` | A pre-rendered 128-pixel paper tooth, used by medium and large sheets. |

### 3.2 Semantic layer

Components never read the raw tokens. They read the semantic layer, which every band redefines.

| Semantic token | Meaning | Default (desk band) |
| --- | --- | --- |
| `--ground` | The background of the band. | `--desk` |
| `--surface` | The background of a sheet or panel inside the band. | `--paper` |
| `--stripe` | A striped or alternating row ground. | `--desk` |
| `--tile` | A small well such as a count badge or numeral tile. | `--desk-deep` |
| `--text` | Primary text. | `--ink` |
| `--text-soft` | Secondary text. | `--ink-soft` |
| `--text-faint` | Tertiary text. | `--ink-faint` |
| `--line` | Hairline dividers. | `--rule` |
| `--line-firm` | Control borders. | `--rule-firm` |
| `--line-ink` | Ink borders and rings. | `--ink` |
| `--focus-ring` | The focus outline colour. | `--ink` |

### 3.3 Contrast

Measured as WCAG 2.x contrast ratios from the token values.

| Pair | Ratio | Use |
| --- | --- | --- |
| Ink on paper | 19.43 : 1 | Body and headings on sheets. |
| Ink on desk | 17.83 : 1 | Body text on the desk band. |
| Ink on wash | 17.48 : 1 | Body text on the wash band. |
| Ink on desk-deep | 15.86 : 1 | Text in a tile. |
| Ink-soft on paper | 10.52 : 1 | Secondary text. |
| Ink-soft on wash | 9.46 : 1 | Secondary text on the wash band. |
| Ink-faint on paper | 6.29 : 1 | Captions and counts. |
| Ink-faint on desk | 5.77 : 1 | Captions on the desk band. |
| Ink-faint on wash | 5.65 : 1 | Captions on the wash band. |
| Ink-faint on desk-deep | 5.13 : 1 | Counts inside a tile. |
| Ink on mark | 10.26 : 1 | Text on a marked fill. |
| Ink on mark-deep | 7.78 : 1 | Text on a pressed marked fill. |
| On-binder on binder | 17.57 : 1 | Body text in the footer. |
| On-binder-soft on binder | 9.76 : 1 | Secondary text in the footer. |
| On-binder-soft on binder-rise | 8.29 : 1 | Secondary text on a raised binder surface. |
| Mark on binder | 10.11 : 1 | The focus ring on the binder, and the highlighter lines in the footer. |
| Alert on paper | 7.19 : 1 | Error text. |
| Alert on alert-wash | 6.16 : 1 | Error text on its ground. |
| Line-firm on paper | 4.56 : 1 | Control borders, above the 3 : 1 non-text floor. |
| Line-firm on desk | 4.19 : 1 | Control borders on the desk band. |
| Mark on paper | 1.89 : 1 | Never used alone. The highlight always carries ink. |
| Rule on paper | 1.47 : 1 | Decorative hairlines only. |

### 3.4 Rules for the mark

- The mark fill is never the only signal. Pair it with ink: a 2px ink ring (`box-shadow: inset 0 0 0 var(--edge) var(--ink)`), an ink border, a tick, or ink text.
- Text on a mark fill is `--on-mark` (ink). Text on an ink fill is `--on-ink` (white).
- The mark is the colour of the highlighter behind words (`::selection`, `[data-mark]` headline spans, the link highlight on focus). It is a background, never a text colour on paper.
- The logo's right-hand leg is the mark colour. Under forced colours it uses `currentColor`.
- On the binder, where the mark measures 10.11 : 1, it may be a line: the focus ring, the underline of a hovered or focused link, and in the footer the 2px edge along its top and the underline of a hovered or focused link. The footer's one button is a mark fill with ink text, which dilutes to `--mark-wash` under the pointer or focus and goes to `--mark-deep` when held down.

### 3.5 Binder and ink surfaces

`[data-band="ink"]` and `[data-band="binder"]` share one definition: ground `--binder`, surface and tile `--binder-rise`, text `--on-binder`, lines `--rule-on-binder`, focus ring `--mark`. The footer uses `binder` directly. The ink band is the surface of the home solution section and of the promise band on the about page.

## 4. Bands

A band is a full-width stripe that paints its own ground and sets the text colour for everything inside it. `components/ui/band.tsx` renders the band and sets `data-band`. The base rule `[data-band] { background: var(--ground); color: var(--text); }` does the painting.

| `data-band` | Ground | Surface | Lines | Focus ring |
| --- | --- | --- | --- | --- |
| `desk` | `--desk` | `--paper` | `--rule` | `--ink` |
| `paper` | `--paper` | `--paper` | `--rule` | `--ink` |
| `wash` | `--mark-wash` | `--paper` | `--rule` | `--ink` |
| `ink` | `--binder` | `--binder-rise` | `--rule-on-binder` | `--mark` |
| `binder` | `--binder` | `--binder-rise` | `--rule-on-binder` | `--mark` |

Alternate bands between `desk` and `paper` down a page. Use `wash` once per page as a single tinted moment. Use `ink` for a single statement, and `binder` only for the footer.

### 4.1 Band props

`Band` takes:

- `as`: `section` (default), `div`, `header`, `footer` or `aside`.
- `surface`: `desk` (default), `paper`, `wash`, `ink` or `binder`.
- `pad`: `regular` (default), `none`, `title`, `tight` or `roomy`.
- `innerClassName`, `className`, `ref`, and any other element attributes.

Vertical padding by `pad`:

| `pad` | Below 40em | From 40em |
| --- | --- | --- |
| `none` | 0 | 0 |
| `title` | 28px | 42px |
| `tight` | 42px | 42px |
| `regular` | 56px (`--band-pad`) | 84px (`--band-pad`) |
| `roomy` | 84px | 112px |

Content sits inside `Wrap`, which caps the width at the page maximum.

## 5. Type

### 5.1 Families

- **Display:** Besley, through `--face-display` (`var(--font-besley)`, then Rockwell, Roboto Slab, Georgia, serif). Used for headlines, the logo name, numerals, prices and the poster.
- **Text:** Atkinson Hyperlegible Next, through `--face-text` (`var(--font-atkinson)`, then the system UI stack). Used for everything else: copy, labels, buttons, tags and eyebrows.

Both are loaded in `app/layout.tsx` with `display: "swap"` and exposed as CSS variables.

### 5.2 Size scale

Display sizes are fluid. The minimum and maximum below are the rendered sizes at the 16px root. Every size is in rem, so on a large monitor, where the root grows (section 6.2), each size grows with it by the same factor. The home headline is also held to a sixteenth of `--page-max` from 68em, so on a large monitor its two lines still span the page.

| Token | Min | Max | Used by |
| --- | --- | --- | --- |
| `--size-poster` | 112px | 320px | The 404 numeral and the solution figure. |
| `--size-hero` | 40px | 80px | The home headline. |
| `--size-statement` | 34px | 72px | Wide title blocks and statements. |
| `--size-banner` | 34px | 56px | Standard page titles and section statements. |
| `--size-page` | 28px | 40px | Page headings in shelves. |
| `--size-section` | 22px | 26px | Section headings and large row labels. |
| `--size-item` | 18px | 20px | Row titles. |
| `--size-amount` | 30px | 40px | Prices. |
| `--size-lead` | 18px | 20px | Lead paragraphs. |
| `--size-copy` | 16px | 17px | Body copy (also the body size). |
| `--size-ui` | 16px | 16px | Buttons, labels, inputs. |
| `--size-note` | 14px | 14px | Notes, captions, breadcrumbs. |
| `--size-eyebrow` | 13px | 13px | Eyebrows (uppercase). |
| `--size-tag` | 12px | 12px | Tags (uppercase). |

### 5.3 Type classes

Apply a class; do not set the family or size by hand.

| Class | Family | Weight | Line height | Tracking | Role |
| --- | --- | --- | --- | --- | --- |
| `.type-poster` | Display | 800 | 0.86 | 0 | The largest numeral or word. |
| `.type-hero` | Display | 600 | 1.04 | 0 | The home headline. |
| `.type-statement` | Display | 600 | 1.06 | 0 | Statements and wide titles. |
| `.type-banner` | Display | 600 | 1.12 | 0 | Page titles and section statements. |
| `.type-page` | Display | 600 | 1.16 | 0 | Shelf headings. |
| `.type-section` | Display | 600 | 1.24 | 0 | Section headings. |
| `.type-item` | Display | 600 | 1.3 | 0 | Row titles. |
| `.type-amount` | Display | 700 | 1.1 | 0 | Prices and totals. |
| `.type-lead` | Text | 400 | 1.5 | 0 | Lead paragraphs. |
| `.type-copy` | Text | 400 | 1.58 | 0 | Body copy. |
| `.type-ui` | Text | 600 | 1.375 | 0 | Controls and labels. |
| `.type-note` | Text | 400 | 1.43 | 0 | Notes and captions. |
| `.type-eyebrow` | Text | 700 | 1.385 | 0.08em | Uppercase eyebrow. |
| `.type-tag` | Text | 700 | 1.333 | 0.06em | The uppercase format tag. The saving tag uses `.type-note` and the plain tag `.type-ui`. |

Display classes keep the font's own figures: they set `font-feature-settings: "tnum" 0`, because Besley's tabular zero is drawn thin above weight 600. Use `.tabular` (tabular and lining numerals) on text figures, such as prices and counts in Text-family classes.

Writing rules:

- One `h1` per page. The home headline uses `.type-hero`; inner page titles use `.type-banner`, or `.type-statement` in the wide title block. The catalog has no title block: its `h1` ("Catalog") is `type-banner visually-hidden`, read out and not shown.
- Measure body copy with `--wrap-copy` (36rem) and lead copy with `--wrap-lead` (40rem). Headings take `--wrap-head` (22em).
- Headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty`.
- Copy uses typographic apostrophes and quotation marks. The content tests reject straight quotes and exclamation marks in copy.
- The eyebrow and tag classes are always uppercase through CSS. The text in the DOM stays in sentence case.

## 6. Space, grid and layout

### 6.1 Spacing

The space scale runs on a 7px module. Space, widths and control heights are in rem: the pixels given in this section are those at the 16px root, and past a 1600px window they grow with it (section 6.2). Corner radii, edges and hairlines (section 6.5) stay in pixels.

| Token | Value | Typical use |
| --- | --- | --- |
| `--s-1` | 7px | Icon gaps, tight stacks. |
| `--s-2` | 14px | Row padding, small gaps. |
| `--s-3` | 21px | Sheet padding (small), block gaps. |
| `--s-4` | 28px | Sheet padding (large), group gaps. |
| `--s-5` | 42px | Space under a shelf heading. The minimum target is `--tap` (44px). |
| `--s-6` | 56px | Band padding (small screens). |
| `--s-7` | 84px | Band padding (from 40em). |
| `--s-8` | 112px | Roomy band padding. |
| `--s-9` | 168px | The label column of a fact list. |

### 6.2 Page and columns

| Token | Below 40em | 40em and up | 68em and up |
| --- | --- | --- | --- |
| `--page-max` | `max(77rem, min(72vw, 120rem))` | same | same |
| `--page-pad` | 21px | 28px | 42px |
| `--col-gap` | 14px | 21px | 28px |
| `--band-pad` | 56px | 84px | 84px |
| `--bar-h` | 56px | 56px | 70px |

`--page-max` is the width of the grid itself, so it limits the content box of `Wrap` and the page padding stands outside it. Its floor, 77rem, is twelve 77px columns with eleven 28px gaps: 1232px at the 16px root. From 68em, the `Split` primitive lays content on a twelve-column grid: the margin takes columns 1 to 3 and the content takes columns 4 to 12.

#### Large monitors

Past a 1600px window the page is drawn larger as one piece, and a wide window is not left as a narrow column on a wide desk. Three rules in `app/globals.css` do it:

- `--over` is how far the window is past 1600px: `max(0px, calc(100vw - 1600px))`.
- The root size is `html { font-size: min(140%, calc(100% + var(--over) * 0.005)) }`: the browser's own size (16px by default, the 100%) up to a 1600px window, then 0.5% of every pixel past it, up to 140% (22.4px) from about 2880px. The sizes and spaces in the site are in rem (the 7px module, the type, the controls, the icons and the caps on a band), so the root size scales all of it together. The `em` media queries do not follow it (a browser reads them at its own text size), so `40em` and `68em` stay where they are.
- `--page-max` takes 72% of the window (`72vw`) from about 1840px of window, where that is more than 77rem, and stops at 120rem.

| Window | Root size | `--page-max` |
| --- | --- | --- |
| to 1600px | 16px | 77rem, 1232px |
| 1680px | 16.4px | 77rem, 1263px |
| 1920px | 17.6px | `72vw`, 1382px |
| 2560px | 20.8px | `72vw`, 1843px |
| 2880px | 22.4px | `72vw`, 2074px |
| 3440px | 22.4px | `72vw`, 2477px |
| 3840px | 22.4px | 120rem, 2688px |

Where a thing is drawn in rem and the column grows faster than the root does, it follows the column and not the root alone:

- The home hero: `--hero-cap` (`max(56rem, 57vw)`) is the most the first screen is tall, so a 16:9 and a 16:10 monitor are filled to the fold at any size. `--hero-type` is the headline's size: a sixteenth of the column when that is more than `--size-hero`, with the lead at a quarter of it. The proof strip is at most `max(64rem, --page-max * 0.8)` wide. `--stage-bleed` stands the hand of documents past the column on each side (0.2px for every pixel of window past 1920px) so that it keeps the height the window gives it.
- The toolkit's folder on the home page takes `max(30rem, 79.7%)` of its six columns, and the "what's inside" specimen `max(20rem, 78%)` of its margin.
- The Purchase page's folder and contents leaf, and the worked example's page, are drawn larger with CSS `zoom` by `--grow`: how many times wider the column is than 77rem at the root size in use (1 up to a 1600px window, 1.15 at 2560, above 1.4 from 3440), held to what the window's height allows (`100svh` over 1150px, so 1.25 at 1440px high, the height of an ultrawide monitor) and never below 1. The ratio of two lengths is made a plain number by the tangent of the arc tangent of the pair (`tan(atan2(...))`).

A few measures stay fixed, so that a row is never a thousand pixels from its arrow: a ledger of rows with a label at one end and a link or a tally at the other (the Sample page's ledgers and the list of next steps) holds to 64rem, the 404's ledger and the statement's aside hold to `--wrap-lead`, and the filter sheet is at most 40rem wide.

Other layout tokens:

| Token | Value | Use |
| --- | --- | --- |
| `--over` | `max(0px, 100vw - 1600px)` | How far the window is past a 1600px desktop. The root size and the stage's bleed read it. |
| `--rail-h` | 42px | The phase rail below the bar, from 68em. |
| `--wrap-copy` | 36rem | Body measure. |
| `--wrap-lead` | 40rem | Lead measure. |
| `--wrap-head` | 22em | Heading measure. |
| `scroll-padding-top` | `--bar-h` plus `--s-3` | Anchors and focused elements stop clear of the sticky bar. |

### 6.3 Breakpoints

Two viewport breakpoints exist: `40em` and `68em`. Below 40em is the phone layout. From 40em sheets stand two across and rows gain a second column, which is a tablet's layout (640 to 1087px wide). From 68em the site shows the inline navigation, the phase rail, the twelve-column grid, and the four-layer depth. The header and the nav drawer also use container queries at 27.4em and 24.3em (header) and 17em (drawer). The other media queries in use are listed in section 12.4.

A large monitor is not a third breakpoint. The breakpoints are in em, which a browser reads at its own text size and not at the root size that section 6.2 grows past a 1600px window, so they stay at 640px and 1088px, and nothing changes layout at 1600px: the page only grows. The design gate allows no other width query.

A tablet is not a stretched phone or a squeezed desktop, and the layout does not wait for 68em where a pair has room for two columns before it. It does that without a query, with a grid or a flex row that wraps at a stated measure (`repeat(auto-fit, minmax(min(100%, 24rem), 1fr))`, `flex: 1 1 22rem`), so the two columns appear as soon as each has the room and not at a width chosen for a device. These stand beside each other before 68em:

| Surface | Beside each other from | How |
| --- | --- | --- |
| A page title and its aside (`TitleBlock` with `aside`: the phase numeral and its count, the worked example's page) | 40em | The `paired` grid: words and a column of `clamp(16rem, 25vw + 6rem, 18rem)`. The numeral and its count stand in a row below 68em and stack from it. |
| The home page's toolkit: the words and the folder | each has 24rem | An auto-fit grid. |
| The six free samples on the home page | 40em: three across; 68em: six across | A grid of three and then six equal columns, so no tile is left alone on a second row. |
| The Why Advanta page's head and passes of the making; a buyer's name and concern; a thing not finished and its sentence | about 55em; about 52em; about 50em | Wrapping flex rows: the head (22rem) and the passes (28rem); the name (20rem) and the concern (16rem); the thing (20rem) and its sentence (24rem). The phases of the making take the full width under both. |
| The Why Advanta comparison | 40em | The two alternatives are two columns on five shared rows (a subgrid), and the toolkit's sheet lies the full width under them. A fact stands as a line where its sheet holds both of its parts. |
| The Purchase page's folder and contents leaf | about 1010px | An auto-fit grid of two 28rem columns, the tag lying on the folder. |
| The catalog's phase row | 40em | The seven cards share the row equally where they fit (a 768px tablet holds them; each card is 70px at least from 40em, 84px below) and scroll sideways where they do not. |

Other tablet details: the filter sheet is the window's width on a phone and at most 40rem, centred, past it; the pop-up's side padding runs from 21px at 640px to 42px from 1088px; the `large` phase cards (a page's index of the phases) stand in one row from 40em where their list is 42rem wide, a window of about 730px, and four across where it is not.

The site is checked at sixteen window sizes by `tests/e2e/viewports.spec.ts`, on twelve routes (`/`, `/catalog`, `/phases/plan`, `/purchase`, `/why-advanta`, `/contact`, `/privacy`, `/terms`, `/refunds`, `/accessibility`, `/sample` and `/nope`). Nothing is drawn past the window's edge at any of them, and from 1280px up the words of a page span more than half of the window (the 404 is the exception):

| Group | Window sizes (width by height) |
| --- | --- |
| Phones | 320 by 640, 390 by 844 |
| Tablets | 768 by 1024, 820 by 1180, 1024 by 768 |
| Either side of 68em | 1087 by 800, 1088 by 800 |
| Laptops and monitors | 1280 by 720, 1366 by 768, 1440 by 900, 1536 by 864, 1680 by 1050, 1920 by 1080 |
| Large monitors | 2560 by 1440, 3440 by 1440 (an ultrawide), 3840 by 2160 |

### 6.4 Controls

| Token | Height | Use |
| --- | --- | --- |
| `--tap` | 44px | Minimum target below 68em. |
| `--control-sm` | 40px | The small control in the desktop bar only. |
| `--control` | 48px | The default button, input and select. |
| `--control-lg` | 56px | The large button. |

### 6.5 Shape and layers

| Token | Value | Use |
| --- | --- | --- |
| `--round-1` | 3px | Tags, counts, small tiles. |
| `--round-2` | 6px | Pagination and small panels. |
| `--round-3` | 10px | The top corners of the filter sheet on phones. |
| `--edge` | 2px | Ink rings and inset borders. |
| `--hair` | 1px | Hairlines and forced-colour borders. |

| Layer token | Value | Stack order |
| --- | --- | --- |
| `--layer-bar` | 50 | The sticky bar. |
| `--layer-skip` | 90 | The skip link. |
| `--layer-cover` | 100 | The first-load cover. |

Dialogs sit in the browser's top layer, above every value in this table.

## 7. Depth

Depth is a shadow scale. Level 0 is a hairline ring, and higher levels lift objects further from the desk. Levels 3 and 4 gain two extra layers from 68em.

| Token | Level | Use |
| --- | --- | --- |
| `--depth-0` | Hairline ring | A sheet sitting flat on the desk. |
| `--depth-1` | Thumbnail or tab | Phase tabs and small covers. |
| `--depth-2` | At rest | Sheets at rest. The default for `PaperSheet`. |
| `--depth-3` | Lifted or panel | Lifted sheets, the toolkit's sheet in the comparison, the front of a page-size folder. |
| `--depth-4` | Top of a stack | The menu drawer, the filter sheet, the pop-up of the catalog and the checkout. |

Values, as written in `globals.css`:

```css
--depth-0: 0 0 0 1px rgb(11 13 18 / 0.06);
--depth-1: 0 0 0 1px rgb(11 13 18 / 0.05), 0 1px 2px rgb(11 13 18 / 0.06), 0 3px 6px -2px rgb(11 13 18 / 0.06);
--depth-2: 0 0 0 1px rgb(11 13 18 / 0.05), 0 2px 4px -1px rgb(11 13 18 / 0.06), 0 10px 20px -8px rgb(11 13 18 / 0.12), 0 28px 44px -24px rgb(11 13 18 / 0.14);
--depth-3: 0 0 0 1px rgb(11 13 18 / 0.05), 0 12px 24px -8px rgb(11 13 18 / 0.18);   /* 68em: 4 layers */
--depth-4: 0 0 0 1px rgb(11 13 18 / 0.05), 0 20px 40px -12px rgb(11 13 18 / 0.24);  /* 68em: 4 layers */
```

Level 3 and level 4 at 68em are the four-layer forms defined in the same file. Shadows on paper use the ink colour.

## 8. Motion

### 8.1 Principles

- Motion is opt-in. Every animation and movement is inside `@media (prefers-reduced-motion: no-preference)`, or starts only from a state the boot script sets when motion is allowed (the cover). Colour transitions on controls are short (`--time-swap`), and the reduced-motion safety net in `globals.css` shortens every transition.
- Page-level motion is driven by attributes (8.5). A component's own class holds its one animation, for example `.blink` in `Blank` and `.animate` on `Tally`.
- Surfaces never fade or slide. Content arrives; sheets respond.
- Durations are short. Most motion is under 600ms, and the page-level entrances stay under one second.

### 8.2 Root switches

| Attribute | Set by | When |
| --- | --- | --- |
| `data-motion="on"` on `<html>` | The boot script | Motion is allowed (not reduced motion). |
| `data-timeline="on"` on `<html>` | The boot script | The browser supports `animation-timeline: view()`. |
| `data-io="armed"` on `<html>` | `MotionRoot`, before paint | The scroll-seen observer is running for the current page. |
| `data-intro` | The boot script | The cover is playing: `play` or `leave`. The attribute is gone when the cover ends. |
| `data-hydrated` | `MotionRoot`, in an effect | The client components of the page have their handlers. Nothing on the site reads it; browser tests wait for it. |

`MotionRoot` runs in a layout effect on each route change, so the observer is armed before the first paint of the incoming page. The reduced-motion check happens once, when the boot script runs.

### 8.3 Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `--time-swap` | 120ms | Swapping a state (a tab, an icon). |
| `--time-enter` | 240ms | Entering a small element. |
| `--time-exit` | 160ms | Leaving a small element. |
| `--time-fill` | 180ms | One block filling in a tally. |
| `--time-fill-gap` | 80ms | Delay between tally blocks. |
| `--time-blink` | 1100ms | The caret cycle of a blank line. |
| `--time-lift` | 260ms | Lifting a sheet on hover or focus. |
| `--time-ink` | 400ms | An element arriving with ink-in. |
| `--time-settle` | 560ms | An element settling in. |
| `--time-count` | 1200ms | The spread of the ninety's block fill where view timelines are missing. |
| `--time-page-out` | 140ms | The outgoing page. |
| `--time-page-in` | 260ms | The incoming page. |
| `--time-morph` | 420ms | A shared sheet or cover morph. |
| `--stagger` | 70ms | Delay between siblings (multiplied by `--order`). |

| Curve | Value | Use |
| --- | --- | --- |
| `--curve-settle` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Default ease for entrances and sheets. |
| `--curve-leave` | `cubic-bezier(0.55, 0.06, 0.68, 0.19)` | Leaving the screen. |
| `--curve-ink` | `cubic-bezier(0.16, 0.84, 0.3, 1)` | Ink arriving. |
| `--curve-drop` | `cubic-bezier(0.3, 1.25, 0.5, 1)` | A small overshoot, used for settling sheets. |
| `--curve-pen` | `cubic-bezier(0.65, 0, 0.2, 1)` | Pen strokes on the cover. |

`motion.css` also uses a few literal values: 480ms for drift entrances, 600ms for grow entrances, 420ms for the paper shade and tilt transitions, 1ms while the cover is up (so content behind it is already finished), the price tag's swing (1700ms, and 1200ms when its folder is hovered), a locked tile's denial (a state of 600ms: a 440ms shake and a 560ms ring hit-and-fade), and the pop-up's arrival (320ms).

### 8.4 Entrances

`Appear` wraps content and sets `data-move` (`drift`, `ink-in`, `settle` or `grow`), `data-when="load"` when it should play on page load, and `--order` for a stagger. Entrances use one of three paths:

- **Timeline path.** With `data-timeline="on"`, each entrance is tied to scroll position with `animation-timeline: view()`. The element's range depends on `--order`. Drift covers the first 22% of its view range (14rem at most). Ink-in covers 16% (8rem at most), so a heading is inked before the text around it. Settle covers 30%. Grow covers 28%.
- **Observer path.** Without view timelines, `data-io="armed"` applies the hidden starting state to elements that lack `data-seen`. The observer adds `data-seen` when an element has reached 88% of the viewport height (or half of it, for ninety sequences). The transition then plays with the curve of its kind (drift 480ms and grow 600ms on `--curve-settle`; ink-in on `--time-ink` with `--curve-ink`; settle on `--time-settle` with `--curve-drop` for its movement), delayed by `--order` times `--stagger`.
- **Load path.** `data-when="load"` plays on page load with the same curves, and finishes at once under the cover.

Entrance kinds:

| `move` | What arrives |
| --- | --- |
| `drift` | Opacity from 0, and 12px upward movement. |
| `ink-in` | Opacity from 0, with no blur and no movement, over the shortest range (it ends 8rem into the window), so a heading is legible as soon as it is seen. Used for sentences. |
| `settle` | Opacity from 0, 28px drop from above, and a 1.03 scale easing down. Sheets use this. |
| `grow` | A scale from 0 along the left edge. Used for ledger rules and tallies. |

### 8.5 Hooks

| Attribute | Set by | Effect |
| --- | --- | --- |
| `data-move` | `Appear`, `Sentences` | The entrance kind. |
| `data-when="load"` | `Appear when="load"` | Plays on load, not on scroll. |
| `data-seen` | `MotionRoot` observer | The element has arrived. |
| `data-watch` | `Tally animate`, `PriceTag`, observed elements | The element is watched for arrival. |
| `data-paper`, `data-lit` | `PaperSheet` | A sheet with its shade and its pointer lift. |
| `data-bar` | The site header | The sticky bar's shadow and forced-contrast border. |
| `data-ninety` | The solution section | The scroll-linked ninety-percent sequence. |
| `data-block` | `Tally` | Each block: `ink`, `mark` or `empty`. |
| `data-ledger` | `BandedList` | The grow rules on each row. |
| `data-folder`, `data-folder-scope` | `Folder`, and an element around one | The folder whose sheets rise under the pointer; the scope in which keyboard focus raises them too. |
| `data-price-tag` | `PriceTag` | The paper tag on its string: it swings once when it is first seen, and a little when its folder comes under the pointer. |
| `data-nav-underline` | `PrimaryNav` | The bar's ink underline: it stands under the current link and slides to the next. |
| `data-tile`, `data-free`, `data-locked`, `data-denied` | `TemplateTile`, `LockedTile` | A catalog tile, its kind, and the 600ms state in which a locked tile shakes and hits and fades a ring on its well in `--alert`. |
| `data-well` | `TemplateTile` | The well of a tile: its `::before` is the red wash of a denied tile, animated by opacity. |
| `data-page-dialog`, `data-enter` | `PageDialog` | A pop-up: the catalog's (`data-template-dialog`) or the checkout (`data-checkout-dialog`); `data-enter` is on one that a link inside the site opened, which rises into place. |
| `data-checkout-step`, `data-checkout-progress` | `CheckoutDialog` | A step of the checkout, which settles 10px into place when the visitor moves to it (`data-enter`), and the line under the bar, which grows to the current step. |
| `data-hero-stage`, `data-hero-prompt`, `data-hero-doc` | `HeroStage` | The hero's prompt box and hand of six documents. Where movement is wanted the box blinks for 700ms, dissolves by 1500ms, and the documents land from 1300ms, 110ms apart; under reduced motion or without a script there is no box. One under the pointer or the keyboard straightens over `--time-lift`. |
| `data-lit-scope` | Read by the pointer tracker | Scope for a group of lit sheets that is not an article (the Purchase page's contents leaf, the Why Advanta page's toolkit sheet and the pop-up's cover each stand in one, and so does each of the hero's documents); the scope stands where the sheet rests, so a lifted sheet does not drop and lift again under a pointer at its lower edge; read by `lib/scroll/pointer.ts` and the lit selectors in `app/motion.css`. |

### 8.6 Sheets and the pointer

A lit sheet (`PaperSheet lit`) responds to hover on a device that can hover (`(hover: hover)`), and to keyboard focus inside it:

- It lifts 6px (`translate: 0 -6px`) over `--time-lift`.
- It tilts up to 1.2 degrees toward the pointer (`--tx`, `--ty`), with a 900px perspective. Only `(hover: hover)` devices get the tilt; touch input is ignored.
- Its shade (`::after`) fades in with `--curve-settle` over 420ms at rest, and over `--time-lift` on hover.

The tilt and the light position are written by `lib/scroll/pointer.ts` in one animation frame per pointer move.

### 8.7 Page transitions

A page change swaps the page at once. The first block of a page, wrapped in `PageShift`, is a view transition: the outgoing block fades out over `--time-page-out`, and the incoming block arrives with `move-ink-in` (opacity only) over `--time-page-in`, after an 80ms delay. A shared element named `cover-<slug>` or `folder-<slug>` morphs over `--time-morph` (class `sheet-morph`); `TemplateCover` and `Folder` take a `slug` for it, and no page passes one today. Opening a sample in the pop-up is a change inside the page and starts no view transition. Under reduced motion, every view transition group has no animation and the outgoing block is not shown.

### 8.8 The first-load cover

The home page opens with a cover: a full-viewport paper plane (`--layer-cover`) with the logo drawn in two moves, the name and the line "An EchoFive product" written in under it, and a `Skip` hint at the bottom.

| Element | Timing |
| --- | --- |
| Arm of the mark (ink) | 120ms to 620ms, on `--curve-pen`, uncovered smoothly from its foot up to the peak. |
| Leg of the mark (highlighter) | 620ms to 1000ms, uncovered from the peak down on an ease-in (a fall speeds up), landing at about 850ms; it then squashes against the ground (`scaleY` 0.93, from its foot) and springs back past 1 to rest, for weight. |
| Name | 900ms to 1150ms, written in from the left. |
| "An EchoFive product" | 1100ms to 1400ms, written in from the left, in the text face and the faint ink. |
| Hint | 600ms to 900ms. |
| The finished signature | Stands from 1400ms to 2500ms. |
| Signature and hint leave | 2500ms to 2680ms, fading on the paper while it is still opaque. |
| Cover leaves | From 2500ms, 450ms with `--curve-leave`. The paper holds until 40% (2680ms) and only then clears, so the logo is gone before the hero shows. |

- It plays once per browser session on the home page, when motion is allowed and the tab is visible. The session flag is `advanta365.intro.v1` in `sessionStorage`.
- Any pointer press, key press, wheel or touch ends it early. The skip is quiet: the cover fades over 200ms without moving the page.
- A backstop ends it after 5500ms regardless of events.
- The hero has no sequence of its own: its six documents already stand under the cover, and nothing starts when it has gone.

### 8.9 Figures and tallies

- A figure is printed as it is and never counts or rolls up to its value: while it moves it reads a wrong one. The `#inside` counts and the ninety's 90% are plain text.
- `Tally animate` fills its blocks one after another: each block starts after `--time-enter` plus its index times `--time-fill-gap`, and takes `--time-fill` to fill.
- Nothing in an entrance is blurred, and `app/motion.css` has no blur at all.

### 8.10 Reduced motion

- With reduced motion, the boot script stops at its first check and writes nothing: no motion and no cover attributes.
- The `no-preference` rules never apply. A global safety net (in `globals.css`) forces every remaining animation and transition to 0.01ms with one iteration.
- Tallies are fully filled. Figures read as they always do.

## 9. Primitives

All primitives live in `components/ui/`. Props are shown with their defaults in parentheses. Every primitive also accepts the attributes of its root element where it is a wrapper, and `className` where it is styled. Server components are the default; only `MotionRoot` is a client component.

### 9.1 Layout and surfaces

| Primitive | Props | Usage |
| --- | --- | --- |
| `Wrap` | `as` (div, section, header, footer, nav; div), `ref`, `className` | `<Wrap as="section" className={styles.inner}>...</Wrap>` |
| `Band` | `as` (section, div, header, footer, aside; section), `surface` (desk, paper, wash, ink, binder; desk), `pad` (regular, none, title, tight, roomy; regular), `innerClassName`, `ref`, `className` | `<Band id="state" surface="wash">...</Band>` |
| `Split` | `margin` (ReactNode), `sticky` (false), `rule` (false), `className`, `marginClassName`, `contentClassName` | `<Split margin={<h2 className="type-banner">Plan</h2>} rule>...</Split>` |
| `PaperSheet` | `as` (div, section, aside, span, li; div), `ratio` (free, portrait, landscape, slide; free), `size` (sm, md, lg; md), `depth` (0 to 4; 2), `lit` (false), `turn` (degrees), `className`, `style`, `ref` | `<PaperSheet ratio="portrait" depth={3} lit>...</PaperSheet>` |
| `PaperStack` | `under` (2), `className`, `ref` | `<PaperStack under={3}><PaperSheet ratio="portrait" /></PaperStack>` |
| `Folder` | `tab` (ReactNode), `sheets` (3, or the sheets themselves as nodes), `size` (card, page; card), `slug`, `frontClassName`, `ref`, element attributes | `<Folder size="page" tab="The complete toolkit" sheets={covers}>...</Folder>` |
| `ShelfHead` | `eyebrow`, `title` (required), `titleAs` (h1, h2, h3; h2), `titleId`, `body`, `action`, `stack` (false), `className` | `<ShelfHead eyebrow="Free samples" title="The six free samples, one by one" action={...} />` |
| `BandedList` | `as` (ul, ol, dl, div; ul), `className`, `ref` | `<BandedList as="dl">...</BandedList>` |
| `BandedRow` | `as` (li, div; li), `className` | `<BandedRow as="div">...</BandedRow>` |

`BandedList` and `BandedRow` are also exported under the names `Ledger` and `LedgerRow`.

### 9.2 Text and labels

| Primitive | Props | Usage |
| --- | --- | --- |
| `Eyebrow` | `as` (p, span, div; p), `marker` (true), `id`, `className` | `<Eyebrow>The answer</Eyebrow>` |
| `Note` | `className`, children | `<Note>These are samples.</Note>` |
| `Sentences` | `text` (string, split on line breaks), `move` (false) | `<Sentences text="First sentence.\nSecond sentence." move />` |
| `KeepCompounds` | `text` | `<KeepCompounds text="Go/No-Go Decision Checklist" />` |
| `Tag` | `variant` (format, saving, plain; format), `className`, children | `<Tag variant="saving">Free sample</Tag>` |
| `FactList` | `items` ({ label, value }[]), `className` | `<FactList items={[{ label: "Type", value: "Plan" }]} />` |
| `Icon` | `name` (arrow, chevron, plus, minus, close, tick, bars, search), `size` (20, the width and height in pixels at the 16px root, drawn in rem), `flip` (false), `className` | `<Icon name="arrow" size={32} />` |
| `LogoMark` | `height` ("1.5em"), `className`, `title`, `tone` (one, two; one) | `<LogoMark tone="two" height="2.5rem" />` (one fills the whole "A" in `currentColor`; two draws the right half in `--logo-half`) |
| `BrandLockup` | `variant` (tile, bare; tile), `size` (sm, md; md), `className`, `nameClassName` | `<BrandLockup variant="bare" size="sm" />` |

### 9.3 Links

| Primitive | Props | Usage |
| --- | --- | --- |
| `TransitionLink` | `prefetch` (true), plus `next/link` props | `<TransitionLink href="/catalog">Catalog</TransitionLink>` |
| `TextLink` | `href`, `external` (false), `onClick`, `className`, `aria-current` | `<TextLink href="/purchase">Purchase</TextLink>` |
| `RowLink` | `href`, `label`, `caption`, `trailing`, `lead`, `size` (md, lg; md), `external`, `onClick`, `className`, `aria-current` | `<RowLink href="/phases/plan" label="Plan" caption="Two steps" />` |
| `Pagination` | `page`, `pageCount`, `hrefFor` (page to href) | `<Pagination page={2} pageCount={5} hrefFor={(p) => `/catalog?page=${p}`} />` |
| `PhaseTabs` | `phases` ({ slug, name }[]), `current`, `currentKind` (page, true; page), `size` (rail, large; rail), `className` | `<PhaseTabs phases={phases} current="plan" size="large" />` |

`TransitionLink` is the only module that imports `next/link`. Every internal link goes through it.

### 9.4 Controls

| Primitive | Props | Usage |
| --- | --- | --- |
| `Button` | `variant` (mark, outline, ink, text; mark), `size` (sm, md, lg; md), `fullWidth` (false), `arrow` (false), `href`, `external` (false), `linkRef`, `className`, native button attributes | `<Button variant="outline" size="lg" href="/sample" arrow>See a sample</Button>` |
| `Checkbox` | `label` (string), `count`, `disabled`, `className`, input attributes except `type` | `<Checkbox label="Sharepoint" count={12} checked={on} onChange={...} />` |
| `Input` | `className`, input attributes | `<Input id="catalog-search" name="q" maxLength={200} />` |
| `Select` | `className`, select attributes, children (options) | `<Select aria-label="Sort by">...</Select>` |
| `Textarea` | `rows` (3), `className`, textarea attributes | `<Textarea id="checkout-note" maxLength={600} />`: a few lines of text, drawn as `Input` is, and resizable downwards |
| `Blank` | `caret` (blink, steady, none; steady), `size` (sm, md, lg; md), `className` | `<Blank caret="blink" size="lg" />` |
| `Button` in `href` form | Forwards only `id`, `title`, `tabIndex`, `aria-label`, `aria-describedby`, `aria-current`, `onClick`. `scroll={false}` keeps the page where it is, for a link that opens a pop-up | `<Button href="/purchase?checkout=details" scroll={false}>Checkout</Button>` |
| `Button` with `aria-disabled="true"` | Looks like a `:disabled` button and stays focusable, so a keyboard reaches its words. It does nothing | `<Button size="lg" aria-disabled="true">Opening payment…</Button>` |

Button sizes: `sm` is 44px below 68em and 40px from 68em; `md` is 48px; `lg` is 56px. Buttons always carry `type-ui`. The `text` variant underlines its words and shows a mark highlight behind them on hover and focus.

### 9.5 Feedback and state

| Primitive | Props | Usage |
| --- | --- | --- |
| `Tally` | `total`, `filled` (number, or 1-based list), `marked` (1-based), `size` (sm, md, lg; md), `numerals` (false), `animate` (false), `label`, `className` | `<Tally total={10} filled={9} marked={10} size="lg" />` |

`Tally` without `label` is decorative and hidden from assistive technology. With `label` it becomes an image with that label. Do not set `animate` on a tally inside a ninety sequence.

### 9.6 Motion helpers

| Primitive | Props | Usage |
| --- | --- | --- |
| `Appear` | `as` (div, p, span, ul, ol, li, section, figure; div), `move` (drift, ink-in, settle, grow; drift), `when` (view, load; view), `order`, `ref`, `style`, element attributes | `<Appear as="p" when="load" className="type-lead">...</Appear>` |
| `PageShift` | `children` | `<PageShift>{children}</PageShift>` (wraps the first block of a page in a view transition; the rest of the page swaps at once) |
| `MotionRoot` | none (client, renders nothing) | `<MotionRoot />` in `app/layout.tsx`, once per app |

### 9.7 Shared behaviour

- `cx` (`lib/cx.ts`) joins class names and drops falsy values. `cssVars` builds style objects and drops `undefined` values. Use them instead of template strings.
- Sizes and variants map to CSS module classes. If a prop value has no matching class, the root class applies, so keep to the documented values.

### 9.8 Feature components

Built from the primitives for one part of the site; each has a doc comment that says what it does.

| Component | Props | Usage |
| --- | --- | --- |
| `TemplateTile` | `template`, `phaseName`, `phaseOrder`, `href`, `headingLevel`, `scroll` (true), `denied` (false) | `<li><TemplateTile template={t} phaseName="Plan" phaseOrder={2} href={catalogHref(criteria, t.slug)} headingLevel="h2" /></li>` inside a `TileGrid`. A free sample is a link; any other template is locked. |
| `TileGrid` | `className`, children | `<TileGrid>{items}</TileGrid>`: a list with as many columns of at least 11rem (176px at the 16px root) as fit, never fewer than two. A page that holds a set number of tiles gives the grid its own columns by `className` (the home page's six free samples: three across from 40em, six from 68em). |
| `LockedTile` | `title`, `headingLevel` (h3), `initialDenied` (false), children | Used by `TemplateTile`: the button named "<title>, locked" and its live line, "Included with the toolkit." |
| `PageDialog` (`components/ui`) | `name` (template, checkout), `closeHref`, `labelledBy`, `bar`, `fill` (false), children | The pop-up both features share: a native modal dialog at depth 4 with a bar that holds Close; Escape, Close and the dimmed page close it. `bar` is what stands before Close. `fill` is for content that changes while it is open: the whole window below 40em (square corners, no dimmed page), and one height (46rem, or what the window leaves) and at most 64rem wide from there. |
| `TemplateDialog` | `closeHref`, `labelledBy`, children | `<TemplateDialog closeHref="/catalog" labelledBy="title-id"><TemplateDetail ... /></TemplateDialog>`: `PageDialog` for a free sample. |
| `CheckoutDialog` | `panel`, `disclosure` | The checkout over the Purchase page: `PageDialog` with `fill`, its bar holding the title and the three steps (a numeral tile each: ink for the current one, a tick on the highlighter for one that is done, an outline for one ahead; below 40em the bar says "Step 1 of 3" instead), a 3px line that grows to the current step, the step, and the order summary. |
| `OrderSummary` | `variant` (panel, disclosure) | What is being bought, on the binder (white on black, highlighter ticks, the total in Besley): a column beside the form from 68em, a native `<details>` row above it below 68em. |
| `Field`, `FieldError`, `ErrorSummary` | `id`, `label`, `required`, `hint`, `error`, children (a function that draws the control) | One field of a form: a real label, an asterisk for a needed field and "(optional)" in words for the others, a hint, the control, and an error line in the alert colour behind a 3px rule that opens with a hidden "Error:". The summary stands at the head of a form sent with something wrong, on the alert wash, takes focus and links to each field. |
| `TemplateDetail` | `template`, `phase`, `titleId` | The pop-up's content: a large lit cover, the "Free sample" tag, the title, facts, what is included, and a button to `/purchase`. |
| `Portfolio` | `size` (page, section), `covers`, `phases`, `className` | `<Portfolio size="page" covers={samples} phases={phaseCoverage(phases, templates)} />`: the toolkit as a folder with its price tag and a tally of the phases. |
| `PriceTag` | `className` | The price from `OFFER` on a paper tag on a string: the amount in Besley with its currency code (`CAD`) small under it. Used by `Portfolio`. |
| `ContentsLeaf` | `className` | The Purchase page's contents leaf: a lit, dog-eared `PaperSheet` (cut as a whole along the fold, with a flap over the cut) holding a ledger (`dl`) of counts from `TOOLKIT`, each a large Besley figure with a drawn highlighter stroke, then the Checkout link (the page's main action, which opens the checkout), the line that leads to the contact page and the sample note. |
| `Hero`, `HeroStage` | `samples`, `phases` | The home page's first screen and its stage, the six free samples as a hand of documents (section 8.5). |
| `ProofStrip` | none | The hero's foot: four facts in a ruled row, on opaque paper. |
| `PurchaseButton` | `className` | The bar's one call to action, with the full price ("$1,499.99 CAD") from 68em; quiet on `/purchase` itself. |
| `BrandLink` | the props of `TransitionLink` | The bar's brand link. A plain link to `/` everywhere but the home page, where a plain click scrolls to the top instead (smooth, instant under reduced motion; no history entry, query and hash kept). |

Rules for them: a catalog tile has exactly one control; a price is printed from `OFFER` and never typed.

`components/about/` holds the sections of the Why Advanta page: `PromiseBand`, `MakingSection`, `PhaseLine`, `BuyersSection`, `CompareSection`, `SiteState` and `SectionHead`; each file's doc comment says what it does.

`components/checkout/` holds the checkout: `CheckoutDialog`, its three steps (`DetailsStep`, `ReviewStep`, `PaymentStep`), `OrderSummary` and the form parts (`Field`, `FieldError`, `ErrorSummary`), built from the kit (`PageDialog`, `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Note`, `TextLink`, `Icon`). A step is its content over a bar of actions that is sticky at the foot of the dialog; the main action is the last one, at the right of the row from 40em and at the foot of the column below it, where each button is the bar's full width. Fields are one column below 40em and two from there (the country beside its region). The colours are the page's own: white paper for the form, the binder for the summary, the highlighter for progress and ticks, and the alert colour for errors only. Under reduced motion nothing in it moves.

`components/contact/` holds `ContactSection`, the whole Contact page as one paper band, built from the kit alone (`Band`, `PageShift`, `Appear`, `BandedList`, `RowLink`, `Icon`). From 68em the `h1` stands in the margin (columns 1 to 3) at the banner size, held to the width of its three columns by the measure the index title blocks use, and the lead stands on its baseline in columns 4 to 12; under the lead the address is a `mailto:` link at the statement size with a 32px arrow (the highlighter fills in behind it on hover and focus, and its size steps down on a phone so the domain never breaks), then one sentence on what to expect; under those, an `h2` and a ledger of four `RowLink`s, each the same address with a subject, held to 64rem. Below 68em it is one column in the same order. It has no ink, no wash and no script.

`components/legal/` holds `LegalPage`, the one layout of the four legal pages (`/privacy`, `/terms`, `/refunds`, `/accessibility`), built from the kit (`TitleBlock`, `Band`, `Eyebrow`, `BandedList`, `RowLink`, `TextLink`, `Icon`) and the type classes. The title block is the `document` form: the date the page last changed stands in the margin under a "Last updated" eyebrow, the `h1` and the summary beside it. Under it one paper band opens on a 2px ink rule, the head rule of a document, and holds three parts. The contents ("On this page") are a ledger of anchors on hairlines, each a number in the faint text colour and the section's heading; hover, focus and press give an entry the wash, ink words and an underline. The article keeps every line to 40rem (`--wrap-lead`, about 68 characters of the copy size): first the page in a few points on the wash ("In short", each point behind a tick), then the numbered sections 56px apart, each `h2` in `.type-section` behind its number in a 28px ruled tile (1px ink, 3px corner, the store's face at weight 700). The tile takes the highlighter with ink on it while its section is the `:target` of the address, so a reader who followed a link sees where it led. Paragraphs and lists are `.type-copy` 21px apart, lists carry square markers in the faint colour, named things (the browser storage entries, what is collected) are a `dl` of rows on hairlines, and a subsection is an `h3` in `.type-item`. The aside ("Policies") lists the four pages as `RowLink`s in a `BandedList`, the current one marked with `aria-current`, over a line with the contact address. From 68em the contents take columns 1 to 3 and the aside columns 10 to 12, both sticky 21px under the bar (contents taller than the window scroll inside themselves), and the article columns 4 to 9; from 40em the contents run in two columns across the top; below 68em the aside stands beside the article where 30rem and 14rem both fit and under it where they do not. Below 68em every entry of the contents is at least 44px tall. Nothing on these pages moves but the 120ms colour changes, there is no ink behind them, and at raised contrast and in forced colours the wash keeps an edge. There are no print styles: the design gate allows no `print` query.

## 10. Logo and icons

### 10.1 The mark

The logo is an "A" made of one strip folded at its peak, in two filled halves that meet on a vertical seam: the arm on the left, which climbs, in the ink, and the leg on the right, which comes down, in the highlighter. It is drawn on a grid 48 by 44 units (`MARK_VIEWBOX`), with a flat peak 10 wide and both legs leaning 11 across for 40 down; the ink is centred in its box, 2 units clear of every side. It has no crossbar and no strokes. The geometry lives in `lib/brand/mark.ts`:

- `MARK_INK_D`: the left half, the arm.
- `MARK_HUE_D`: the right half, the leg. Its left edge runs half a unit under the arm (`MARK_SEAM_X` is 24, the leg starts at 23.5), so no hairline shows on the seam; the arm is drawn over it.
- `MARK_PATH_D`: the whole "A" as one shape, for one ink.

`BrandLockup` renders the mark in tone `two`: the arm takes `currentColor` and the leg takes `--logo-half`, which is the mark colour. `LogoMark` defaults to tone `one`, which fills the whole mark in `currentColor`. Under forced colours `--logo-half` is `currentColor`.

### 10.2 Lockups

`BrandLockup` pairs the mark with the name in Besley. The `tile` variant sets the mark in an ink square, at 60% of the tile's height. The `bare` variant sets the mark and name on the current ground. Sizes are `sm` and `md`. The `md` tile is 28px, and 49px from 68em; the bare `md` mark (the footer) is 36px high. There is one form of the mark at every size.

### 10.3 Site icon

`app/icon.svg` is the site icon: a 32 by 32 ink tile with a 7-unit corner radius, and the mark (the arm in white, the leg in blue) at 84% of its width, centred. It is generated: `node scripts/gen-icon.mjs` writes it from `lib/brand/mark.ts`, and `brand-mark.test.ts` fails when the file is not what the script writes. Its colours are the tokens' values, written out because an icon file cannot read tokens.

### 10.4 Icon set

`Icon` draws eight glyphs on a 20-unit grid with a 1.75 stroke, round caps and joins, and `currentColor`. Its `size` is in pixels at the 16px root and the icon is set in rem (`size / 16`), so on a large monitor it grows with the words and the controls it stands beside (section 6.2). The names are `arrow`, `chevron`, `plus`, `minus`, `close`, `tick`, `bars` and `search` (the magnifier on the catalog search's submit button). Icons are decorative (`aria-hidden`); pair them with a visible or visually hidden label.

## 11. Do and do not

| Do | Do not |
| --- | --- |
| Put content on a sheet, a band, or a panel. | Place text directly on the desk without a band. |
| Use the mark (blue highlight) for what the buyer fills in or owns, with ink. | Use the pale mark fill as a signal on its own, or as text colour on paper. |
| Use the type classes for every text element. | Set font family, size or weight inline. |
| Use the spacing tokens and the 7px module. | Write pixel values for spacing or type. |
| Use `Band` for every full-width stripe, and alternate desk and paper. | Set a band ground with a raw colour or a custom class. |
| Use `PaperSheet` for objects that sit on the desk, and set `depth` deliberately. | Build a card with a border and a radius by hand. |
| Gate every animation and movement inside `prefers-reduced-motion: no-preference`, or start it from a state the boot script sets when motion is allowed. | Animate layout properties or add infinite animations. |
| Use `Appear` for entrances, with `order` for sequences. | Hide content in CSS without a path that shows it again. |
| Keep the grounds plain: paper, desk, the wash and the dark bands. | Put anything that moves behind text, or add a canvas. |
| Use `TransitionLink` or `TextLink` for internal links. | Import `next/link` in a component. |
| Keep the hit area of a control at least 44px below 68em. | Make a target smaller than `--tap` on a phone. |
| Write copy with typographic quotes and apostrophes. | Use straight quotes or exclamation marks in copy. |
| Keep one `h1` on each page. | Use a heading for styling alone. |
| Use `--alert` only for errors and for a locked tile's refusal. | Use the alert colour for emphasis. |

## 12. Accessibility floor

### 12.1 Text and non-text contrast

- Body and heading text meets 4.5 : 1 on every ground the system uses (section 3.3).
- Control borders meet 3 : 1 on the paper and desk grounds (`--line-firm`, 4.56 : 1 and 4.19 : 1).
- The mark is never the only indicator. A marked block, link, or tab carries ink as well.

### 12.2 Focus

- Every focusable element shows a 3px outline with a 3px offset, in `--focus-ring`: ink on light bands, mark on the binder.
- The skip link to `#main` appears on the first Tab.
- Under forced colours, the outline becomes `Highlight`.
- Native dialogs move focus into the dialog and return it to the control that opened it. Escape closes a dialog.

### 12.3 Targets and sizes

- Interactive targets are at least 44px tall below 68em (`--tap`). The desktop bar uses a 40px control.
- The smallest text is 12px and only in uppercase tags. Body copy is 16px.
- Text is sized in rem, so the browser's text size settings apply. The root uses `-webkit-text-size-adjust: 100%`. Past a 1600px window the root grows from the browser's own size (section 6.2), so a visitor's chosen size is the base of the scale and not overridden by it.

### 12.4 Media queries and modes

In stylesheets, the allowed media queries are exactly these, and the design gate rejects any other:

| Query | Behaviour |
| --- | --- |
| `(min-width: 40em)` | The tablet layout. |
| `(min-width: 68em)` | The desktop layout: inline navigation, rail, four-layer depth, twelve columns. There is no query for a larger monitor: the root size scales it (section 6.2). |
| `(hover: hover)` | Hover states and the sheet tilt. |
| `(prefers-reduced-motion: no-preference)` | Every animation and transition. |
| `(prefers-reduced-motion: reduce)` | The global safety net and the reduced-motion branches. |
| `(prefers-contrast: more)` | The bar gets a solid ink border, and paper sheets get a solid border. |
| `(forced-colors: active)` | Blocks use system colours, and borders use `CanvasText`. |
| `@container (max-width: 27.4em)`, `(max-width: 24.3em)` (header), `(max-width: 17em)` (nav drawer) | A name that does not fit its container is hidden visually and stays readable to assistive technology. |

Scripts query only forms from this list. Stylesheets do not query `prefers-color-scheme`. `:root` declares `color-scheme: light`, and the design gate enforces this.

### 12.5 Semantics

- Site pages have one `header` (the banner), one `main` with `id="main"`, and one `footer` (the contentinfo landmark).
- Navigation is labelled: `Primary` for the header, `Phases` for the rail, `Footer` for the footer's site and legal links, `Breadcrumb` on section pages, `Pagination` on catalog pages, `Start from a phase` for the phone catalog's strip, `Browse by phase` in the catalog's empty search, `Previous and next phase` at the foot of a phase page, and `Menu` for the site drawer.
- The current page is marked with `aria-current="page"`, and the current section with `aria-current="true"`.
- Decorative elements are hidden from assistive technology: the 90% figure (its heading says it in words), unlabelled tallies, numerals on phase tabs, the specimen sheet and the cover of a first visit (a locked cover has nothing drawn over it; the tile's button says "locked").
- Each `Tally` or count with a meaning carries a `label`.
- A form field has a real `<label>`, an `autocomplete` token, `required` where it is needed and "(optional)" in words where it is not. An error is tied to its control with `aria-invalid` and `aria-describedby` and never rests on colour alone; a form sent with errors moves focus to a summary that links to each field. A change of step in the checkout moves focus to the step's heading and is announced by a polite status line.

### 12.6 Motion

- Motion is off for reduced motion.
- The cover never plays under reduced motion.
- No motion is infinite.

## 13. Contributing checklist

- Read the token before you write a value. If a value is not a token, add one in `app/globals.css` and use it.
- Compose with primitives: `Band`, `Wrap`, `Split`, `PaperSheet`, `Button`, `RowLink`, `BandedList`.
- Check the contrast table for every pairing, and test it under forced colours and `prefers-contrast: more`.
- Gate every animation and movement inside `no-preference`, or start it from a state the boot script sets when motion is allowed, and add its hook to section 8.5.
- Run the checks from the repository root:

```sh
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e
```

`corepack pnpm test` runs the design gate and the unit tests. `corepack pnpm test:e2e` builds the site, serves it on port 3100, and checks identity, motion, reduced-motion, menu and keyboard behaviour in a browser (`tests/e2e`).
