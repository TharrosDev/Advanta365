/**
 * The names and the decisions of a page load: whether the ink runs live, whether the page opens
 * under the cover of a first visit, which routes stay calm. Pure data and pure functions, with no
 * DOM, so the inline boot script (`boot-script.ts`) can mirror them, the unit test can run both and
 * compare, and the browser specs can import the names.
 */

/** The session flag of the cover: the first page load of a browser session sets it. */
export const INTRO_FLAG = "advanta365.intro.v1";

/** The value the flag is set to. */
export const INTRO_SEEN = "1";

/**
 * The session's ink choice: `off` (this device cannot run it, or ran it too slowly), `paused` (the
 * visitor paused it) or the quality tier the engine settled on.
 */
export const INK_KEY = "advanta365.ink.v1";
export const INK_OFF = "off";
export const INK_PAUSED = "paused";
export const INK_TIERS = ["high", "medium", "low"] as const;

/** The one page that opens under the cover. */
export const INTRO_PATH = "/";

/** What ends the cover at once: a press, a key, a turn of the wheel, a finger on the screen. */
export const INTRO_SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/** The cover is taken off this long after the script ran, whatever else happened. */
export const INTRO_BACKSTOP_MS = 4500;

/** Live ink that no layer has claimed by then falls back to stills. */
export const INK_BACKSTOP_MS = 6000;

export type InkMode = "live" | "paused" | "still";

/**
 * Renderers that draw on the processor, as source text of a pattern matched without regard to
 * case (the boot script embeds it). A browser may hand out such a context even when it is asked
 * to refuse a slow one, so the name is read as well.
 */
export const SOFTWARE_RENDERER_SOURCE = "swiftshader|llvmpipe|softpipe|software|basic render";

const SOFTWARE_RENDERER = new RegExp(SOFTWARE_RENDERER_SOURCE, "i");

/** Whether a renderer's name says it has no GPU behind it. */
export function isSoftwareRenderer(name: string): boolean {
  return SOFTWARE_RENDERER.test(name);
}

/**
 * The pattern of the calm routes, as source text (the boot script embeds it): the catalog, the
 * cart, and every template and bundle page. The bundles index is not one of them.
 */
export const CALM_ROUTE_SOURCE = "^/(catalog|cart)(/|$)|^/(templates|bundles)/.";

const CALM_ROUTE = new RegExp(CALM_ROUTE_SOURCE);

/** Routes where a buyer works: the engine is never loaded there and the footer shows its still. */
export function isCalmRoute(path: string): boolean {
  return CALM_ROUTE.test(path);
}

/** What the decision about the cover needs to know about a page load. */
export type IntroVisit = {
  /** The pathname being loaded. */
  path: string;
  /** Whether the session flag was already set. Storage that cannot be read counts as seen. */
  seen: boolean;
  /** Whether the visitor asked for reduced motion. */
  reducedMotion: boolean;
  /** Whether the document is visible as it loads. Absent: it is. */
  visible?: boolean;
};

/**
 * Whether a page load opens under the cover: only the home page, only as the first load of the
 * session, only in a tab that is in view, and never for a visitor who asked for reduced motion.
 */
export function shouldPlayIntro({
  path,
  seen,
  reducedMotion,
  visible = true,
}: IntroVisit): boolean {
  return path === INTRO_PATH && !seen && !reducedMotion && visible;
}

/** What the decision about the ink needs to know about a page load. */
export type InkVisit = {
  reducedMotion: boolean;
  /** `(prefers-contrast: more)` or `(forced-colors: active)`. */
  contrast: boolean;
  /** `(prefers-reduced-data: reduce)` or the connection's save-data flag. */
  saveData: boolean;
  /** The stored choice of the session, or null. */
  stored: string | null;
  /**
   * Whether this browser gave a context with float targets on a real GPU (see
   * `isSoftwareRenderer`). Asked only when needed.
   */
  capable: () => boolean;
};

/**
 * How the ink starts on a page load: `still` under reduced motion, raised contrast or a data
 * saver, and on a device that cannot run it; `paused` when the visitor paused it earlier in the
 * session; `live` when the session already settled on a tier, or when the device proves able now.
 */
export function inkMode({ reducedMotion, contrast, saveData, stored, capable }: InkVisit): InkMode {
  if (reducedMotion || contrast || saveData || stored === INK_OFF) return "still";
  if (stored === INK_PAUSED) return "paused";
  if ((INK_TIERS as readonly string[]).includes(stored ?? "")) return "live";
  return capable() ? "live" : "still";
}
