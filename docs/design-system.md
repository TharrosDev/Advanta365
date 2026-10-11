# Design system

The visual language is monochrome and square: ink on white, inverted in the dark sections. There is
no accent colour, no border radius and no shadow scale. Every visual value comes from a token in
`app/globals.css`. Components are CSS Modules that read those tokens, so no component file carries a
raw colour value, a Tailwind class or a radius.

## Where things live

- `app/globals.css`: tokens, theme scopes, base rules and global utility classes. It is the only
  stylesheet that holds raw colour values, `@property` registrations and global-only selectors.
- `components/ui/`: primitives for layout, type, controls and wipe-based interactions.
- `components/motion/`: reveal, route transition and page controllers.
- `lib/cx.ts`: `cx()` joins class names, `cssVars()` builds typed inline custom properties.
- `lib/brand/mark.ts`: the logo mark. The SVG and the WebGL symbol both read it.

## Colour

### Base colours

| Token                | Value     | Use                                                                                         |
| -------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `--base-color-white` | `#fff`    | Literal white for `mix-blend-mode: difference` sweeps and the site frame. Ignores the theme. |
| `--base-color-black` | `#000`    | Literal black, for the same kind of blend. Ignores the theme.                               |
| `--base-color-ink`   | `#181818` | The ink of the light theme (`--color-foreground-100` in light).                            |

### Semantic ramps

`--color-background-N` and `--color-foreground-N`, where N is one of `5 10 20 30 40 50 60 80 100`.
N is the alpha in percent: `--color-foreground-30` is the ink at 30% opacity, and `-100` is opaque.

In the light theme the background ramp is white and the foreground ramp is ink. The dark theme swaps
them (see Themes).

