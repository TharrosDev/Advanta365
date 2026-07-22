# ADVANTA365 — Design System ("Blueprint")

The implementation reference. Tokens live in the `@theme` block of
`app/globals.css`; this document explains the intent behind them.

ADVANTA365 renders its argument as a living **set of technical drawings**.
Governance is structure, so the framework is drawn: warm bone-paper sheets
laid over a faint drafting grid, the six stages / five modules / three
platforms shown as annotated schematics, and governed hand-offs drawn as
connector lines between nodes. One accent — cobalt, doubling as blueprint
ink-blue — carries every signal. The whole site is **light**: no dark
anchors. This replaces the previous "Day Grid" dossier, which leaned on
all-uppercase display type, mono "coordinates", numbered section eyebrows,
HUD corner ticks, and two dark anchors (a cobalt drench and an abyss footer).

## Color

Strategy: **one committed accent on a warm paper field**, kept entirely
light. Grounds are layered bone-paper tones for sheet rhythm; ink carries
text; cobalt carries meaning and doubles as the drawing's ink-blue. All
OKLCH; every text/ground pair holds WCAG AA (verified — body ≥ 4.5:1, large
≥ 3:1).

| Token | Role |
| --- | --- |
| `--color-paper` | Base sheet ground (warm bone) |
| `--color-paper-2` / `--color-paper-3` | Deeper bands for section rhythm |
| `--color-card` | Raised node / plate surfaces |
| `--color-ink` | Primary text (warm ink) |
| `--color-ink-soft` / `--color-ink-muted` | Secondary / tertiary text (AA on every band) |
| `--color-cobalt` | The accent: fills, connectors, active states, stat numerals |
| `--color-cobalt-deep` | Accent text on paper (annotations, codes) — AA |
| `--color-cobalt-ink` | Deepest, for large accent text (contact email) |
| `--color-cobalt-wash` / `-wash-2` | Pale cobalt tints (sign-off field, active surfaces) |
| `--color-on-cobalt` | Light text on cobalt fills (ribbon, buttons, checks) |
| `--color-draft` | Faint cobalt grid rules — the drafting graph paper |
| `--color-line*` | Keylines (ink at alpha) and cobalt keylines |

Rhythm alternates `paper` / `paper-2` / `paper-3` grounds, closing on the
light cobalt-wash **sign-off plate** (contact) and the **title-block** footer.

## Typography

- **Display:** Familjen Grotesk — a warm structural grotesque used mixed-case
  for plate titles, node/section headings, and the wordmark. Replaces the old
  all-uppercase expanded Archivo shout.
- **Body / UI / annotations:** Hanken Grotesk — a highly legible humanist sans
  carrying text, and, in small tracked caps (`.annot`), the drafting
  annotation labels. **No mono:** the point is leaving the mono-as-technical
  costume behind.

Scale utilities (all `clamp()`-based): `.t-display`, `.t-h2`, `.t-h3`,
`.t-lead`, `.t-body`, plus the schematic classes below. No serif, no italic,
no em-dashes in copy.

## Layout — the drawing set

The core unit is the **sheet** (`components/ui/Sheet.tsx`): a header plate
(small drawing reference + kicker annotation, a masked `SplitText` title, and
an optional lede set opposite it) over the schematic body. Sections are
full-width sheets, not the old sticky-rail split. Numbers appear only where
genuinely sequential (the six delivery stages); the decorative `01·word`
eyebrow scaffolding and mono `MOD-01` codes are gone.

Per-sheet schematic:

- **Hero** — headline over the drafting grid and the connective field
  (`GridField`: scattered points settle into a governed lattice).
- **01 Problem** — a fault register: three labelled fault nodes.
- **02 Framework** — the operating model as a four-node keyline grid.
- **03 Delivery** — the six stages as a drawn flow-track: a cobalt connector
  spine with a node per stage; the row nearest viewport centre lights its node
  (IntersectionObserver, additive).
- **04 Modules** — five working modules as labelled registry nodes.
- **05 Platforms** — a data-flow: SharePoint / Teams / OneDrive stacked with
  governed hand-off connectors **drawn** between them.
- **06 Adoption** — cobalt count-up stats, four role swimlanes, stick-factor
  checklist.
- **07 Why** — a scrubbed statement over four marked, unnumbered callouts.
- **Contact** — the cobalt sign-off stamp (light); **Footer** — the drafting
  title block, closing on the oversized stroked wordmark.

## Motion

Same reliability doctrine as before — each mechanism stands alone so a hiccup
in one can't leave content hidden.

- **Lenis** (`components/providers/SmoothScroll.tsx`): smooth scroll only.
- **Reveals (IntersectionObserver + GSAP):** `useReveal` via `RevealRoot`
  reveals `[data-reveal]` / `[data-reveal-group]` and `[data-split]` masked
  headlines; sections stay server components.
- **Connector draw-in:** SVG paths tagged `.draw` carry `pathLength="1"`; the
  reveal observer flags `data-drawn` on their `[data-draw]` sheet and CSS
  transitions `stroke-dashoffset` 1 → 0. No paid DrawSVG plugin.
- **Additive moments:** the delivery flow-track node lighting; `TextScrub`
  statements; count-up numerals; `GridField` settling; the ink ribbon.
- FX: scroll-progress bar, hide-on-scroll-down nav with scrollspy.

Rules: initial hidden states are gated behind the `.js` class (no-JS users see
everything); `prefers-reduced-motion` forces all final states — including the
fully-drawn connectors — and skips every GSAP / Lenis / canvas animation.

### Cascade/transform gotchas (still true)

1. **`backdrop-filter` creates a containing block for fixed descendants.** The
   solid nav uses backdrop blur, so the full-screen mobile menu is rendered as
   a *sibling* of the nav, never a child, and below its z-index.
2. **Tailwind's scanner can't see utilities inside class-name templates.**
   Structural CSS (position, z-index) for stateful components lives in named
   classes in `globals.css`.
3. **GSAP parses stylesheet `translateY(110%)` as pixels.** Percent-based
   rises (`yPercent`) also set `y: 0`.
4. **Draw-in never gates visibility in CSS by length.** `pathLength="1"` lets
   one CSS rule hide every `.draw` path regardless of its real length, and the
   start state is `.js`-gated so no-JS and reduced-motion always show it drawn.

## Accessibility floor

WCAG AA contrast on every text/ground pair (verified). Skip link, single `h1`,
ordered headings, semantic lists, keyboard-operable nav with focus trap in the
mobile menu, cobalt focus-visible ring, and reduced-motion fallbacks on every
animated element.
