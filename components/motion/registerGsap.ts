"use client";

// Single place that registers GSAP plugins. ScrollTrigger ships in the free
// core package. Guarded so it never touches `window` during SSR.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
