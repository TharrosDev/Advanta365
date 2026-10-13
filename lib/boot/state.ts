/**
 * The names and the decisions of a page load: whether the page opens under the cover of a first
 * visit. Pure data and pure functions, with no DOM, so the inline boot script (`boot-script.ts`)
 * can mirror them, the unit test can run both and compare, and the browser specs can import the
 * names.
 */

/** The session flag of the cover: the first page load of a browser session sets it. */
export const INTRO_FLAG = "advanta365.intro.v1";

/** The value the flag is set to. */
export const INTRO_SEEN = "1";

/** The one page that opens under the cover. */
export const INTRO_PATH = "/";

/** What ends the cover at once: a press, a key, a turn of the wheel, a finger on the screen. */
export const INTRO_SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * After a touch (or a pen) ends the cover, the first click is swallowed for this long. A touch's
 * click is aimed when the finger lifts, not when it came down, and the cover is gone 200 ms after
 * the press: a tap held longer than that would otherwise click the link that lies under it.
 */
export const INTRO_CLICK_GUARD_MS = 600;

/** The cover is taken off this long after the script ran, whatever else happened. */
export const INTRO_BACKSTOP_MS = 5500;

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
