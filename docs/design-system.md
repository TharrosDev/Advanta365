# Design system: Wet Ink

Advanta365 sells working documents that are 90% written. The site is drawn as a working copy: white
pages already written in black ink, with the few things left for the buyer marked in a light-blue
highlighter. In this edition the ink is wet: black ink falls into clear water beside the headline and
light blue blooms through it, the products are sheets of paper on a light table, and type is set
large in Besley. This document describes that look: the idea, the tokens, the motion system, the
ink, the primitives and the rules the code relies on. For how the parts connect, see
`architecture.md`.

The presentation layer is plain CSS Modules reading custom properties. Every visual value comes from
a token in `app/globals.css`, so no component file carries a raw colour, a Tailwind class or a
one-off spacing value.

## Where things live

- `app/globals.css`: the tokens, the five `[data-band]` surfaces, the base rules, the `.type-*`
  classes, `.visually-hidden`, `.tabular`, the reduced-motion safety net and the forced-colours
  rules. With `app/icon.svg` it is the only place that holds raw colour values. It starts with the
  import of `app/motion.css`.
- `app/motion.css`: the motion system (see "Motion"), the only stylesheet that names a scroll or
  view timeline.
- `app/layout.tsx`: the two fonts, loaded through `next/font/google` and exposed as `--font-besley`
  and `--font-atkinson`, the inline boot script first thing in `<body>` and `MotionRoot` after the
  children.
- `components/ui/`: the primitives. Each has a `.module.css` beside it unless noted.
- `components/layout/`: the shell (bar, phase rail, drawer, footer, beta strip) and the page-opening
  `TitleBlock`.
- `components/intro/`: the cover a first visit to the home page opens under (see "The cover" under
  Ink). `components/ink/`: the backdrop, the layer and the pause button. `lib/ink/`: the engine, the
  scenes, the zones and the stills manifest. `lib/boot/`: the boot script. `lib/scroll/`: the
  observer and the pointer light. `public/ink/` holds the eleven stills, `public/paper/` the grain.
- `lib/cx.ts`: `cx()` joins class names, `cssVars()` builds typed inline custom properties.
- `lib/brand/mark.ts`: the logo mark, the single source for `LogoMark` and `app/icon.svg`.
- `tests/unit/design-gate.test.ts`: fails when a retired name, value or technique comes back (see
  "The design gate").

## Concept

**Black ink is what is done. The light-blue highlighter marks what is yours. Black is the action.**

The identity is three colours: white, black and light blue. White is the paper. Black writes
everything that is finished and is the solid button that moves the buyer on. Light blue is used the
way a highlighter is used on a printed page: in small strokes, over black text, on the parts that
are the reader's own.

| Device | What it is                                                                                                          | Where                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Ink    | Near-black for everything already done: text, line art, filled tally blocks, ticks, and the solid button            | Everywhere                                                                                                    |
| Mark   | One light-blue highlighter for what the buyer owns or has chosen, always with ink text and an ink edge              | Current page or phase, a checked filter, the cart count, a saving, the blank, the tenth block, a hovered link |
| Blank  | A highlighted empty field with a text caret                                                                         | The specimen, every template cover (foot), empty cart, 404, empty results                                       |
| Tally  | A row of blocks. Nine inked and the tenth marked is the 90/10 claim; seven is "phase n of 7" or a bundle's coverage | The specimen, "The answer", closing, phase and template pages, bundle cards                                     |
| Margin | A left column (columns 1 to 3) for labels, breadcrumbs and meta, with no rule beside it | Statement sections and the document pages |
| Tabs   | Numbered index tabs 1 to 7 for the phases; a folder tab on each bundle                                              | Phase rail, home phase list, bundle cards                                                         |
| Objects | Sheets of paper with tooth and layered shadow on a light desk: covers, stacks, folders, panels. Ledgers (rows between hairlines) where a list is read | Products, the purchase panel, tables, the specimen |
| Ink | Real-time black and light-blue ink in water, behind a few headlines | The home hero, the ninety, the closing, the title blocks, the footer, the 404 |

### The rules of the Mark

1. It means "yours": the place you are, a choice you made, a state that is about you, the part
   left for you to fill in. It is a small signal. It is never decoration, never a section
   background and never a large solid surface.
2. On a light surface it is too pale to stand alone (1.89 against paper), so it is never text,
   never a thin line and never the only cue. Every marked element also carries ink: a 2px ink
   border or inset ring, ink text, an ink tick or a heavier weight.
3. Text on the mark is ink, always. It never carries white text. (`--on-mark` is `--ink`.)
4. The primary action is not the mark: it is solid ink with white text. The mark is where that
   button goes under the pointer or keyboard focus, inside its ink border. A marked fill that is
   itself pressed or hovered goes one step deeper, to `--mark-deep`.
5. `--mark-wash`, the diluted mark, may fill one band per page. It is also the hover fill of rows,
   outline controls, navigation links and page numbers, and the ground of notes and the beta strip.
6. On the binder the mark is strong enough (10.11) to be a line: the tail of the logo, the focus
   ring and the underline of a hovered link. Nothing else there is marked. On ink it is as strong
   (10.26): the tail of the logo on its tile and, on the cover of a first visit, that tail, the
   tenth block and the edge that trails the sheet.

Every page shows the mark in several places: the beta strip and the tail of the logo at the top,
the square before each section label, the current item of the navigation, and whatever the page
itself marks (a tally, a blank, a saving, a checked filter).

There is one theme. There is no dark mode, no theme attribute and no scroll trigger. The only dark
surface of a page is the footer. The cover of a first visit is a sheet of ink over the page, for a
little over two seconds, and is no part of it.

## Colour

### Palette

Solid values; there are no alpha ramps. Every neutral leans a little toward blue, so the greys sit
with the mark.

| Token              | Hex                   | Use                                                                                              |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| `--paper`          | `#FFFFFF`             | Page ground, bar, sheets, panels, tables, inputs, reading and ink bands                          |
| `--desk`           | `#F4F5F8`             | The light table under objects: shelves of sheets and folders                                     |
| `--desk-deep`      | `#E6E8EE`             | Cover tiles, the empty cart badge, disabled fills                                                |
| `--rule`           | `#D2D5DE`             | Decorative borders and the margin rule. Never the only cue                                       |
| `--rule-firm`      | `#70758A`             | Borders that identify a control (input, select, checkbox), empty tally blocks                    |
| `--ink`            | `#0B0D12`             | Text, line art, strong borders, inked blocks, the solid button, the logo tile, the cover         |
| `--ink-soft`       | `#3A3F4C`             | Leads, descriptions                                                                              |
| `--ink-faint`      | `#596072`             | Meta, counts, captions                                                                           |
| `--mark`           | `#86C1FF`             | The highlighter                                                                                  |
| `--mark-deep`      | `#5FA8F5`             | A marked fill that is pressed or under the pointer (a pressed button, a checked box)             |
| `--mark-wash`      | `#EAF4FF`             | Beta strip, the one wash band, hover fills, notes, the Advanta365 column of the comparison table |
| `--on-mark`        | `var(--ink)`          | Text and ticks on the mark: always ink                                                           |
| `--on-ink`         | `#FFFFFF`             | Text on an ink fill (the solid button, the logo tile, the cover)                                 |
| `--binder`         | `#0D0F15`             | Footer ground (the only dark surface)                                                            |
| `--binder-rise`    | `#1C202B`             | Raised areas on the binder                                                                       |
| `--on-binder`      | `#F4F5F8`             | Text on the binder                                                                               |
| `--on-binder-soft` | `#B4B9C7`             | Secondary text on the binder                                                                     |
| `--rule-on-binder` | `#343947`             | Decorative lines on the binder                                                                   |
| `--alert`          | `#A32B1D`             | Error text and borders only (reserved; no error UI exists yet)                                   |
| `--alert-wash`     | `#FBEAE5`             | Error message ground                                                                             |
| `--scrim`          | `rgb(11 13 18 / 0.5)` | Dialog backdrop                                                                                  |

Depth is the `--depth-*` family and `--bar-shadow` (the sticky bar), all cast in the ink colour (see
"Depth and paper objects"). `--lift` remains as an alias of `--depth-3`. The page itself is
`--paper`; `--desk` is the light table under objects.

### Semantic layer

Components never read the palette directly. They read the semantic layer, which a surface redefines:
`--ground`, `--surface`, `--stripe`, `--tile`, `--text`, `--text-soft`, `--text-faint`, `--line`,
`--line-firm`, `--line-ink` and `--focus-ring`. `:root` carries the `desk` values.

A section declares its surface with `data-band` (the `Band` primitive sets it). `[data-band]` paints
`--ground` and sets `--text`, so everything inside inherits the right colours. Edges between bands
are hard: no transition, no gradient, no registered properties.

