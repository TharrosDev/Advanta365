import type { Pigments, Rgb } from "./types";

/**
 * The six pigments of the ink, read from the `--pigment-*` tokens of `app/globals.css`. The engine
 * holds numbers, never colours: each token is set as the text colour of a probe element and the
 * value the browser computes for it is parsed. The numbers below stand in when a token is missing
 * or cannot be read.
 */

const of255 = (r: number, g: number, b: number): Rgb => [r / 255, g / 255, b / 255];

export const PIGMENT_FALLBACKS: Pigments = {
  paper: of255(255, 255, 255),
  binder: of255(13, 15, 21),
  black: of255(16, 19, 26),
  blue: of255(95, 168, 245),
  blueDark: of255(134, 193, 255),
  pale: of255(195, 206, 223),
};

export const PIGMENT_TOKENS: Record<keyof Pigments, string> = {
  paper: "--pigment-paper",
  binder: "--pigment-binder",
  black: "--pigment-black",
  blue: "--pigment-blue",
  blueDark: "--pigment-blue-dark",
  pale: "--pigment-pale",
};

/**
 * A computed colour as three channels from 0 to 1, or null when it is not one. Browsers report
 * either the 0 to 255 form or, for a colour given in a colour space, the 0 to 1 form.
 */
export function parseComputed(value: string): Rgb | null {
  const numbers = (value.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g) ?? []).slice(0, 3);
  const [r, g, b] = numbers.map((text) =>
    text.endsWith("%") ? Number.parseFloat(text) / 100 : Number.parseFloat(text),
  );
  if (r === undefined || g === undefined || b === undefined) return null;
  if (![r, g, b].every(Number.isFinite)) return null;
  const unit = value.trim().startsWith("rgb") ? 255 : 1;
  const channel = (v: number, percent: boolean) => Math.min(1, Math.max(0, percent ? v : v / unit));
  return [
    channel(r, numbers[0]?.endsWith("%") ?? false),
    channel(g, numbers[1]?.endsWith("%") ?? false),
    channel(b, numbers[2]?.endsWith("%") ?? false),
  ];
}

/** Reads the pigments from the document. Never throws. */
export function readPigments(): Pigments {
  const result: { -readonly [K in keyof Pigments]: Rgb } = { ...PIGMENT_FALLBACKS };
  if (typeof document === "undefined") return result;
  let probe: HTMLElement | null = null;
  try {
    const root = document.documentElement;
    const declared = getComputedStyle(root);
    probe = document.createElement("span");
    probe.hidden = true;
    root.append(probe);
    for (const key of Object.keys(PIGMENT_TOKENS) as (keyof Pigments)[]) {
      const token = PIGMENT_TOKENS[key];
      // An undeclared token would compute to the inherited text colour: skip it.
      if (!declared.getPropertyValue(token).trim()) continue;
      probe.style.color = `var(${token})`;
      const parsed = parseComputed(getComputedStyle(probe).color);
      if (parsed) result[key] = parsed;
    }
  } catch {
    // The fallbacks stand.
  } finally {
    probe?.remove();
  }
  return result;
}
