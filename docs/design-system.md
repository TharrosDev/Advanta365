# Design system

This document describes the visual system of the Advanta365 site: the concept, the colour and type tokens, the bands and grid, depth, motion, every UI primitive, the ink layer, and the accessibility floor. The source of truth is the code. The token values below are copied from `app/globals.css`, and the primitives are the files in `components/ui/`.

## 1. Concept

Advanta365 sells one thing: the complete change management and user adoption toolkit for Microsoft 365 rollouts, for $499.99. Six templates are free samples and the rest are shown locked. Each template arrives mostly written, so the buyer's work is the last part. The site is drawn as a working copy: white sheets on a cool grey desk, set in near-black type, with a light-blue highlighter that marks the parts that belong to the buyer. The ink layer is the only moving material on the page. It behaves like wet ink on water, sits under the text, and never competes with it.

Six principles guide every decision:

1. **Paper first.** Content sits on sheets. A sheet is a white plane with a grain, a hairline ring, and a soft shadow.
2. **The mark is the buyer's.** The highlight marks what the buyer fills in or owns. It always carries ink: a border, a ring, a tick, or the text itself. The pale blue fill alone is never a signal.
3. **Hard edges on surfaces.** Bands and sheets change ground without a transition. Movement is limited to content arriving and to sheets responding to the pointer.
4. **Type carries the hierarchy.** Two families and one size scale do all the structural work. Colour and depth add emphasis only after type has done its job.
5. **Motion explains or pays off.** Motion announces a state change, reveals a sequence, or rewards a completed step. Every animation and movement is inside the `prefers-reduced-motion: no-preference` query, or starts only from a state the boot script sets when motion is allowed.
6. **Ink stays under the text.** The ink layer is calmed around every text block, and its brightness is capped against the ground behind the copy.

## 2. Where the system lives

| Path | What it holds |
| --- | --- |
| `app/globals.css` | Every colour, type, space, depth, shape, layer and motion token; the band definitions; base element rules; the type classes; the reduced-motion safety net; the forced-colours rules. |
| `app/motion.css` | Entrances, view transitions, paper and lift behaviour, the sticky bar's shadow, the bar's sliding underline, the ninety-percent scroll sequence, the price tag's swing, a locked tile saying no, the pop-up's arrival and the hero's sequence. Imported first by `globals.css`. |
| `app/layout.tsx` | Font loading (Besley and Atkinson Hyperlegible Next as CSS variables), root attributes, the boot script, and `MotionRoot`. |
| `app/icon.svg` | The site icon: the logo mark on an ink tile. |
| `lib/brand/mark.ts` | The logo geometry, the single source for the mark path data. |
| `components/ui/` | The UI primitives described in section 9. |
| `components/catalog/`, `components/purchase/`, `components/home/`, `components/layout/` | Feature components built from the primitives (section 9.8): the template tiles, locks and pop-up, the portfolio and its price tag, the hero, the bar's purchase button. |
| `components/ink/`, `lib/ink/` | The ink layer: the backdrop component, the controller, the engine, scenes, zones and stills. |
| `lib/boot/` | The inline boot script and the pure functions it mirrors. |
| `lib/scroll/` | The scroll-seen observer and the pointer light tracker. |
| `tests/unit/design-gate.test.ts` | The standing rules: raw colour placement, allowed media queries, the allowed `@container` files, and the allowed `next/link` importer. |

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
| `--mark` | `#86c1ff` | The highlighter. Fills marked blocks and the logo tail. |
| `--mark-deep` | `#5fa8f5` | A solid button while pressed; a checked checkbox under the pointer. |
| `--mark-wash` | `#eaf4ff` | The mark diluted to a ground for the wash band and hover rows. |
| `--on-mark` | `var(--ink)` | Text on a mark fill. |
| `--on-ink` | `#ffffff` | Text on an ink fill. |
| `--binder` | `#0d0f15` | The binder: the footer and the ink surface. |
| `--binder-rise` | `#1c202b` | A raised surface on the binder. |
| `--on-binder` | `#f4f5f8` | Text on the binder. |
| `--on-binder-soft` | `#b4b9c7` | Secondary text on the binder. |
| `--rule-on-binder` | `#343947` | Hairlines on the binder. |
| `--alert` | `#a32b1d` | Errors, and the outline of a locked tile that says no. |
| `--alert-wash` | `#fbeae5` | The ground behind an error. |
| `--scrim` | `rgb(11 13 18 / 0.5)` | The backdrop behind the menu drawer and dialogs. |
| `--bar-shadow` | `0 10px 21px -14px rgb(11 13 18 / 0.4)` | The shadow under the sticky bar once it is scrolled. |
| `--paper-shade` | `#f1f3f7` | The far corners of a sheet. |
| `--card-light` | `rgb(255 255 255 / 0.62)` | The light on the card stock front of a page-size folder. |
| `--pocket-shade` | `0 -8px 14px -8px rgb(11 13 18 / 0.22)` | The shade that front casts up onto the sheets in its pocket. |
| `--steel-light` | `#f8fafd` | The light along the top of a link of a lock's chain. |
| `--steel` | `#b6bdca` | The body of a chain link. |
| `--steel-shade` | `#6a7182` | The shaded side of a chain link and of the padlock's bow. |
| `--steel-edge` | `#262a35` | The dark line around every piece of steel. |
| `--lock-light` | `#515869` | The light on the padlock's body. |
| `--lock` | `#1e222c` | The padlock's body. |
| `--lock-cast` | `rgb(11 13 18 / 0.34)` | The shadow the chains and padlock cast on the cover under them. |
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
| Mark on binder | 10.11 : 1 | The focus ring on the binder. |
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
- The logo tail is the mark colour. Under forced colours it uses `currentColor`.