| `data-band` | ground    | surface     | stripe      | tile        | text / soft / faint                         | line / firm / ink                           | focus ring |
| ----------- | --------- | ----------- | ----------- | ----------- | ------------------------------------------- | ------------------------------------------- | ---------- |
| `desk`      | desk      | paper       | desk        | desk-deep   | ink / ink-soft / ink-faint                  | rule / rule-firm / ink                      | ink        |
| `paper`     | paper     | paper       | desk        | desk-deep   | same                                        | same                                        | ink        |
| `wash`      | mark-wash | paper       | desk        | desk-deep   | same                                        | same                                        | ink        |
| `binder`    | binder    | binder-rise | binder-rise | binder-rise | on-binder / on-binder-soft / on-binder-soft | rule-on-binder / on-binder-soft / on-binder | mark       |

`desk` is the default. `binder` is used by the footer alone; `wash` by at most one band per page.

### Contrast

WCAG 2.1 ratios, computed for these values.

| Foreground on background                                               | Ratio                             | Level        |
| ---------------------------------------------------------------------- | --------------------------------- | ------------ |
| ink on paper / desk / desk-deep / mark-wash                            | 19.43 / 17.83 / 15.86 / 17.48     | AAA          |
| ink on mark / mark-deep (every marked element; a pressed button)       | 10.26 / 7.78                      | AAA          |
| ink-soft on paper / desk / desk-deep / mark-wash / mark                | 10.52 / 9.65 / 8.59 / 9.46 / 5.56 | AA or better |
| ink-faint on paper / desk / desk-deep / mark-wash                      | 6.29 / 5.77 / 5.13 / 5.65         | AA           |
| on-ink on ink (the solid button, the logo tile, the cover)             | 19.43                             | AAA          |
| on-binder on binder / binder-rise                                      | 17.57 / 14.92                     | AAA          |
| on-binder-soft on binder / binder-rise                                 | 9.76 / 8.29                       | AAA          |
| mark on binder (logo tail, focus ring, hover underline)                | 10.11                             | passes 3:1   |
| mark on ink (the tail on the logo tile; on the cover, tail and edge)   | 10.26                             | passes 3:1   |
| rule-firm on ink (the outline of a block of the cover, not yet filled) | 4.26                              | passes 3:1   |
| alert on paper / alert-wash / desk                                     | 7.19 / 6.16 / 6.60                | AA           |
| rule-firm on paper / desk / desk-deep / mark-wash (control borders)    | 4.56 / 4.19 / 3.73 / 4.10         | passes 3:1   |
| ink focus ring on any light surface, the mark included                 | 10.26 or more                     | passes 3:1   |

Not for text or meaning: `--rule` (1.47 on paper), `--rule-on-binder` (1.66), and `--mark` against
paper (1.89), desk (1.74) or the wash (1.70). That is why rule 2 of the Mark exists, and why the
focus ring on a light surface is ink. `--ink-faint` is never set on the mark (3.32); text on
`--mark` is `--ink` only. The wash and the desk are equally light (1.02 between them), so a wash
fill on a desk surface is a change of hue: a hovered row also underlines its label and moves its
arrow.

### What colour never does

No file-format or app colours, no multi-colour motif, no second accent beside the light blue. No
gradients, glows, blurs or transparency effects. No white text on the mark, no blue text, and no
large solid blue surface: the pale wash band is the only blue ground. On a light surface the mark
is never a line. On the binder the mark is the logo tail, the focus ring and the underline of a
hovered link, and nothing else. On the cover it is the tail, the tenth block and the trailing edge.

## Type

Two variable families, roman only, Latin subset, `display: "swap"`, loaded in `app/layout.tsx`:

```ts
const besley = Besley({ subsets: ["latin"], display: "swap", variable: "--font-besley" });
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-atkinson",
});
// <html lang="en" dir="ltr" className={cx(besley.variable, atkinson.variable)}>
```

- Besley (a Clarendon slab) is the voice of the documents: titles, statements, figures, amounts and
  the brand name. `--face-display` is its stack.
- Atkinson Hyperlegible Next is the voice of the store: copy, navigation, controls and labels.
  `--face-text` is its stack.
- Weights in use: Besley 400 (quoted lines), 600 (headings), 700 (amounts, brand name, numerals), 800
  (figures); Atkinson 400 (copy), 600 (controls), 700 (labels, emphasis). `font-synthesis: none`.

### Scale

Global classes in `app/globals.css`. Each sets family, size, line height, weight and tracking, so a
component picks a class and adds only colour and line length. The size tokens are `--size-figure`
and so on, one per class.

| Class           | Face, weight              | At 390px | At 1280px and up | Line height | Tracking | Used for                                                       |
| --------------- | ------------------------- | -------- | ---------------- | ----------- | -------- | -------------------------------------------------------------- |
| `.type-figure`  | Besley 800                | 96       | 176              | 0.9         | 0        | "90%", "404"                                                   |
| `.type-banner`  | Besley 600                | 34/38    | 56/62            | 1.12        | 0        | Home h1, "Why it's different" and closing statements           |
| `.type-page`    | Besley 600                | 28/32    | 40/46            | 1.16        | 0        | Inner h1, section statements, shelf titles                     |
| `.type-section` | Besley 600                | 22/27    | 26/32            | 1.24        | 0        | Side-head h2, step titles, panel titles                        |
| `.type-item`    | Besley 600                | 18/23    | 20/26            | 1.3         | 0        | Card titles, row labels, FAQ questions                         |
| `.type-amount`  | Besley 700                | 30/33    | 40/44            | 1.1         | 0        | Prices in panels, subtotal, price ranges                       |
| `.type-lead`    | Atkinson 400              | 18/27    | 20/30            | 1.5         | 0        | Leads                                                          |
| `.type-copy`    | Atkinson 400              | 16/25    | 17/27            | 1.58        | 0        | Paragraphs, table cells                                        |
| `.type-ui`      | Atkinson 600 (inputs 400) | 16/22    | 16/22            | 1.375       | 0        | Navigation, buttons, inputs, filter options, card prices (700) |
| `.type-note`    | Atkinson 400              | 14/20    | 14/20            | 1.43        | 0        | Meta, captions, breadcrumbs, legal                             |
| `.type-eyebrow` | Atkinson 700, uppercase   | 13/18    | 13/18            | 1.385       | 0.08em   | Section labels, legends, table heads, fact labels              |
| `.type-tag`     | Atkinson 700, uppercase   | 12/16    | 12/16            | 1.333       | 0.06em   | File-format tags only                                          |

The larger sizes are fluid (`clamp()` between the two widths). Floor: no sentence-case text below
14px. The two smaller sizes are uppercase, bold and tracked; the uppercase is CSS `text-transform`,
so the DOM text is unchanged.

`.tabular` (`font-variant-numeric: tabular-nums lining-nums`) goes on prices, counts and table
numerals. Besley's own figures are already lining, and its tabular zero exists at one weight only,
so the display classes (`.type-figure` to `.type-amount`) keep the font's own figures
(`font-feature-settings: "tnum" 0`) even where `.tabular` is set. A module that sets `--face-display`
on a numeral itself adds the same declaration.

### Behaviour

- Sentence case everywhere except `.type-eyebrow` and `.type-tag`. No negative tracking anywhere.
- `text-wrap: balance` on `h1` to `h3`; `text-wrap: pretty` on paragraphs.
- Line length: paragraphs `max-width: var(--wrap-copy)` (36rem), leads `var(--wrap-lead)` (40rem),
  headings `var(--wrap-head)` (22em).
- Headings never animate, are never split into words and carry no effect. The cover of a first
  visit lies over the headline and leaves it alone.
- A statement of two sentences (a `\n` in the string) is set one sentence per block with
  `Sentences`: each sentence is a `display: block` span and a space joins them, so the heading text
  stays the plain statement and every sentence is balanced by itself.
- A hyphenated compound ("End-User", "ready-to-use") is never broken across two lines in a page
  title, a card or row title, or the short copy of the home page (the hero lead, the manifest rows,
  the values): the text goes through `KeepCompounds`.

## Space, grid, shape, layers

The module is 7px, one per rollout phase. The margins, padding and gaps of a layout are steps of the
scale; a few small parts (a tag's 2px padding, the 10px side padding that makes a bar control a 44px
square) are the only exceptions.

| Token   | Value          |     | Token   | Value         |
| ------- | -------------- | --- | ------- | ------------- |
| `--s-1` | 0.4375rem (7)  |     | `--s-6` | 3.5rem (56)   |
| `--s-2` | 0.875rem (14)  |     | `--s-7` | 5.25rem (84)  |
| `--s-3` | 1.3125rem (21) |     | `--s-8` | 7rem (112)    |
| `--s-4` | 1.75rem (28)   |     | `--s-9` | 10.5rem (168) |
| `--s-5` | 2.625rem (42)  |     |         |               |

### Grid

The only two layout breakpoints are `(min-width: 40em)` and `(min-width: 68em)`, mobile first.

| Token                                | Phone (under 40em) | Tablet (40em to 68em) | Desktop (68em and up) |
| ------------------------------------ | ------------------ | --------------------- | --------------------- |
| Columns                              | 4                  | 8                     | 12                    |
| `--col-gap`                          | 14px               | 21px                  | 28px                  |
| `--page-pad`                         | 21px               | 28px                  | 42px                  |
| `--band-pad` (section block padding) | 56px               | 84px                  | 84px                  |
| `--bar-h`                            | 56px               | 56px                  | 70px                  |

