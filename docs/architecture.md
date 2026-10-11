# Architecture

Advanta365 is a Next.js 16 App Router site. Pages are server components that read a validated catalog
and compose primitives. The motion and graphics layer is client-only and starts after hydration. This
document describes how the parts connect. For the visual rules see `design-system.md`; for numbers you
can tune see `graphics-tuning.md`.

## Server and client boundaries

- Layouts and pages are server components. They load data and pass plain values down.
- A file with `"use client"` is a client island. It is still rendered to HTML on the server, then
  hydrated, and its hooks run in the browser only.
- A file without the directive uses no hooks and can be rendered from either side: `Container`,
  `Text`, `SectionShell`, `SectionIntro`, `DetailCard`, `Chip`, `LogoMark` and the other static
  primitives. `lib/motion/reduced-motion.ts` is deliberately without the directive, so
  `prefersReducedMotion()` is an ordinary function that a server module can import.
- WebGL code is loaded with `await import()` inside an effect, never by a static import. The first
  route chunk contains no WebGL.
- Catalog data lives in `content/**`. Only `lib/catalog/repository.ts` reads it. It validates every
  record with zod when the module loads (`validateCatalog`) and throws `CatalogError`, which names the
  record, field or duplicate slug. Its functions are async, so a database can replace the file source
  without touching callers.
- The cart is pure logic in `lib/cart/store.ts` (`parseCart`, `addLine`, `removeLine`, `pruneLines`).
  `components/cart/use-cart.ts` exposes it as an external store, mirrored to `localStorage` under
  `advanta365.cart.v1`. Storage access is wrapped in try/catch: without storage the cart still works for
  the page. Changes made in another tab arrive through the `storage` event.
- `CartSync`, rendered by the site layout, removes lines whose template or bundle has left the catalog.
  It runs on every page, so the header count is right everywhere.

## Routes

| Route                | File                                   | Notes                                                |
| -------------------- | -------------------------------------- | ---------------------------------------------------- |
| `/`                  | `app/(site)/page.tsx`                  | Home: hero, swirl band, values, built-for band       |
| `/catalog`           | `app/(site)/catalog/page.tsx`          | Search, sort and filters in the URL                  |
| `/phases/[phase]`    | `app/(site)/phases/[phase]/page.tsx`   | Static per phase. Calls `notFound()`                 |
| `/templates/[slug]`  | `app/(site)/templates/[slug]/page.tsx` | Static per template. Calls `notFound()`              |
| `/bundles`           | `app/(site)/bundles/page.tsx`          |                                                      |
| `/bundles/[slug]`    | `app/(site)/bundles/[slug]/page.tsx`   | Static per bundle. Calls `notFound()`                |
| `/cart`              | `app/(site)/cart/page.tsx`             | Checkout is a disabled "coming soon" control         |
| `/pricing`           | `app/(site)/pricing/page.tsx`          |                                                      |
| `/about`             | `app/(site)/about/page.tsx`            |                                                      |
| `/contact`           | `app/(site)/contact/page.tsx`          |                                                      |
| any other path       | `app/(site)/[...rest]/page.tsx`        | Calls `notFound()`, so the site shell stays          |

404 rules:

- No `<Suspense>` boundary and no `loading.tsx` may sit above `children` in `app/(site)`. A boundary
  there sends a 200 shell before the not-found error, so `/nope` would answer 200. Keep this in mind
  when adding a layout.
- `app/(site)/not-found.tsx` renders inside the site layout. `app/not-found.tsx` covers the rare case of
  a path outside the group.

`proxy.ts` answers mixed-case paths with a 308 redirect to lower case. Everything else passes through.

## Site shell

`app/(site)/layout.tsx` renders, in order:

1. The skip link, which is the first focusable element.
2. `CartSync`, `ViewportLock` and, while the catalog holds sample content, `BetaBar`.
3. `.frame`, which holds `Header`, `<main id="main">` with the page, and `Footer`.
4. `SiteFrame` (the 2000px guide lines, from 2000px wide) and `PageFade` (the route fade layer).

Pages render a `PageShell` (a `div`). The layout owns `<main>`, so there is exactly one per page.

The header is absolutely positioned, scrolls away with the page and has no background of its own. It is
a three-column grid: brand, Menu, cart. DOM order, visual order and tab order are the same at every width.

The footer is always light. It holds the one `nav` named "Rollout phases", the primary links, the legal
notice and the wordmark.

### The Menu

`components/layout/menu.tsx` is a curtain on every viewport, with no separate desktop navigation.