### 3.5 Binder and ink surfaces

`[data-band="ink"]` and `[data-band="binder"]` share one definition: ground `--binder`, surface and tile `--binder-rise`, text `--on-binder`, lines `--rule-on-binder`, focus ring `--mark`. The footer uses `binder` directly. The ink band is the surface of the home solution section and of the AI statement on the about page.

### 3.6 Pigments

The ink engine reads six pigment tokens from the root with `getComputedStyle`.

| Token | Value | Used for |
| --- | --- | --- |
| `--pigment-paper` | `var(--paper)` | The light ground the ink is composited onto. |
| `--pigment-binder` | `var(--binder)` | The dark ground. |
| `--pigment-black` | `#10131a` | The black ink. |
| `--pigment-blue` | `var(--mark-deep)` | The blue ink on light grounds. |
| `--pigment-blue-dark` | `var(--mark)` | The blue ink on dark grounds. |
| `--pigment-pale` | `#c3cedf` | The pale ink on dark grounds. |

The engine keeps numeric fallbacks in `lib/ink/pigments.ts`. They equal the values above and change with them.

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
- `backdrop`: an optional ink backdrop, rendered before the content.
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

Display sizes are fluid. The minimum and maximum below are the rendered sizes.

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

- One `h1` per page. The home headline uses `.type-hero`; inner page titles use `.type-banner`, or `.type-statement` in the wide title block.
- Measure body copy with `--wrap-copy` (36rem) and lead copy with `--wrap-lead` (40rem). Headings take `--wrap-head` (22em).
- Headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty`.
- Copy uses typographic apostrophes and quotation marks. The content tests reject straight quotes and exclamation marks in copy.
- The eyebrow and tag classes are always uppercase through CSS. The text in the DOM stays in sentence case.

## 6. Space, grid and layout

### 6.1 Spacing

The space scale runs on a 7px module.

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
| `--page-max` | 1232px (77rem) | same | same |
| `--page-pad` | 21px | 28px | 42px |
| `--col-gap` | 14px | 21px | 28px |
| `--band-pad` | 56px | 84px | 84px |
| `--bar-h` | 56px | 56px | 70px |

`--page-max` is twelve 77px columns with eleven 28px gaps. From 68em, the `Split` primitive lays content on a twelve-column grid: the margin takes columns 1 to 3 and the content takes columns 4 to 12.

Other layout tokens:

| Token | Value | Use |
| --- | --- | --- |
| `--rail-h` | 42px | The phase rail below the bar, from 68em. |
| `--strip-h` | 0px by default | The beta strip sets it to 35px, and to 36px from 68em, while it is shown. |
| `--wrap-copy` | 36rem | Body measure. |
| `--wrap-lead` | 40rem | Lead measure. |
| `--wrap-head` | 22em | Heading measure. |
| `scroll-padding-top` | `--bar-h` plus `--s-3` | Anchors and focused elements stop clear of the sticky bar. |

### 6.3 Breakpoints

Two viewport breakpoints exist: `40em` and `68em`. Below 40em is the phone layout. From 68em the site shows the inline navigation, the phase rail, the twelve-column grid, and the four-layer depth. The header and the nav drawer also use container queries at 27.4em and 24.3em (header) and 17em (drawer). The other media queries in use are listed in section 13.4.

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
| `--depth-3` | Lifted or panel | Lifted sheets, the raised column of the comparison, the front of a page-size folder. |
| `--depth-4` | Top of a stack | The menu drawer, the filter sheet and the pop-up of the catalog. |

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
| `data-intro` | The boot script, then the ink controller | The cover is playing: `play`, `ink`, or `leave`. The attribute is gone when the cover ends. |
| `data-ink` | The boot script, and the ink layer (to `still`, when the ink cannot run) | `live`, `paused` or `still`. |
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

`motion.css` also uses a few literal values: 480ms for drift entrances, 600ms for grow entrances, 420ms for the paper shade and tilt transitions, 1ms while the cover is up (so content behind it is already finished), the price tag's swing (1700ms, and 1200ms when its folder is hovered), a locked tile's denial (a state of 600ms: 420ms shake, 480ms rattle, 560ms outline pulse), the pop-up's arrival (320ms) and the hero's sequence (section 8.9).

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
| `data-ink-backdrop`, `data-ink-slot` | `InkBackdrop` | The ink layer's container and canvas slot. |
| `data-folder`, `data-folder-scope` | `Folder`, and an element around one | The folder whose sheets rise under the pointer; the scope in which keyboard focus raises them too. |
| `data-price-tag` | `PriceTag` | The paper tag on its string: it swings once when it is first seen, and a little when its folder comes under the pointer. |
| `data-nav-underline` | `PrimaryNav` | The bar's ink underline: it stands under the current link and slides to the next. |
| `data-tile`, `data-free`, `data-locked`, `data-denied` | `TemplateTile`, `LockedTile` | A catalog tile, its kind, and the 600ms state in which a locked tile shakes, pulses its outline in `--alert` and rattles its padlock (`data-lock`). |
| `data-template-dialog`, `data-enter` | `TemplateDialog` | The pop-up of the catalog; `data-enter` is on one that a link inside the site opened, which rises into place. |
| `data-hero-stage`, `data-hero-prompt`, `data-hero-doc`, `data-landed` | `HeroStage`, `HeroLanding` | The hero's prompt box and the six documents that replace it; `data-landed` on the stage ends the sequence for it (section 8.9). |
| `data-lit-scope` | Read by the pointer tracker | Scope for a group of lit sheets that is not an article; read by `lib/scroll/pointer.ts` and the lit selectors in `app/motion.css`. |

### 8.6 Sheets and the pointer

A lit sheet (`PaperSheet lit`) responds to hover on a device that can hover (`(hover: hover)`), and to keyboard focus inside it:

- It lifts 6px (`translate: 0 -6px`) over `--time-lift`.
- It tilts up to 1.2 degrees toward the pointer (`--tx`, `--ty`), with a 900px perspective. Only `(hover: hover)` devices get the tilt; touch input is ignored.
- Its shade (`::after`) fades in with `--curve-settle` over 420ms at rest, and over `--time-lift` on hover.

The tilt and the light position are written by `lib/scroll/pointer.ts` in one animation frame per pointer move.

### 8.7 Page transitions

A page change swaps the page at once. The first block of a page, wrapped in `PageShift`, is a view transition: the outgoing block fades out over `--time-page-out`, and the incoming block arrives with `move-ink-in` (opacity only) over `--time-page-in`, after an 80ms delay. A shared element named `cover-<slug>` or `folder-<slug>` morphs over `--time-morph` (class `sheet-morph`); `TemplateCover` and `Folder` take a `slug` for it, and no page passes one today. Opening a sample in the pop-up is a change inside the page and starts no view transition. Under reduced motion, every view transition group has no animation and the outgoing block is not shown.

### 8.8 The first-load cover

The home page opens with a cover: a full-viewport paper plane (`--layer-cover`) with the logo drawn stroke by stroke, the name, and a `Skip` hint at the bottom.

| Element | Timing |
| --- | --- |
| Legs of the mark | 120ms to 480ms, on `--curve-pen`, from 0 to full stroke. |
| Crossbar | 420ms to 600ms. |
| Tail | 560ms to 800ms, in the mark colour. |
| The 365 | 800ms to 1000ms, in a finer pen on the tail: the 3, the 6 and the 5, 100ms each and 50ms apart. |
| Name | 500ms to 900ms, fading in. |
| Hint | 600ms to 900ms. |
| The finished mark | Stands from 1000ms to 2500ms. |
| Signature and hint leave | 2500ms to 2680ms, fading on the paper while it is still opaque. |
| Cover leaves | From 2500ms, 450ms with `--curve-leave`. The paper holds until 40% (2680ms) and only then clears, so the logo is gone before the hero shows. |

- It plays once per browser session on the home page, when motion is allowed and the tab is visible. The session flag is `advanta365.intro.v1` in `sessionStorage`.
- Any pointer press, key press, wheel or touch ends it early. The skip is quiet: the cover fades over 200ms without moving the page.
- A backstop ends it after 5500ms regardless of events.
- When the ink layer is ready on the cover (1600ms in at the latest), ink runs inside the cover (section 10.6). The signature still fades from 2500ms to 2800ms, and the cover's own timeline ends it with the last of the clear, 2700ms to 3500ms after the takeover.
- Where the ink is live, the hero's sequence starts when the cover is gone (section 8.9).

### 8.9 The hero's sequence

The home page's first screen acts out the tagline: an empty prompt box becomes finished work. The sequence is the page's half of the `prompt` ink scene and plays to live ink only: the root says `data-motion="on"` and `data-ink="live"`, and the stage is not marked `data-landed`. Its clock starts when the root has no `data-intro` (at load, or when the cover has gone), and the scene is written to the same times.

| Time | What happens |
| --- | --- |
| 0 to 700ms | The box (`data-hero-prompt`) stands empty, its caret blinking: on 300ms, off 200ms, three times. |
| 700ms | The first drop lands in the box; a light-blue one follows at 1200ms. |
| 1100ms to 2300ms | The box dissolves as the ink opens over it. |
| 2600ms to 3500ms | The ink turns to mist; the water is clean at 3500ms. |
| From 3700ms | The six documents (`data-hero-doc`) land where the box stood: the middle two first, 110ms apart, 560ms each, opaque from their first frames, from a little above and a little large. They never fade in through ink. |
| From 6000ms | Ink keeps arriving slowly behind and beside them. |

Under the cover the box shows and the documents are out of sight.

Without live ink there is no box and the documents stand from the first frame, visible and focusable, over the still: with no JavaScript, under reduced motion, with still ink (no usable GPU, more contrast, forced colours, data saving, ink switched off for the session) and in a session whose ink is paused. `HeroLanding` marks the stage `data-landed` when the ink is not running as the stage mounts, or stops running later (it fails, or the visitor pauses it), and never takes the mark off. So ink that stops half-way lands the documents at once, and ink that starts later runs behind documents that stay where they are. A return to the home page inside the site is a new stage: with running ink the sequence plays again.

### 8.10 Figures and tallies

- A figure is printed as it is and never counts or rolls up to its value: while it moves it reads a wrong one. The `#inside` counts and the ninety's 90% are plain text.
- `Tally animate` fills its blocks one after another: each block starts after `--time-enter` plus its index times `--time-fill-gap`, and takes `--time-fill` to fill.
- Nothing in an entrance is blurred. The one blur in `app/motion.css` is on the hero's empty prompt box as it dissolves into the ink (section 8.9): it is leaving, and it holds no words.

