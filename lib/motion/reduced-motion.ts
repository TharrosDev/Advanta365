// Namespace import on purpose: this module has no "use client" directive, so that
// `prefersReducedMotion()` stays an ordinary function wherever it is imported. A named import of a
// client-only hook would make Next reject the file as soon as a server module pulled it in.
import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor asked for reduced motion. Always false on the server and in workers. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Reactive `prefersReducedMotion()` for client components. The server snapshot (and therefore the
 * hydration render) is false; the real value arrives right after hydration.
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, prefersReducedMotion, getServerSnapshot);
}
