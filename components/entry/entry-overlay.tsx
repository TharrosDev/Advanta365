"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ChromeSymbol,
  type ChromeSymbolHandle,
} from "@/components/graphics/chrome-symbol/chrome-symbol";
import { CHROME_SYMBOL_INTRO } from "@/components/graphics/chrome-symbol/constants";
import { cubicBezier } from "@/components/graphics/chrome-symbol/cubic-bezier";
import { Container } from "@/components/ui/container";
import { cssVars, cx } from "@/lib/cx";
import { durations } from "@/lib/motion/durations";
import {
  ENTRY_LOCK_ATTRIBUTE,
  ENTRY_LOCK_FRAMES,
  ENTRY_OVERLAY_FAILSAFE,
  ENTRY_SWAP_DURATION,
  clearEntryBrand,
  clearEntryOverlay,
  hasEntryOverlay,
  isOverlayLifted,
  liftOverlay,
  onOverlayLifted,
  whenPageReady,
} from "@/lib/motion/page-ready";
import styles from "./entry-overlay.module.css";

/*
 * The first-load sequence of the home page.
 *
 *   holding   white layer; the chrome mark grows edge-on, turns to face front and spins until the
 *             page is ready (fonts, window load, first WebGL frames), then lands
 *   docking   one frame: the mark starts flying to the header logo, the words start fading
 *   leaving   the page is released (overlay lifted, reveals run); the background fades out
 *   swapping  the docked mark cross-fades with the real header logo
 *   gone      unmounted
 *
 * holding/docking can also go straight to leaving (the fallback: 14s failsafe, nothing to dock
 * onto, or the overlay was lifted from outside) and from there to gone.
 */
type Phase = "holding" | "docking" | "leaving" | "swapping" | "gone";

const DEFAULT_WORDS: readonly [string, string] = ["Advanta", "365"];

/** The flight of the mark to the header logo. */
const DOCK_DURATION = 800;
const DOCK_EASE = [0.5, 0, 0, 1] as const;
/** Background and word fades. */
const FADE_DURATION = durations.theme;
/** The words start by themselves if the symbol has not drawn a frame by then. */
const LIVE_FALLBACK = 1500;
/**
 * Lead of the first page reveal over the dock, in ms: the overlay is lifted `lead - reveal delay`
 * into the flight. With 0 that is the first frame.
 */
const DOCK_REVEAL_LEAD = 0;
/** Exposure that flattens the chrome to a black silhouette, and the one that blows it out to white. */
const EXPOSURE_FOR_DARK_MARK = 0;
const EXPOSURE_FOR_LIGHT_MARK = 64;

const bezier = (points: readonly number[]) => `cubic-bezier(${points.join(", ")})`;

const OVERLAY_STYLE = cssVars({
  "--dock-duration": `${DOCK_DURATION}ms`,
  "--swap-duration": `${ENTRY_SWAP_DURATION}ms`,
  "--bg-duration": `${FADE_DURATION}ms`,
  "--text-duration": `${FADE_DURATION}ms`,
  "--dock-ease": bezier(DOCK_EASE),
  "--wordmark-delay": `${CHROME_SYMBOL_INTRO.initialDelay}s`,
  "--wordmark-reveal": `${CHROME_SYMBOL_INTRO.depthDuration}s`,
  "--wordmark-spread": `${CHROME_SYMBOL_INTRO.blendDuration}s`,
  "--wordmark-reveal-ease": bezier(CHROME_SYMBOL_INTRO.depthEase),
  "--wordmark-spread-ease": bezier(CHROME_SYMBOL_INTRO.blendEase),
});

const subscribeNever = () => () => {};
const serverHasOverlay = () => true;
const clientMounted = () => true;
const serverMounted = () => false;

function restoreScrollRestoration(): void {
  try {
    window.history.scrollRestoration = "auto";
  } catch {
    // Not available in every embedding; the browser default then applies anyway.
  }
}

/** Everything the page needs to be usable, whatever state the sequence was in. Idempotent. */
function releasePage(): void {
  liftOverlay();
  clearEntryOverlay();
  clearEntryBrand();
  document.documentElement.removeAttribute(ENTRY_LOCK_ATTRIBUTE);
  restoreScrollRestoration();
}

/**
 * The intro always plays at the top of the page, so a hard load of "/#section" loses its anchor.
 * Once the overlay is gone the anchor is honoured, unless the visitor has scrolled in the meantime.
 */
function scrollToHashTarget(): void {
  if (window.scrollY !== 0 || window.location.hash.length < 2) return;
  let id: string;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  document.getElementById(id)?.scrollIntoView();
}

/** `--reveal-delay` of the page in ms (0 when it cannot be read). */
function readRevealDelay(): number {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--reveal-delay")
    .trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return raw.endsWith("ms") ? value : value * 1000;
}