### 8.11 Reduced motion

- With reduced motion, the boot script stops at its first check. It sets no motion or cover attributes and writes `data-ink="still"`.
- The `no-preference` rules never apply. A global safety net (in `globals.css`) forces every remaining animation and transition to 0.01ms with one iteration.
- Tallies are fully filled. Figures read as they always do.
- The ink layer shows the still image for its scene.

## 9. Primitives

All primitives live in `components/ui/`. Props are shown with their defaults in parentheses. Every primitive also accepts the attributes of its root element where it is a wrapper, and `className` where it is styled. Server components are the default; only `MotionRoot` is a client component.

### 9.1 Layout and surfaces

| Primitive | Props | Usage |
| --- | --- | --- |
| `Wrap` | `as` (div, section, header, footer, nav; div), `ref`, `className` | `<Wrap as="section" className={styles.inner}>...</Wrap>` |
| `Band` | `as` (section, div, header, footer, aside; section), `surface` (desk, paper, wash, ink, binder; desk), `pad` (regular, none, title, tight, roomy; regular), `backdrop`, `innerClassName`, `ref`, `className` | `<Band id="values" surface="paper">...</Band>` |
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
| `Eyebrow` | `as` (p, span, div; p), `marker` (true), `id`, `className` | `<Eyebrow>The problem</Eyebrow>` |
| `Note` | `className`, children | `<Note>These are samples.</Note>` |
| `Sentences` | `text` (string, split on line breaks), `move` (false) | `<Sentences text={"Most rollouts launch.\nFewer get adopted."} move />` |
| `KeepCompounds` | `text` | `<KeepCompounds text="Go/No-Go Decision Checklist" />` |
| `Tag` | `variant` (format, saving, plain; format), `className`, children | `<Tag variant="saving">Free sample</Tag>` |
| `FactList` | `items` ({ label, value }[]), `className` | `<FactList items={[{ label: "Type", value: "Plan" }]} />` |
| `Icon` | `name` (arrow, chevron, plus, minus, close, tick, bars, search), `size` (20), `flip` (false), `className` | `<Icon name="arrow" size={32} />` |
| `LogoMark` | `height` ("1.5em"), `className`, `title`, `tone` (one, two; one), `digits` (true) | `<LogoMark tone="two" height="2.5rem" />` (the 365 is drawn only in two inks, and only where the mark is 35px high or more) |
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
| `Blank` | `caret` (blink, steady, none; steady), `size` (sm, md, lg; md), `className` | `<Blank caret="blink" size="lg" />` |
| `Button` in `href` form | Forwards only `id`, `title`, `tabIndex`, `aria-label`, `aria-describedby`, `aria-current`, `onClick` | `<Button href="/purchase">Purchase</Button>` |
| `Button` with `aria-disabled="true"` | Looks like a `:disabled` button and stays focusable, so a keyboard reaches its words. It does nothing | `<Button size="lg" aria-disabled="true">Checkout coming soon</Button>` |

