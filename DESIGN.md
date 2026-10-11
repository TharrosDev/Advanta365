---
name: Advanta365
description: A working copy on a desk. White paper, near-black ink, one light-blue highlighter, and live ink in water under the text.
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
  pigment-black: "#10131a"
  pigment-pale: "#c3cedf"
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
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
  phase-tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.note}"
    rounded: "{rounded.round-2}"
    padding: "0 0.4375rem"
    height: "2.1875rem"
  phase-tab-hover:
    backgroundColor: "{colors.mark-wash}"
  phase-tab-current:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.ink}"
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

The site is a desk with documents on it. White sheets of paper lie on a cool grey desk, set in near-black type, and one light-blue highlighter marks the parts that belong to the buyer: the blank still to fill, the tenth block of ten, the page they are on. Everything the system draws is an object from that desk. A sheet has a tooth, a light on it and a layered shadow. A folder has a tab and sheets standing in it. Phases are index tabs, lists are ledgers ruled with hairlines, and progress is a tally of blocks.

Ink is the one material that moves. A real-time simulation of ink in water runs behind the first screen, the 90% statement, the closing band, wide page titles, the 404 and the footer. It lies on the ground of a band and never on a sheet, it is held back around every block of text, and its strength is capped against the ground the copy is read on. The rest of the motion is small and physical: a sheet settles as it scrolls into view, rises 6px and tilts up to 1.2 degrees toward the pointer, a rule is drawn from the left, and a first visit opens on a blank page where the logo is signed stroke by stroke.

The density is that of a document, not of a dashboard: reading-width columns, a twelve-column grid from 68em, bands 56 to 112px deep, and type that carries the hierarchy before colour or depth add anything. The system has a light scheme only. Under reduced motion, raised contrast, forced colours, no JavaScript or no WebGL2 the page is complete: still images stand in for the ink, shadows give way to ink lines, and nothing waits hidden.

**Key Characteristics:**

- Paper objects on a desk: sheets, stacks, folders, index tabs and ledgers, each with a real edge and a real shadow.
- Three inks: near-black for what is written, light blue for what is the buyer's, and a dark binder ground for the footer and the statement bands.
- The highlighter always comes with ink (a border, a ring, a tick or the text itself) and is never a text colour on a light ground.
- Two typefaces with fixed jobs: a slab serif for the documents and their figures, a hyperlegible sans for the store.
- A 7px module for every space, two breakpoints (40em and 68em) for every layout.
- Live ink in water as the showpiece, always beneath the text, always pausable, with a still image for every case where it cannot run.
- Movement only inside the no-preference motion query. Bands and surfaces change ground with a hard edge and never fade.

## Colors

White, near-black and one light blue, on cool greys that lean a few degrees toward the blue so the desk, the rules and the ink read as one family.

### Primary

