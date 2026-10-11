/**
 * The light on a lit sheet. One delegated `pointermove` for the whole document, coalesced to one
 * write a frame, on the sheet under the pointer only:
 *
 *   --lx, --ly  where the light stands on the sheet, in percent of its box
 *   --tx, --ty  the tilt toward the pointer, in degrees, at most 1.2 on each axis
 *
 * A sheet is found on the pointer's own path or, where a card's link is stretched over it, inside
 * the nearest `article` or `[data-lit-scope]`. The properties are taken away again when the
 * pointer moves on, so the sheet goes back to its own light and lies flat.
 */

const LIT = "[data-lit]";
const SCOPE = "article, [data-lit-scope]";
const PROPERTIES = ["--lx", "--ly", "--tx", "--ty"] as const;
const MAX_TILT = 1.2;

function sheetAt(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const sheet = target.closest(LIT) ?? target.closest(SCOPE)?.querySelector(LIT) ?? null;
  return sheet instanceof HTMLElement ? sheet : null;
}

function share(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Starts following the pointer. Returns the function that stops it and clears the last sheet. */
export function trackLight(): () => void {
  if (!window.matchMedia("(hover: hover)").matches) return () => {};

  let sheet: HTMLElement | null = null;
  let frame = 0;
  let x = 0;
  let y = 0;

  const clear = () => {
    if (!sheet) return;
    for (const property of PROPERTIES) sheet.style.removeProperty(property);
    sheet = null;
  };

  const paint = () => {
    frame = 0;
    if (!sheet) return;
    const rect = sheet.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const across = share((x - rect.left) / rect.width);
    const down = share((y - rect.top) / rect.height);
    sheet.style.setProperty("--lx", `${(across * 100).toFixed(1)}%`);
    sheet.style.setProperty("--ly", `${(down * 100).toFixed(1)}%`);
    sheet.style.setProperty("--tx", `${((0.5 - down) * 2 * MAX_TILT).toFixed(2)}deg`);
    sheet.style.setProperty("--ty", `${((across - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const next = sheetAt(event.target);
    if (next !== sheet) {
      clear();
      sheet = next;
    }
    if (!sheet) return;
    x = event.clientX;
    y = event.clientY;
    if (frame === 0) frame = requestAnimationFrame(paint);
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", clear);

  return () => {
    document.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", clear);
    if (frame !== 0) cancelAnimationFrame(frame);
    clear();
  };
}