Button sizes: `sm` is 44px below 68em and 40px from 68em; `md` is 48px; `lg` is 56px. Buttons always carry `type-ui`. The `text` variant underlines its words and shows a mark highlight behind them on hover and focus.

### 9.5 Feedback and state

| Primitive | Props | Usage |
| --- | --- | --- |
| `Tally` | `total`, `filled` (number, or 1-based list), `marked` (1-based), `size` (sm, md, lg; md), `numerals` (false), `animate` (false), `label`, `anchor` ({ block, name }), `className` | `<Tally total={10} filled={9} marked={10} size="lg" anchor={{ block: 10, name: "tenth" }} />` |

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
| `TileGrid` | `className`, `locks` (true), children | `<TileGrid>{items}</TileGrid>`: a list with as many columns of at least 176px as fit, never fewer than two. It carries the drawing the locks draw from. |
| `LockedTile` | `title`, `headingLevel` (h3), `initialDenied` (false), children | Used by `TemplateTile`: the button named "<title>, locked" and its live line, "Included with the toolkit." |
| `ChainLock` | none | A drawing over a locked cover: two crossed steel chains and a padlock. Decorative, deaf to the pointer. |
| `TemplateDialog` | `closeHref`, `labelledBy`, children | `<TemplateDialog closeHref="/catalog" labelledBy="title-id"><TemplateDetail ... /></TemplateDialog>`: a native modal dialog; Escape, Close and the dimmed page close it. |
| `TemplateDetail` | `template`, `phase`, `titleId` | The pop-up's content: a large lit cover, the "Free sample" tag, the title, facts, what is included, and a button to `/purchase`. |
| `Portfolio` | `size` (page, section), `covers`, `phases`, `className` | `<Portfolio size="page" covers={samples} phases={phaseCoverage(phases, templates)} />`: the toolkit as a folder with its price tag and a tally of the phases. |
| `PriceTag` | `className` | The price from `OFFER` on a paper tag on a string. Used by `Portfolio`. |
| `Hero`, `HeroStage` | `samples`, `phases` | The home page's first screen and its stage (section 8.9). |
| `ProofStrip` | none | The hero's foot: four facts in a ruled row, on opaque paper. |
| `PurchaseButton` | `className` | The bar's one call to action; quiet on `/purchase` itself. |

