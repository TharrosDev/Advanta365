import manifest from "./stills.json";
import type { SceneName } from "./types";

/**
 * The stills: settled frames of the real engine, captured on the real pages and served from
 * `public/ink/`. They stand in for the live ink without JavaScript, under reduced motion, when the
 * visitor paused it, on calm routes and after a failure. `stills.json` is the one list of them: the
 * capture script, the file test and `InkBackdrop` all read it.
 */

export type StillName =
  | "prompt-wide"
  | "prompt-tall"
  | "ninety-wide"
  | "ninety-tall"
  | "bloom-wide"
  | "bloom-tall"
  | "bloom-purchase-wide"
  | "bloom-purchase-tall"
  | "wisps-wide"
  | "wisps-tall"
  | "title"
  | "spill-wide"
  | "spill-tall";

export type StillEntry = {
  name: StillName;
  /** The page it is captured on. */
  route: string;
  /** The window it is captured in, in CSS pixels, and its device pixel ratio. */
  viewport: readonly [number, number];
  ratio: number;
  scene: SceneName;
  /**
   * Calm zones of other pages that use the same stage. A frame is shared by every page that has the
   * stage, so it is captured on one of them with the zones the others add laid over it: the capture
   * script measures each of these where it stands on its own page, at the same window size.
   */
  borrow?: readonly { route: string; kind: "text" | "display" | "veil" }[];
};

export const STILLS = manifest as unknown as readonly StillEntry[];

/** The stills a backdrop shows: one for wide windows and, where the layout differs, one for tall. */
export type StillPair = { wide: StillName; tall?: StillName };

/** Where a still is served from. */
export function stillPath(name: StillName): string {
  return `/ink/${name}.webp`;
}

/** The quality stills are encoded at, and the limits they must keep, in bytes. */
export const STILL_QUALITY = 0.86;
export const STILL_MAX_BYTES = 90 * 1024;
export const STILLS_MAX_BYTES = 600 * 1024;
