---
name: Advanta365
description: A working copy on a desk. White paper, near-black ink and one light-blue highlighter.
colors:
  mark: "#86c1ff"
  mark-deep: "#5fa8f5"
  mark-wash: "#eaf4ff"
  alert: "#a32b1d"
  alert-wash: "#fbeae5"
  paper: "#ffffff"
  paper-shade: "#f1f3f7"
  desk: "#f4f5f8"
  desk-deep: "#e6e8ee"
  rule: "#d2d5de"
  rule-firm: "#70758a"
  ink: "#0b0d12"
  ink-soft: "#3a3f4c"
  ink-faint: "#596072"
  on-ink: "#ffffff"
  binder: "#0d0f15"
  binder-rise: "#1c202b"
  on-binder: "#f4f5f8"
  on-binder-soft: "#b4b9c7"
  rule-on-binder: "#343947"
  scrim: "rgb(11 13 18 / 0.5)"
typography:
  poster:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(7rem, 2.171rem + 19.81vw, 20rem)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "0"
  hero:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(2.5rem, 1.5714rem + 3.8095vw, 5rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "0"
  statement:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(2.125rem, 1.243rem + 3.619vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "0"
  banner:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(2.125rem, 1.5225rem + 2.472vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "0"
  page:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(1.75rem, 1.4213rem + 1.348vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "0"
  section:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(1.375rem, 1.2654rem + 0.449vw, 1.625rem)"
    fontWeight: 600
    lineHeight: 1.24
    letterSpacing: "0"
  item:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(1.125rem, 1.0702rem + 0.225vw, 1.25rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
  amount:
    fontFamily: "Besley, Rockwell, 'Roboto Slab', Georgia, serif"
    fontSize: "clamp(1.875rem, 1.6012rem + 1.124vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  lead:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(1.125rem, 1.0702rem + 0.225vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  copy:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(1rem, 0.9726rem + 0.112vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.58
    letterSpacing: "0"
  ui:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "0"
  note:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "0"
  eyebrow:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.385
    letterSpacing: "0.08em"
  tag:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: "0.06em"
rounded:
  round-1: "3px"
  round-2: "6px"
  round-3: "10px"
spacing:
  s-1: "0.4375rem"
  s-2: "0.875rem"
  s-3: "1.3125rem"
  s-4: "1.75rem"
  s-5: "2.625rem"
  s-6: "3.5rem"
  s-7: "5.25rem"
  s-8: "7rem"
  s-9: "10.5rem"
  page-max: "77rem"
  page-max-ceiling: "120rem"
  tap: "2.75rem"
  control-sm: "2.5rem"
  control: "3rem"
  control-lg: "3.5rem"
components:
  button-mark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-2}"
    padding: "0.4375rem 1.3125rem"
    height: "{spacing.control}"
  button-mark-hover:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
  button-mark-active:
    backgroundColor: "{colors.mark-deep}"
    textColor: "{colors.ink}"
  button-on-binder:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-2}"
    padding: "0.4375rem 1.75rem"
    height: "{spacing.control-lg}"
  button-on-binder-hover:
    backgroundColor: "{colors.mark-wash}"
    textColor: "{colors.ink}"
  button-on-binder-active:
    backgroundColor: "{colors.mark-deep}"
    textColor: "{colors.ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-2}"
    padding: "0.4375rem 1.3125rem"
    height: "{spacing.control}"
  button-outline-hover:
    backgroundColor: "{colors.mark-wash}"
    textColor: "{colors.ink}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-1}"
    padding: "0"
    height: "{spacing.tap}"
  button-text-hover:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
  button-disabled:
    backgroundColor: "{colors.desk-deep}"
    textColor: "{colors.ink-faint}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-2}"
    padding: "0 0.875rem"
    height: "{spacing.control}"
  input-disabled:
    backgroundColor: "{colors.desk-deep}"
    textColor: "{colors.ink-faint}"
  checkbox:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.round-1}"
    size: "{spacing.s-3}"
  checkbox-checked:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
  checkbox-checked-hover:
    backgroundColor: "{colors.mark-deep}"
  tag-format:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.round-1}"
    padding: "2px 0.4375rem"
  tag-saving:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
    typography: "{typography.note}"
    rounded: "{rounded.round-1}"
    padding: "2px 0.4375rem"
  tag-plain:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-1}"
    padding: "0.4375rem 0.875rem"
  paper-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round-1}"
  folder-front:
    backgroundColor: "{colors.mark-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round-2}"
    padding: "1.3125rem"
  price-tag:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.amount}"
    rounded: "{rounded.round-1}"
  template-dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round-3}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-2}"
    padding: "0 0.875rem"
    height: "{spacing.control-sm}"
  nav-link-hover:
    backgroundColor: "{colors.mark-wash}"
  nav-link-current:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  phase-menu-link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-1}"
    padding: "0 0.4375rem"
    height: "{spacing.tap}"
  phase-menu-link-hover:
    backgroundColor: "{colors.mark-wash}"
  row-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.round-2}"
    padding: "0.875rem"
    height: "{spacing.control-lg}"
  row-link-hover:
    backgroundColor: "{colors.mark-wash}"
    textColor: "{colors.ink}"
  note:
    backgroundColor: "{colors.mark-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-2}"
    padding: "0.875rem 1.3125rem"
  blank:
    backgroundColor: "{colors.mark}"
    rounded: "{rounded.round-2}"
    height: "{spacing.s-5}"
  page-number:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.round-2}"
    size: "{spacing.tap}"
  page-number-current:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
  footer:
    backgroundColor: "{colors.binder}"
    textColor: "{colors.on-binder}"
---

# Design System: Advanta365

## Overview

**Creative North Star: "The Working Copy"**

The site is a desk with documents on it. White sheets of paper lie on a cool grey desk, set in near-black type, and one light-blue highlighter marks the parts that belong to the buyer: the blank still to fill, the tenth block of ten, the phase they are on. Everything the system draws is an object from that desk. A sheet has a tooth, a light on it and a layered shadow. A folder has a tab and sheets standing in it. Phases are index tabs, lists are ledgers ruled with hairlines, and progress is a tally of blocks. The site sells one thing, the complete toolkit, and it is the folder on the desk with its price on a paper tag: six sample templates lie open on the desk, and every other template is locked, its cover out of focus.

Nothing moves behind the text: a band is plain paper, desk or a dark ground. The motion is small and physical, and it belongs to the objects: a sheet settles as it scrolls into view, rises 6px and tilts up to 1.2 degrees toward the pointer, a rule is drawn from the left, a tally fills block by block, and a first visit opens on a blank page where the logo is signed stroke by stroke, the small 365 on its arm last. On the first screen the six free samples land as a hand of finished documents, the middle ones first. The prompt is only the first blank: the headline's last word is a split-flap board that turns, letter by letter, through prompt, page, project, document, plan, design and idea, so the promise is "never from blank", whatever the tool.

The density is that of a document, not of a dashboard: reading-width columns, a twelve-column grid from 68em, bands 56 to 112px deep, and type that carries the hierarchy before colour or depth add anything. The system has a light scheme only. Under reduced motion, raised contrast, forced colours or no JavaScript the page is complete: shadows give way to ink lines, and nothing waits hidden.

**Key Characteristics:**

- Paper objects on a desk: sheets, stacks, folders, index tabs and ledgers, each with a real edge and a real shadow.
- Three inks: near-black for what is written, light blue for what is the buyer's, and a dark binder ground for the footer and the statement bands.
- The highlighter always comes with ink (a border, a ring, a tick or the text itself) and is never a text colour on a light ground.
- Two typefaces with fixed jobs: a slab serif for the documents and their figures, a hyperlegible sans for the store.
- A 7px module for every space, two breakpoints (40em and 68em) for every layout, and one root size that grows past a 1600px window, so a large monitor gets the same page drawn larger.
- Every size and space in rem, so the whole page scales together on a large monitor.
- Plain grounds: paper, desk and dark bands, with nothing moving behind the text.
- Movement only inside the no-preference motion query. Bands and surfaces change ground with a hard edge and never fade.

## Colors

White, near-black and one light blue, on cool greys that lean a few degrees toward the blue so the desk, the rules and the ink read as one family.

### Primary

