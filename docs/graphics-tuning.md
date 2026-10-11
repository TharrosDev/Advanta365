# Graphics tuning

Where to change the look of the WebGL graphics, what each value does, and how the reduced-motion and
no-WebGL paths behave. Every value named here lives in the file given with it. After a change, run
`pnpm test` (the geometry, swirl interpolation and intro timeline tests check the numbers that have a
structure to protect), then look at the page in a browser at desktop and phone widths.

Shared timing values appear in two places: CSS tokens in `app/globals.css` and milliseconds in
`lib/motion/durations.ts`. Change both together.

## Hero ribbons

Folder: `components/graphics/hero-liquid/`.

### Artwork: `geometry.ts`

- `BRANCHES`: four branches, listed in paint order (later ones sit over earlier ones, so branch 3 owns
  the trunk). Each has a `start`, two cubic `curves` (the segment along the trunk, then the fan) and a
  `gray` tone key. Edit the control points here. The SVG fallback, the mask and the renderer all read
  this array.
- `TRUNK_Y` (502): the trunk's centre line, 62% of the artwork height.
- `STROKE_WIDTH` (150): ribbon thickness in artwork units. Butt caps.
- `VIEWBOX_WIDTH` and `VIEWBOX_HEIGHT` (1440 x 810): the authored box.
- `OVERFLOW_SCALE` (1.25): the canvas is 25% taller than the hero, so the lowest ribbon runs under the
  next section. Do not add `overflow: hidden` to the hero to cut it.
- `CROP_ASPECT` (1): canvases narrower than this are centre-cropped rather than squashed.
- `SAMPLES_PER_CUBIC` (48): polyline resolution used when the mask is rasterised.

`tests/unit/liquid-geometry.test.ts` checks that split points and exits keep a minimum distance from a
fixed list of earlier values. Read it before redrawing the curves.

### Shading: `hero-liquid.tsx` and `renderer.ts`

- `shadeFloor` (prop of `HeroLiquid`, default 0.35; the home page passes 0.6): compresses the tone keys
  into the range the shader uses. A higher floor makes the four ribbons more alike. It is part of the
  mask cache key, so each value builds its own mask once.
- `HERO_LIQUID_EFFECT` (`renderer.ts`):
  - `repetition` (1.79): stripe cycles per unit of phase.
  - `softness` (1): base blur of the stripes.
  - `shiftRed` (0.61) and `shiftBlue` (0.33): the warm and cool edge fringes. Raise them for stronger
    colour separation.
  - `shadowBlue` (0.075): blue added to the dark stripes.
  - `distortion` (0.07): how much noise bends the edge value.
  - `contour` (0.97): how strongly the edge field bends the stripes. 0 is flat, 1 is a full tube.
  - `angle` (0) and `flow` (1): the diagonal bias and whether stripes travel (1) or swirl (0).
  - `speed` (0.48): shader seconds per real second. Lower it for a calmer shimmer.
- `LINE_OPACITY` (`hero-liquid.tsx`): the four tones of the flat SVG fallback. The fallback's overall
  opacity is `.lines` in `hero-liquid.module.css` (0.2).

### Intro: `renderer.ts`

- `HERO_LIQUID_INTRO`:
  - `startDelay` (0 s).
  - `stagger` (0.13 s): the bottom ribbon leads, the others follow.
  - `duration` (2.5 s): one ribbon's draw-in. The whole draw-in ends about 2.9 s after it starts.
  - `feather` (0.2): softness of the reveal front, in arc-length units.
- The clock runs only while the loop runs, and the loop waits for the entry overlay to lift. The draw-in
  therefore starts when the overlay lifts, not when the page loads.
- `.liquid` in `hero-liquid.module.css` fades in over 0.5s once the first frame has drawn.

### Cost: `renderer.ts`, `mask-loader.ts`, `mask.ts`

- `MAX_DEVICE_PIXEL_RATIO` (2) and `PIXEL_BUDGET` (12.5e6 drawing-buffer pixels): above the budget the
  ratio is scaled down.
- `MAX_FRAME_DELTA` (0.1 s): the longest clock step, so a stalled tab does not jump.
- `LARGE_MASK_WIDTH` (2048), `SMALL_MASK_WIDTH` (1024) and `LARGE_MASK_MIN_EXTENT` (1024): the mask size
  is chosen at mount from the canvas extent.
