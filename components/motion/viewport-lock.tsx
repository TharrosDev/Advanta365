"use client";

import { useEffect } from "react";

const PROPERTY = "--viewport-height";

/**
 * Pins `--viewport-height` on `<html>` to the window height in px (the stylesheet fallback is
 * 100svh). On touch devices a resize that keeps the width is the URL bar sliding in or out; it is
 * ignored so full-height sections never reflow while scrolling. Rendered once by the site layout;
 * renders nothing.
 */
export function ViewportLock(): null {
  useEffect(() => {
    const root = document.documentElement;
    let width = window.innerWidth;

    const update = () => {
      width = window.innerWidth;
      root.style.setProperty(PROPERTY, `${window.innerHeight}px`);
    };
    const onResize = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (coarse && window.innerWidth === width) return;
      update();
    };

    update();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", update);
      root.style.removeProperty(PROPERTY);
    };
  }, []);

  return null;
}
