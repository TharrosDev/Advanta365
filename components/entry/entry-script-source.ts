import {
  ENTRY_BRAND_ATTRIBUTE,
  ENTRY_FAILSAFE_EVENT,
  ENTRY_LOCK_ATTRIBUTE,
  ENTRY_OVERLAY_ATTRIBUTE,
  ENTRY_SCRIPT_FAILSAFE,
} from "@/lib/motion/page-ready";

/*
 * The one inline script of the app. It runs before first paint, straight after <body> opens.
 *
 * On a hard load of the home page (and only when motion is allowed) it marks <html> with the two
 * entry attributes: one shows the entry overlay and pauses every reveal, the other hides the
 * header brand so the chrome mark can dock into it. It also arms the last-resort timer that
 * removes all entry state if the bundle never lifts the overlay.
 *
 * HARD RULE for this file: no regular expression and no escape character anywhere, not even in
 * a comment. An escape written inside a string literal is consumed by the TypeScript compiler,
 * the emitted script would then be a syntax error, the entry attribute would never be set, and
 * no compiler or linter would report it. The route test is a plain string comparison: the home
 * path is always exactly one slash. tests/unit/entry-script.test.ts guards all of this.
 */

function quote(value: string): string {
  return "'" + value + "'";
}

const OVERLAY = quote(ENTRY_OVERLAY_ATTRIBUTE);
const BRAND = quote(ENTRY_BRAND_ATTRIBUTE);
const LOCK = quote(ENTRY_LOCK_ATTRIBUTE);

export const ENTRY_SCRIPT_SOURCE: string =
  "(function(){try{" +
  "var d=document.documentElement;" +
  "if(location.pathname!=='/')return;" +
  "if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;" +
  "d.setAttribute(" +
  OVERLAY +
  ",'');d.setAttribute(" +
  BRAND +
  ",'');" +
  "try{history.scrollRestoration='manual'}catch(e){}" +
  "setTimeout(function(){" +
  "if(!d.hasAttribute(" +
  OVERLAY +
  ")&&!d.hasAttribute(" +
  BRAND +
  "))return;" +
  "d.removeAttribute(" +
  OVERLAY +
  ");d.removeAttribute(" +
  BRAND +
  ");d.removeAttribute(" +
  LOCK +
  ");" +
  "try{history.scrollRestoration='auto'}catch(e){}" +
  "try{window.dispatchEvent(new Event(" +
  quote(ENTRY_FAILSAFE_EVENT) +
  "))}catch(e){}" +
  "}," +
  String(ENTRY_SCRIPT_FAILSAFE) +
  ");" +
  "}catch(e){}})()";
