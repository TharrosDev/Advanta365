#!/usr/bin/env node
/**
 * Writes `app/icon.svg` from the mark in `lib/brand/mark.ts`: the arm in white and the leg that
 * drops in the highlighter, on the ink tile. `tests/unit/brand-mark.test.ts` fails when the file is not what this writes, so after a
 * change to the mark run `node scripts/gen-icon.mjs`.
 *
 * The colours are written here and in the icon only: the icon is a file of its own and cannot read
 * the site's tokens (the design gate allows raw colour in `app/icon.svg` alone).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MARK_HUE_D, MARK_INK_D, MARK_VIEWBOX } from "../lib/brand/mark.ts";

const SIZE = 32;
const RADIUS = 7;
const INK = "#0B0D12";
const HIGHLIGHTER = "#86C1FF";
const WHITE = "#FFFFFF";
/** The mark fills this share of the tile's width, centred on both axes. */
const FILL = 0.84;

export function renderIcon() {
  const scale = (SIZE * FILL) / MARK_VIEWBOX.width;
  const x = (SIZE - MARK_VIEWBOX.width * scale) / 2;
  const y = (SIZE - MARK_VIEWBOX.height * scale) / 2;
  const n = (value) => String(Number(value.toFixed(3)));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">`,
    `  <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" fill="${INK}"/>`,
    `  <g transform="translate(${n(x)} ${n(y)}) scale(${n(scale)})">`,
    `    <path d="${MARK_HUE_D}" fill="${HIGHLIGHTER}"/>`,
    `    <path d="${MARK_INK_D}" fill="${WHITE}"/>`,
    `  </g>`,
    `</svg>`,
    ``,
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../app/icon.svg", import.meta.url), renderIcon());
  console.log("wrote app/icon.svg");
}