- `WORKER_TIMEOUT` (5000 ms): a mask worker that has not answered is abandoned for the main-thread build,
  which always uses 1024.
- `BLUR_RADIUS` (2) in `mask.ts`: radius of the feather. `SOR_SWEEPS` (40), `SOR_OMEGA` (1.9) and
  `SOR_SOURCE` (0.01): the relaxation that makes the rounded dome across each ribbon. More sweeps give a
  smoother dome and a longer build. `SOR_SWEEPS_PER_PAUSE` (8) is how often the main-thread build yields.

## Metallic swirl

Folder: `components/graphics/metallic-swirl/`.

### Keyframes: `keyframes.ts`

`HOME_SWIRL_KEYFRAMES` holds six keyframes, mapped to these positions in scroll order:

| Index | Keyframe | Position                     | Character                                                   |
| ----- | -------- | ---------------------------- | ----------------------------------------------------------- |
| 0     | `K0`     | Band top                     | Curls anchored near the top-left corner, frozen              |
| 1     | `K1`     | `#inside` centre             | The same curls with the centre at mid-height                 |
| 2     | `K2`     | `#bundles` centre            | The breath: zoomed in, brightness 0.14, a hole at the centre |
| 3     | `KF`     | `#featured` centre           | The extra stop, between `K2` and `K3` (see below)            |
| 4     | `K3`     | `#practice` centre           | Five-beam polar burst in white. The only stop that animates  |
| 5     | `K4`     | Band bottom                  | The same burst with its centre on the top edge, frozen       |

The section ids are listed in `app/(site)/page.tsx`: `stops={["inside", "bundles", "featured", "practice"]}`.

- `BAND_BASE`: values shared by every keyframe (transparent canvas, stripes, only the highlight strips
  survive, top and bottom fades of 0.5).
- `KF` is not a hand-written keyframe. It is the sampler's value at 2.4, which is 40% of the way from `K2`
  to `K3`, with `speed` 0 and `brightness` 0.28, and `colorA` `#a8d2ffff`. Changing `K2` or `K3` changes it
  too. `brightness` (0.28) is the knob for this stop; the useful range is 0.14 to 0.44. The plain sample
  would be about 0.44.

To add a section to the band: add its id to `stops` and add one keyframe, so there are always
`stops.length + 2` keyframes. If the counts differ, `SwirlBackdrop` does nothing and the swirl stays on
keyframe 0.

### Interpolation: `interpolate.ts`

- Numbers use a monotone cubic Hermite spline, so a value never overshoots its two neighbours.
- `zoom` and `repetition` are interpolated in logarithmic space when every keyframe is positive. A zoom
  from 2 to 0.25 passes through 0.71 at the midpoint, not 1.1.
- Colours are interpolated per channel and written back as `#rrggbbaa`.
- `colorMode` and other non-numeric fields take the nearest keyframe's value.

`tests/unit/swirl-interpolate.test.ts` covers these rules.

### Scroll driver: `swirl-backdrop.tsx`

- `SMOOTHING` (3 per second): the morph trails the scroll with a time constant of 1/3 s.
- `MAX_FRAME_SECONDS` (0.1) and `SNAP_DISTANCE` (1e-4): the step limit and the point at which the morph
  snaps to its target.
- Stops are the vertical centres of the named sections, in document space. Progress between two stops
  is linear, and the centre line of the viewport supplies the probe.

### Parameters and renderer: `params.ts`, `renderer.ts`, `shaders.ts`

- `SwirlParams` in `params.ts` documents every field. `METALLIC_SWIRL_DEFAULTS` is the base set that
  every keyframe overrides.
- `MAX_DEVICE_PIXEL_RATIO` (1.5) in `renderer.ts`: the drawing-buffer cap.
- `MAX_ITERATIONS` (12): the hard maximum of advection steps. The shader accepts fractional values.
- `OFFSET_RATE` (6 per second): the easing of `setTimeOffset`.
- Shader time is `initialTime` plus the animated clock plus the offset. The animated clock advances at
  `speed` per second.

### Band and page layout: `swirl-band.module.css`

- `.layer` is sticky and one viewport tall, so the swirl stays behind the sections while they scroll.
- `.band::after` dissolves the bottom 30% of a viewport into the page background. The last section's
  buttons sit inside that zone. Change `0.3` to lengthen or shorten the fade.

### Inner-page backdrop: `params.ts`

`INNER_SWIRL_PARAMS` is the set used by the dark band on the About page: two slow, wide beams
sweeping in from beyond the top-right corner, drawn as thin pale-blue lines on a transparent canvas.

To add one to any section, put a `MetallicSwirl` in the section's `backdrop` and let its CSS module
fill the backdrop:

```tsx
// page.tsx
<SectionShell
  theme="dark"
  height="full"
  backdrop={<MetallicSwirl params={INNER_SWIRL_PARAMS} className={styles.swirl} />}
  innerClassName={styles.different}
>
  {children}
</SectionShell>
```

```css
/* page.module.css */
.swirl {
  position: absolute;
  inset: 0;
}
```

`SectionShell` already provides the positioned, clipped backdrop layer behind its content. The canvas
fills its parent, so the `position: absolute; inset: 0` rule is what gives it a size. For a pinned
multi-section band, use `SwirlBand` with its own keyframes instead.

## Chrome logo and the entry intro

Folders: `components/graphics/chrome-symbol/`, `components/entry/`.

### Resting look: `constants.ts` (`CHROME_SYMBOL_DEFAULTS`)

| Field       | Value               | Effect                                                                 |
| ----------- | ------------------- | ---------------------------------------------------------------------- |
| `depth`     | 0.09                | Half thickness of the extrusion, in glyph heights                      |
| `bevel`     | 0.032               | Edge rounding (clamped to 98% of `depth`)                              |
| `roughness` | 0.265               | Width of the light bands and highlights                                 |
| `yaw`, `pitch` | 0, 0             | Rotation of the resting solid. 0 faces the viewer                      |
| `sway`      | 4.5                 | Idle wobble amplitude, in degrees                                      |
| `speed`     | 0                   | Idle clock rate. 0 freezes the wobble after the intro                  |
| `fit`       | 1.125               | Zoom. The solid is drawn this many times the glyph box                 |
| `parallax`  | 1.25                | How much the surface position bends the reflection                     |
| `exposure`  | 1.05                | Gain before tone mapping. 0 is a black silhouette, large is white      |
| `keyAzimuth`, `keyElevation` | 0, 34 | Key light direction                                              |
| `fillAzimuth`, `fillElevation` | 118, 8 | Fill light direction                                          |
| `tintR`, `tintG`, `tintB` | 0.95, 0.955, 0.97 | Base reflectance tint of the metal                       |

The studio itself (a dark floor, a bright sky, three strip lights, a key and a fill highlight) is in the
fragment shader in `shaders.ts`. Change its colours there. `TRACE_STEPS` (96) is the sphere-tracing budget
per pixel.

### Intro: `constants.ts` (`CHROME_SYMBOL_INTRO`)

- `from`: the edge-on starting look. `depth` 0.112, `bevel` 0.044, `roughness` 0.43, `yaw` -90.
- `initialDelay` (0.12 s): empty before the first movement.
- `depthDuration` (0.8 s, ease `0, 0, 0, 1`): the bar grows from nothing.
- `blendDuration` (1.5 s, ease `0.5, 0, 0, 1`): every parameter blends from the intro look to the resting look
  while the solid turns to face front. The intro is therefore 2.42 s in total.
- `spinPeriod` (2 s): one revolution per two seconds while the symbol waits to land.
- `landMinDuration` (0.6 s): the landing eases from spin speed to rest over at least this long, and carries
  the current turn to the next whole revolution.

The entry overlay copies the delay and the two durations into CSS custom properties
(`--wordmark-delay`, `--wordmark-reveal`, `--wordmark-spread`) and the eases, so the two words move on
the same clock as the symbol. Change the intro in `CHROME_SYMBOL_INTRO` and the words follow. The 2.42 s
intro is the agreed timing. Tune it only with the word timing in view.

### Shape: `lib/brand/mark.ts`

The mark is the union of three capsules, read from `MARK_SEGMENTS`, with radius `MARK_STROKE_WIDTH / 2`.
`LogoMark`, the WebGL symbol and the header and footer all read the same data.