Other tokens:

- Page: `--page-max` 77rem (1232px: twelve 77px columns and eleven 28px gaps), `--rail-h` 2.625rem
  (42), `--wrap-copy` 36rem, `--wrap-lead` 40rem, `--wrap-head` 22em.
- Controls: `--control-sm` 2.5rem (40, the desktop bar only), `--control` 3rem (48), `--control-lg`
  3.5rem (56), `--tap` 2.75rem (44, the minimum target below 68em).
- Shape: `--round-1` 3px (tags, blocks, checkboxes), `--round-2` 6px (controls, tiles, tabs),
  `--round-3` 10px (sheets, cards); `--edge` 2px (ink and control borders), `--hair` 1px (decorative
  borders).
- Layers: `--layer-bar` 50, `--layer-skip` 90, `--layer-cover` 100 (the cover of a first visit, over
  everything for as long as it is up). Dialogs use the top layer.

Other queries that are allowed: `(hover: hover)`, `(prefers-reduced-motion: reduce)` and
`(forced-colors: active)`. The bar and the drawer also use `@container` queries, because a row there
has to fit the width of its own box and not the window (see the bar in `architecture.md`). The two
facing sheets of the home page are size containers as well, with no `@container` rule: their largest
type is capped in `cqi`, so "90%" and the problem heading fit a narrow sheet. Test viewports: 320,
360, 412, 640, 1088, 1280 and 1440.

Rhythm: heading to content 42, paragraph to paragraph 21, card grid gap 28 (21 on a tablet, 14 on a
phone). No section has a viewport-based height. `html` carries
`scroll-padding-top: calc(var(--bar-h) + var(--s-3))`, so anchors and focused elements stop clear of
the sticky bar.

## Motion

One rule: the ink is the one thing that moves big. Everything else moves a little, by the same four
verbs, and every verb has a reason. The page is complete at first paint: nothing waits for an
animation, and what the visitor sees without JavaScript, under reduced motion or with the ink off is
the same page.

### The system

All of it lives in the global `app/motion.css` (the only stylesheet that may name a scroll or view
timeline) and is asked for by hooks in the markup, never by a stylesheet of a page.

| Hook                                    | What it is                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `data-move="drift"`                     | An entrance: 12px up and in. Copy, leads, rows                                              |
| `data-move="ink-in"`                    | An entrance: from blurred to sharp. Statement sentences only (`Sentences move`)             |
| `data-move="settle"`                    | An entrance: down from 28px above onto the desk, with a shadow that arrives after it        |
| `data-move="grow"`                      | An entrance: a hairline grows from the left. Ledger rules                                   |
| `data-when="load"` with `--order`       | The entrance runs by the clock at page load, `--stagger` (70ms) apart                       |
| `data-ninety`                           | The one band whose figure and tally follow the scroll                                       |
| `data-bar`                              | The bar: its shadow is a pseudo-element whose opacity follows the scroll                    |
| `data-paper`, `data-lit`                | A paper object, and its light under the pointer                                             |

- **Entrances** follow the element's own passage through the viewport on a view timeline, linear,
  filled both ways, so an element already in view at load is simply where it belongs. The far end of
  each range is capped by a length so the last block of a short page on a tall window still
  finishes. Without view timelines (Firefox) a small observer, `components/ui/motion-root.tsx`
  with `lib/scroll/observe.ts`, marks each element `data-seen` as it arrives and the same
  keyframes run by the clock. Load entrances (the hero, the title block's lead) never wait for
  scroll.
- **The ninety** (`#solution`): as the band goes through the window, the odometer's wheel rolls from
  blank to 9 and the ten blocks of the tally ink in one after another; the tenth turns light blue
  and the ink layer drops one light-blue drop from it. Without view timelines the band is marked
  seen and the fill runs by the clock, and the tenth block's `animationend` is the cue for the drop.
  Both the figure and the tally are drawn in their final state without JavaScript.
- **Shift**: a state change (hover, focus, press, current, open) on buttons, links, rows and tabs
  shifts colour, border or underline over `--time-swap`, linear. A press is `translate: 0 1px`.
- **Enter**: a panel arrives. The phone drawer from the right (320ms, `--curve-settle`) with its links
  drifting in 40ms apart, the filter sheet from the bottom, the scrim, the FAQ panel. Dialogs close
  instantly.
- **Change of page**: a client navigation runs a view transition. The old page fades out in
  `--time-page-out`, the new one in over `--time-page-in`, and a template's sheet or a bundle's
  folder travels from where it was clicked to where it stands on the next page
  (`view-transition-name` `cover-<slug>` and `folder-<slug>`, `--time-morph`). A filter, sort or
  search change under the same address starts no view transition. Where the browser has no
  `document.startViewTransition` the page simply changes. `components/ui/page-shift.tsx` names the
  first block of a page; if view transitions ever prove unstable, the fallback is one edit there
  (return the children), plus dropping the `ViewTransition` wrapper in `template-cover.tsx` and
  `folder.tsx`.
- **Cart badge**: pops (`scale` 1, 1.3, 1; 320ms) when the count changes after the stored cart has
  been read.

### The three switches

`<html>` carries three attributes, set by the boot script before first paint (`data-motion`,
`data-timeline`) and by `MotionRoot` after hydration (`data-io`). A hidden starting state always
needs `data-motion="on"`, and on the observer path `data-io="armed"` as well, so a script that never
runs hides nothing: without JavaScript every `[data-move]` is at opacity 1.

### Rules every animation keeps

- Only `opacity`, `filter`, `translate`, `rotate`, `scale`, `transform`, `clip-path` and
  `background-color` animate. A custom property never does (there is no `@property`), and a shadow
  never does: a shadow that comes or goes is a second shadow on a pseudo-element whose opacity moves.
- Every `@keyframes`, `animation` and `transition` sits inside
  `@media (prefers-reduced-motion: no-preference)`, with the final state outside it. Keyframes name
  the starting state only; the end is whatever the element is, so hover states survive a finished
  entrance. `tests/unit/kit-motion.test.ts` checks this against the stylesheet.
- Nothing repeats (the word `infinite` is banned in any stylesheet), nothing is split below a
  sentence, no heading translates and the page `h1` never animates at all.
- `animation-timeline` and `animation-range` are written after any `animation` shorthand, which would
  reset them.
- Everything that starts by itself outside the ink ends within five seconds of first paint. The ink
  runs longer, so it has a pause control (see "Ink").

Under `prefers-reduced-motion: reduce` there is no cover, no ink engine, no entrance (every
`[data-move]` is at opacity 1 with no filter), no view transition and `document.getAnimations()` is
empty on every route. Under `prefers-contrast: more` and forced colours the ink and the grain are
removed, objects get a 1px ring and the bar a hairline instead of its shadow.

## Depth and paper objects

Nothing is a bordered box in a grid. A thing is an **object** or a **ledger**.

- **Objects**: a paper sheet, a stack, a folder, a panel. White paper (`--paper`) with tooth (a
  128px grain, `public/paper/grain.png`, 2.4KB, four alphas, generated by `scripts/paper-grain.mjs`)
  under its content, a 1px ring at 5% ink inside a layered shadow, and no border. The shadow depth
  is a token: `--depth-0` (a ring), `--depth-1` (a resting sheet), `--depth-2`, `--depth-3` (the
  purchase panel, a lifted sheet), `--depth-4` (the drawer and the filter sheet) and
  `--depth-on-ink`. Inside a `PaperSheet` and a `Folder` front the semantic colours are reset to
  light-surface values, so they are safe on the black band.
- **Ledgers**: rows separated by hairlines, no outer box and no stripes (`BandedList`, also exported
  as `Ledger`). Hairlines grow on a view timeline. A `RowLink` stands 14px past both ends of its row,
  so a ledger must not sit in an `overflow: hidden` box.
- **Grounds**: `desk` (`#F4F5F8`, the light table under objects), `paper` (white, reading and ink
  stages), `wash` (at most one per page), `ink` (black: only `#solution` and the AI statement on
  `/about`) and `binder` (the footer only). The body is `--paper`. A band with a backdrop is
  `position: relative; isolation: isolate`.
- **Light**: a lit sheet (`data-lit`) rises 3px and tilts under the pointer and under keyboard focus,
  and its lifted shadow arrives with it. `lib/scroll/pointer.ts` (`trackLight`) writes where the light stands
  on the sheet (`--lx`, `--ly`, in percent) and its tilt (`--tx`, `--ty`, at most 1.2 degrees); a lit
  sheet answers hover on itself, or on the nearest `article` or `[data-lit-scope]`.
- **The three product objects** (`components/catalog/`): `TemplateCover` is an HTML page on a
  `PaperSheet`, printed with the template's own title and summary, in its format (a document is a
  portrait page 5:7, a workbook 4:3, a deck 16:9), sized from its own width. `TemplateCard` is an
  `<article>` with one stretched link, as a row (`layout="row"`: an index of 24 rows with a numeral
  chip and a thumbnail) or a sheet (`layout="sheet"`: the home page's spread). `BundleCard` is a row
  or a feature folder (`layout="feature"`).

### Tokens added in this edition

`--depth-0` to `--depth-4` and `--depth-on-ink`; `--paper-shade` and `--grain`; the six pigments the
ink engine reads (`--pigment-paper`, `--pigment-binder`, `--pigment-black`, `--pigment-blue`,
`--pigment-blue-dark`, `--pigment-pale`); `--time-lift`, `--time-ink`, `--time-settle`,
`--time-count`, `--time-page-out`, `--time-page-in`, `--time-morph` and `--stagger`; `--curve-ink`,
`--curve-drop` and `--curve-pen`; `--layer-over` and `--layer-cover`; `--strip-h` (0px, set by the
beta strip while it shows). The type classes `.type-poster`, `.type-hero` and `.type-statement` join
the others.

## Ink

The showpiece. Black ink falls into water beside the home headline and curls, a plume of light blue
(the part that is yours) blooms through it, and the pointer stirs it. It is a real-time fluid
simulation (`lib/ink/engine/`), drawn on one canvas that moves between stages as the page scrolls.
How it is built is in `architecture.md`; this section is the design contract.

**The look**: macro photography of ink dropped into a glass tank. A drop forms a rolled cap with a
trailing stem and fine filaments; veils are translucent grey; cores are near-black with a soft
self-shadow; light blue stays light. The white field stays exactly white, with no banding, grid or
stair-steps, and nothing shines: the engine has no specular term, no environment map, no striping and
no iridescence. Light blue is `--pigment-blue` (`#5FA8F5`) with a blue tint that keeps the darkest 1%
of saturated blue at a relative luminance of at least 0.25 and a hue between 205 and 216.

**Stages**: where ink may appear.

| Where                                                                      | Scene    | Live ink                                     |
| -------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| `/`, first visit of a session: the cover                                   | `intro`  | Yes                                          |
| `/` hero                                                                   | `hero`   | Yes                                          |
| `/` `#solution` (black)                                                    | `ninety` | Yes, from the tenth block                    |
| `/` `#closing`                                                             | `bloom`  | Yes                                          |
| Footer (black), every page                                                 | `wisps`  | Yes, except on calm routes (a still instead) |
| `/about`, `/pricing`, `/contact`, `/sample`, `/bundles`, `/phases/[phase]` | `title`  | From 68em; nothing below                     |
| 404, both not-found files                                                  | `spill`  | Yes                                          |

Calm routes (`/catalog`, `/cart`, `/templates/*`, `/bundles/*`) never load the engine: buying pages
carry no live ink at all. The footer shows the `wisps` still there.

**Legibility** is a guarantee, not a likelihood. A page marks the copy the ink must keep clear of
with `data-ink-calm`:

| Kind      | Marks                                                      | Cap on a light ground | Cap on a dark ground |
| --------- | ---------------------------------------------------------- | --------------------- | -------------------- |
| `text`    | Copy, leads, notes and controls: ink is kept out           | 0.80                  | 0.06                 |
| `display` | Headings of 32px and more: ink passes behind               | 0.30                  | 0.14                 |
| `veil`    | The footer, edge to edge: wisps pass behind, capped        | 0.80                  | 0.06                 |

A cap is a floor (light ground) or a ceiling (dark ground) on the relative luminance of the canvas
under the zone, applied in the composite in linear light. Worst cases are all AA: ink on a 0.80 floor
is 15.7:1, `--ink-faint` 5.1:1, display text in ink at 0.30 is 6.5:1; on the dark ground at 0.06
`--on-binder` is 8.8:1. `data-ink-anchor="open" | "tenth"` names a rectangle a scene aims at (the
open water beside the hero, the tenth block). `data-edges` on a backdrop lists the sides where the
ink thins to exact ground before the canvas ends.

**The pause control** (WCAG 2.2.2): while a stage is live, one button, `Pause ink`, stands at the foot
of that stage (a 44px target holding a 32px round of paper with `--depth-1`, a two-bar glyph in
`--text`, the usual 3px ring), before the stage's content in the tab order. It stops the loop at
once and is renamed `Play ink`. The choice lasts the session: after a reload the page starts paused
(stills, no engine) and offers `Play ink`. There is no button in `still` mode, on calm routes or
during the cover. With no input the water comes to rest by itself after a scene's run window (30s on
the hero) and moves again on a pointer move, a click (which leaves a light-blue drop) or a scroll.