- Opening requests the dark theme, drops the panel from the top and staggers the rows in.
- Closing happens on Close, Escape, a tap on the backdrop, a link in the panel, or a route change.
  Focus is kept inside while open and returns to the toggle when it closes.
- The "Close" label is placed over the "Menu" text by measuring both (`--menu-shift`,
  `--menu-close-inset`).
- The page does not scroll while the menu is open.
- Browser Back while open closes it: the component remembers the pathname it was opened on
  (`openAt`) and drops the menu when the pathname differs. It needs no effect for this.

## Load sequence: a hard load of `/`

Only a hard load of `/` plays the intro. Other routes show no overlay.

1. **Before first paint.** `EntryScript` runs inline at the top of `<body>`. When the pathname is exactly
   `/` and reduced motion is not requested, it sets `data-entry` and `data-entry-brand` on `<html>`,
   sets `history.scrollRestoration` to `manual`, and arms a 16s timer. The timer clears every entry
   attribute and dispatches `a365:entry-failsafe`. Under reduced motion, or on any other route, the
   script does nothing.
2. **Server HTML.** The overlay markup is in the document, but CSS hides it until `data-entry` (or
   `data-docking`) is set. Its own last-resort animation hides it at 17s.
3. **Hydration.** `EntryOverlay` shows a white layer with the words "Advanta" and "365". The chrome
   symbol's renderer is loaded by dynamic import and created one animation frame after mount. Its first
   frame is drawn once the shader has linked, and the intro clock starts there. The symbol stays empty for
   0.12s, grows from nothing into an edge-on bar over 0.8s, then turns to face front over 1.5s. That is the
   2.42s intro. It then spins until it is asked to land.
4. **Scroll lock.** Three animation frames after mount the overlay sets `data-entry-lock`, which holds the
   body at `overflow: hidden`. Until then the page is kept at the top of the scroll range.
5. **Page ready.** `whenPageReady()` waits for window load, `document.fonts.ready` and every page-ready
   claim. The claims are the hero's first frame, the swirl's first frame and the sheen words above the
   fold. The wait is capped at 8s. Then the overlay asks the symbol to land.
6. **Dock.** When the symbol has landed and the page is ready, the overlay flies the symbol to the header
   mark (`[data-site-symbol] svg`) over 800ms and flattens its exposure to the logo colour. The overlay
   lifts in the first frame of the flight: `liftOverlay()` runs its listeners and `data-entry` is removed.
7. **Release.** Reveals run, the headline words rise 50ms apart, the hero ribbons draw in from the left
   (about 2.9s, each ribbon 2.5s, staggered by 0.13s), and the header mark fades in over 200ms with the
   brand text following. The overlay then unmounts.

Failsafes, in the order they can fire:

| Time  | What fires                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------- |
| 1.5s  | If the symbol has not drawn a frame, the overlay's words start animating anyway.                         |
| 8s    | `whenPageReady` gives up waiting for claims and resolves.                                                |
| 14s   | The overlay's own timer calls `fallbackLeave`: the overlay fades out without docking.                    |
| 16s   | The inline script clears the entry attributes and dispatches `a365:entry-failsafe`. The page lifts.      |
| 17s   | CSS hides the overlay if nothing else has removed it.                                                    |

If the dock cannot find its target (no `[data-site-symbol] svg`, or zero-height boxes), the overlay takes
the fallback leave instead of the dock.

## Route transitions

`TransitionLink` is the only way internal links navigate. For a plain left click to another pathname, it:

1. Calls `coverPage()`, which asks `PageFade` to fade the page to the background over 300ms.
2. Pushes the route when the cover is complete.
3. `PageFade` sees the pathname change, scrolls to the top (unless the URL has a hash), and reveals the
   page over 300ms. The layer is idle again after 400ms.

If the pathname never changes, a 4s hold failsafe reveals the page. `coverPage()` resolves immediately
when no `PageFade` is mounted or under reduced motion, so navigation never depends on the fade.

A link is not faded when it points at the current pathname (filters, pagination, same-page anchors),
when it is external, `mailto:`, protocol-relative or has a `target` other than `_self`, when a modifier
key is held, when the click is not a primary click, or when `fade={false}` is passed. The caller's own
`onClick` always runs first; a handler that calls `preventDefault()` stops the fade too.

## Theme controller

`lib/motion/theme.ts` is the only writer of `<html data-theme>`. It keeps a set of requesters. The
attribute is `dark` while any requester asks for dark, and is removed when none does. The two requesters
are:

- **`scroll`**, owned by `ThemeScroll` on the home page. An `IntersectionObserver` with
  `rootMargin: 0px 0px -50% 0px` watches `#practice`. Scroll and resize re-evaluate the same test in a
  frame. The first time the page goes dark, `#practice` receives `data-in-view`, which starts the reveals
  paused inside it. The request is released on `pagehide` and the observer is re-created on `pageshow`,
  so a page restored from the back-forward cache is correct.
- **`menu`**, owned by the open menu. It requests dark on open and releases the request when a close
  starts, or on unmount.

Scoped themes do not touch `<html>`: the footer is light, the beta bar and the about page's principles
band are dark, and the entry overlay is light.

## Page-ready and motion contract

`lib/motion/page-ready.ts` is a module-level store with no React context:

- `hasEntryOverlay()`, `isOverlayLifted()`, `onOverlayLifted(cb)`, `liftOverlay()`. Routes without the
  overlay are lifted from the first call.
- `claimReady()` registers "something above the fold is still warming up" and returns an idempotent
  `release()`.
- `whenPageReady()` resolves when window load, fonts and all claims are settled, or after 8s.

Every canvas follows the same rules:

1. Claim on mount, and release on the first drawn frame, on error and on cleanup.
2. Draw the first frame as soon as the program has linked, whatever the scroll position. A canvas below
   the fold must not hold the loader until its own timeout.
3. Draw later frames only while the canvas is in view, the tab is visible and the overlay is lifted, and
   only when something is changing.
4. Link shaders without blocking: start the link, poll `isProgramComplete()` once per frame (using
   `KHR_parallel_shader_compile` where it exists), then call `finishProgram()`. See `lib/gl/program.ts`.
5. On context loss or a link error, switch to the fallback. A disposed renderer releases its context
   with `WEBGL_lose_context`.
6. Under reduced motion there is no time loop.

| Component       | Loaded by                                                          | Page-ready claim                                       | Fallback                                         |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------ |
| `HeroLiquid`    | `renderer.ts` by dynamic import, mask from a worker or the main thread | Yes, released at the first frame                      | Flat SVG ribbons (`data-hero-lines`)             |
| `MetallicSwirl` | `renderer.ts` by dynamic import                                    | Yes, on mount, released at the first frame             | Canvas hidden, plain background                  |
| `ChromeSymbol`  | `session.ts` by dynamic import, one frame after mount              | No. The overlay waits on `whenPageReady()` and `land()` | Flat `LogoMark` (`data-failed`)                  |
| `SheenWord`     | `sheen-engine.ts` by dynamic import                                | Yes, for words above the fold                          | Gradient text clipped to the glyphs              |

### The hero mask

`mask-loader.ts` builds the ribbon mask once per width and shading floor, and caches the result.

- The width is chosen at mount: 2048 when the canvas extent is at least 1024px, otherwise 1024.
- It first tries a module worker (`mask.worker.ts`) with an `OffscreenCanvas`. A worker that fails or
  does not answer within 5s is abandoned.
- Otherwise, or after that, it builds on the main thread at 1024. That build yields to the event loop
  between stages and every 8 relaxation sweeps, so it never blocks the page with one long task.
- A rejected build is evicted from the cache so the next mount can retry.

The mask has three textures: a base RGBA8 texture (coverage and tone), a meta RGBA8 texture (branch id and
a 16-bit arc length) and an R16F edge field at half resolution. The shader samples them; it never
evaluates a curve.

## Test hooks

Tests and the cross-unit code locate elements by these attributes. Keep them stable.

| Attribute                                        | Element                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `data-entry`, `data-entry-brand`, `data-entry-lock` | `<html>` during the intro                                      |
| `data-entry-overlay`                             | Entry overlay root (`data-live`, `data-docking`, `data-leaving`, `data-swapping`) |
| `data-site-symbol`                               | Span around the header `LogoMark` (the dock target)              |
| `data-chrome-symbol`                             | Chrome symbol root (`data-live`, `data-failed`)                  |
| `data-hero-lines`, `data-hero-liquid`            | Hero fallback SVG, and the hero canvas (`data-active`)           |
| `data-swirl-band`, `data-swirl-canvas`           | Swirl band root, and the swirl canvas (`data-ready`, `hidden`)   |
| `data-sheen-word`                                | Sheen word span (`data-live`)                                    |
| `data-reveal-group`                              | Reveal group and any manual pause wrapper (`data-in-view`)       |
| `data-theme`                                     | `<html>`, sections, footer, beta bar, entry overlay              |
| `data-menu-backdrop`, `data-menu-label`          | Menu backdrop button, and the single text node "Menu"            |
| `data-page-fade`                                 | Route fade layer (`data-state`: `idle`, `cover`, `hold`, `reveal`) |
| `--viewport-height`                              | Set in pixels on `<html>` by `ViewportLock`                      |