/** Relative luminance below one half. Unreadable colours count as dark (the ink default). */
function isDarkColor(color: string): boolean {
  const channels = color.match(/[\d.]+/g);
  if (!channels || channels.length < 3) return true;
  const r = Number(channels[0]);
  const g = Number(channels[1]);
  const b = Number(channels[2]);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

/**
 * Rendered by the home page only, after its content. The markup is in the server HTML (white from
 * the first paint) but shows only when the inline entry script marked this load: a hard load of
 * "/" with motion allowed. On a client-side navigation to "/" the component renders nothing.
 */
export function EntryOverlay({ words = DEFAULT_WORDS }: { words?: readonly [string, string] }) {
  // Server snapshot true keeps the markup in the HTML; on the client the attribute decides.
  const marked = useSyncExternalStore(subscribeNever, hasEntryOverlay, serverHasOverlay);
  // The symbol is client-only: the dock is empty in the server HTML.
  const mounted = useSyncExternalStore(subscribeNever, clientMounted, serverMounted);
  const [phase, setPhase] = useState<Phase>("holding");
  const [live, setLive] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<ChromeSymbolHandle>(null);
  const dockRef = useRef<HTMLSpanElement>(null);
  const dockFrame = useRef(0);
  const dockAttempted = useRef(false);
  const dockStarted = useRef(false);
  const pageReady = useRef(false);
  const landed = useRef(false);
  const releaseTimer = useRef(0);

  // `data-entry` is cleared when the dock starts; from then on the phase keeps the overlay up.
  const shown = (marked || phase !== "holding") && phase !== "gone";

  const fallbackLeave = useCallback(() => {
    setPhase((current) => (current === "holding" || current === "docking" ? "leaving" : current));
  }, []);

  const dock = useCallback(() => {
    if (dockAttempted.current) return;
    dockAttempted.current = true;

    const root = rootRef.current;
    const seat = dockRef.current;
    const symbol = symbolRef.current;
    const target = document.querySelector("[data-site-symbol] svg");
    if (!root || !seat || !symbol || !target) {
      fallbackLeave();
      return;
    }
    // The target is the header mark at the top of the page (see the scroll guard in the effect).
    if (window.scrollY !== 0) window.scrollTo(0, 0);
    const from = seat.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (from.height === 0 || to.height === 0) {
      fallbackLeave();
      return;
    }

    // Measured once; a resize during the flight is not followed.
    const { fit, exposure } = symbol.getParams();
    const drawnScale = fit > 0 ? fit : 1;
    seat.style.setProperty(
      "--dock-x",
      `${to.left + to.width / 2 - (from.left + from.width / 2)}px`,
    );
    seat.style.setProperty(
      "--dock-y",
      `${to.top + to.height / 2 - (from.top + from.height / 2)}px`,
    );
    seat.style.setProperty("--dock-scale", String(to.height / (from.height * drawnScale)));
    seat.style.setProperty("--dock-keep", "1");
    // The phase below reaches the DOM only when React next renders, which can be after the first
    // frame of the flight. That frame clears `data-entry`, and without `data-docking` the
    // stylesheet would hide the overlay for a moment: the flight and the fades would then start
    // from nothing, without their transitions. So the attribute is written here as well.
    root.setAttribute("data-docking", "");

    // The chrome flattens into the colour of the logo it is about to be swapped for.
    const targetExposure = isDarkColor(window.getComputedStyle(target).color)
      ? EXPOSURE_FOR_DARK_MARK
      : EXPOSURE_FOR_LIGHT_MARK;
    const ease = cubicBezier(...DOCK_EASE);
    const liftAt = Math.max(0, DOCK_REVEAL_LEAD - readRevealDelay());
    const start = performance.now();
    let released = false;
    let leaving = false;

    const frame = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const progress = Math.min(elapsed / DOCK_DURATION, 1);
      symbol.setParams({ exposure: exposure + (targetExposure - exposure) * ease(progress) });

      if (!released && elapsed >= liftAt) {
        released = true;
        liftOverlay();
        clearEntryOverlay();
        restoreScrollRestoration();
      }
      if (!leaving) {
        leaving = true;
        setPhase("leaving");
      }
      if (elapsed < DOCK_DURATION) {
        dockFrame.current = requestAnimationFrame(frame);
        return;
      }
      dockFrame.current = 0;
      setPhase("swapping");
    };

    dockStarted.current = true;
    dockFrame.current = requestAnimationFrame(frame);
    setPhase("docking");
  }, [fallbackLeave]);

  const tryDock = useCallback(() => {
    if (pageReady.current && landed.current) dock();
  }, [dock]);

  const handleLanded = useCallback(() => {
    landed.current = true;
    tryDock();
  }, [tryDock]);

  const handleLive = useCallback((isLive: boolean) => {
    if (!isLive) return;
    // Written at once as well, so the words start in the very frame the symbol's clock starts,
    // however long React takes to render the state while the page is still hydrating.
    rootRef.current?.setAttribute("data-live", "");
    setLive(true);
  }, []);

  // Ready wait, failsafe, scroll position and scroll lock. Runs once, for as long as the overlay is up.
  useEffect(() => {
    if (!shown) return;
    // The hydration render uses the server snapshot; only a marked load really plays the sequence.
    if (!hasEntryOverlay()) return;

    // A release queued by a simulated unmount (Strict Mode) is withdrawn: the overlay is still here.
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = 0;

    const html = document.documentElement;
    let cancelled = false;

    // The intro plays at the top of the page, where the dock target (the header mark) is on screen.
    // Nothing may move the page while the overlay covers it: the browser's own jump to a
    // "#section" anchor arrives whenever the document has finished loading, lock or no lock.
    const keepAtTop = () => {
      if (window.scrollY !== 0 && !isOverlayLifted()) window.scrollTo(0, 0);
    };
    window.scrollTo(0, 0);
    window.addEventListener("scroll", keepAtTop, { passive: true });

    void whenPageReady().then(() => {
      if (cancelled) return;
      pageReady.current = true;
      const symbol = symbolRef.current;
      if (symbol) symbol.land();
      else landed.current = true;
      tryDock();
    });

    const failsafe = window.setTimeout(fallbackLeave, ENTRY_OVERLAY_FAILSAFE);

    // Scroll lock, a few frames late so the browser's own initial scroll handling has settled.
    let lockFrame = 0;
    let framesLeft = ENTRY_LOCK_FRAMES;
    const countFrame = () => {
      lockFrame = 0;
      if (isOverlayLifted()) return;
      framesLeft -= 1;
      if (framesLeft > 0) {
        lockFrame = requestAnimationFrame(countFrame);
        return;
      }
      html.setAttribute(ENTRY_LOCK_ATTRIBUTE, "");
    };
    if (!isOverlayLifted()) lockFrame = requestAnimationFrame(countFrame);

    // Fires for our own lift (dock start, fallback) and for a lift from outside (script failsafe).
    const unsubscribe = onOverlayLifted(() => {
      window.removeEventListener("scroll", keepAtTop);
      html.removeAttribute(ENTRY_LOCK_ATTRIBUTE);
      restoreScrollRestoration();
      if (!dockStarted.current) fallbackLeave();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      window.removeEventListener("scroll", keepAtTop);
      if (lockFrame !== 0) cancelAnimationFrame(lockFrame);
      if (dockFrame.current !== 0) cancelAnimationFrame(dockFrame.current);
      dockFrame.current = 0;
      unsubscribe();
      html.removeAttribute(ENTRY_LOCK_ATTRIBUTE);
      // Gone or unmounted (for example a keyboard navigation away mid-intro): never leave the
      // page paused, locked or without its header brand. Deferred so that an immediate re-run of
      // this effect can withdraw it.
      releaseTimer.current = window.setTimeout(releasePage, 0);
    };
  }, [shown, fallbackLeave, tryDock]);

  // The words must animate even if WebGL never draws.
  useEffect(() => {
    if (!shown || live) return;
    const timer = window.setTimeout(() => setLive(true), LIVE_FALLBACK);
    return () => window.clearTimeout(timer);
  }, [shown, live]);

  // Fallback leave: release the page now, fade, then unmount.
  useEffect(() => {
    if (phase !== "leaving" || dockStarted.current) return;
    liftOverlay();
    clearEntryOverlay();
    restoreScrollRestoration();
    const timer = window.setTimeout(() => setPhase("gone"), FADE_DURATION);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Swap: hand over to the real header brand, then unmount.
  useEffect(() => {
    if (phase !== "swapping" && phase !== "gone") return;
    clearEntryBrand();
    if (phase === "gone") {
      scrollToHashTarget();
      return;
    }
    const timer = window.setTimeout(() => setPhase("gone"), ENTRY_SWAP_DURATION);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!shown) return null;

  return (
    <div
      ref={rootRef}
      data-entry-overlay=""
      className={styles.root}
      data-theme="light"
      aria-hidden="true"
      role="presentation"
      data-live={live ? "" : undefined}
      data-docking={phase !== "holding" ? "" : undefined}
      data-leaving={phase === "leaving" || phase === "swapping" ? "" : undefined}
      data-swapping={phase === "swapping" ? "" : undefined}
      style={OVERLAY_STYLE}
    >
      <Container className={styles.wordmark}>
        <span className={cx("t-display-fluid", styles.word)}>{words[0]}</span>
        <span ref={dockRef} className={styles.dock}>
          {mounted ? (
            <ChromeSymbol
              ref={symbolRef}
              height="5rem"
              intro
              spin
              onLive={handleLive}
              onLanded={handleLanded}
            />
          ) : null}
        </span>
        <span className={cx("t-display-fluid", styles.word)}>{words[1]}</span>
      </Container>
    </div>
  );
}