**Stills** stand in for the ink where it cannot run: without JavaScript, under reduced motion, when
the visitor paused it, on calm routes, on a software renderer, without WebGL2, after a lost context
or a failed chunk, and never under `prefers-contrast: more` or forced colours (no ink at all). A
still is a settled frame of the same engine, captured on the real page (see `architecture.md`), so the
caps are baked in. Each is scaled by the width of its backdrop and by nothing else, so the picture
and the layout keep their proportions; the title still stands at its own size in its corner.

### The cover

A first visit is the first page load of a browser session, when that page is the home page. White, a
pen strokes the mark (the legs, the crossbar, the tail in light blue), the name fades in, "Skip"
sits at the foot. With ink ready in the first second, a black drop falls through the mark, a
light-blue one chases it, the ink turns to mist and the page is there (about 2.8s after the
take-over); without ink the cover fades at 1.65s. Any key, press, wheel or touch ends it within
200ms and does not navigate. The page under it is complete and opaque from first paint (the h1 is
painted, so Largest Contentful Paint is not held back). Its timings are local to
`components/intro/intro-cover.module.css`; its states are the `data-intro` values on `<html>`
(`play`, `ink`, `leave`). Never on any page but `/`, never twice in a session, never under reduced
motion, without JavaScript, with storage blocked or in a tab that loads hidden.

## Global CSS

`app/globals.css` holds these rules, in this order. Components do not repeat them.

1. The import of `app/motion.css`, then the token block: `:root`, the two breakpoint overrides and
   the `[data-band]` scopes (`desk`, `paper`, `wash`, `ink`, `binder`; `ink` shares the binder's
   values). The cover's timings are not here: they are local to its own module.
2. Base: `box-sizing: border-box` on everything; `html` with `scrollbar-gutter: stable`,
   `scroll-padding-top` and `-webkit-text-size-adjust`; `html:has(dialog[open])` with
   `overflow: hidden`; `body` (desk ground, ink text, Atkinson at the copy size, weight 400, line
   height 1.58, `font-synthesis: none`); zero margins on headings, `p`, `figure`, `dl` and `dd`;
   `text-wrap` on headings and paragraphs; `a { color: inherit }`; controls inherit font and colour.
   There is no global list reset: each module resets its own lists.
3. `[data-band] { background: var(--ground); color: var(--text) }`.
4. Focus: `:focus-visible` is a 3px outline in `--focus-ring`, offset 3px, on every surface.
   Selection: `::selection` is `--mark` with `--ink` text.
5. `[hidden]` always wins over a component's own `display`, except `hidden="until-found"`, which
   must stay in the layout so find-in-page can open it.
6. The twelve `.type-*` classes, `.visually-hidden` and `.tabular`.
7. The reduced-motion safety net (`app/motion.css` carries the rest: no entrance, no view
   transition).
8. Forced colours: tally blocks, the blank, `[aria-current]` and the focus ring get system colours
   (`CanvasText`, `Highlight`, `Canvas`), so every state stays visible when backgrounds are dropped.
   (The cover sets its own in its module.)

There is no `@property`, no `data-theme`, no `prefers-color-scheme`, no `.ruled` and no `.t-*`,
`.w-*` or `.c-fg-*` class.

## Brand

