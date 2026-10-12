import {
  CALM_ROUTE_SOURCE,
  INK_BACKSTOP_MS,
  INK_KEY,
  INK_OFF,
  INK_TIERS,
  INTRO_BACKSTOP_MS,
  INTRO_CLICK_GUARD_MS,
  INTRO_FLAG,
  INTRO_PATH,
  INTRO_SEEN,
  INTRO_SKIP_EVENTS,
  SOFTWARE_RENDERER_SOURCE,
} from "./state";

const q = (value: unknown) => JSON.stringify(value);

/**
 * The inline script, run first thing in `<body>` on every page, before anything is painted. It
 * makes the decisions of `state.ts` in the browser (the unit test runs both and compares them) and
 * writes them on the root element, where the stylesheets and the ink layer read them. In order:
 *
 * 1. Reduced motion: `data-ink="still"`, and nothing else.
 * 2. `data-motion="on"`, and `data-timeline="on"` where view timelines exist.
 * 3. The ink: `data-ink-route="calm"` on a calm route, then `data-ink` as `inkMode` decides. Only a
 *    session with no stored choice asks the GPU, with a throw-away context that is lost again at
 *    once: it must exist, hold float targets and not be a software renderer. A device that cannot
 *    is remembered as `off`.
 * 4. A backstop: live ink that no layer has claimed after six seconds becomes still.
 * 5. The cover: on the home page, on the first load of the session, in a tab that is in view,
 *    `data-intro="play"`. The first press, key, wheel turn or touch sets `leave`, unless the cover
 *    is already leaving. The end of the cover's own animation takes the attribute off again, and
 *    so does a timer, whatever else happened. A touch or a pen that ends the cover also arms a
 *    one-shot, capture-phase click guard for `INTRO_CLICK_GUARD_MS`: the click of a touch is aimed
 *    where the finger lifts, so a tap held past the 200 ms skip would click the link under it.
 *
 * It only ever switches states: every timeline is CSS, so the cover leaves even if this stops
 * after its first `setAttribute`. All storage access is guarded; storage that cannot be read means
 * no cover.
 */
export const BOOT_SCRIPT = `(function(){
var d=document,r=d.documentElement,t,h;
function m(x){return matchMedia("("+x+")").matches}
function S(k,v){r.setAttribute("data-"+k,v)}
function get(k){try{return sessionStorage.getItem(k)}catch(e){}}
function put(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
if(m("prefers-reduced-motion: reduce")){S("ink","still");return}
S("motion","on");
if(typeof CSS!="undefined"&&CSS.supports&&CSS.supports("animation-timeline: view()"))S("timeline","on");
var p=location.pathname,s=get(${q(INK_KEY)}),c=navigator.connection,i="still",g,x;
if(new RegExp(${q(CALM_ROUTE_SOURCE)}).test(p))S("ink-route","calm");
if(m("prefers-contrast: more")||m("forced-colors: active")||m("prefers-reduced-data: reduce")||c&&c.saveData||s==${q(INK_OFF)});
else if(${q(INK_TIERS)}.indexOf(s)>=0)i="live";
else{try{g=d.createElement("canvas").getContext("webgl2",{failIfMajorPerformanceCaveat:true});if(g){x=g.getExtension("WEBGL_debug_renderer_info");if((g.getExtension("EXT_color_buffer_float")||g.getExtension("EXT_color_buffer_half_float"))&&!new RegExp(${q(SOFTWARE_RENDERER_SOURCE)},"i").test(g.getParameter(x?x.UNMASKED_RENDERER_WEBGL:g.RENDERER)))i="live";x=g.getExtension("WEBGL_lose_context");x&&x.loseContext()}}catch(e){}if(i!="live")put(${q(INK_KEY)},${q(INK_OFF)})}
S("ink",i);
if(i=="live")setTimeout(function(){if(r.getAttribute("data-ink")=="live"&&!r.hasAttribute("data-ink-layer"))S("ink","still")},${INK_BACKSTOP_MS});
s=get(${q(INTRO_FLAG)});
if(s===void 0)return;
put(${q(INTRO_FLAG)},${q(INTRO_SEEN)});
if(s==${q(INTRO_SEEN)}||p!=${q(INTRO_PATH)}||d.visibilityState!="visible")return;
var E=${q(INTRO_SKIP_EVENTS)},o={capture:true,passive:true};
function own(e){var a=e.target;return a&&a.hasAttribute&&a.hasAttribute("data-intro-cover")}
function quiet(){E.forEach(function(k){removeEventListener(k,leave,o)})}
function hush(e){loose();e.stopPropagation();e.preventDefault()}
function loose(){clearTimeout(h);removeEventListener("click",hush,true)}
function leave(e){quiet();if(r.hasAttribute("data-intro")){S("intro","leave");if(e.type=="touchstart"||e.pointerType&&e.pointerType!="mouse"){addEventListener("click",hush,true);h=setTimeout(loose,${INTRO_CLICK_GUARD_MS})}}}
function going(e){if(own(e))quiet()}
function gone(e){if(own(e))end()}
function end(){clearTimeout(t);quiet();removeEventListener("animationstart",going);removeEventListener("animationend",gone);r.removeAttribute("data-intro")}
S("intro","play");
E.forEach(function(k){addEventListener(k,leave,o)});
addEventListener("animationstart",going);
addEventListener("animationend",gone);
t=setTimeout(end,${INTRO_BACKSTOP_MS});
})()`;
