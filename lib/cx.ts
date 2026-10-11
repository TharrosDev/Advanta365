import type { CSSProperties } from "react";

/** Joins the truthy parts with a single space. The one way class names are combined in this codebase. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  let out = "";
  for (const part of parts) {
    if (!part) continue;
    out = out ? `${out} ${part}` : part;
  }
  return out;
}

/** Typed escape hatch for inline CSS custom properties. Undefined values are dropped. */
export function cssVars(vars: Record<`--${string}`, string | number | undefined>): CSSProperties {
  const style: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(vars)) {
    if (value !== undefined) style[name] = value;
  }
  return style as CSSProperties;
}