- **Highlighter Blue** (`mark`, #86c1ff): the buyer's colour. It fills the blank on a template cover, the marked block of a tally, a checked box, the current phase card and the numeral of the current phase in the drop-down, a saving tag (the "Free sample" tag among them), the square before an eyebrow, the tail of the logo and the 365 on it, the headline's last words and the text selection. Under the pointer or keyboard focus it comes up inside solid buttons and behind the words of a link. On the binder it is the fill of the footer's one button.
- **Pressed Highlighter** (`mark-deep`, #5fa8f5): the highlighter one step deeper. A solid button while it is held down and a checked box under the pointer.
- **Highlighter Wash** (`mark-wash`, #eaf4ff): the highlighter diluted to a ground. The wash band, the front and tab of a folder (the front of a page-size folder lies under a light, `card-light`), a note, the bar's button when it is the current page, the hover and focus fill of the footer's button, and the hover and focus fill of rows, outline buttons, navigation links and tabs.

### Secondary

- **Correction Red** (`alert`, #a32b1d) on **Correction Wash** (`alert-wash`, #fbeae5): reserved for errors and for a locked tile's refusal, whose ring on the cover well hits and fades in the red. No component draws an error state today; the wash exists so that the first one has its ground.

### Neutral

- **Paper** (`paper`, #ffffff): the sheet, the body background, the sticky bar, the navigation drawer and the ground of every paper band.
- **Paper Shade** (`paper-shade`, #f1f3f7): the far corners of a sheet, where its radial light falls off.
- **Desk** (`desk`, #f4f5f8): the cool grey the sheets lie on. The desk band, the numeral tiles of the phase lists, striped rows and the scrollbar track.
- **Deep Desk** (`desk-deep`, #e6e8ee): a small well in the desk. Count badges, numeral tiles and the fill of every disabled control.
- **Rule** (`rule`, #d2d5de): decorative hairlines only: ledger rules, the margin rule, the ghost lines printed on a cover.
- **Firm Rule** (`rule-firm`, #70758a): borders that must be seen. Inputs, selects, unchecked boxes, empty tally blocks and the scrollbar thumb.
- **Ink** (`ink`, #0b0d12): primary text, solid buttons, ink borders and rings, the logo tile and the focus ring on light grounds.
- **Soft Ink** (`ink-soft`, #3a3f4c): secondary text and leads.
- **Faint Ink** (`ink-faint`, #596072): captions, counts, placeholders and the text of disabled controls.
- **On Ink** (`on-ink`, #ffffff): text on an ink fill.
- **Binder** (`binder`, #0d0f15): the dark ground of the footer and of the ink bands.
- **Binder Rise** (`binder-rise`, #1c202b): a raised surface on the binder: the surface, stripe and tile of a dark band.
- **On Binder** (`on-binder`, #f4f5f8) and **Soft On Binder** (`on-binder-soft`, #b4b9c7): primary and secondary text on the binder.
- **Binder Rule** (`rule-on-binder`, #343947): hairlines on the binder.
- **Scrim** (`scrim`, ink at 50%): the dimmed page behind the navigation drawer, the filter sheet and the pop-up of the catalog.

### Named Rules

**The Mark Carries Ink Rule.** The highlighter fill is never the only signal. On paper it measures 1.89 : 1, too pale to be seen alone, so every marked thing also has an ink border, an inset ink ring, an ink tick or a heavier weight of ink text.

**The Background Only Rule.** On a light ground the highlighter is a background behind ink text and never a text, icon or line colour. Only on the binder, where it measures 10.11 : 1, does it become a line: the focus ring and the underline of a hovered link, and in the footer the 2px edge along its top.

**The Band Decides Rule.** Components read eleven semantic names (`ground`, `surface`, `stripe`, `tile`, `text`, `text-soft`, `text-faint`, `line`, `line-firm`, `line-ink`, `focus-ring`) and never a raw colour. Each band (`desk`, `paper`, `wash`, `ink`, `binder`) redefines them, and a sheet or a folder front resets them to the paper values, so one component is correct on every ground.

**The Light Fill Rule.** The wash and the highlighter are light on every band. While one of them is the fill of a hovered or current element, everything inside reads the ink colours, whatever the band says.

## Typography

**Display Font:** Besley (with Rockwell, Roboto Slab, Georgia, serif)
**Body Font:** Atkinson Hyperlegible Next (with Segoe UI, system-ui, Helvetica Neue, Arial, sans-serif)

**Character:** A sturdy slab serif at weights 600 to 800 speaks for the documents: their titles, their figures and their prices. A sans drawn for legibility speaks for the store: copy, labels and controls. The pairing reads as a printed deliverable with clear margin notes, not as an app.

### Hierarchy

- **Display** (`poster`, 800, 112 to 320px, 0.86): one figure per page at most. The 90% of the home statement band, the phase numeral, the 404.
- **Display** (`hero`, 600, 40 to 80px, 1.04): the home headline only. From 68em it is two lines across the page and never taller than the window lets them be, so the first screen fits. On a large monitor it grows with the column (a sixteenth of it, once that is more than the size's own top of 5rem), so the two lines still span the page.
- **Headline** (`statement`, 600, 34 to 72px, 1.06): large statements, and the wide form of a page title. One or two headlines per page at most: where a page makes several statements in a row (Why Advanta), the rest step down to `banner` or `page`, so two headlines carry it. The Contact page's address, a link and not a headline, is set at this size too.
- **Headline** (`banner`, 600, 34 to 56px, 1.12): standard page titles and the one-sentence statement of a section.
- **Title** (`page`, 600, 28 to 40px, 1.16): the heading of a shelf of content.
- **Title** (`section`, 600, 22 to 26px, 1.24): section headings and large row labels.
- **Title** (`item`, 600, 18 to 20px, 1.3): row and card titles.
- **Title** (`amount`, 700, 30 to 40px, 1.1): prices.
- **Body** (`lead`, 400, 18 to 20px, 1.5): lead paragraphs, at most 40rem wide, in soft ink.
- **Body** (`copy`, 400, 16 to 17px, 1.58): body copy and the body default, at most 36rem wide.
- **Label** (`ui`, 600, 16px, 1.375): buttons, links in the bar and field labels. Typed values, notes and plain tags use the same size at weight 400.
- **Label** (`note`, 400, 14px, 1.43): notes, captions, breadcrumbs and facts.
- **Label** (`eyebrow`, 700, 13px, 0.08em, uppercase): the label over a heading, with a 9px highlighter square before it.
- **Label** (`tag`, 700, 12px, 0.06em, uppercase): format tags.

Every display size is fluid between the two ends given, and every size is set in rem. The sizes in pixels on this page are those at the 16px root: past a 1600px window the root grows (see Layout) and every size grows with it. Headings are balanced (`text-wrap: balance`, at most 22em wide) and paragraphs use `text-wrap: pretty`.

### Named Rules

**The Two Voices Rule.** Besley is for what a document says: headings, figures, prices, numerals on tabs and tiles. Atkinson Hyperlegible Next is for everything the store says. A component never mixes them inside one line of text.

**The Small Is Loud Rule.** The two sizes under 14px are always uppercase, weight 700 and tracked. The text in the markup stays in sentence case; the capitals are drawn by the style.

**The Own Figures Rule.** Display type keeps Besley's own lining figures and turns tabular figures off, because its tabular zero is drawn thin from weight 600 up. Columns of numbers in the text face use tabular lining figures.

**The No Tracking Rule.** Letter spacing is 0 at every size from 14px up. Hierarchy comes from size, weight and face.

## Layout

The page is a stack of full-width bands. A band paints its own ground, sets the text colour for everything inside it, and holds a centred column 77rem wide (twelve 77px columns and eleven 28px gaps, 1232px) up to a 1600px window, and wider past it (see below), with the page padding outside it: 21px on a phone, 28px from 40em and 42px from 68em. The column gap follows the same steps at 14, 21 and 28px.

All space comes from a 7px module: 7, 14, 21, 28, 42, 56, 84, 112 and 168px. A band is padded 56px above and below on a phone and 84px from 40em. A roomy band takes 84 and 112px, a tight one 42px, a title band 28 and 42px. A pixel figure for a size or a space in this file is that size at the 16px root; hairlines, edges, corner radii and shadows are drawn in pixels at any root.

A large monitor gets the same page, drawn larger, and not a wider desk with the same page in its middle. Up to a 1600px window the root font size is 16px. Past it the root grows by 0.5% of every pixel of window, to 140% (22.4px) at about 2880px, and since every size and space is in rem (the module, the type, the controls, the icons and the caps on a band) the whole page scales together. The column grows faster: `page-max` is 77rem as a floor, from about 1840px of window it is 72% of the window, and it stops at `page-max-ceiling`, 120rem. On a 1920, 2560 or 3440 monitor the words span about 70% of the window, on a 4K panel the ceiling holds them at 2688px. Objects that would be lost in a wider column are drawn larger with it: the hero's headline, its hand of documents and its proof strip, the toolkit's folder on the home page, and, by a scale that stops at what the window's height leaves room for, the folder and the contents leaf of the Purchase page and the worked example's page. A few measures stay fixed on purpose: a ledger of rows with a label at one end and a link at the other holds to 64rem, and the filter sheet to 40rem, so a row is never a thousand pixels from its arrow.

There are two breakpoints and no others, and a large monitor is not a third. They are written in em, which a browser reads at its own text size and not at the root size the page sets, so 40em and 68em stay where they are while the root grows; nothing changes layout at 1600px, the page only grows from there. Below 40em is the phone layout: one column, full-width stacked buttons, index rows in place of sheets. From 40em sheets stand two across and rows gain a second column; a tablet in portrait, 768px wide, is this layout, and where a pair of things has room for two columns before 68em (an aside beside a page title, the Why Advanta sheets, the Purchase folder and leaf from about 1010px) it takes them. From 68em the twelve-column grid applies: a margin in columns 1 to 3 with content in 4 to 12, the home first screen centred across the whole band, the inline navigation with its Roadmap drop-down and the deeper shadows. Three container queries hide the brand name or the word Menu visually when the bar or the drawer is too narrow for them; the text stays readable to assistive technology. A fourth, on the line of phases on Why Advanta, draws its tally only where the line itself is 72rem wide.

A sticky white bar tops every page, 56px tall and 70px from 68em; nothing stands under it. Anchors and focused elements stop 21px clear of the bar. The catalog is the one page with no title block: it opens straight on its rail and results, 42px under the bar, and its `h1` is read out and not shown.

Bands alternate between paper and desk down a page. The wash is a single tinted moment, the ink band a single statement, and the binder is the footer. Controls are 48px tall by default, 56px large, and 40px in the desktop bar; below 68em no target is shorter than 44px.

## Elevation & Depth

Depth is layered and physical. Every paper object casts a soft shadow in the ink colour, built from a 1px ring at 5 to 6% and up to three stacked drops. The scale has five steps and each means a height above the desk. Bands themselves are flat: they meet with a hard edge and no shadow.

### Shadow Vocabulary

- **Depth 0, a hairline ring** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.06)`): a sheet lying flat.
- **Depth 1, a thumbnail or a tab** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 1px 2px rgb(11 13 18 / 0.06), 0 3px 6px -2px rgb(11 13 18 / 0.06)`): cover thumbnails, the sheets under a stack, and the back, tab and inner sheets of a folder.
- **Depth 2, an object at rest** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 2px 4px -1px rgb(11 13 18 / 0.06), 0 10px 20px -8px rgb(11 13 18 / 0.12), 0 28px 44px -24px rgb(11 13 18 / 0.14)`): the default sheet and the front of a folder.
- **Depth 3, lifted or a panel** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 12px 24px -8px rgb(11 13 18 / 0.18)`; from 68em `0 0 0 1px rgb(11 13 18 / 0.05), 0 4px 8px -2px rgb(11 13 18 / 0.07), 0 20px 36px -12px rgb(11 13 18 / 0.16), 0 48px 72px -32px rgb(11 13 18 / 0.2)`): the toolkit's sheet in the comparison, the front of a page-size folder, the middle documents of the hero's hand, and the shadow a resting sheet takes when it is lifted.
- **Depth 4, the top of a stack** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 20px 40px -12px rgb(11 13 18 / 0.24)`; from 68em `0 0 0 1px rgb(11 13 18 / 0.05), 0 8px 14px -4px rgb(11 13 18 / 0.08), 0 32px 56px -16px rgb(11 13 18 / 0.2), 0 84px 112px -42px rgb(11 13 18 / 0.26)`): the navigation drawer, the filter sheet and the pop-up of the catalog.
- **Bar shadow** (`box-shadow: 0 10px 21px -14px rgb(11 13 18 / 0.4)`): under the sticky bar. It is absent at the top of a page and arrives over the first 84px of scroll.

### Named Rules

**The Second Shadow Rule.** No shadow is ever animated. An object that lifts carries its lifted shadow on a pseudo-element from the start, and only that layer's opacity moves.

**The Rest And Lift Rule.** A sheet's lifted shadow is one step above its resting one and never lower than depth 3. Only a sheet marked as lit lifts, 6px, under the pointer on a device that hovers and under keyboard focus inside it.

**The Ink Line Fallback Rule.** At raised contrast every shadow gives way to a 1px ink border, and in forced colours to a system border. An object is never defined by its shadow alone.

## Shapes

Corners are small, as on cut paper. Sheets, tags, checkboxes, tally blocks and numeral tiles take 3px. Controls, tabs, rows, notes, page numbers and the panels of a folder take 6px. The 10px radius appears on the top corners of the filter sheet that rises from the bottom of a phone, on the pop-up of the catalog and on the panels of a page-size folder. The logo tile has its own 7px corner.

Edges come in two weights: a 1px hairline for rules and quiet borders, and a 2px ink edge for control borders, inset rings and thick underlines. A ring is drawn inside the box, so a state change never alters a size.

Sheets keep the proportions of what they stand for: 5 : 7 for a Word document or a PDF, 4 : 3 for a workbook, 16 : 9 for a slide. A PDF has its top-right corner cut and folded over. A sheet may rest turned by a degree or two, and the sheets under a stack are offset and turned behind it. Icons and the logo are monoline with round caps and joins: icons at a 1.75 stroke on a 20-unit grid, the logo at 3.8 on a grid 24 units high (36 wide with the 365 on its arm, 30 without), and the 365 at 1.4 in the ink of the tail, flush with its end. The 365 is drawn only where it is 7px high (the bar's tile from 68em, the footer's mark, the cover), never on the favicon; below that the logo is drawn without it and with a shorter tail.

## Components

### Buttons

Plain and certain. A button answers the pointer by taking the highlighter, and its border never changes, so its width never does.

- **Shape:** gently squared (6px), a 2px border, 48px tall with 7px by 21px of padding. The small size is 44px, and 40px in the desktop bar; the large size is 56px with 28px of side padding.
- **Primary (`mark`, and `ink` on the wash band):** solid ink with white text. Under the pointer or keyboard focus the fill becomes the highlighter inside the unchanged ink border and the text turns to ink. Held down, the fill goes one step deeper.
- **On the binder:** the primary button is the highlighter fill with ink text (a solid ink button would be the ground). Under the pointer or keyboard focus it dilutes to the wash, and held down it goes one step deeper to `mark-deep`. The footer's one button is drawn this way.
- **Secondary (`outline`):** transparent with a 2px border in the text colour of its band. Hover, focus and press fill it with the wash, or with paper on the wash band.
- **Text:** no box. Underlined ink words with a 44px hit height; on hover and focus the underline thickens to 2px and the highlighter is drawn behind the words and 2px past their ends.
- **Motion:** colour changes take 120ms, linear. An arrow after the label moves 3px to the right on hover and focus. A press moves the button down 1px.
- **Disabled:** deep-desk fill, rule border, faint text, a not-allowed cursor, and no movement. A button that is busy and cannot be pressed again (the pay button of the checkout while a payment opens) is drawn this way with `aria-disabled`; it stays in the tab order so a keyboard reaches its words.
- **In the bar:** "Get the toolkit · $1,499.99 CAD" in the small size, solid ink with the price from 68em and without it below. On the Purchase page, where the visitor already is, it is the wash with an ink edge and does not change under the pointer.

### Chips

- **Format tag:** a paper chip with a 1px ink border and uppercase 12px text, naming a file format on a cover or a row.
- **Saving tag:** the highlighter with an inset 1px ink ring and 14px ink text at weight 700, in sentence case. It reads "Free sample" on a free template.
- **Plain tag:** paper with a 1px firm rule border, roomier (7px by 14px), in 16px text at weight 400.
- **Filter chip:** above the catalog results, one small outline button per filter that is on, 7px apart in a wrapping row, each the value's name with a close mark after it (44px tall below 68em, 40px from there), and a text button, "Clear all", after the last. Nothing is drawn while no filter is on.

### Cards / Containers

There are no boxed cards. A thing in a list is either a row on a hairline or a paper object with a caption under it.

- **Paper sheet:** a 3px corner, paper lit from its top-left corner and a shade darker at the far ones, a pre-rendered grain on medium and large sheets, depth 2 at rest. It has no padding of its own; a panel made from it is padded 21px, and 28px from 40em. Inside a sheet the colours are those of paper whatever band it lies on.
- **Paper stack:** two or more blank sheets under the top one, at depth 1, offset and turned from 40em and only slightly turned below it.
- **Register:** a ruled ledger on one paper sheet with two sheets beneath it (the Why Advanta buyers). Hairline rows run to the sheet's edges, from 68em a margin line stands between the numerals and the names, and a head row carries the column labels.
- **Folder:** the toolkit. A wash-coloured tab 28px tall names it, a back panel holds up to three white sheets standing 5px lower each, and a wash front panel at depth 2 carries the content. Under the pointer or focus the sheets rise 14, 10 and 6px, 40ms apart. At page size (the Purchase page and the home portfolio) it measures itself against its own width: the pocket is taller and holds the real covers of the six free samples in two ranks, the front is card stock (the wash under a light, with the paper's grain) at depth 3 that casts a shade up onto the sheets, and a price tag hangs from its corner.
- **Price tag:** a sheet of paper with rounded shoulders and an eyelet, hung by a two-strand string tied through a second eyelet. It carries the price in Besley (`$1,499.99`, with `CAD` small under it) and "one purchase" under it, set at a slight turn. It swings once, like a weight on a string, when it is first seen, and a little each time the pointer comes onto the folder.
- **Contents leaf:** the contents of the toolkit as one loose sheet of paper beside the folder: opaque paper with the grain, depth 2, lit under the pointer, with a dog-eared top-right corner (the whole sheet is cut along the fold, so its shadow follows the cut, and a darker flap lies over the cut with a small contact shadow). An eyebrow, the h2, then a ruled ledger of five rows: an ink tick and term, a large Besley 800 figure printed as it is (never counted up) with a highlighter stroke drawn in once under its lower half, and a line of words. Under the ledger: the disabled Checkout button, the way to write, and the sample note. Its measures are shares of its own width. From 68em it stands on the page's right edge, as the folder stands on the left, and on a large monitor the pair is drawn larger together; on a tablet wider than about 1010px the two stand side by side before 68em, each centred on the other.
- **Template tile:** a small article in a grid of at least 176px columns, two across on a phone. The cover, printed with its own title and first line, stands in a square well in its format's proportions, with the phase and type, the title and the format tag under it. There is no price. A free sample carries a "Free sample" tag, its title is the one link and covers the whole tile, and the cover rises under the pointer. On a phase page a tile names its type alone, since every tile there is of that phase. A locked template has its cover out of focus (a 4px blur, most of its colour drained and set back to 75%), and nothing is drawn over it (the title and summary stay readable); its one control is a button named "<title>, locked". Pressing it opens nothing: for 600ms the cover well is ringed in a 2px alert-red edge (there within 40ms, gone by 560ms), never the words, and the tile shakes its head sideways, five eased swings from 6px to rest (440ms). The tile's own outline is left alone, so a focused tile keeps its focus ring. A line under the tile says "Included with the toolkit." with a link to the Purchase page. Under reduced motion only the ring and the line remain; they stand for as long as the state does, and are all a tile shows when the server renders it already denied (a link that names it) without a script.
- **Pop-up:** a native modal dialog over the dimmed page, a sheet of paper at depth 4 with a 10px corner and a bar that holds Close. A free sample opens in it: its cover large and lit on a desk of its own at the left, and at the right the tag, the title, the summary, the facts as a ledger, what is included and a button to the Purchase page; below 40em the cover stands above the words. It closes on Escape, on Close and on a click on the dimmed page, and rises 14px into place when a link inside the site opened it.
- **Note:** a short sentence on the wash (6px corner, 14px by 21px, 16px text at weight 400), no wider than a lead; on the wash band it takes paper.

### Inputs / Fields

- **Text input and select:** paper, 48px tall, a 2px firm rule border, a 6px corner, 14px of side padding and 16px text at weight 400. The select draws its own chevron 14px from the right edge. The catalog search carries its submit inside the field: a 44px square at the right end with the magnifier, which takes the wash under the pointer and focus.
- **Hover / Focus:** the border darkens to soft ink under the pointer and to ink on focus, with the standard focus ring outside it.
- **Checkbox:** a 21px box with a 2px firm rule border and a 3px corner in a row at least 44px tall (35px from 68em); the invisible input covers the whole row. Checked, it is the highlighter with an ink border and a heavy ink tick, one step deeper under the pointer. A faint count may close the row. A list of contents (a free sample's "What's included" in the pop-up) is never drawn as checked boxes: each item has a bare ink tick, 20px, with no box and no highlighter, so nothing in it looks selectable.
- **Disabled:** deep-desk fill, rule border, faint text.
- **Focus ring, everywhere:** a 3px outline 3px off the element, ink on light bands and the highlighter on the binder.

### Navigation

- **Bar:** white and sticky, with no border and no shadow at the top of the page. It holds the brand lockup (the logo in an ink tile, with the 365 on its tail from 68em, and the name in Besley 700), the primary links from 68em, the purchase button and, below 68em, a Menu button. From 68em the row is three zones: the brand at the left, the links centred on the bar itself, the button at the right. On the home page the brand is the way back to the top: a click scrolls the page up, smoothly unless motion is reduced, and adds no history entry; on every other page it goes home.
- **Primary links:** Catalog, Roadmap and Why Advanta, 40px tall, a 6px corner, soft-ink text, set wide apart. Hover and focus fill with the wash. The current page is ink text under one 2px ink line that slides from link to link; with no current page the line is not drawn.
- **Roadmap drop-down:** a native disclosure of links to the 13 sections, each row a numeral tile and the plain name, Start here first and Used at every step last, set apart by a hairline and with an empty tile. In the bar (from 68em) its button is the word "Roadmap" and a chevron, drawn as a primary link; on the catalog below 68em it is an outline control that says "Jump to a phase", or names the phase the catalog is filtered on ("Phase 10 Go live and support"). The panel is paper at depth 3, at least 272px wide and at most 70% of the window tall, dropping centred under the bar's button; rows are 44px, 35px from 68em. Hover and focus fill a row with the wash; the current phase is set at 700 with its numeral tile in the highlighter inside an ink edge. It closes on Escape, a click outside it, a link and a change of page, and works without script.
- **Phase cards:** the 13 sections as index cards 56px tall, with the numeral over the name (Start here and Used at every step have none): two across on a phone, an odd last card taking the whole row, and from 40em as many across as fit, never narrower than 200px. They stand on the home page under `#inside` and in the catalog's empty search.
- **Phase pager:** at the foot of a phase page, the section before and the section after, in folder order, as two links on a hairline above and below, stacked below 40em and side by side from there, the next one always at the right. Each is a faint label ("Previous", "Next") over the section's numeral tile (none for Start here and Used at every step) and name, with an arrow pointing its way; hover, focus and press fill it with the wash and move the arrow 3px.
- **Drawer (below 68em):** a paper panel on the right edge, at most 378px wide, at depth 4 over the scrim. It slides in over 320ms and its links drift in 40ms apart; closing has no animation. Rows are 49px, and the current one is highlighted with its ink ring.
- **Text link:** ink with a 1px ink underline. On hover and focus the highlighter is drawn behind the words like a stroke of a marker and the underline thickens. On the binder the words stay as they are and the underline takes the highlighter.
- **Row link:** a row at least 56px tall inside a ledger. Hover, focus and press fill it with the wash, underline its label and move its arrow 3px.
- **Pagination:** square page numbers (44px, 40px from 68em) with a 2px ink border; the current page is the highlighter at weight 700.
- **Footer:** the binder, kept short, under a 2px highlighter edge along its top. Three rows on hairlines: the lockup with the one button; one navigation of the site's links (Catalog, Why Advanta, Contact) followed by the legal pages in smaller, softer type, each in a 44px-tall item; and the copyright with the non-affiliation notice. It has no tagline and no status lines. A hovered or focused link is underlined in the highlighter.

### Template Cover

The signature object: a miniature first page of a template, printed on a paper sheet in the proportions of its format. Everything on it is sized as a share of the sheet's own width, so it reads the same as a 60px thumbnail and as the large sheet in a template's pop-up. It carries the title in Besley, one line of the summary (ending on a whole word, never inside one), ghost lines for the rest (rows of three cells on a workbook), a line drawing of the deliverable type, the phase numeral on an ink index tab at the right edge (none for Start here and Used at every step), the format tag, and one blank in the highlighter with its ink edge. The blank is the only highlighted part of a cover: it is the part the buyer writes.

### Tally and Blank

- **Tally:** a row of equal blocks 7px apart. Ink for what is done, the highlighter with its 2px ink ring for the buyer's part, an outline for what is not yet. Ten blocks with nine inked and the tenth marked is the recurring figure. Seen for the first time, the blocks fill one after another, 180ms each and 80ms apart.
- **Blank:** an empty field waiting for text. The highlighter inside a 2px ink border, 42px tall, with an ink caret 14px in that blinks three times and then stays.
- **Eyebrow marker:** a 9px square of the highlighter inside a hairline of ink, before an uppercase label.

### Entrances and Page Changes

Content arrives in one of four ways: a drift (12px up, fading in), ink-in (fading in, never blurred, and done first: a heading is legible by the time it stands 8rem into the window), a settle (a sheet dropping 28px from 1.03 times its size, with a small overshoot) and a grow (a rule drawn from its left end). Where the browser supports view timelines an entrance follows the scroll; elsewhere it plays once when the element is seen, 70ms apart for siblings. On a page change only the first block of the page leaves and arrives, and a cover or a folder given a `slug` that exists on both pages travels between them over 420ms (no page does today). On a first visit to the home page a paper cover fills the window, the logo is written on it in three strokes within 800ms and the 365 on its arm within 200ms more, the finished mark stands until 2500ms, the mark and the hint fade from the paper by 2680ms before the paper itself clears, and the cover is gone by 2950ms, or within 200ms of any press, key, scroll or touch. When the cover has gone (or at once, on any later load), the hero plays its sequence: the six documents land from 0ms, the middle ones first, 110ms apart and 560ms each, the last down at 1110ms. Under reduced motion or without a script the documents stand from the start. The headline's last word turns 3.6s after that clock starts, and every 2.6s once its last letter is down: each letter that changes flips once, straight from its old letter to its new one (240ms, its top half and then its bottom), 45ms after the letter to its left, so a word turns in about half a second; a letter that stays does not move, and the highlighter widens or narrows with the word as it turns. A word that would push the headline onto another line is passed over ("document", where the line is already full), and the board holds still while it is out of sight. Under reduced motion or without a script the word is "prompt" and stays so; a screen reader always reads "prompt".

## Do's and Don'ts

### Do:

- **Do** pair every highlighter fill with ink: a 2px inset ring, an ink border, a tick or weight 700 text.
- **Do** put a band under everything, and let the band set the colours through the semantic names.
- **Do** present a thing as a paper object (a sheet, a stack, a folder, a cover) or as a row on a hairline. A set of short claims (the Why Advanta buyers, as a ruled register) is a ledger, not a grid of icon tiles; the line drawings belong to the home manifest alone.
- **Do** take every space from the 7px module and every layout change from the two breakpoints, 40em and 68em.
- **Do** write every size and space in rem, so the root size scales the page on a large monitor. Hairlines, edges, corner radii and shadows stay in pixels.
- **Do** set documents, figures and prices in Besley at 600 to 800, and everything the store says in Atkinson Hyperlegible Next.
- **Do** make hover and keyboard focus look the same, and give a press the same answer, so a finger gets what a pointer gets.
- **Do** keep every target at least 44px tall below 68em, and show the 3px focus ring 3px off the element.
- **Do** keep every animation inside the no-preference motion query, with the finished state as the default.
- **Do** print a figure as it is. A number never counts or rolls up to its value: while it moves it reads a wrong one.
- **Do** give an object an ink line where its shadow is removed, at raised contrast and in forced colours.

### Don't:

- **Don't** use the highlighter as a text, icon or line colour on a light ground, or as a fill with no ink beside it.
- **Don't** introduce another accent. The palette is white, near-black and one light blue; the red is for errors and a locked tile's refusal only.
- **Don't** build a boxed card with a border and a large radius. Corners are 3px on paper and 6px on controls.
- **Don't** fade, slide or blend a band or a surface. Grounds change with a hard edge.
- **Don't** animate a shadow, a layout property or a custom property, and don't loop an animation.
- **Don't** let a state change alter a size: borders are always present and rings are drawn inside.
- **Don't** put anything that moves behind the text, and don't add a canvas.
- **Don't** set type smaller than 14px unless it is uppercase, weight 700 and tracked, and don't track anything larger.
- **Don't** add a dark scheme or a query for one. The system declares a light scheme only.
- **Don't** hide content in a starting state that a script has to undo. Without the script, nothing is missing.