`app/icon.svg` repeats the path by hand (`M4 20.5L12.5 3.5L21 20.5M8.5 13.5H28.5`, moved 4 units down inside
its 32-unit square).
Update it when the mark changes.

### Field and renderer: `constants.ts`, `chrome-symbol.tsx`, `session.ts`

- `FIELD_PADDING` (0.28): free space around the glyph box, so the turning solid is never clipped.
- `FIELD_PIXELS_PER_UNIT` (384): sets the normal epsilon (`NORMAL_EPSILON`, 1.25 / 384).
- `MAX_PIXEL_RATIO` (2) in `chrome-symbol.tsx`: the drawing-buffer cap.
- `MIN_VISIBLE_DEPTH` (1e-5) in `session.ts`: below this nothing is drawn. It keeps the empty part of the
  intro empty.

### Overlay: `entry-overlay.tsx`, `lib/motion/page-ready.ts`, `entry-script-source.ts`

- `DOCK_DURATION` (800 ms) and `DOCK_EASE` (`0.5, 0, 0, 1`): the flight to the header mark.
- `EXPOSURE_FOR_DARK_MARK` (0) and `EXPOSURE_FOR_LIGHT_MARK` (64): the exposure the symbol flattens to
  during the flight, so it matches the logo colour it is about to be swapped for.
- `FADE_DURATION` (`durations.theme`, 400 ms): background and word fades.
- `LIVE_FALLBACK` (1500 ms): the words start animating after this long even if the symbol never draws.
- `<ChromeSymbol height="5rem" intro spin>`: the symbol's size in the overlay.
- `DEFAULT_WORDS`: `["Advanta", "365"]`.
- `ENTRY_OVERLAY_FAILSAFE` (14000 ms) and `ENTRY_SCRIPT_FAILSAFE` (16000 ms): the two safety timers.
  The CSS last resort is 17 s in `entry-overlay.module.css`.
- `PAGE_READY_TIMEOUT` (8000 ms): the cap on the page-ready wait.
- `ENTRY_LOCK_FRAMES` (3) and `ENTRY_SWAP_DURATION` (200 ms).
- `entry-script-source.ts` must contain no regular expression and no backslash. The script is a single
  string, and an escape inside it is consumed by the compiler and silently breaks the intro.
  `entry-script.test.ts` guards this.

## Sheen text

Folder: `components/graphics/sheen-text/`. Every word of a page title carries the sheen (`PageTitle`
passes `sheen` to its words; `sheen={false}` turns it off).

### Pattern: `shaders.ts` (`SHEEN_PARAMS`)

- `unit` (5): one noise unit spans five em of the heading's font size. Larger is a broader pattern.
- `speed` (0.75): wall-clock seconds to shader time.
- `repetition` (1): bands per noise unit.
- `warp` (0.1): how far the noise bends the bands.
- `shiftRed` (0.045) and `shiftBlue` (0.04): the phase offsets of the red and blue channels.
- `softness` (1): the width of the band tail and the edge blur.
- `seed` (204): which region of the noise field the pattern uses.
- `onLight` and `onDark`: the lit colour and the chroma used on each surface. The engine picks
  `onLight` when the text's red, green and blue sum to 1.5 or less.

### Engine: `sheen-engine.ts`

- `MAX_DPR` (2): the device pixel ratio cap.
- `PAD_RATIO` (0.3): how far glyphs may overhang the word box, in em.
- `MAX_SIDE` (2048): the largest canvas side.
- `MAX_CONTEXTS` (3): one context plus two re-creations after a context loss.
- `ECONOMY` (`scale` 0.25, `interval` 50 ms): used only on a software rasteriser (SwiftShader, llvmpipe,
  softpipe, WARP and similar). The light is shaded at a quarter size and stepped 20 times a second.
  Hardware GPUs always get full size on every frame.

### Static fallback: `app/globals.css` and `sheen-text.module.css`

- `--gradient-sheen`: a 100-degree band of ink with a foreground-40 highlight in the middle. It is what
  shows until WebGL is live, and what shows for good under reduced motion or without WebGL2.
- `background-size: 300% 100%` and `background-position: 42% 0` in `sheen-text.module.css` place that
  band on the word.