Rules for them: a catalog tile has exactly one control; a price is printed from `OFFER` and never typed; text over a backdrop is marked with `data-ink-calm`, and an object on paper (the folder, the tag, the proof strip) needs no zone because no ink is behind its words.

## 10. The ink layer

### 10.1 Designer's view

The ink is the one place the page behaves like a physical material. A drop lands on the ground, spreads into the paper, and fades as it spreads. It is the working copy's pen: a mark made by the page itself, always beneath the text. The layer should feel like something that happened on the sheet, not an effect laid on top of it. Three things hold it there. The ink is calmed around every text block, so the copy keeps its paper or binder ground. Its brightness is capped against that ground, so the copy stays legible. And each backdrop is a still image until the browser can run the simulation well.

### 10.2 Scenes

Each scene is a short composition of drops, streams and clears. Designers choose a scene by where it sits on the page.

| Scene | Where | Ground | What the ink does |
| --- | --- | --- | --- |
| `intro` | The first-load cover | Paper | A black drop, then a blue drop, then the ink clears over about a second. |
| `prompt` | The home first screen, behind the headline and the documents | Paper | The page's prompt box stands empty for a moment. A black drop lands in it, a blue drop follows, the ink opens across the band and then turns to mist; the six documents land where the box stood. Slow drops then keep arriving across the band. |
| `title` | Wide title blocks (About, Sample and the phase pages) | Paper | A black and a blue drop, then occasional drops in the open half. |
| `ninety` | The home solution section (ink surface) | Binder | Waits. When the ninety-percent tally reaches its tenth block, blue ink drops onto it. |
| `bloom` | The home closing section, and the stage of the Purchase page | Paper | Blue ink rises from the bottom edge in slow, staggered drops. |
| `wisps` | The footer | Binder | Pale and blue wisps drift upward from the bottom. |
| `spill` | The 404 page | Paper | Black drops spill to the left over several seconds. |