## Test contract

- **Unit** (Vitest, `tests/unit/**/*.test.ts`): the logo geometry, word splitting, page-ready gate,
  hero geometry, swirl keyframe interpolation, intro timeline and entry script, plus the catalog, cart,
  query, format and pricing tests. `entry-script.test.ts` guards the inline script's source text.
- **Browser** (Playwright, `tests/e2e/`): the existing browse, cart, cart keyboard, catalog, menu and
  404 specs, plus the rebuild's specs for the intro, the desktop menu, the page theme, console errors on
  the main routes, the WebGL fallbacks and reduced motion.
- **Projects**: two, both with motion on: desktop Chromium at 1280 x 800 and Pixel 7. Reduced motion is
  emulated inside a test with `page.emulateMedia({ reducedMotion: "reduce" })`, not with a project.
- **Server**: `playwright.config.ts` builds and starts the production server on port 3100 and reuses a
  running one unless `CI` is set.
- **Locators**: every link or button locator is scoped to its landmark (`banner`, the `Menu`
  navigation, `main`, `contentinfo`). The header, the open menu and the footer repeat link names.
- **WebGL fallback**: the tests stub `getContext` to return `null` for `webgl2` and `webgl` before the
  page loads, then check that the SVG, the flat glyph and the gradient text are what is visible.
- **Invariants checked by the tests**: one `h1` with the exact title text; one `main`; the skip link is
  first; the beta text appears once; one "Rollout phases" navigation; the cart link is named
  "Cart, N items" once the stored cart is known; only the allowed `article` and `role="status"` elements.

Before a merge, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e`. After a
production build, `curl` the unknown routes (`/nope`, `/templates/nope/extra`) to confirm they answer 404.

## Failure and fallback matrix

| Situation                                              | What the visitor sees                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| JavaScript disabled                                    | Full content. No intro. Reveals are released by the no-JS rule. Hero shows SVG ribbons. Search (a GET form), result links and pagination work. Filters, sort and the Menu need JavaScript. |
| No WebGL2                                              | Hero: SVG ribbons. Swirl: canvas hidden, plain background. Chrome logo: flat glyph. Headings: gradient text. |
| WebGL2 context lost                                    | The same as no WebGL2, for that canvas only.                                                           |
| Shader link fails                                      | The same as no WebGL2, for that canvas only.                                                           |
| Hero mask worker fails or takes over 5s                | The main-thread build is used. The page is correct either way.                                         |
| Reduced motion                                         | No intro, no overlay. Reveals are instant. Hero shows SVG ribbons. Swirl shows one frame per scroll stop. Logo is flat. Headings use the gradient. Route changes are not faded. The menu has no curtain. |
| Overlay never lifts                                    | The 14s, 16s and 17s failsafes remove it in turn.                                                      |
| Page-ready claim never released                        | `whenPageReady()` gives up at 8s.                                                                      |
| Route fade never completes                             | `coverPage()` resolves after the 300ms cover. The 4s hold failsafe reveals the page.                  |
| Storage blocked or disabled                            | The cart works in memory for the current page. Nothing else reads storage.                             |
| Stored cart has lines for removed records              | `CartSync` removes them on the next page.                                                              |
| Menu open and Back pressed                             | The menu closes and the page is scrollable with no theme left behind.                                  |

## Known failure modes

These are the failures most likely to appear when the code changes. Check them first.

- **The intro never plays**: the inline entry script has lost a backslash or contains a regular expression
  or an escape. Its source must hold only plain string concatenation. `entry-script.test.ts` catches it.
- **Unknown routes return 200**: a `<Suspense>` or `loading.tsx` sits above the page content in
  `app/(site)`.
- **Content stays invisible**: a pause wrapper has neither a `RevealGroup` nor `data-in-view`, or the
  page never went dark, so `#practice` never received `data-in-view`.
- **The overlay sticks**: the header has no `[data-site-symbol] svg`, so the dock has no target. The
  overlay then leaves through the fallback, which is correct but not the intended look.
- **A class from another file does nothing**: a module uses a `@keyframes` name defined in another module.
  Keyframe names are scoped per file.
- **Hydration warnings**: a component reads `window`, `matchMedia` or `Date` during render. Read them in
  an effect, or through `useSyncExternalStore` with a server snapshot.
- **The cart count jumps**: `CartButton` shows the count in its accessible name only after the store has
  been read. Keep it that way.