- **Highlighter Blue** (`mark`, #86c1ff): the buyer's colour. It fills the blank on a template cover, the marked block of a tally, a checked box, the current page in the navigation, the current phase tab, a saving tag, the square before an eyebrow, the tail of the logo and the text selection. Under the pointer or keyboard focus it comes up inside solid buttons and behind the words of a link.
- **Pressed Highlighter** (`mark-deep`, #5fa8f5): the highlighter one step deeper. A solid button while it is held down, a checked box under the pointer, and the blue pigment of the ink on light grounds.
- **Highlighter Wash** (`mark-wash`, #eaf4ff): the highlighter diluted to a ground. The wash band, the front and tab of a folder, a note, the beta strip, and the hover and focus fill of rows, outline buttons, navigation links and tabs.

### Secondary

- **Correction Red** (`alert`, #a32b1d) on **Correction Wash** (`alert-wash`, #fbeae5): reserved for errors and for nothing else. No component draws an error state today; the pair exists so that the first one has its colour.

### Neutral

- **Paper** (`paper`, #ffffff): the sheet, the body background, the sticky bar, the navigation drawer and the ground of every paper band.
- **Paper Shade** (`paper-shade`, #f1f3f7): the far corners of a sheet, where its radial light falls off.
- **Desk** (`desk`, #f4f5f8): the cool grey the sheets lie on. The desk band, the phase rail, striped rows and the scrollbar track.
- **Deep Desk** (`desk-deep`, #e6e8ee): a small well in the desk. Count badges, numeral tiles and the fill of every disabled control.
- **Rule** (`rule`, #d2d5de): decorative hairlines only: ledger rules, the margin rule, the ghost lines printed on a cover.
- **Firm Rule** (`rule-firm`, #70758a): borders that must be seen. Inputs, selects, unchecked boxes, empty tally blocks and the scrollbar thumb.
- **Ink** (`ink`, #0b0d12): primary text, solid buttons, ink borders and rings, the logo tile and the focus ring on light grounds.
- **Soft Ink** (`ink-soft`, #3a3f4c): secondary text and leads.
- **Faint Ink** (`ink-faint`, #596072): captions, counts, placeholders and the text of disabled controls.
- **On Ink** (`on-ink`, #ffffff): text on an ink fill.
- **Binder** (`binder`, #0d0f15): the dark ground of the footer and of the ink bands.
- **Binder Rise** (`binder-rise`, #1c202b): a raised surface on the binder, such as the round of the ink's pause button there.
- **On Binder** (`on-binder`, #f4f5f8) and **Soft On Binder** (`on-binder-soft`, #b4b9c7): primary and secondary text on the binder.
- **Binder Rule** (`rule-on-binder`, #343947): hairlines on the binder.
- **Black Pigment** (`pigment-black`, #10131a) and **Pale Pigment** (`pigment-pale`, #c3cedf): the ink simulation's black on paper and its pale ink on the binder. Its two blues are the highlighter pair.
- **Scrim** (`scrim`, ink at 50%): the dimmed page behind the navigation drawer and the filter sheet.

### Named Rules

**The Mark Carries Ink Rule.** The highlighter fill is never the only signal. On paper it measures 1.89 : 1, too pale to be seen alone, so every marked thing also has an ink border, an inset ink ring, an ink tick or a heavier weight of ink text.

**The Background Only Rule.** On a light ground the highlighter is a background behind ink text and never a text, icon or line colour. Only on the binder, where it measures 10.11 : 1, does it become a line: the focus ring and the underline of a hovered link.

**The Band Decides Rule.** Components read eleven semantic names (`ground`, `surface`, `stripe`, `tile`, `text`, `text-soft`, `text-faint`, `line`, `line-firm`, `line-ink`, `focus-ring`) and never a raw colour. Each band (`desk`, `paper`, `wash`, `ink`, `binder`) redefines them, and a sheet or a folder front resets them to the paper values, so one component is correct on every ground.

**The Light Fill Rule.** The wash and the highlighter are light on every band. While one of them is the fill of a hovered or current element, everything inside reads the ink colours, whatever the band says.

## Typography

**Display Font:** Besley (with Rockwell, Roboto Slab, Georgia, serif)
**Body Font:** Atkinson Hyperlegible Next (with Segoe UI, system-ui, Helvetica Neue, Arial, sans-serif)

**Character:** A sturdy slab serif at weights 600 to 800 speaks for the documents: their titles, their figures and their prices. A sans drawn for legibility speaks for the store: copy, labels and controls. The pairing reads as a printed deliverable with clear margin notes, not as an app.

### Hierarchy

- **Display** (`poster`, 800, 112 to 320px, 0.86): one figure per page at most. The 90% of the home statement band, the phase numeral, the 404.
- **Display** (`hero`, 600, 40 to 80px, 1.04): the home headline only, at most 11.5em wide.
- **Headline** (`statement`, 600, 34 to 72px, 1.06): large statements, and the wide form of a page title.
- **Headline** (`banner`, 600, 34 to 56px, 1.12): standard page titles and the one-sentence statement of a section.
- **Title** (`page`, 600, 28 to 40px, 1.16): the heading of a shelf of content.
- **Title** (`section`, 600, 22 to 26px, 1.24): section headings and large row labels.
- **Title** (`item`, 600, 18 to 20px, 1.3): row and card titles.
- **Title** (`amount`, 700, 30 to 40px, 1.1): prices and totals.
- **Body** (`lead`, 400, 18 to 20px, 1.5): lead paragraphs, at most 40rem wide, in soft ink.
- **Body** (`copy`, 400, 16 to 17px, 1.58): body copy and the body default, at most 36rem wide.
- **Label** (`ui`, 600, 16px, 1.375): buttons, links in the bar and field labels. Typed values, notes and plain tags use the same size at weight 400.
- **Label** (`note`, 400, 14px, 1.43): notes, captions, breadcrumbs and facts.
- **Label** (`eyebrow`, 700, 13px, 0.08em, uppercase): the label over a heading, with a 9px highlighter square before it.
- **Label** (`tag`, 700, 12px, 0.06em, uppercase): format tags.

Every display size is fluid between the two ends given, and every size is set in rem. Headings are balanced (`text-wrap: balance`, at most 22em wide) and paragraphs use `text-wrap: pretty`.

### Named Rules

**The Two Voices Rule.** Besley is for what a document says: headings, figures, prices, numerals on tabs and tiles. Atkinson Hyperlegible Next is for everything the store says. A component never mixes them inside one line of text.

**The Small Is Loud Rule.** The two sizes under 14px are always uppercase, weight 700 and tracked. The text in the markup stays in sentence case; the capitals are drawn by the style.

**The Own Figures Rule.** Display type keeps Besley's own lining figures and turns tabular figures off, because its tabular zero is drawn thin from weight 600 up. Columns of numbers in the text face use tabular lining figures.

**The No Tracking Rule.** Letter spacing is 0 at every size from 14px up. Hierarchy comes from size, weight and face.

## Layout

The page is a stack of full-width bands. A band paints its own ground, sets the text colour for everything inside it, and holds a centred column at most 77rem wide (twelve 77px columns and eleven 28px gaps) with the page padding outside it: 21px on a phone, 28px from 40em and 42px from 68em. The column gap follows the same steps at 14, 21 and 28px.

All space comes from a 7px module: 7, 14, 21, 28, 42, 56, 84, 112 and 168px. A band is padded 56px above and below on a phone and 84px from 40em. A roomy band takes 84 and 112px, a tight one 42px, a title band 28 and 42px.

There are two breakpoints and no others. Below 40em is the phone layout: one column, full-width stacked buttons, index rows in place of sheets. From 40em sheets stand two across and rows gain a second column. From 68em the twelve-column grid applies: a margin in columns 1 to 3 with content in 4 to 12, the home first screen with its text in columns 1 to 7 and open water for the ink in 8 to 12, the inline navigation, the phase rail and the deeper shadows. Three container queries hide the brand name or the word Menu visually when the bar or the drawer is too narrow for them; the text stays readable to assistive technology.

A sticky white bar tops every page, 56px tall and 70px from 68em. From 68em a 42px strip of the desk under it holds the seven phases as tabs. A beta strip in the wash sits above the bar and scrolls away with the page. Anchors and focused elements stop 21px clear of the bar.

Bands alternate between paper and desk down a page. The wash is a single tinted moment, the ink band a single statement, and the binder is the footer. Controls are 48px tall by default, 56px large, and 40px in the desktop bar; below 68em no target is shorter than 44px.

## Elevation & Depth

Depth is layered and physical. Every paper object casts a soft shadow in the ink colour, built from a 1px ring at 5 to 6% and up to three stacked drops. The scale has five steps and each means a height above the desk. Bands themselves are flat: they meet with a hard edge and no shadow.

### Shadow Vocabulary

- **Depth 0, a hairline ring** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.06)`): a sheet lying flat.
- **Depth 1, a thumbnail or a tab** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 1px 2px rgb(11 13 18 / 0.06), 0 3px 6px -2px rgb(11 13 18 / 0.06)`): cover thumbnails, phase tabs on the rail, the sheets under a stack, the back, tab and inner sheets of a folder, and the round of the ink's pause button.
- **Depth 2, an object at rest** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 2px 4px -1px rgb(11 13 18 / 0.06), 0 10px 20px -8px rgb(11 13 18 / 0.12), 0 28px 44px -24px rgb(11 13 18 / 0.14)`): the default sheet and the front of a folder.
- **Depth 3, lifted or a panel** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 12px 24px -8px rgb(11 13 18 / 0.18)`; from 68em `0 0 0 1px rgb(11 13 18 / 0.05), 0 4px 8px -2px rgb(11 13 18 / 0.07), 0 20px 36px -12px rgb(11 13 18 / 0.16), 0 48px 72px -32px rgb(11 13 18 / 0.2)`): the purchase panel, the cart summary, the raised column of the comparison, and the shadow a resting sheet takes when it is lifted.
- **Depth 4, the top of a stack** (`box-shadow: 0 0 0 1px rgb(11 13 18 / 0.05), 0 20px 40px -12px rgb(11 13 18 / 0.24)`; from 68em `0 0 0 1px rgb(11 13 18 / 0.05), 0 8px 14px -4px rgb(11 13 18 / 0.08), 0 32px 56px -16px rgb(11 13 18 / 0.2), 0 84px 112px -42px rgb(11 13 18 / 0.26)`): the navigation drawer and the filter sheet.
- **Bar shadow** (`box-shadow: 0 10px 21px -14px rgb(11 13 18 / 0.4)`): under the sticky bar. It is absent at the top of a page and arrives over the first 84px of scroll.

### Named Rules

**The Second Shadow Rule.** No shadow is ever animated. An object that lifts carries its lifted shadow on a pseudo-element from the start, and only that layer's opacity moves.

**The Rest And Lift Rule.** A sheet's lifted shadow is one step above its resting one and never lower than depth 3. Only a sheet marked as lit lifts, 6px, under the pointer on a device that hovers and under keyboard focus inside it.

**The Ink Line Fallback Rule.** At raised contrast every shadow gives way to a 1px ink border, and in forced colours to a system border. An object is never defined by its shadow alone.

## Shapes

Corners are small, as on cut paper. Sheets, tags, checkboxes, tally blocks and numeral tiles take 3px. Controls, tabs, rows, notes, page numbers and the panels of a folder take 6px. The 10px radius appears once, on the top corners of the filter sheet that rises from the bottom of a phone. The only circle is the 32px round of the ink's pause button, and the logo tile has its own 7px corner.

Edges come in two weights: a 1px hairline for rules and quiet borders, and a 2px ink edge for control borders, inset rings and thick underlines. A ring is drawn inside the box, so a state change never alters a size.

Sheets keep the proportions of what they stand for: 5 : 7 for a Word document or a PDF, 4 : 3 for a workbook, 16 : 9 for a slide. A PDF has its top-right corner cut and folded over. A sheet may rest turned by a degree or two, and the sheets under a stack are offset and turned behind it. Icons and the logo are monoline with round caps and joins: icons at a 1.75 stroke on a 20-unit grid, the logo at 4.2 on a 32 by 24 grid.

## Components

### Buttons

Plain and certain. A button answers the pointer by taking the highlighter, and its border never changes, so its width never does.

- **Shape:** gently squared (6px), a 2px border, 48px tall with 7px by 21px of padding. The small size is 44px, and 40px in the desktop bar; the large size is 56px with 28px of side padding.
- **Primary (`mark`, and `ink` on the wash band):** solid ink with white text. Under the pointer or keyboard focus the fill becomes the highlighter inside the unchanged ink border and the text turns to ink. Held down, the fill goes one step deeper.
- **Secondary (`outline`):** transparent with a 2px border in the text colour of its band. Hover, focus and press fill it with the wash, or with paper on the wash band.
- **Text:** no box. Underlined ink words with a 44px hit height; on hover and focus the underline thickens to 2px and the highlighter is drawn behind the words and 2px past their ends.
- **Motion:** colour changes take 120ms, linear. An arrow after the label moves 3px to the right on hover and focus. A press moves the button down 1px.
- **Disabled:** deep-desk fill, rule border, faint text, a not-allowed cursor, and no movement.

### Chips

- **Format tag:** a paper chip with a 1px ink border and uppercase 12px text, naming a file format on a cover or a row.
- **Saving tag:** the highlighter with an inset 1px ink ring and 14px ink text at weight 700, in sentence case.
- **Plain tag:** paper with a 1px firm rule border, roomier (7px by 14px), in 16px text at weight 400.
- **Count badge:** a 21px deep-desk tile with a faint numeral; holding something, it takes the highlighter with an ink ring. A change in the count pops it once to 1.3 times its size.

### Cards / Containers

There are no boxed cards. A thing in a list is either a row on a hairline or a paper object with a caption under it.

- **Paper sheet:** a 3px corner, paper lit from its top-left corner and a shade darker at the far ones, a pre-rendered grain on medium and large sheets, depth 2 at rest. It has no padding of its own; a panel made from it is padded 21px, and 28px from 40em. Inside a sheet the colours are those of paper whatever band it lies on.
- **Paper stack:** two or more blank sheets under the top one, at depth 1, offset and turned from 40em and only slightly turned below it.
- **Folder:** a bundle. A wash-coloured tab 28px tall names it, a back panel holds up to three sheets, and a wash front panel at depth 2 carries the content. A bundle's sheets are the small covers of its first three templates, standing 84px tall like files: the first highest and furthest right, each next one 14px lower, 20px to the left and in front, so every format tag shows; the front panel covers their feet. A folder can scale them with `--cover-scale` (1 in ledger rows at every width, 1.5 for the home feature and the bundle page). Without covers the sheets are blank paper standing 5px lower each. Under the pointer or focus the sheets rise 14, 10 and 6px, 40ms apart. The cart draws the same folder at thumbnail size in a bundle's line, and a template's line carries its small cover.
- **Template card:** below 40em, and in list view at every width, a row on a hairline with a cover thumbnail; its hover wash stands 14px past both ends and the thumbnail lifts and turns 1.5 degrees. From 40em in sheet view, the cover itself at the foot of a 17rem area (20rem from 68em) with the phase, the title and the price as a caption. A row shows the summary under the title at every width, at most two lines. The title is the one link and covers the whole article, and the focus ring is drawn on the article.
- **Note:** a short sentence on the wash (6px corner, 14px by 21px, 16px text at weight 400), no wider than a lead; on the wash band it takes paper.

### Inputs / Fields

- **Text input and select:** paper, 48px tall, a 2px firm rule border, a 6px corner, 14px of side padding and 16px text at weight 400. The select draws its own chevron 14px from the right edge. The catalog search carries its submit inside the field: a 44px square at the right end with the magnifier, which takes the wash under the pointer and focus.
- **Hover / Focus:** the border darkens to soft ink under the pointer and to ink on focus, with the standard focus ring outside it.
- **Checkbox:** a 21px box with a 2px firm rule border and a 3px corner in a row at least 44px tall (35px from 68em); the invisible input covers the whole row. Checked, it is the highlighter with an ink border and a heavy ink tick, one step deeper under the pointer. A faint count may close the row. A list of contents (a template's "What's included") is never drawn as checked boxes: each item has a bare ink tick, 20px, with no box and no highlighter, so nothing in it looks selectable.
- **Disabled:** deep-desk fill, rule border, faint text.
- **Focus ring, everywhere:** a 3px outline 3px off the element, ink on light bands and the highlighter on the binder.

### Navigation

- **Bar:** white and sticky, with no border and no shadow at the top of the page. It holds the brand lockup (the logo in an ink tile, the name in Besley 700), the primary links from 68em, the cart and, below 68em, a Menu button.
- **Primary links:** 40px tall, a 6px corner, ink text. Hover and focus fill with the wash. The current page is the highlighter with an inset 2px ink ring and weight 700.
- **Phase rail (from 68em):** seven equal tabs standing on the bottom edge of a desk strip, white with rounded top corners at depth 1, each a Besley numeral and a name. The current phase is the highlighter inside a 2px ink edge.
- **Phase cards:** the same seven as index cards 56px tall, two across on a phone, four from 40em and one row where they fit, with the numeral over the name. At the top of the phone catalog they stand in one row that scrolls sideways from edge to edge, each as wide as its name, so the card cut off at the edge shows there are more.
- **Drawer (below 68em):** a paper panel on the right edge, at most 378px wide, at depth 4 over the scrim. It slides in over 320ms and its links drift in 40ms apart; closing has no animation. Rows are 49px, and the current one is highlighted with its ink ring.
- **Text link:** ink with a 1px ink underline. On hover and focus the highlighter is drawn behind the words like a stroke of a marker and the underline thickens. On the binder the words stay as they are and the underline takes the highlighter.
- **Row link:** a row at least 56px tall inside a ledger. Hover, focus and press fill it with the wash, underline its label and move its arrow 3px.
- **Pagination:** square page numbers (44px, 40px from 68em) with a 2px ink border; the current page is the highlighter at weight 700.
- **Footer:** the binder, with the lockup, two link lists, status lines and the legal text on the twelve-column grid. A hovered link is underlined in the highlighter.

### Template Cover

The signature object: a miniature first page of a template, printed on a paper sheet in the proportions of its format. Everything on it is sized as a share of the sheet's own width, so it reads the same as a 60px thumbnail and as the large sheet on a product page. It carries the title in Besley, one line of the summary (ending on a whole word, never inside one), ghost lines for the rest (rows of three cells on a workbook), a line drawing of the deliverable type, the phase numeral on an ink index tab at the right edge, the format tag, and one blank in the highlighter with its ink edge. The blank is the only highlighted part of a cover: it is the part the buyer writes.

### Tally and Blank

- **Tally:** a row of equal blocks 7px apart. Ink for what is done, the highlighter with its 2px ink ring for the buyer's part, an outline for what is not yet. Ten blocks with nine inked and the tenth marked is the recurring figure. Seen for the first time, the blocks fill one after another, 180ms each and 80ms apart.
- **Blank:** an empty field waiting for text. The highlighter inside a 2px ink border, 42px tall, with an ink caret 14px in that blinks three times and then stays.
- **Eyebrow marker:** a 9px square of the highlighter inside a hairline of ink, before an uppercase label.

### Ink Backdrop

The showpiece. One canvas serves the whole page, and the backdrop most in view holds it; every other backdrop shows a still image of its scene. Seven scenes exist: drops beside the home headline, a drop onto the tenth block of the 90% tally when the scroll reaches it, blue ink rising from the foot of the closing band, pale wisps in the footer, a strip beside wide page titles, a spill on the 404, and the drop under the first-load cover. Text over ink marks itself as a calm zone and the ink is thinned and capped around it. A 44px pause button with a 32px round sits at the foot of the stage. The ink gives way to its stills under reduced motion, raised contrast, forced colours, data saving, without WebGL2, and on a device that cannot keep up.

### Entrances and Page Changes

Content arrives in one of four ways: a drift (12px up, fading in), ink-in (fading in, with an 8px blur resolving from 68em), a settle (a sheet dropping 28px from 1.03 times its size, with a small overshoot) and a grow (a rule drawn from its left end). Where the browser supports view timelines an entrance follows the scroll; elsewhere it plays once when the element is seen, 70ms apart for siblings. On a page change only the first block of the page leaves and arrives, and a cover or a folder that exists on both pages travels between them over 420ms. On a first visit to the home page a paper cover fills the window, the logo is written on it in three strokes within 800ms, and the cover is gone by 1650ms, by 2800ms when the ink runs under it, or within 200ms of any press, key, scroll or touch.

## Do's and Don'ts

### Do:

- **Do** pair every highlighter fill with ink: a 2px inset ring, an ink border, a tick or weight 700 text.
- **Do** put a band under everything, and let the band set the colours through the semantic names.
- **Do** present a thing as a paper object (a sheet, a stack, a folder, a cover) or as a row on a hairline.
- **Do** take every space from the 7px module and every layout change from the two breakpoints, 40em and 68em.
- **Do** set documents, figures and prices in Besley at 600 to 800, and everything the store says in Atkinson Hyperlegible Next.
- **Do** make hover and keyboard focus look the same, and give a press the same answer, so a finger gets what a pointer gets.
- **Do** keep every target at least 44px tall below 68em, and show the 3px focus ring 3px off the element.
- **Do** place ink on the ground of a band, mark every text block over it as a calm zone, and name a still for it.
- **Do** keep every animation inside the no-preference motion query, with the finished state as the default.
- **Do** give an object an ink line where its shadow is removed, at raised contrast and in forced colours.

### Don't:

- **Don't** use the highlighter as a text, icon or line colour on a light ground, or as a fill with no ink beside it.
- **Don't** introduce another accent. The palette is white, near-black and one light blue; the red is for errors only.
- **Don't** build a boxed card with a border and a large radius. Corners are 3px on paper and 6px on controls.
- **Don't** fade, slide or blend a band or a surface. Grounds change with a hard edge.
- **Don't** animate a shadow, a layout property or a custom property, and don't loop an animation.
- **Don't** let a state change alter a size: borders are always present and rings are drawn inside.
- **Don't** place ink on a sheet, inside a panel or behind body copy that has no calm zone, and don't run a second canvas.
- **Don't** set type smaller than 14px unless it is uppercase, weight 700 and tracked, and don't track anything larger.
- **Don't** add a dark scheme or a query for one. The system declares a light scheme only.
- **Don't** hide content in a starting state that a script has to undo. Without the script, nothing is missing.