Scenes run for a set time (3.5 seconds for the cover) or until a trigger fires. Scenes without a fixed duration keep running while their backdrop is on screen and rest once it leaves.

### 10.3 Stages and the single canvas

The page has one canvas. Only one backdrop is live at a time. The stage chooser works in three rules. If the topmost backdrop on screen has at least 40% of itself in view, it gets the canvas, unless another backdrop has at least 95% of itself in view; then the topmost of those gets it instead. Otherwise each backdrop scores its visible area times the weight of its scene (the cover is heaviest), and the highest score wins. The current holder keeps the canvas unless a challenger scores 1.25 times more, so the canvas stays put while the user scrolls slowly.

Backdrops that are not chosen show their still image. Each stage runs for a fixed time, then eases to rest over about 2.5 seconds. Input wakes a resting stage for up to 12 seconds.

### 10.4 Calm zones and caps

Text and figures inside a backdrop mark themselves with `data-ink-calm`. The ink is calmed in rectangles around them.

| Calm kind | Mark | Padding | Feather | Floor | Cap on paper | Cap on binder |
| --- | --- | --- | --- | --- | --- | --- |
| Text | `data-ink-calm="text"` | 24px (8px on narrow windows) | 120px (56px narrow) | 0.04 | 0.8 | 0.06 |
| Display | `data-ink-calm="display"` | 26px | 110px | 0.42 | 0.3 | 0.14 |
| Veil | `data-ink-calm="veil"` | 0 | 40px | 1 | 0.8 | 0.06 |

- Padding is the extra space around the element. Feather is the distance over which the ink fades toward the zone.
- Floor is the density the ink is calmed down to inside the zone. A floor of 1 means the zone is not calmed at all and only the cap applies. Display zones keep more ink than text zones, because large type reads through it.
- The cap is the luminance the ground must not cross. On a light ground the ground must not get darker than the cap; on a dark ground it must not get lighter. `tests/e2e/ink-live.spec.ts` checks each cap from the pixels under each zone; `node scripts/ink-stills.mjs --check` checks the stills at seven widths.
- When more than four calm rectangles exist, the closest pairs merge until four remain, and the stricter kind wins. Edges are kept separately, at most four.
- Edges (`data-edges="top right bottom left"`) fade ink in from the viewport side, so it enters from the edge of the frame rather than from behind a block of text.

