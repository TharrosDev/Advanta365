# ADVANTA365 — Design System ("Night Grid")

The implementation reference. Tokens live in the `@theme` block of
`app/globals.css`; this document explains the intent behind them.

ADVANTA365 is the product of Echofive Solutions, and this site is the **dark
sibling** of the parent's "Bone & Cobalt" system. Same family DNA — warm bone,
warm ink, one electric cobalt — with the polarity inverted: a deep warm-ink
ground carrying bone type. The concept is **sprawl brought under governance**:
a control room for the digital workplace. Direction is drawn from the dark,
structural, mono-labeled school of Awwwards winners (basement.studio, Igloo
Inc, darkroom.engineering): expanded-grotesque uppercase display type, mono
"coordinates" everywhere, keyline grids, HUD corner ticks, and one luminous
accent doing all the signaling.

## Color

Strategy: **one committed accent on a deep warm field**. Grounds are layered
void tones for depth; bone (the parent site's paper color, verbatim) carries
text; the family cobalt carries meaning. All OKLCH.

| Token | Role |
| --- | --- |
| `--color-void` | Base ground (deep warm ink) |
| `--color-void-2` / `--color-void-3` | Raised bands for section rhythm |
| `--color-panel` | Raised surfaces |
| `--color-abyss` | Footer, deeper than base |
| `--color-bone` | Primary text — identical to Echofive `--color-paper` |
| `--color-bone-soft` / `--color-bone-muted` | Secondary / tertiary text (AA on every band) |
| `--color-cobalt` | The family accent, used for fills (identical to Echofive) |
| `--color-cobalt-hot` | Luminous variant for text/keylines on dark grounds |
| `--color-on-cobalt` | Light text on cobalt fills |
| `--color-line*` | Keylines (bone at alpha) and cobalt keylines |

Rhythm comes from alternating `void` / `void-2` / `void-3` section grounds,
closing on the cobalt-drenched contact section (the family's shared conversion
signature) and the near-black `abyss` footer.

## Typography

- **Display:** Archivo (variable, width axis). Expanded (`wdth` 120–125)
  uppercase is the broadcast voice — distinct from the parent's Bricolage.
- **Body:** Public Sans (variable) — shared with the parent site; quiet trust
  signal for public-sector buyers.
- **Mono:** IBM Plex Mono for "coordinates": indices, kickers, codes
  (`MOD-01`, `SPRWL-01`), buttons, meta bars. `.t-coord` is the canonical
  label.

Scale utilities (all `clamp()`-based): `.t-display`, `.t-h2`, `.t-h3`,
`.t-lead`, `.t-body`, plus `.index-num` / `.dlv-key` (stroked numerals).
No serif, no italic, no em-dashes in copy.

## Motion

Same reliability doctrine as the parent site — each mechanism stands alone so
a hiccup in one can't leave content stuck hidden. Visibility runs on
IntersectionObserver; **ScrollTrigger carries only additive scrub moments**:

- **Lenis** (`components/providers/SmoothScroll.tsx`): smooth scroll on the
  GSAP ticker. It only smooths; nothing depends on it to become visible.
- **Grid field** (`components/fx/GridField.tsx`): the hero's raw 2D-canvas
  particle lattice. Points open scattered and settle into a governed grid
  (the product argument as a visual); a cobalt scan line sweeps the settled
  grid; the pointer scatters points locally. Adaptive density/DPR, pauses
  off-screen and on hidden tabs, never mounts for reduced-motion visitors
  (a static CSS lattice + cobalt bloom remains).
- **Reveals (IntersectionObserver + GSAP):** `useReveal` via `RevealRoot`
  reveals `[data-reveal]` / `[data-reveal-group]` rises and `[data-split]`
  masked headlines; content sections stay server components. The hero
  entrance plays on mount with a safety timer so it can never be left hidden.
- **Scrub moments (ScrollTrigger, additive only):**
  - The chapter rails' vertical progress lines (`ChapterRail`).
  - `TextScrub` pull statements (faint → full bone, one-way).
  - The delivery ledger's centre-tracking stage numerals
    (IntersectionObserver, additive).
- **Signature surfaces:** the giant stroked marquee with scroll-velocity skew,
  full-row cobalt hover floods on the module registry, bone-inversion hovers
  on the platform columns, count-up stat numerals, the cobalt-drenched
  contact close, and the oversized stroked footer wordmark.
- FX: scroll-progress bar, hide-on-scroll-down nav with scrollspy, HUD corner
  ticks, film grain (screen blend), dot-lattice atmosphere.

Rules: initial hidden states are gated behind the `.js` class (no-JS users see
everything); `prefers-reduced-motion` forces all final states in CSS and skips
every GSAP / Lenis / canvas / marquee animation; never `clearProps` on
elements whose hidden state lives in the stylesheet.

### Cascade/transform gotchas (inherited from the parent, still true)

00. **`backdrop-filter` creates a containing block for fixed descendants.**
   The solid nav bar uses backdrop blur, so a `position: fixed` panel
   rendered *inside* the nav element gets sized against the nav's box, not
   the viewport (the mobile menu once rendered 128px tall because of this).
   Full-screen overlays are rendered as *siblings* of the nav, never
   children — and sit below the nav's z-index so the toggle stays visible.

0. **Tailwind's scanner can't see utilities inside class-name templates.**
   Structural CSS (position, z-index) for stateful components lives in named
   classes in `globals.css`, never in template-assembled utilities.
1. **GSAP parses stylesheet `translateY(110%)` as pixels.** Every
   percent-based rise (`yPercent`) must also set `y: 0`.
2. **No unlayered universal resets.** Tailwind v4 preflight handles the reset.
3. **Tailwind v4 `scale-*` composes with GSAP transforms.** Anything GSAP
   scales gets its initial scale from GSAP (`fromTo`), not Tailwind classes.

## Layout — the Split Dossier

The architecture is a **permanent two-column split**, modeled on the split
school of Awwwards winners (Ochi Design SOTD, Exo Ape SOTD) and deliberately
distinct from the parent site's full-width editorial bands:

- Every chapter (`components/ui/Chapter.tsx`) is a grid of **sticky left
  rail** (stroked index, chapter word, kicker, and a scroll-progress line
  fed by an additive scrub) and **scrolling right body** separated by a
  keyline. Stickiness is pure CSS; the rail collapses to a compact header
  on small screens.
- The hero is "Chapter 00 / Dossier": the same split, full-viewport, with
  the grid field behind and the document meta in the rail.
- Delivery is a vertical stage ledger — the row nearest the viewport centre
  lights its numeral (IntersectionObserver, additive), replacing the old
  pinned horizontal scrub.
- Full-bleed moments are reserved for the marquee divider, the cobalt
  contact drench, and the abyss footer (which closes with an
  "End of dossier — 08 / 08" register above the oversized wordmark).
- Narrative: Cover → Marquee → Problem → Framework → Delivery → Modules →
  Platforms → Adoption → Why → Contact → Footer.

## Conversion

Primary action everywhere is `#contact` / the booking link (nav CTA, hero
CTAs, contact close). `/contact` remains as a standalone landing for direct
links, styled in the same system.

## Accessibility floor

WCAG AA contrast on every text/ground pair. Skip link, single `h1`, ordered
headings, semantic lists, keyboard-operable nav with focus trap in the mobile
menu, focus-visible ring in cobalt (swapped light on cobalt ground), and
reduced-motion fallbacks on every animated element.