The A glyph is drawn from three strokes in `lib/brand/mark.ts`: `MARK_VIEWBOX` (32 by 24),
`MARK_ASPECT`, `MARK_STROKE_WIDTH` (4.2), `MARK_SEGMENTS`, `MARK_PATH_D` (the whole mark as one
path), and the two halves `MARK_BODY_D` (both legs and the crossbar up to the centre line of the
right leg) and `MARK_TAIL_D` (the crossbar's overshoot past the right leg). The body is also given
as the two strokes a pen makes, `MARK_LEGS_D` and `MARK_BAR_D`, which together are `MARK_BODY_D`.

- `LogoMark tone="one"` strokes `MARK_PATH_D` in `currentColor`. `tone="two"` draws the tail first in
  `var(--logo-tail, currentColor)`, then the body in `currentColor` over it. Round caps and joins.
- Tile lockup (bar, drawer): the two-ink A on a square `--ink` tile, body `--on-ink` and tail
  `--mark`, then the name.
- Bare lockup (footer): the two-ink A, body `--on-binder` and tail `--mark`, then the name in
  `--on-binder`.
- The name is "Advanta365", one unbroken word in Besley 700 with no tracking. It is never split,
  never set around the mark, never larger than 28px and never 3D. It moves once: on the cover of a
  first visit it fades in, whole.
- The mark is never rotated, tilted or drawn in 3D. It is written once, stroke by stroke, on the
  cover of a first visit (`IntroCover` draws the tail, `MARK_LEGS_D` and `MARK_BAR_D` as three
  paths of its own, because a dash pattern starts again on every subpath); everywhere else it is
  still.
- `app/icon.svg` repeats the two-path form of the tile: an ink square with `rx="7"`, the tail
  stroked in the mark and the body in white over it. `tests/unit/brand-mark.test.ts` keeps the icon,
  `MARK_BODY_D` and `MARK_TAIL_D` in step.

## Primitives

All of `components/ui/`. Each has a `.module.css` beside it unless noted, and accepts `className`,
merged last. Hooks for tests are the data attributes named in the entries. Every entry gives the
real props and one usage line.

### Layout

- **`Wrap`** (`wrap.tsx`): `Wrap({ as = "div", ...rest })`; `as`: div, section, header, footer, nav.
  The page column: at most `--page-max` wide, centred, with `--page-pad` on both sides.

  ```tsx
  <Wrap as="footer">{children}</Wrap>
  ```

- **`Band`** (`band.tsx`): `Band({ as = "section", surface = "desk", pad = "regular", innerClassName, ...rest })`;
  `surface`: desk, paper, wash, binder; `pad`: none, title, tight, regular; `as`: section, div,
  header, footer, aside. A full-width strip on one surface: it renders `data-band={surface}` around
  an inner `Wrap` (`innerClassName` lands on it). `pad` sets `--pad` and the block padding: regular is
  `--band-pad`, tight 42, title 28 (42 from 40em), none 0. A `Split` inside reads `--pad`.

  ```tsx
  <Band id="values" surface="paper" pad="tight">
    {children}
  </Band>
  ```

- **`Split`** (`split.tsx`): `Split({ margin, sticky = false, rule = true, marginClassName, contentClassName, children })`.
  The margin layout. From 68em, `margin` fills columns 1 to 3 and the children columns 4 to 12.
  `rule` draws a 1px `--line` rule in the middle of the gutter, through the band's padding. `sticky`
  keeps the margin under the bar. Below 68em the margin sits above the content, 21px apart, with no
  rule.

  ```tsx
  <Split sticky margin={<Eyebrow>Bundles</Eyebrow>}>
    {children}
  </Split>
  ```

- **`Eyebrow`** (`eyebrow.tsx`): `Eyebrow({ as = "p", marker = true, id, children })`; `as`: p, span, div.
  A section label in `.type-eyebrow` and `--text`, with a square before it: 7px of `--mark` inside a
  hairline of ink, 9px in all, the height of the capitals. `marker={false}` leaves the square out
  (legends, table heads, a label on the binder).

  ```tsx
  <Eyebrow id="missing-next">Next</Eyebrow>
  ```

- **`ShelfHead`** (`shelf-head.tsx`): `ShelfHead({ eyebrow, title, titleAs = "h2", titleId, body, action })`;
  `titleAs`: h1, h2, h3. The header row of a full-width section: eyebrow, title in `.type-page`,
  an optional lead, and an `action` at the right (under the text below 40em). 42px below.

  ```tsx
  <ShelfHead
    title="Bundles"
    body={lead}
    action={
      <Button variant="outline" arrow href="/bundles">
        All bundles
      </Button>
    }
  />
  ```

- **`Sheet`** (`sheet.tsx`): `Sheet({ as = "div", edge = "rule", pad = "regular", ...rest })`; `as`: div,
  section, aside; `edge`: rule, ink; `pad`: none, tight, regular, roomy. A paper panel on the desk:
  `--surface` fill, radius 10, a 1px `--line` or 2px `--line-ink` border. Padding is one step smaller
  below 40em. Every other prop, `ref` included, goes to the element.

  ```tsx
  <Sheet as="aside" edge="ink" aria-label="Purchase">
    {children}
  </Sheet>
  ```

- **`BandedList`** and **`BandedRow`** (`banded-list.tsx`): `BandedList({ as = "ul", ...rest })`, `as`:
  ul, ol, dl, div; `BandedRow({ as = "li", ...rest })`, `as`: li, div. One sheet whose rows alternate
  `--surface` and `--stripe`, with no lines between rows. A row publishes `--row-pad-block` and
  `--row-pad-inline`, so a `RowLink` can reach its edges. Use `as="dl"` with `BandedRow as="div"`
  for label and value pairs.

  ```tsx
  <BandedList>
    <BandedRow>
      <RowLink href="/pricing" label="Pricing" />
    </BandedRow>
  </BandedList>
  ```

- **`RowLink`** (`row-link.tsx`): `RowLink({ href, label, caption, trailing, lead, size = "md", external, onClick, aria-current })`;
  `size`: md, lg. One link that fills its `BandedRow`: an optional `lead`, the label, a caption under
  it, a `trailing` value (a price, a tally), then the arrow icon. Hover and focus: the row takes
  `--mark-wash`, the label is underlined and the arrow moves 3px. An email label may break after its
  `@`. A root-relative `href` is an internal link.

  ```tsx
  <RowLink href="/catalog" label="Browse the catalog" caption="25 templates" trailing="$49" />
  ```

- **`FactList`** (`fact-list.tsx`): `FactList({ items: Array<{ label: string; value: ReactNode }> })`.
  A `dl` in a `BandedList`: the label (`.type-eyebrow`, faint) in a fixed first column and the value
  beside it; the value goes under its label below 40em.

  ```tsx
  <FactList
    items={[{ label: "Phase", value: <TextLink href="/phases/prepare">Prepare</TextLink> }]}
  />
  ```

- **`FigureStrip`** (`figure-strip.tsx`): `FigureStrip({ items: Array<{ label: string; value: string; marked?: boolean }> })`.
  Up to four figures on one sheet: the label (`.type-eyebrow`) first in the DOM, then a tabular
  Besley value; two by two where the strip is narrow. A `marked` value is highlighted: the saving.

  ```tsx
  <FigureStrip
    items={[
      { label: "Templates", value: "12" },
      { label: "You save", value: "$40", marked: true },
    ]}
  />
  ```

- **`CheckList`** (`check-list.tsx`): `CheckList({ items: Array<{ key: string; title?: string; body: ReactNode }>, titleAs = "h3", columns = 1 })`;
  `titleAs`: h2, h3, h4, p; `columns`: 1, 2. A plain `ul` in which each item is a ticked box (decoration),
  an optional title in `.type-item` and the body. Two columns from 40em.

  ```tsx
  <CheckList
    columns={2}
    items={[{ key: "a", title: "Field-tested", body: "Refined on real rollouts." }]}
  />
  ```

### Wet Ink primitives

Added or changed in this edition (all in `components/ui/` unless noted). Where an entry above
disagrees with one here, this one wins.

- **`Band`** gained `surface="ink"` (the black band: `#solution` and the AI statement only, on the same
  values as the binder), `backdrop` (a node rendered before the `Wrap`, usually an `InkBackdrop`;
  it makes the band `position: relative; isolation: isolate`) and `pad="roomy"`.
- **`Sheet`** has no border any more: a paper panel with `--depth-*` shadow. **`Split`**'s `rule`
  defaults to false (the margin rule is gone). **`BandedList`**/**`BandedRow`** are a ledger with no
  box and no stripes; rows have no inline padding and a `RowLink` inside stands 14px past both ends.
  **`RowLink`** has a 6px radius. **`Sentences`** takes `move` (the sentences ink in). **`ShelfHead`**
  takes `stack` (the action under the text).
- **`Appear`** (`appear.tsx`): `Appear({ as = "div", move = "drift", when = "view", order, ...rest })`. An entrance on
  its own wrapper: `data-move`, and with `when="load"` `data-when="load"` and `--order`. Never put
  `data-move` on a `PaperSheet` itself.
- **`MotionRoot`** (`motion-root.tsx`, client, no props): rendered by `app/layout.tsx` after the
  children. Arms the observer path (`data-io="armed"`), marks `[data-watch]` elements `data-seen` as
  they arrive and starts `trackLight()`.
- **`PageShift`** (`page-shift.tsx`): renders no element; it names its single element child for the
  view transition, so a page's first block (the title block, the hero's text) fades in under the next
  page's. Give it exactly one element child.
- **`PaperSheet`** (`paper-sheet.tsx`): `PaperSheet({ as = "div", ratio = "free", size = "md", depth = 2, lit = false, turn, ...rest })`. A paper object:
  grain, ring, layered shadow, no padding of its own (add it with a class). Hooks: `data-paper`,
  `data-lit`.
- **`PaperStack`** (`PaperStack({ under = 2, ...rest })`): the sheets beneath a top sheet, drawn as edges; leave about 14px around it
  from 40em for the sheets underneath. `data-paper-stack`.
- **`Folder`** (`Folder({ tab, sheets = 3, slug, frontClassName, ...rest })`): a bundle as a folder: a tab, sheets peeking out and a front panel;
  `slug` names it for the view transition (`folder-<slug>`). `data-folder`.
- **`Odometer`** (`odometer.tsx`): `Odometer({ value, suffix, className })`. A two-digit figure whose
  tens roll on a wheel (blank, then 1 to 9) inside a one-line window. At rest it reads the figure.
  `data-odometer` with `data-value`, and `data-odometer-wheel` on the wheel.
- **`CountUp`** (`count-up.tsx`): `CountUp({ value })`. A number that counts up when it is first seen
  below the fold, with `requestAnimationFrame`, and reads its value without JavaScript.
- **`Tally`** gained `animate` (fills when seen, `data-watch`), `size="lg"` and
  `anchor={{ block, name }}`, which puts `data-ink-anchor` on one block (the tenth).
- **`InkBackdrop`** and **`InkLayer`** (`components/ink/`): see `architecture.md`.
- **`TemplateCover`** (`components/catalog/template-cover.tsx`): `TemplateCover({ size, lit, slug, title, summary, phaseOrder, ... })`.
  A `PaperSheet` printed with the template's own title and summary, a ghost text block, the
  deliverable glyph and one blank at the foot, in its format (`data-cover` with `data-format`: a
  document 5:7, a workbook 4:3, a deck 16:9). It scales with its own width (`container-type:
  inline-size` and `cqi` units). With `slug` it carries the view transition name `cover-<slug>`; the
  template page's large cover draws its own two sheets beneath, so do not wrap it in a `PaperStack`.
- **`Tally`** (`tally.tsx`): `Tally({ total, filled, marked, size = "md", numerals = false, animate = false, label })`;
  `filled`: a count or a list of 1-based positions; `marked`: a 1-based position; `size`: sm, md, lg.
  A row of equal blocks. Ink blocks use `--line-ink`; the marked block is `--mark` with an inset ink
  ring; empty blocks are an outline. Hooks: `data-tally` on the root, `data-block="ink"`, `"mark"`
  or `"empty"` and `--i` on each block. `aria-hidden` unless `label` is given, which makes it an `img`
  with that name. `animate` plays `tally-fill` once; `numerals` prints each position (size `md`).

  ```tsx
  <Tally total={10} filled={9} marked={10} size="lg" />
  ```

- **`Blank`** (`blank.tsx`): `Blank({ caret = "steady", size = "md" })`; `caret`: blink, steady, none;
  `size`: sm (28), md (42), lg (56). A `--mark` field with a 2px ink border and an ink caret, as wide as
  its container. Always `aria-hidden`. Hooks: `data-blank` on the field, `data-caret` on the caret.

  ```tsx
  <Blank caret="blink" />
  ```

- **`Tag`** (`tag.tsx`): `Tag({ variant = "format", children })`; `variant`: format, saving, plain. Never
  interactive. `format` is the file-format tag (`.type-tag`, ink border, paper fill); `saving` is
  `--mark` with ink text and an inset ink ring; `plain` is a quiet boxed word.

  ```tsx
  <Tag variant="saving">Save $40</Tag>
  ```

- **`Note`** (`note.tsx`): `Note({ children })`. A callout paragraph on `--mark-wash`, in `.type-ui`
  at weight 400, for one sentence the reader should not miss.

  ```tsx
  <Note>Beta preview — templates shown are samples.</Note>
  ```

- **`Icon`** (`icon.tsx`, no CSS): `Icon({ name, size = 20, flip = false })`; `name`: arrow, chevron, plus,
  minus, close, tick, bars. Line icons on a 20-unit grid, 1.75 stroke, round caps and joins,
  `currentColor`, always `aria-hidden`. `flip` mirrors the icon (the arrow of "Previous").

  ```tsx
  <Icon name="chevron" size={14} />
  ```

- **`Sentences`** (`sentences.tsx`): `Sentences({ text })`. The words of a statement heading: a line
  break in `text` makes each sentence a block of its own, joined by a space. One sentence renders as
  plain text. It goes directly inside the heading.

  ```tsx
  <h2 className="type-page">
    <Sentences text={"First sentence.\nSecond sentence."} />
  </h2>
  ```

- **`KeepCompounds`** (`keep-compounds.tsx`): `KeepCompounds({ text })`. A title or a short line of
  copy with each hyphenated compound kept whole; the text itself is unchanged. The split is
  `splitCompounds()` in `lib/compounds.ts`.

  ```tsx
  <h3>
    <KeepCompounds text="SharePoint End-User Training Deck" />
  </h3>
  ```

### Controls and links

- **`Button`** (`button.tsx`): `Button({ variant = "mark", size = "md", fullWidth, arrow, href, external, linkRef, children, ...rest })`;
  `variant`: mark, outline, ink, text; `size`: sm, md, lg. With `href` it renders an anchor (a
  `TransitionLink` for a root-relative href, a plain `<a>` for `#main`, `mailto:` or a full address;
  `external` opens a new tab), otherwise `<button type="button">` taking every native attribute. See
  "Buttons" below.

  ```tsx
  <Button variant="mark" size="lg" arrow href="/catalog">
    Browse the catalog
  </Button>
  ```

- **`TextLink`** (`text-link.tsx`): `TextLink({ href, children, external, onClick, aria-current })`. A link
  in running text or a list: the text colour of its surface and a 1px underline at 3px offset. On
  hover and focus the underline thickens to 2px and the highlighter is drawn behind the words, 2px
  past their ends, like a stroke of a marker; the text is ink on it. On the binder the words stay
  as they are and the underline takes `--mark`. Breadcrumb links and the `text` button take the same
  stroke.

  ```tsx
  <TextLink href="mailto:hello@advanta365.com">hello@advanta365.com</TextLink>
  ```

- **`TransitionLink`** (`transition-link.tsx`, no CSS): `TransitionLink(props: ComponentProps<typeof Link>)`.
  A plain wrapper over `next/link` with `prefetch` defaulting to true. No fade, no state, usable from
  server components. The only file that imports `next/link`.

  ```tsx
  <TransitionLink href="/pricing" className={styles.link}>
    Pricing
  </TransitionLink>
  ```

- **`Input`** (`input.tsx`): `Input(props: InputHTMLAttributes<HTMLInputElement>)`. 48px, `--surface`, a
  2px `--line-firm` border, radius 6. Hover border `--ink-soft`; focus border `--ink` plus the ring.
  It fills its container; every prop goes to the `<input>`.

  ```tsx
  <Input type="search" name="q" placeholder="Search templates" />
  ```

- **`Select`** (`select.tsx`): `Select(props: SelectHTMLAttributes<HTMLSelectElement>)`. A native select
  drawn as the same field, with the chevron icon. `className` lands on the wrapper.

  ```tsx
  <Select name="sort">
    <option value="title">Title A–Z</option>
  </Select>
  ```

- **`Checkbox`** (`checkbox.tsx`): `Checkbox({ label, count, disabled, ...rest })` (every input
  attribute but `type`). A check row with a 21px box, the label and a faint tabular count at the right.
  Checked: `--mark` fill, ink border, ink tick; `--mark-deep` under the pointer. The native input
  covers the whole row, so the whole row is the target; its accessible name is the label followed by
  the count. `className` lands on the row.

  ```tsx
  <Checkbox label="Training" count={12} name="type" value="training" />
  ```

- **`Pagination`** (`pagination.tsx`): `Pagination({ page, pageCount, hrefFor })`. `nav aria-label="Pagination"`;
  renders nothing for one page. Previous and Next are outline small buttons with the arrow; the page
  numbers are links that take the wash on hover, and the current one is a non-link drawn in `--mark`
  with an ink border and `aria-current="page"`.

  ```tsx
  <Pagination page={2} pageCount={5} hrefFor={(n) => `/catalog?page=${n}`} />
  ```

- **`PhaseTabs`** (`phase-tabs.tsx`): `PhaseTabs({ phases: ReadonlyArray<{ slug: string; name: string }>, current, currentKind = "page", size = "rail" })`;
  `currentKind`: page, true; `size`: rail, large. A `ul` of links to `/phases/{slug}`. Each link shows
  its numeral (position in the list, `aria-hidden`) and the phase name, so its accessible name is
  exactly the phase name. `rail` is the strip under the bar; `large` is the set of index cards on a
  page. A tab takes the wash on hover; the current one is `--mark` inside a 2px ink edge, with its
  name set heavier. No state: the caller that knows the pathname passes `current`.

  ```tsx
  <PhaseTabs phases={phases} current="prepare" size="large" />
  ```

### Buttons

All buttons: `.type-ui`, radius 6, a 2px border, padding-inline 14 (sm), 21 (md) or 28 (lg), and a
7px gap before an arrow. Heights: sm 40 on the desktop bar and 44 below 68em, md 48, lg 56. The
transition runs on `background-color`, `color` and `border-color` over `--time-swap`, linear. The
width never changes on hover. The arrow moves 3px right. Pressed: `translate: 0 1px`. Every hover
state (under `(hover: hover)`) is also the `:focus-visible` state.

| Variant  | Rest                                                                           | Hover and focus                                                     | Use                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| mark     | `--ink` fill, `--on-ink` text, ink border                                      | `--mark` fill, `--ink` text, ink border; pressed: `--mark-deep`     | The buyer's main move: Browse the catalog, Add to cart, Add bundle to cart, Shop Advanta365, Go to home, Show results, the skip link |
| outline  | transparent, `--text`, `--line-ink` border                                     | `--mark-wash` fill, ink text (`--surface` fill on the wash band)    | Secondary: See a sample, All bundles, Browse the sample catalog, See bundles, Cart, Menu, Close, Search, Filters, step links         |
| ink      | the same as mark                                                               | the same as mark                                                    | The main action on the wash band, under its own name: See how it compares                                                            |
| text     | no box, `--text`, underline 1px at 3px offset, 44px hit height                 | underline 2px, the highlighter behind the words (as on a text link) | Remove, Clear all filters                                                                                                            |
| disabled | `--tile` fill, `--text-faint` text, 2px `--line` border, `cursor: not-allowed` | none                                                                | Checkout — coming soon (a native `disabled` button of any variant)                                                                   |

The solid button is black because it is the action; the mark only shows where the pointer or the
keyboard is. The skip link is only ever seen focused, so it keeps the ink fill and the white label
there. The words of a `text` button sit in a span of their own (`.words`), which is what the
highlighter is drawn behind.

### Brand

- **`LogoMark`** (`logo-mark.tsx`, no CSS): `LogoMark({ height = "1.5em", title, tone = "one" })`; `tone`:
  one, two. The mark as an inline SVG in a 4:3 box. Decorative unless `title` is given, which exposes
  it as an image with that name.

  ```tsx
  <LogoMark tone="two" height="28px" />
  ```

- **`BrandLockup`** (`brand-lockup.tsx`): `BrandLockup({ variant = "tile", size = "md", nameClassName })`;
  `variant`: tile, bare; `size`: sm, md. The mark and the name as real text, so a link around it is
  named "Advanta365". `tile` in the bar and the drawer, `bare` in the footer. `nameClassName` lands on
  the name, for a caller that has to hide it visually on a very narrow bar.

  ```tsx
  <TransitionLink href="/">
    <BrandLockup variant="tile" />
  </TransitionLink>
  ```

## Page-level pieces

These are not primitives, but they carry rules the rest of the code relies on. Props are the real
ones.

- **`TitleBlock`** (`components/layout/title-block.tsx`): `TitleBlock({ title, lead, form = "index", crumbs, meta, ink, aside, children })`;
  `form`: index, document, wide. Opens every inner page on paper and holds the page's only `<h1>`,
  whose text is exactly `title` and which never animates: `.type-banner` for `index` and
  `document`, `.type-statement` for `wide`. The lead is an `Appear when="load"`. `ink` puts the
  `title` backdrop in the right 42% from 68em (live ink, or its still); the title, lead and children
  are one `data-ink-calm="text"` box, so the ink thins only under the words. `aside` stands in
  columns 9 to 12 from 68em and under the lead below (the phase numeral, a paper stack). It wraps
  itself in `PageShift`, so a page must not wrap it again. Pass `ink` on `/about`, `/pricing`,
  `/contact`, `/sample`, `/bundles` and `/phases/[phase]`, never on `/catalog`, `/cart`,
  `/templates/*` or `/bundles/*`.
- **`Breadcrumbs`** (`components/layout/breadcrumbs.tsx`): `Breadcrumbs({ items: Array<{ href?: string; label: string }> })`.
  `nav aria-label="Breadcrumb"` with an `ol`; the last item is the current page, set heavier. The "/"
  separators are hidden from assistive technology.
- **`BetaStrip`** (`components/layout/beta-strip.tsx`): no props. "Beta preview — templates shown are
  samples." on `--mark-wash`, in the flow, scrolled away with the page. The layout renders it while the
  catalog holds sample content.
- **`Specimen`** (`components/home/hero-sheet.tsx`): `Specimen({ specimen })`, where `SpecimenContent` is
  `{ title, summary, formatTag, facts, phaseOrder, phaseName }`. One catalog template drawn as the
  top sheet of a `PaperStack` in the margin of `#inside` (from 68em): its own title, summary and facts
  as a ledger, a blank and a ten-block tally that fills when seen. `aria-hidden`, hook
  `data-specimen`. The one place where catalog text is repeated.
- **`IntroCover`** (`components/intro/intro-cover.tsx`): no props. The cover of a first visit: a fixed
  white sheet, full viewport, with an `InkBackdrop scene="intro"`, the mark written by three pen
  strokes (`lib/brand/mark.ts`), the name in Besley 700 at 28px and a "Skip" hint. `aria-hidden`,
  nothing focusable, hook `data-intro-cover`, not displayed unless `data-intro` on `<html>` says so.
  Its companion `IntroScript` (`intro-script-tag.tsx`, no props) prints the boot script in the root
  layout. See "The cover" under Ink.
- **`LineDrawing`** (`components/home/value-tiles.tsx`): `LineDrawing({ name })`; `name`: tested, borrow,
  adapt, sector, audiences, example, copilot. Line art on the page's own ground, 84px (70px below
  40em), pulled left so the art stands on the text's edge. Only "adapt" carries the mark.
- **`TemplateCover`** (`components/catalog/template-cover.tsx`): `TemplateCover({ type, format })`. The file as a
  3:2 tile: a drafting board, the silhouette of the format, a title bar, ghost text lines, the
  deliverable-type glyph and one blank at the foot. The blank is the only marked element on a cover;
  the format `Tag` sits at the top right.
- **`TemplateCard`** (`components/catalog/template-card.tsx`): `TemplateCard({ template, phaseName, phaseOrder, index, layout = "row", share = true, headingLevel = "h3" })`.
  An `<article data-layout>` with one stretched link on the title. `row`: an index row (a numeral
  chip, a thumbnail, title, meta, price and the format `Tag`), in a single-column list. `sheet`: the
  cover's own sheet resting at a slight turn, for the home page's spread (a row again below 40em).
  `share={false}` drops the view transition name where a template could appear twice on a page. The
  focus ring is drawn on the article.
- **`BundleCard`** (`components/catalog/bundle-card.tsx`): `BundleCard({ bundle, templateCount, savingsCents, coverage, layout = "row", headingLevel = "h3" })`.
  An `<article>`: a ledger row, or with `layout="feature"` a `Folder` whose tab carries the template
  count. With `coverage` it shows a seven-block `Tally` labelled `Phases: …`.
- **`StatementSection`** (`components/company/statement-section.tsx`): `StatementSection({ id, label, statement, copy, surface = "desk", children })`;
  `surface`: desk, paper, wash. A `Band` with a `Split`: the label in the margin; the statement as a
  `.type-banner` `<h2>`, one sentence per block; the paragraphs, which drift in; then `children`.
- **`AiStatement`**, **`ProofLedger`**, **`WaysToBuy`** and **`WorkedExample`** (`components/company/`):
  the black AI band of `/about` (a `.type-statement` heading whose sentences ink in), the four proof
  points as a two-column ledger, the pricing page's `PaperStack` of singles beside a `Folder` of
  bundles, and the sample page's twelve-sheet stack with a printed first page.
- **`ComparisonTable`** (`components/company/comparison-table.tsx`): `ComparisonTable({ id, caption, columns, rows, emphasized, note })`.
  A real table in a sheet. The `emphasized` column is the buyer's: highlighted head, wash cells. Below
  40em each row reflows to a block; the cells carry `data-label` and every part carries an explicit
  `role`, so the table keeps its semantics once its display is block.
- **`BundlePriceTable`** (`components/company/bundle-price-table.tsx`): `BundlePriceTable({ caption, rows })`.
  The bundles and their prices as a table that reflows the same way; the saving is a
  `Tag variant="saving"`.
- **`BuyerList`** (`components/company/buyer-list.tsx`): `BuyerList({ buyers, caresLabel })`. The buyers as a
  `BandedList`: the name (`h3`), what they care about, one quoted line.
- **`FaqList`** (`components/company/faq-list.tsx`): `FaqList({ items })`, a client component. A
  `BandedList` of questions that open in place; several can be open at once. A closed answer is
  `inert`, and the panel opens by growing its row from zero height.
- **`NextSteps`** (`components/company/next-steps.tsx`): `NextSteps({ surface = "desk", title, links, children })`.
  The closing band of a company page: the "Next" label in the margin, a short heading and the places
  to go as `RowLink`s.
- **`PurchasePanel`** (`components/product/purchase-panel.tsx`): `PurchasePanel({ priceCents, note, children })`.
  `aside aria-label="Purchase"` in an ink-edged `Sheet`: the price, the note, the one buy control
  (passed as children) and the beta sentence.
- **`MissingPage`** (`components/not-found/missing-page.tsx`): `MissingPage()`. The 404 as a blank page: an
  empty sheet with the figure "404" (middle digit marked), a blank and an empty tally, beside the
  address that was asked for (`AskedPath`), the h1, the way home and the next places to go.

## CSS Modules rules

These rules come from the Turbopack and lightningcss build. Break one and the build fails or the
rule silently does nothing.

- Every selector in a module contains at least one local class. A bare `dialog` or `:root[data-x]
body` belongs in `globals.css`.
- `@keyframes` are file scoped. A module uses only keyframes it defines itself, which is why
  `scrim-in` is defined twice.
- No `composes`.
- A module overrides a primitive's declaration by doubling its selector (`.skip.skip { top: var(--s-1) }`),
  never by relying on stylesheet order.
- Join class names with `cx()`. `styles.foo` is `string | undefined`, so template strings are not
  safe.
- Never set `display` on a bare `dialog` class. Use `.sheet[open] { display: flex }`, so a closed
  dialog stays hidden.
- Inline custom properties go through `cssVars()`: `style={cssVars({ "--i": index })}`.

## Do and don't

| Do                                                                                     | Don't                                                                                      |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Read colour from the semantic layer (`--text`, `--surface`, `--line`)                  | Write a hex or `rgb()` value outside `app/globals.css` and `app/icon.svg`                  |
| Mark only what the buyer owns or has chosen, and pair it with ink (border, text, tick) | Use the mark as decoration, a section background, text or a line on a light surface        |
| Set ink text on the mark (`--on-mark`) and white text on ink (`--on-ink`)              | Put white text on the mark, or make a large solid blue surface                             |
| Make the main action the solid ink button                                              | Give a button the mark as its resting fill                                                 |
| Use `--mark-wash` for one band per page and for hover fills                            | Put a second wash band on a page                                                           |
| Choose a surface with `Band surface` and let hard edges separate bands                 | Add gradients, glows, blurs, blend modes, other shadows or a transition between bands      |
| Use steps of `--s-1` to `--s-9` for layout space                                       | Write other spacing values                                                                 |
| Lay out with the two breakpoints, 40em and 68em                                        | Add another layout media query                                                             |
| Pick a `.type-*` class and add `.tabular` to prices, counts and table numerals         | Set negative letter-spacing, add weights outside the scale or set sentence case under 14px |
| Link internal routes with `TransitionLink` or a primitive built on it                  | Import `next/link` anywhere except `components/ui/transition-link.tsx`                     |
| Keep one `h1` per page with the exact title as its text (`TitleBlock`)                 | Split a heading into words, animate it or give it an effect                                |
| Set a two-sentence statement with `Sentences`                                          | Put a `<br>` or `white-space: pre-line` in a heading                                       |
| Show the current item with `aria-current` and a fill, border and weight                | Rely on colour alone                                                                       |
| Hide decoration with `aria-hidden`; give an informative tally a `label`                | Repeat catalog text in the DOM to draw a second copy (the specimen is the one exception) |
| Set `display` on `.sheet[open]`                                                        | Set `display` on a bare `dialog` class                                                     |
| Define a `@keyframes` in the module that uses it                                       | Use a keyframes name defined in another file                                               |
| Keep the cover to a first visit of the home page, over a page that is already complete | Hold content back for an animation, lock scrolling, trap focus or cover an inner page      |
| Mark copy the ink must keep clear of with `data-ink-calm`, and give ink a pause button | Draw ink behind words without a calm zone, or run ink on a page where someone buys         |
| Ask for an entrance with `data-move` (or `Appear`) and let `app/motion.css` run it     | Write a scroll or view timeline in a CSS module, or animate a shadow or a custom property  |
| Make objects with `PaperSheet`, `PaperStack` and `Folder`, lists with ledgers          | Put a border around a product, stripe a list or draw a card grid                           |
| Use `cssVars()` for inline custom properties                                           | Write `style={{ "--x": 1 }}`, which does not type check                                    |
| Wrap every `localStorage` and `sessionStorage` access in try/catch                     | Assume storage exists                                                                      |
| Use `<article>` only for template and bundle cards                                     | Add `<article>` anywhere else                                                              |
| Use `role="status"` only on the catalog result count and the add-to-cart confirmation  | Add `role="status"` or `<output>` elsewhere                                                |
| Read the catalog through `lib/catalog/repository.ts`                                   | Import from `content/` in a page or component (`content/taxonomy.ts` is the one exception) |

## The design gate

`tests/unit/design-gate.test.ts` runs with `pnpm test`. It reads every file under `app/`,
`components/`, `lib/` and `tests/` as text and fails on:

- **retired vocabulary**, matched in any case and in comments too: `wipe` (so also the longer word
  that contains it), `reveal`, `sheen`, `swirl`, `liquid`, `chrome` (so also `monochrome`),
  `wordmark`, the name of the retired typeface, a phrase for the site this one was once modelled on; the earlier presentation's scripted effects, blend
  modes, `new Worker`, `@property`, `data-entry`, `data-theme`, negative letter-spacing, token
  families named `--duration-*`, `--easing-*`, `--spacing-*`, `--measure-*` and `--container-*`, the
  old measures (502, 938, 620, 366, 232 as pixel values) and the two wordings the site no longer
  uses. Say fluid, water, curl, eddy, bloom, clear, drain, ink-in and show instead;
- **scoped techniques**, in files under `app/`, `components/` and `lib/` only (tests may stub what
  they need), each allowed only where the edition needs it:

  | Pattern                           | Allowed under                                                                                                                           |
  | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
  | `<canvas`, `getContext(`, `webgl` | `lib/ink/`, `components/ink/`, `lib/boot/`                                                                                              |
  | `requestAnimationFrame`           | `lib/ink/`, `components/ink/`, `lib/scroll/`, `lib/boot/`, `components/intro/`, `components/ui/count-up.tsx`                            |
  | a quoted `"scroll"` or `'scroll'` | `lib/ink/`, `components/ink/`, `lib/scroll/`                                                                                            |

  The gate tests its own helper with synthetic files, so a hit outside the lists is reported and a
  hit inside is not;
- a **raw colour** (a hex value or a function named `rgb`, `hsl`, `lab`, `lch` or `color`) in any file
  under `app/`, `components/` or `lib/` other than `app/globals.css` and `app/icon.svg`. The scan
  also reads `app/motion.css` and shader files (`.glsl`, `.frag`, `.vert`); shader strings in
  TypeScript hold numbers, never colours, and no function is named `rgb`, `hsl`, `lab`, `lch` or
  `color`;
- `infinite` in any stylesheet, comments included;
- `package.json` dependencies other than exactly `next`, `react`, `react-dom` and `zod`: no
  animation, 3D or scroll library;
- `prefers-color-scheme` in a stylesheet;
- a media query other than the two breakpoints, `(hover: hover)`, `(forced-colors: active)`,
  `(prefers-reduced-motion: reduce)`, `(prefers-reduced-motion: no-preference)` and
  `(prefers-contrast: more)`. Nest queries instead of joining them with `and`;
- `@container` anywhere but `header.module.css` and `nav-drawer.module.css` (a container may give a size to `cqi`
  units elsewhere, as the printed covers do, but no other file writes an `@container` rule);
- an import of `next/link` outside `components/ui/transition-link.tsx`;
- a second pass over `README.md` and `docs/` looks for three strings from the retired design, and
  asserts that the retired folders do not exist.

Beside it, `tests/unit/kit-motion.test.ts` checks `app/motion.css` (every keyframes, animation and
transition inside the no-preference query, a timeline always written after its `animation`
shorthand, nothing hidden without `html[data-motion="on"]`), and `tests/unit/kit-grain.test.ts` the
paper grain. The browser specs check the same design where it is computed: `identity.spec.ts`
(grounds, faces, landmarks, the five bands, one canvas at most and only in an ink slot, no blend
mode, nothing that loops, the name never above 28px, the 3px ring, 44px targets, nothing moving five
and a half seconds after load), `reduced-motion.spec.ts`, `ink-fallback.spec.ts`, `motion.spec.ts`,
`intro.spec.ts` and, on a graphics card, `ink-live.spec.ts`.

## Accessibility floor

- Every text pair in the contrast table passes AA, and body text passes AAA. Colour is never the
  only cue: a phase is a numeral and a name, current is fill, border and weight, a checked box has a
  tick.
- A 3px focus ring on every interactive element, on every surface (ink on the light bands, where
  the mark would not reach 3:1, and the mark on the binder). Targets are at least 44px below 68em.
  The sticky bar never covers a focused or targeted element (`scroll-padding-top`).
- Both dialogs, the site menu and the filter sheet, are native `<dialog>` elements. Tables keep their
  semantics when they reflow. No page scrolls sideways at 320px.
- Movement that starts by itself, outside the ink, ends within five seconds of first paint and is
  off under reduced motion. The ink runs longer, so it has a pause control (WCAG 2.2.2): a button
  named "Pause ink", renamed "Play ink", in the stage, early in the tab order, with the choice kept
  for the session. The cover can be dismissed with any key, press, wheel or touch, hides nothing from
  assistive technology, and neither traps focus nor locks scrolling. Every calm zone keeps the
  contrast of the text over it (see "Ink"). `prefers-contrast: more` and forced colours remove ink
  and grain and give objects a border, and every state stays visible.
- One canvas at most, created by script, `aria-hidden` and inside an ink slot; no worker and no
  scroll listener outside the ink layer and the scroll helpers. Two variable font files. Client
  JavaScript is limited to the cart, the catalog filters and sort, the phone drawer, the navs that
  read the pathname, the FAQ, the 404 address, the motion observer, the ink layer and the inline
  boot script.