`data-ink-anchor="open"` marks open water: the space where a drop is welcome (the hero's stage, where the first drop lands). `data-ink-anchor="tenth"` marks the block the ninety scene answers.

### 10.5 Quality tiers

The engine runs at one of three tiers and picks one at start.

| Tier | Simulation cells | Dye pixels | Pressure iterations | Max device pixel ratio | Canvas pixels |
| --- | --- | --- | --- | --- | --- |
| high | 112,000 | 1,300,000 | 26 | 2 | 2,400,000 |
| medium | 62,000 | 760,000 | 20 | 1.75 | 1,700,000 |
| low | 34,000 | 420,000 | 16 | 1.5 | 1,000,000 |

A short probe on the first load picks the tier, starting at high on fine pointers and at medium on coarse ones. The tier steps down when frames run long, and is saved for the session. A device that cannot keep up at the lowest tier falls back to stills for the session.

### 10.6 The cover handover

If the browser supports the required extensions, the ink can start under the cover. It takes over the cover's intro scene only while the cover's exit animation has run for no more than 1600 ms; after that, the cover runs alone. Visually, the ink appears behind the logo as it draws and clears as the cover leaves.

### 10.7 Stills

When the simulation is not running, each backdrop shows a WebP still. Each backdrop names its still in the component that renders it, and the wide and tall frames are served by a `picture` element. The site keeps thirteen stills, each at most 90 KiB, and at most 600 KiB in total.

| Still | Route | Viewport (CSS px, ratio) | Scene |
| --- | --- | --- | --- |
| `prompt-wide` | `/` | 1440 x 900, 1x | prompt |
| `prompt-tall` | `/` | 320 x 700, 2x | prompt |
| `ninety-wide` | `/` | 1440 x 900, 1x | ninety |
| `ninety-tall` | `/` | 320 x 700, 2x | ninety |
| `bloom-wide` | `/` | 1920 x 900, 1x | bloom |
| `bloom-tall` | `/` | 390 x 844, 2x | bloom |
| `bloom-purchase-wide` | `/purchase` | 1088 x 900, 1x | bloom |
| `bloom-purchase-tall` | `/purchase` | 320 x 700, 2x | bloom |
| `wisps-wide` | `/about` | 1920 x 900, 1x | wisps |
| `wisps-tall` | `/about` | 390 x 844, 2x | wisps |
| `title` | `/about` | 1088 x 900, 1x | title |
| `spill-wide` | `/nope` | 1440 x 900, 1x | spill |
| `spill-tall` | `/nope` | 320 x 700, 2x | spill |

The manifest is `lib/ink/stills.json`. The stills live in `public/ink/`. A page whose text zones differ from the home page's has a pair of its own, captured on that page: the Purchase page's tally stands where the home page's `bloom` frame holds ink. A wide frame is captured at the narrowest window it serves (a zone of fixed size covers more of a frame the narrower the window), a tall one at 320 or 390.

A still is scaled with the width of its backdrop, with three exceptions. From 68em the `prompt` frame stands at the size it was captured at (90rem wide), centred, and is only scaled where the band is wider. Below 68em the `ninety` frame takes the height of its band, centred, so its ink lands in the open water under the tally instead of past the foot of a band shorter than the frame; the margins either side are the frame's own ground. The footer's `wisps` backdrop is a strip 112px tall under the legal line (`--foot` in `footer.module.css`), anchored at the bottom and faded in over its top half, so the footer's words never stand over ink.

### 10.8 Using the backdrop

`InkBackdrop` takes `scene` (required), `still` (`{ wide, tall? }`), `edges`, `priority` (false; the still is asked for at high priority, for a backdrop in the first screen) and `className`. Its parent must be positioned, and the backdrop fills it. Content placed after the backdrop is lifted above it.

```tsx
<Band surface="paper" backdrop={<InkBackdrop scene="prompt" still={{ wide: "prompt-wide", tall: "prompt-tall" }} edges="bottom" priority />}>
  <p data-ink-calm="text" className="type-lead">...</p>
</Band>
```

Rules for contributors:

- Use one backdrop per section, and no more than one canvas on a page.
- Mark every text block that sits over ink with `data-ink-calm`.
- Use `veil` for a footer or panel that should stay clean. Use `text` for copy and `display` for large figures.
- Place ink on a band's ground. Do not place it on a sheet or inside a panel.
- Keep the pause control visible: the layer renders it in the backdrop's bottom-right corner, 44px square.

### 10.9 Pause and fallbacks

The ink shows a pause control. Paused ink stays on its still image and remembers the choice for the session. Ink falls back to stills when any of these holds:

- Reduced motion is on.
- Contrast is set to more, or forced colours are active.
- Data saver is on.
- WebGL2 is unavailable, or no float render target is available, or the renderer is a software one.
- The lowest tier cannot keep up.

## 11. Logo and icons

### 11.1 The mark

The logo is three strokes on a 32 by 24 grid: two legs meeting at a peak, and a crossbar that continues to the right as the tail. Stroke width is 4.2, with round caps and joins. A small blue "365" stands on the tail, in a finer pen. The geometry lives in `lib/brand/mark.ts`:

- `MARK_LEGS_D`: the legs.
- `MARK_BAR_D`: the short crossbar inside the legs.
- `MARK_TAIL_D`: the tail, drawn in the mark colour.
- `MARK_BODY_D`: the legs and the crossbar together.
- `MARK_VIEWBOX`: 32 by 24.
- `MARK_DIGITS`: the 3, the 6 and the 5, each one open pen stroke; `MARK_DIGITS_D` joins them, `MARK_DIGITS_STROKE_WIDTH` is 1.1, and `MARK_DIGITS_BOX` is x 18.8 to 30.8, y 5.8 to 10.6, inside the view box, clear of the legs and above the arm.

`BrandLockup` renders the mark in tone `two`: the body takes `currentColor` and the tail and the digits take `--logo-tail`, which is the mark colour. `LogoMark` defaults to tone `one`, which draws the whole mark in `currentColor` and never draws the digits.

### 11.2 Lockups

`BrandLockup` pairs the mark with the name in Besley. The `tile` variant sets the mark in an ink square. The `bare` variant sets the mark and name on the current ground. Sizes are `sm` and `md`. The `md` tile is 28px, and from 68em 49px with the mark 35px high (72% of the tile, 3px of ink either side), which makes the digits 7px high; the bare `md` mark (the footer) is 36px high, so its digits are 7.2px. The digits show only there: they would be 3px high on the 28px tile, so the phone bar, the drawer's `sm` lockup and the folder's tile go without them.

### 11.3 Site icon

`app/icon.svg` is the site icon: a 32 by 32 ink tile with a 7-unit corner radius, the white body and the blue tail, without the digits (a 365 there would be about 3px high). Its values match the mark and the tokens above.

### 11.4 Icon set

`Icon` draws eight glyphs on a 20-unit grid with a 1.75 stroke, round caps and joins, and `currentColor`. The names are `arrow`, `chevron`, `plus`, `minus`, `close`, `tick`, `bars` and `search` (the magnifier on the catalog search's submit button). Icons are decorative (`aria-hidden`); pair them with a visible or visually hidden label.

## 12. Do and do not

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
| Mark text over ink with `data-ink-calm`. | Place ink behind body copy with no calm zone. |
| Use `TransitionLink` or `TextLink` for internal links. | Import `next/link` in a component. |
| Keep the hit area of a control at least 44px below 68em. | Make a target smaller than `--tap` on a phone. |
| Write copy with typographic quotes and apostrophes. | Use straight quotes or exclamation marks in copy. |
| Keep one `h1` on each page. | Use a heading for styling alone. |
| Use `--alert` only for errors and for a locked tile's refusal. | Use the alert colour for emphasis. |

## 13. Accessibility floor

### 13.1 Text and non-text contrast

- Body and heading text meets 4.5 : 1 on every ground the system uses (section 3.3).
- Control borders meet 3 : 1 on the paper and desk grounds (`--line-firm`, 4.56 : 1 and 4.19 : 1).
- The mark is never the only indicator. A marked block, link, or tab carries ink as well.

### 13.2 Focus

- Every focusable element shows a 3px outline with a 3px offset, in `--focus-ring`: ink on light bands, mark on the binder.
- The skip link to `#main` appears on the first Tab.
- Under forced colours, the outline becomes `Highlight`.
- Native dialogs move focus into the dialog and return it to the control that opened it. Escape closes a dialog.

### 13.3 Targets and sizes

- Interactive targets are at least 44px tall below 68em (`--tap`). The desktop bar uses a 40px control.
- The smallest text is 12px and only in uppercase tags. Body copy is 16px.
- Text is sized in rem, so the browser's text size settings apply. The root uses `-webkit-text-size-adjust: 100%`.

### 13.4 Media queries and modes

In stylesheets, the allowed media queries are exactly these, and the design gate rejects any other:

| Query | Behaviour |
| --- | --- |
| `(min-width: 40em)` | The tablet layout. |
| `(min-width: 68em)` | The desktop layout: inline navigation, rail, four-layer depth, twelve columns. |
| `(hover: hover)` | Hover states and the sheet tilt. |
| `(prefers-reduced-motion: no-preference)` | Every animation and transition. |
| `(prefers-reduced-motion: reduce)` | The global safety net and the reduced-motion branches. |
| `(prefers-contrast: more)` | The ink backdrop is hidden, the bar gets a solid ink border, and paper sheets get a solid border. |
| `(forced-colors: active)` | Blocks use system colours, the backdrop is hidden, and borders use `CanvasText`. |
| `@container (max-width: 27.4em)`, `(max-width: 24.3em)` (header), `(max-width: 17em)` (nav drawer) | A name that does not fit its container is hidden visually and stays readable to assistive technology. |

Scripts also query `(pointer: coarse)` and `(prefers-reduced-data: reduce)`. Stylesheets do not query `prefers-color-scheme`. `:root` declares `color-scheme: light`, and the design gate enforces this.

### 13.5 Semantics

- Site pages have one `header` (the banner), one `main` with `id="main"`, and one `footer` (the contentinfo landmark).
- Navigation is labelled: `Primary` for the header, `Phases` for the rail, `Footer` for the footer, `Breadcrumb` on section pages, `Pagination` on catalog pages, `Start from a phase` for the phone catalog's strip, `Browse by phase` in the catalog's empty search, `Previous and next phase` at the foot of a phase page, and `Menu` for the site drawer.
- The current page is marked with `aria-current="page"`, and the current section with `aria-current="true"`.
- Decorative elements are hidden from assistive technology: the ink backdrop, the 90% figure (its heading says it in words), unlabelled tallies, numerals on phase tabs, the specimen sheet, the hero's prompt box and the chain and padlock over a locked cover (the tile's button says "locked").
- Each `Tally` or count with a meaning carries a `label`.

### 13.6 Motion and ink

- Motion is off for reduced motion, and the ink layer shows stills.
- The cover never plays under reduced motion.
- No motion is infinite.

## 14. Contributing checklist

- Read the token before you write a value. If a value is not a token, add one in `app/globals.css` and use it.
- Compose with primitives: `Band`, `Wrap`, `Split`, `PaperSheet`, `Button`, `RowLink`, `BandedList`.
- Check the contrast table for every pairing, and test it under forced colours and `prefers-contrast: more`.
- Gate every animation and movement inside `no-preference`, or start it from a state the boot script sets when motion is allowed, and add its hook to section 8.5.
- Mark every text block over ink with `data-ink-calm`.
- Run the checks from the repository root:

```sh
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e
```

`corepack pnpm test` runs the design gate and the unit tests. `corepack pnpm test:e2e` builds the site, serves it on port 3100, and checks identity, motion, ink, reduced-motion, menu and keyboard behaviour in a browser (`tests/e2e`).
