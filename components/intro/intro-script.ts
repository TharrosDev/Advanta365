/**
 * The plumbing of the cover a first visit opens under (see `intro-cover.tsx`): the names it uses,
 * the decision to play it, and the inline script that makes that decision before first paint.
 *
 * Pure data and one pure function: no DOM, so the unit tests and the browser specs import it too.
 */

/**
 * The session flag. The first page load of a browser session sets it, on whichever page that is, so
 * the cover is only ever for a session that starts on the home page.
 */
export const INTRO_FLAG = "advanta365.intro.v1";

/** The value the flag is set to. */
export const INTRO_SEEN = "1";

/**
 * The attribute on the root element that carries the state of the cover: `play` (the timeline is
 * running), `skip` (the visitor asked for the page: the cover is leaving at once) or `done` (it has
 * left). It is taken off again when the animations of that first paint have ended.
 */
export const INTRO_ATTRIBUTE = "data-intro";

/** The hook on the cover itself. The script tells its animation events from its children's by it. */
export const INTRO_COVER_ATTRIBUTE = "data-intro-cover";

/** The one page that opens under the cover. */
export const INTRO_PATH = "/";

/** What lifts the cover at once: a press, a key, a turn of the wheel, a finger moving on the screen. */
export const INTRO_SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchmove"] as const;

/**
 * Backstop, counted from the first frame. The cover leaves by CSS in 2.3 seconds; if its animation
 * events never arrive (the page changed under it), the state still moves on to `done`. The margin
 * is for a slow connection, on which the cover can reach the browser some time after that frame.
 */
export const INTRO_BACKSTOP_MS = 4000;

/** What the decision needs to know about a page load. */
export type IntroVisit = {
  /** The pathname being loaded. */
  path: string;
  /** Whether the session flag was already set. A session whose storage cannot be read counts as seen. */
  seen: boolean;
  /** Whether the visitor asked for reduced motion. */
  reducedMotion: boolean;
};

/**
 * Whether a page load opens under the cover: only the home page, only as the first load of the
 * session, and never for a visitor who asked for reduced motion.
 */
export function shouldPlayIntro({ path, seen, reducedMotion }: IntroVisit): boolean {
  return path === INTRO_PATH && !seen && !reducedMotion;
}

const quoted = (value: unknown) => JSON.stringify(value);

/**
 * The inline script, run first thing in `<body>` on every page, before anything is painted. It
 * reads and sets the session flag, makes the same decision as `shouldPlayIntro` (the unit test
 * runs both and compares them) and, for a visit that plays, sets the state on the root element and
 * keeps it up to date:
 *
 * - one of the skip events, before the cover has begun to leave, sets `skip`;
 * - the cover's own animation starting means it is leaving, so there is nothing left to skip;
 * - the cover's own animation ending, or the backstop, sets `done`;
 * - when every animation that was running at that moment has ended, the attribute is taken off.
 *
 * It only ever switches states: the timeline itself is CSS, so the cover leaves even if this stops
 * after its first `setAttribute`. Storage that throws leaves `seen` true and nothing plays.
 */
export const INTRO_SCRIPT = `(function(){
var root=document.documentElement,seen=true,timer;
try{seen=sessionStorage.getItem(${quoted(INTRO_FLAG)})===${quoted(INTRO_SEEN)};sessionStorage.setItem(${quoted(INTRO_FLAG)},${quoted(INTRO_SEEN)})}catch(e){}
if(seen||location.pathname!==${quoted(INTRO_PATH)}||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var keys=${quoted(INTRO_SKIP_EVENTS)};
function set(state){root.setAttribute(${quoted(INTRO_ATTRIBUTE)},state)}
function own(event){var target=event.target;return!!target&&!!target.hasAttribute&&target.hasAttribute(${quoted(INTRO_COVER_ATTRIBUTE)})}
function quiet(){keys.forEach(function(key){removeEventListener(key,skip)})}
function skip(){quiet();set("skip")}
function leaving(event){if(own(event))quiet()}
function left(event){if(own(event))done()}
function clear(){root.removeAttribute(${quoted(INTRO_ATTRIBUTE)})}
function done(){
clearTimeout(timer);quiet();
removeEventListener("animationstart",leaving);removeEventListener("animationend",left);
set("done");
var moving=document.getAnimations?document.getAnimations():[];
Promise.all(moving.map(function(animation){return animation.finished.catch(function(){})})).then(clear);
}
set("play");
keys.forEach(function(key){addEventListener(key,skip,{passive:true})});
addEventListener("animationstart",leaving);
addEventListener("animationend",left);
requestAnimationFrame(function(){timer=setTimeout(done,${INTRO_BACKSTOP_MS})});
})()`;
