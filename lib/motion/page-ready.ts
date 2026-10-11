/**
 * Page-ready singleton: one module-level store, no React context.
 *
 * It answers two questions for the first load of "/":
 *   1. "Is the entry overlay still covering the page?"
 *      (isOverlayLifted / onOverlayLifted / liftOverlay)
 *   2. "Is everything above the fold warmed up?"
 *      (claimReady / whenPageReady)
 *
 * On every route without the overlay `isOverlayLifted()` is true from the first call and nobody
 * awaits `whenPageReady()`, so canvases simply run. The module touches `window` / `document` only
 * inside functions, which keeps it import-safe on the server and in workers.
 */

export const ENTRY_OVERLAY_ATTRIBUTE = "data-entry";
export const ENTRY_BRAND_ATTRIBUTE = "data-entry-brand";
export const ENTRY_LOCK_ATTRIBUTE = "data-entry-lock";
/** Animation frames the overlay waits after mount before it locks scrolling. */
export const ENTRY_LOCK_FRAMES = 3;
/** ms. The overlay's own timer: it leaves through the fallback path when this fires. */
export const ENTRY_OVERLAY_FAILSAFE = 14000;
/** ms. Timer inside the inline script, for a bundle that is alive but never lifted the overlay. */
export const ENTRY_SCRIPT_FAILSAFE = 16000;
export const ENTRY_FAILSAFE_EVENT = "a365:entry-failsafe";
/** ms. Cross-fade between the docked symbol and the header mark. */
export const ENTRY_SWAP_DURATION = 200;
/** ms. Hard cap on how long ready-claims can hold the overlay. */
export const PAGE_READY_TIMEOUT = 8000;

const MAX_CLAIM_ROUNDS = 64;

const claims = new Set<Promise<void>>();
const liftListeners = new Set<() => void>();
let wake: (() => void) | null = null;
let readyPromise: Promise<void> | null = null;
let ready = false;
let lifted: boolean | null = null;
let failsafeBound = false;

function noop(): void {}

/**
 * Added on the module's first client call: a one-time listener for the event the inline script
 * dispatches when its own timer (ENTRY_SCRIPT_FAILSAFE) had to clear the entry attributes. Lifting
 * here lets the canvases and the overlay component follow.
 */
function bindFailsafe(): void {
  if (failsafeBound) return;
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  failsafeBound = true;
  window.addEventListener(ENTRY_FAILSAFE_EVENT, liftOverlay, { once: true });
}

/** True while `<html>` carries `data-entry`. Always false on the server and in workers. */
export function hasEntryOverlay(): boolean {
  if (typeof document === "undefined") return false;
  bindFailsafe();
  return document.documentElement.hasAttribute(ENTRY_OVERLAY_ATTRIBUTE);
}

/** Lazily initialised to `!hasEntryOverlay()`; true forever after `liftOverlay()`. */
export function isOverlayLifted(): boolean {
  if (typeof document === "undefined") return true;
  bindFailsafe();
  if (lifted === null) lifted = !hasEntryOverlay();
  return lifted;
}

/**
 * Subscribes to the lift. When the overlay is already lifted (or never existed) this returns a
 * no-op and does NOT call `cb`.
 */
export function onOverlayLifted(cb: () => void): () => void {
  if (isOverlayLifted()) return noop;
  liftListeners.add(cb);
  return () => {
    liftListeners.delete(cb);
  };
}

/** Idempotent. Calls every listener exactly once. */
export function liftOverlay(): void {
  if (lifted === true) return;
  lifted = true;
  const listeners = Array.from(liftListeners);
  liftListeners.clear();
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // One failing subscriber must not keep the others (or the page) behind the overlay.
    }
  }
}

export function clearEntryOverlay(): void {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute(ENTRY_OVERLAY_ATTRIBUTE);
}

export function clearEntryBrand(): void {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute(ENTRY_BRAND_ATTRIBUTE);
}

/**
 * Registers "something above the fold is still warming up". Returns `release()`, which is
 * idempotent. Once the page has been reported ready this is a no-op.
 */
export function claimReady(): () => void {
  bindFailsafe();
  if (ready) return noop;

  let settle: () => void = noop;
  const claim = new Promise<void>((resolve) => {
    settle = resolve;
  });
  claims.add(claim);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    claims.delete(claim);
    settle();
    wake?.();
  };
}

function windowLoaded(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

function fontsReady(): Promise<void> {
  const fonts = document.fonts;
  if (!fonts) return Promise.resolve();
  return fonts.ready.then(noop, noop);
}

/** Window load and web fonts first, then every outstanding claim (re-snapshot, max 64 rounds). */
async function allReady(): Promise<void> {
  await Promise.all([windowLoaded(), fontsReady()]);
  for (let round = 0; round < MAX_CLAIM_ROUNDS; round += 1) {
    const snapshot = Array.from(claims);
    if (snapshot.length === 0) return;
    await Promise.race([
      Promise.all(snapshot),
      new Promise<void>((resolve) => {
        wake = resolve;
      }),
    ]);
    wake = null;
  }
}

/** Memoised: (window load && fonts ready && all claims released) raced with PAGE_READY_TIMEOUT. */
export function whenPageReady(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return Promise.resolve();
  bindFailsafe();
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      ready = true;
      claims.clear();
      wake = null;
      resolve();
    };
    const timer = setTimeout(finish, PAGE_READY_TIMEOUT);
    allReady().then(finish, finish);
  });
  return readyPromise;
}