A word that wraps onto two lines is not drawn by the engine (`singleLine`). It keeps the gradient.

## Motion and reveal timings

| Setting                              | Where                                        | Default                                      |
| ------------------------------------ | -------------------------------------------- | -------------------------------------------- |
| Reveal duration, delay, step         | `app/globals.css` (`--reveal-*`)             | 0.75 s, 0.25 s, 0.1 s coarse, 50 ms fine     |
| Theme cross-fade                     | `--duration-theme`                           | 0.4 s                                        |
| Route fade cover                     | `page-fade.tsx` (`COVER_MS`)                 | `durations.slow`, 300 ms                     |
| Route fade reveal                    | `page-fade.tsx` (`UNCOVER_MS`)               | `durations.slow` + 100 ms                    |
| Route fade hold failsafe             | `page-fade.tsx` (`HOLD_FAILSAFE_MS`)         | 4000 ms                                      |
| Menu curtain                         | `menu.tsx` (`OVERLAY_MS`)                    | `durations.slower`, 500 ms                   |
| "Close" label placement              | `menu.tsx` (`CLOSE_TEXT_TOP`, `CLOSE_MAX_RISE`, `PANEL_GUTTER`) | 32px, 16px, 16px          |
| Reveal group trigger                 | `reveal-group.tsx` (`rootMargin`)            | top 93% of the viewport                      |
| Gather band trigger                  | `gather-reveal.tsx` (`rootMargin`)           | top 85% of the viewport                      |
| Theme trigger                        | `theme-scroll.tsx` (`rootMargin`)            | the viewport's middle line                   |

## Reduced motion

`prefers-reduced-motion: reduce` changes these, and only these:

| Piece                  | Behaviour                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Entry overlay          | Not shown. The script does not mark the load. Content is visible at once.                   |
| Reveals                | No animation. Every group is marked in view immediately.                                    |
| Gather band            | Content is visible at once. No measuring, no observers.                                     |
| Hero ribbons           | The flat SVG. No mask, no shader.                                                           |
| Metallic swirl         | No time loop. One frame per scroll stop, snapped rather than eased.                         |
| Chrome logo            | The flat `LogoMark`. No renderer is downloaded.                                             |
| Sheen text             | Static gradient. No engine is downloaded.                                                   |
| Route fade             | Not shown. Navigation does not wait for it.                                                 |
| Theme change           | Instant. The colour transitions are removed.                                                |
| Menu                   | No curtain. The panel appears at once and disappears as soon as a close starts.             |
| Wipes and hover bars   | Bars appear and disappear at once.                                                          |

The preference is read in two places: a hook (`usePrefersReducedMotion`, a `useSyncExternalStore` with a
false server snapshot) for render, and `prefersReducedMotion()` inside effects, where the real value is
known before the first frame.

## Without WebGL2

Every canvas falls back on its own, and the others are unaffected:

- Hero: flat SVG ribbons (`data-hero-lines`), the canvas is hidden.
- Swirl: the canvas is hidden, so the page background shows.
- Chrome logo: the flat glyph (`data-failed`).
- Sheen words: the gradient text.

The tests stub `getContext` to return `null` for `webgl2` and `webgl` to check this.

## Adding a new canvas

1. Make it a client component (`"use client"`), and keep its fallback in the same component.
2. If its first frame belongs to the page's first impression, call `claimReady()` on mount and release
   the claim on the first drawn frame, on error and in cleanup.
3. Load the renderer with `await import("./renderer")` inside an effect, never with a static import.
4. Link shaders with `linkProgramAsync`, poll `isProgramComplete` once per frame, then call
   `finishProgram` (`lib/gl/program.ts`).
5. Read `usePrefersReducedMotion()` for render and `prefersReducedMotion()` in effects. With reduced
   motion, do not start a time loop.
6. Draw only while the canvas is in view, the tab is visible and the overlay is lifted
   (`isOverlayLifted`, `onOverlayLifted`).
7. Hide the canvas with the `hidden` attribute and set `data-*` state so the tests can find it.
8. Set state from callbacks, never synchronously in an effect body. Write inline custom properties with
   `cssVars()`.
9. Add the canvas to the WebGL fallback test, so its fallback is exercised.