| Step                               | Use                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `background-100`                   | Surfaces: the page, sections, the footer, the beta bar, the menu panel, dialogs     |
| `background-80`                    | Dialog backdrop (the filter sheet's `::backdrop`)                                   |
| `foreground-100`                   | Headings, primary text, the bar of a wipe, the focus ring                           |
| `foreground-80`                    | Secondary body paragraphs (`c-fg-80`)                                               |
| `foreground-60`                    | Paragraph copy that must be read. Meets AA on both themes. Use `c-fg-60`            |
| `foreground-50`                    | Decorative meta only: captions, facet counts, definition labels                     |
| `foreground-40`                    | Control borders at rest (checkbox box), input rule on hover, select rule on hover   |
| `foreground-30`                    | Disabled text, the section label divider, the outline chip border                   |
| `foreground-20`                    | Hairline rules: `.ruled`, action rows, the input underline                          |
| `foreground-10`                    | Grid lines of the generated template covers                                         |

Rules:

- Paragraphs that must be read use `c-fg-60` or stronger. `c-fg-50` and below is for decorative meta
  only, never for legal or instructional copy.
- No hex or `rgb()` value in a `*.module.css` file or a TSX file. Exempt: GLSL source, canvas 2D
  `fillStyle` strings and the swirl keyframe colours in TypeScript, and `app/icon.svg`.
- `color-mix()` is allowed when every argument is a token.

## Themes

Dark exists only as `data-theme`. There is no `prefers-color-scheme` rule.

| Scope                                      | Result                                              | Set by                                                    |
| ------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------- |
| `<html>` dark                              | Dark ramps everywhere                               | `setThemeRequest()` only (see `architecture.md`)          |
| `<section theme="dark">`                   | Dark ramps inside the section                       | `SectionShell theme`                                      |
| `<section theme="light">`                  | Light ramps inside the section                      | `SectionShell theme`                                      |
| `<footer>`                                 | Always light                                        | Footer                                                    |
| Beta bar                                   | Always dark                                         | BetaBar                                                   |
| Entry overlay                              | Always light                                        | EntryOverlay                                              |
| `theme="invert"`                           | Opposite of the enclosing scope                     | Defined in CSS. No component uses it yet.                 |

Components never check the theme in JavaScript. They use `--color-background-*` and
`--color-foreground-*` and inherit whatever scope they are in.

The eighteen colour tokens are registered with `@property`, so a theme change cross-fades over
`--duration-theme` (0.4s, `--easing-in-out`). Under reduced motion the change is instant.

## Type

- Family: Instrument Sans, variable weight 400 to 700, exposed as `--font-instrument-sans` by
  `app/layout.tsx`. `--font-family-sans` is the stack that uses it.
- Body weight is 500. Headings are 500 by default. No serif anywhere.
- Headings `h1` to `h3` use `text-wrap: balance`.
- A heading of two sentences breaks between them. The title string carries the line break and a class
  with `white-space: pre-line` shows it (`.sentenceLines` on the home page; `.heroTitle` and About's
  `.compareTitle` only from 1024px, where each sentence fits on one line).
  `StatementSection` goes one step further and sets each line of its statement as a block, so every
  sentence is balanced by itself.
- A hyphenated compound in a card title ("End-User", "ready-to-use") is never broken across two
  lines: `DetailCard`, `TemplateCard` and `BundleCard` render their title through `KeepCompounds`.

Scale (`--text-{variant}-size`, `-line-height`, `-letter-spacing`):

| Variant                | Size      | Line height | Letter spacing |
| ---------------------- | --------- | ----------- | -------------- |
| display-extra-large    | 5rem      | 1           | -0.03em        |
| display-large          | 4rem      | 1           | -0.016em       |
| display-medium         | 3rem      | 1.05        | -0.02em        |
| display-small         | 2.5rem    | 1.05        | -0.02em        |
| headline-large         | 2rem      | 1.2         | -0.03em        |
| headline-medium        | 1.75rem   | 1.2         | -0.03em        |
| headline-small         | 1.5rem    | 1.25        | -0.03em        |
| title-large            | 1.375rem  | 1.3         | -0.02em        |
| title-medium           | 1rem      | 1.3         | -0.03em        |
| title-small            | 0.875rem  | 1.3         | -0.02em        |
| body-large             | 1rem      | 1.3         | -0.03em        |
| body-medium            | 0.875rem  | 1.4         | -0.02em        |
| body-small             | 0.75rem   | 1.3         | -0.03em        |
| label-large            | 0.875rem  | 1.3         | -0.02em        |
| label-medium           | 0.75rem   | 1.3         | -0.03em        |
| label-small            | 0.6875rem | 1.3         | -0.02em        |

`display-fluid` is the one responsive variant: display-small size below 768px, display-large size from
768px, always with display-large metrics. A title whose line just misses a phone's column may cap that
size at a share of the viewport, `min(var(--text-display-small-size), 10vw)`, with the token as the
cap (`.practiceTitle` on the home page and `.differentStatement` on About; `.valuesTitle` on the home
page uses 9.5vw for a longer line).

Classes (global, usable in any `className`): `.t-{variant}`, `.t-display-fluid`, `.w-regular`,
`.w-medium`, `.w-semibold`, `.w-bold`, `.c-fg-30`, `.c-fg-40`, `.c-fg-50`, `.c-fg-60`, `.c-fg-80`,
`.c-fg-100`. The `Text` component emits the same classes.

## Spacing

`--spacing-xs3` 4px, `--spacing-xs2` 8px, `--spacing-xs` 12px, `--spacing-sm` 16px,
`--spacing-md` 24px, `--spacing-xl` 32px, `--spacing-xl2` 40px, `--spacing-xl3` 64px,
`--spacing-xl4` 80px, `--spacing-xl5` 96px, `--spacing-xl6` 128px, `--spacing-xl7` 160px,
`--spacing-xl8` 192px, `--spacing-xl9` 256px.

Sections use `--spacing-xl3` (64px) of block padding. Gutters are 16px, and 32px from 768px.

## Layout

- Breakpoints: `@media (min-width: 768px)` and `@media (min-width: 1024px)`, mobile first. The 2000px
  width is a container limit; `SiteFrame` is the only component with a 2000px media query.
- Test viewports: 1280 x 800 (desktop) and Pixel 7 (412px). Phone rules must also hold at 360px.
- Widths: `--container-content` 2000px (the default `Container` size), `--container-wide` 1120px,
  `--container-narrow` 1024px, `--container-prose` 736px.
- Measures: `--measure-hero` 620px, `--measure-hero-wide` 900px, `--measure-heading` 900px,
  `--measure-statement` 938px, `--measure-heading-centered` 760px, `--measure-body` 440px,
  `--measure-body-sm` 360px, `--measure-intro` 380px, `--measure-card-body` 366px,
  `--measure-card-body-sm` 232px, `--measure-prose` 640px, `--measure-menu` 502px.
- `--viewport-height` is written in pixels on `<html>` by `ViewportLock` (the fallback is `100svh`).
- `--site-header-height` is 84.8px (two 32px paddings and one body-large line).
- `--touch-target` is 44px. Every control is at least that tall below 768px.
- Z-index scale: `--z-swirl` 0, `--z-section` 1, `--z-site-frame` 4, `--z-page-fade` 5,
  `--z-header` 10, `--z-overlay` 20, `--z-skip` 30, `--z-entry` 100.

## Motion tokens

| Token                 | Value                                  |
| --------------------- | -------------------------------------- |
| `--duration-instant`  | 0s                                     |
| `--duration-fast`     | 0.1s                                   |
| `--duration-normal`   | 0.2s                                   |
| `--duration-slow`     | 0.3s                                   |
| `--duration-slower`   | 0.5s                                   |
| `--duration-theme`    | 0.4s                                   |
| `--easing-in`         | `cubic-bezier(0.4, 0, 1, 1)`           |
| `--easing-out`        | `cubic-bezier(0, 0, 0.2, 1)`           |
| `--easing-in-out`     | `cubic-bezier(0.4, 0, 0.2, 1)`         |
| `--easing-smooth`     | `cubic-bezier(0.16, 1, 0.3, 1)`        |
| `--easing-snappy`     | `cubic-bezier(0.2, 0, 0, 1)`           |
| `--easing-emphasized` | `cubic-bezier(0.3, 0, 0, 1)`           |
| `--reveal-duration`   | 0.75s                                  |
| `--reveal-delay`      | 0.25s                                  |
| `--reveal-stagger`    | 0.1s (coarse step)                     |
| `--reveal-stagger-fine` | 50ms (fine step)                     |

The same durations exist in milliseconds in `lib/motion/durations.ts` for timers in TypeScript. Change
both when a duration changes.

## Global CSS

`app/globals.css` holds these base rules and utilities. Components do not repeat them.

- `body`: background `--color-background-100`, text `--color-foreground-100`, weight 500, line
  height 1.3, letter spacing -0.03em.
- `:focus-visible`: 2px outline in `--color-foreground-100`, 2px offset. Every interactive element
  shows it.
- `[hidden]` always wins over a component's own `display`.
- `:root[data-entry-lock] body`: `overflow: hidden` while the intro holds the page.
- `.ruled`: 1px top rule in `--color-foreground-20`.
- `.visually-hidden`: the standard clip pattern, used for text that only assistive technology reads.
- `.tabular`: tabular numerals.

There is no `scroll-behavior: smooth` and no blanket reduced-motion rule. Each component handles
reduced motion itself.

## CSS Modules rules

These rules come from the Turbopack and lightningcss build. Break one and the build fails or the rule
silently does nothing.

- Every selector in a module contains at least one local class. `:root[data-x] body` and a bare
  `dialog` belong in `globals.css`.
- `@property` is registered only in `globals.css`.
- `@keyframes` are file scoped. A module uses only keyframes it defines itself.
- No `composes`.
- A module overrides a primitive's declaration by doubling its selector (`.hero.hero { gap: 40px }`),
  never by relying on stylesheet order.
- Join class names with `cx()`. `styles.foo` is `string | undefined`, so template strings are not safe.
- Never set `display` on a bare `dialog` class. Use `.sheet[open] { display: flex }`, so a closed
  dialog stays hidden.
- Inline custom properties go through `cssVars()`: `style={cssVars({ "--stagger": index })}`.

## Primitives

Most primitives accept `className` and merge it last. Examples use the real prop names.

### Layout

- **`Container`** (`components/ui/container.tsx`): centred, guttered box. `size` is `full` (default),
  `wide`, `narrow` or `prose`.

  ```tsx
  <Container as="section" size="narrow">{children}</Container>
  ```

- **`PageShell`** (`page-shell.tsx`): the root `div` of every page. It clears the absolute header. Pass
  `bleed` only on the home page, so the hero runs under the header.

  ```tsx
  <PageShell><PageTitle title="Catalog" lead="Organized by the seven phases of a rollout." /></PageShell>
  ```

- **`SectionShell`** (`section-shell.tsx`): an isolated `<section>` with an optional theme, a
  `height` (`auto`, `full` or `half` of the viewport), an `aria-hidden` backdrop layer and an inner
  container for page layout.

  ```tsx
  <SectionShell id="practice" height="full" innerClassName={styles.practice}>{children}</SectionShell>
  ```

- **`SectionLabel`** (`section-label.tsx`): the centred caption strip above a section. It has no
  reveal of its own.

  ```tsx
  <Reveal as="div" effect="fade" index={0}><SectionLabel>Catalog</SectionLabel></Reveal>
  ```

- **`SectionIntro`** (`section-intro.tsx`): label, title (word-revealed), body and actions, with the
  reveal indices worked out (see Reveal conventions). With `center` the body is balanced, so it never
  ends on a short line under a full one.

  ```tsx
  <SectionIntro label="Bundles" title="Bundles" body="Curated sets for a whole phase." />
  ```

### Content

- **`Text`** (`text.tsx`): sugar over the global classes. Emits `t-{variant}`, `w-{weight}`, `c-{color}`.

  ```tsx
  <Text as="h2" variant="headline-medium" color="fg-60">Templates for every phase</Text>
  ```

- **`DetailCard`** (`detail-card.tsx`): a ruled text card. With `href`, the title is the card's one link
  and its hit area covers the whole card.

  ```tsx
  <DetailCard title="A complete worked example" href="/sample" body={body} />
  ```

- **`KeepCompounds`** (`keep-compounds.tsx`): title text with each hyphenated compound in an inline
  block, so a line never breaks after the hyphen. The text itself is unchanged. The split is
  `splitCompounds()` in `lib/compounds.ts`.

  ```tsx
  <h3><KeepCompounds text="SharePoint End-User Training Deck" /></h3>
  ```

- **`Chip`** (`chip.tsx`): a small square tag, never interactive. `solid` is the inverted note,
  `outline` is the hairline product name.

  ```tsx
  <Chip variant="outline">SharePoint</Chip>
  ```

- **`FactList`** (`fact-list.tsx`): label and value pairs under one top rule.

  ```tsx
  <FactList items={[{ label: "Phase", value: "Prepare" }]} />
  ```

- **`StatGrid`** (`stat-grid.tsx`): a row of figures, each under a strong rule.

  ```tsx
  <StatGrid items={[{ label: "Templates", value: "60", note: "Sample" }]} />
  ```

- **`LogoMark`** (`logo-mark.tsx`): the mark as an inline SVG in `currentColor`. Decorative unless
  `title` is given.

  ```tsx
  <LogoMark height="1.5em" />
  ```

- **`ArrowIcon`** (`arrow-icon.tsx`): the one arrow glyph. `direction` is `up-right` (default),
  `right`, `down`, `up` or `left`.

  ```tsx
  <ArrowIcon direction="right" />
  ```

### Controls

- **`Input`** (`input.tsx`): a hairline field. The rule darkens on hover and doubles on focus.

  ```tsx
  <Input type="search" name="q" placeholder="Search templates" />
  ```

- **`Select`** (`select.tsx`): a native select in the same style. `className` lands on the wrapper.

  ```tsx
  <Select name="sort"><option value="title">Title</option></Select>
  ```

- **`Checkbox`** (`checkbox.tsx`): a square hairline box with a label and an optional count. The native
  input covers the whole row, so the whole row is the hit target.

  ```tsx
  <Checkbox label="Training" count={12} name="type" value="training" />
  ```

- **`Pagination`** (`pagination.tsx`): previous, page numbers and next. It renders nothing for one page.

  ```tsx
  <Pagination page={2} pageCount={5} hrefFor={(n) => `/catalog?page=${n}`} />
  ```

### Wipe-based interactions

A wipe is a bar that draws in from the left on hover or keyboard focus and leaves to the right when the
pointer or focus goes. Bars stack, so a quick out-and-back chases the bar that is still leaving. The
engine is in `components/ui/wipe.tsx` (`useWipe`, `WipeBars`, `useWipeTriggers`). The elements below
are built on it.

- **`WipeButton`** (`wipe-button.tsx`): the primary call to action, an underlined label. `children` is
  a string. It renders a link for `href`, a button otherwise. `arrow` adds an arrow.

  ```tsx
  <WipeButton href="/catalog" arrow="right">Browse the catalog</WipeButton>
  ```

- **`WipeLink`** (`wipe-link.tsx`): a text link with a wipe. `variant="sweep"` (default) inverts the
  link with a difference blend and is only correct on a light surface, such as the footer.
  `variant="underline"` draws a line under the label and is correct on any theme.

  ```tsx
  <WipeLink href="/cart">Cart</WipeLink>
  ```

- **`Button`** (`button.tsx`): `variant` is `slab` (solid block, inverts as a whole), `outline` (hairline
  box) or `text` (underlined label). `size` is `md` (44px minimum height) or `lg`. Pass `href` for a
  link, and `linkRef` to receive focus on the anchor.

  ```tsx
  <Button variant="slab" size="lg" fullWidth disabled>Checkout — coming soon</Button>
  ```

- **`ActionRow`** (`action-row.tsx`): a full-width hairline row that acts as one link or button. `fill`
  rows bleed past their column and invert as a whole.

  ```tsx
  <ActionRow label="Templates" caption="Sample catalog" href="/catalog" rule="both" />
  ```

- **`WipeRule`** (`wipe-rule.tsx`): a hairline that draws a 1.5px line while `active` and leaves when
  `active` ends. The menu uses it to light the rule around the active row.

  ```tsx
  <WipeRule active={isHovered} />
  ```

- **`WipeLabel`** (`wipe-label.tsx`): a block-wipe text swap, used for the menu's "Close". `hiding`
  plays the reverse. The text is rendered once.

  ```tsx
  <WipeLabel hiding={closing}>Close</WipeLabel>
  ```

The ghost copy of a wipe label is drawn with CSS `attr(data-label)` inside an `aria-hidden` wrapper, so
the text exists once in the DOM and the accessible name is the visible label.

### Motion

- **`Reveal`** (`components/motion/reveal.tsx`): a CSS entrance animation. `effect` is `fade`,
  `fade-up`, `rise` (inline text) or `wipe`. `index` and `step` set the delay.

  ```tsx
  <Reveal as="li" effect="fade-up" index={row}>{card}</Reveal>
  ```

- **`RevealWords`** (`reveal.tsx`): one reveal per word, with the spaces left as plain text. Put it
  directly in the heading, so `textContent` stays the plain sentence.

  ```tsx
  <h1><RevealWords text="Don’t start your M365 rollout from a blank prompt." /></h1>
  ```

- **`RevealGroup`** (`reveal-group.tsx`): a pause scope. Its reveals hold their first frame until the
  group enters the top 93% of the viewport, then play once.

  ```tsx
  <RevealGroup className={styles.grid}>{items}</RevealGroup>
  ```

- **`GatherReveal`** (`gather-reveal.tsx`): a band whose label and chips start stacked on the centre line
  and slide apart once the band is in the top 85% of the viewport. `GatherWords` and `GatherItem` are
  its parts.

  ```tsx
  <GatherReveal><p><GatherWords text="Built for Microsoft 365" /></p>{chips}</GatherReveal>
  ```

- **`TransitionLink`** (`transition-link.tsx`): the only link component for internal routes. It fades
  the page out before navigating. `fade={false}` turns that off.

  ```tsx
  <TransitionLink href="/pricing" className={styles.link}>Pricing</TransitionLink>
  ```

- **`ThemeScroll`** (`theme-scroll.tsx`): turns the page dark while the top of the named section is at
  or above the middle of the viewport. Rendered once, on the page that owns the section.

  ```tsx
  <ThemeScroll targetId="practice" />
  ```

- **`ViewportLock`** (`viewport-lock.tsx`): writes `--viewport-height`. Rendered once, by the site
  layout.

- **`PageFade`** and **`coverPage()`** (`page-fade.tsx`): the route fade layer and the function
  `TransitionLink` calls before a navigation. Rendered once, by the site layout.

## Reveal conventions and index maths

- Every `Reveal` takes an explicit integer `index`. It is not counted automatically. The delay is
  `--reveal-delay + index × step`, where `step` is `coarse` (0.1s, the default) or `fine` (50ms).
- Reveals that belong together sit under one `RevealGroup`, so they wait for the same scroll position.
  A group that is already above the viewport counts as in view.
- `enabled={false}` renders the bare element with no reveal.
- A pause wrapper that is not a `RevealGroup` must carry `data-reveal-group` and be released by
  `data-in-view` on an ancestor. The no-JavaScript rule in the root layout releases every element with
  that attribute.
- `SectionIntro` indices: the label is index 0. Title words start at `wordOffset`, or at 1 when there
  is a label, on the fine step. The body starts on `coarseIndexAfter(firstWord + countWords(title))`,
  which is `ceil(next / 2) + 1` on the coarse step. Actions follow one coarse step later.
- While the entry overlay is up (`:root[data-entry]`), every reveal holds its first frame.
- Reduced motion: `.reveal` has no animation and every group is marked in view at once.

## Do and don't

| Do                                                                       | Don't                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Use tokens for every colour, space, size, duration and easing             | Write `#hex`, `rgb()`, `px` colours or Tailwind classes in components               |
| Use `c-fg-60` for copy that must be read                                  | Use `c-fg-50` or lighter for instructions, legal text or prices                      |
| Link internal routes with `TransitionLink` or a primitive built on it     | Import `next/link` anywhere except `transition-link.tsx`                             |
| Keep one `h1` per page with the exact title as its text                   | Repeat visible text in the DOM to draw a second copy (use `attr()` instead)           |
| Pass a string to `WipeButton`, `WipeLabel`, `SectionLabel` and `SheenText` | Mix JSX text and an expression in those props (use one template literal)              |
| Use `cssVars()` for inline custom properties                              | Write `style={{ "--x": 1 }}`, which does not type check                              |
| Put `RevealWords` directly inside its heading (or a sentence block of it) | Wrap a word in a span that is not a `Reveal`                                         |
| Use `setThemeRequest()` to change the page theme                          | Write `document.documentElement.dataset.theme` yourself                              |
| Set `display` on `.sheet[open]`                                           | Set `display` on a bare `dialog` class                                               |
| Wrap every `localStorage` access in try/catch                             | Assume storage exists                                                                |
| Use `<article>` only for template and bundle cards                        | Add `<article>`, `role="status"` or `<output>` elsewhere                              |

## Accessibility floor

- One `h1` per page, with the page title as its exact text.
- Visible focus ring on every interactive element.
- Touch targets of at least 44px below 768px for every control (buttons, links in the header and
  footer, pagination, checkbox rows).
- Reduced motion is honoured by every animated component (see `graphics-tuning.md`).
- Body copy meets WCAG AA contrast on both themes (`c-fg-60` or stronger).
- Every canvas is `aria-hidden` and has a text or SVG equivalent, so the content never depends on WebGL.
