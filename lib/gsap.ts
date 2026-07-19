/**
 * Single GSAP entry point. Import gsap from here so every component shares one
 * instance. Entrance reveals run on IntersectionObserver (robust, decoupled
 * from scroll); ScrollTrigger is used only for *additive* scrub effects
 * (pins, progress rails, scrubbed statements) that can never leave content
 * hidden if they fail. Client-side only — never import from a server component.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Expressive ease shared across the site (matches CSS cubic-bezier(0.16,1,0.3,1)). */
export const EASE = "expo.out";

/** True when the visitor prefers reduced motion (guarded for SSR). */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger };
