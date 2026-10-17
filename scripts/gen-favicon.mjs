#!/usr/bin/env node
/**
 * Writes the raster icons from the drawing `scripts/gen-icon.mjs` makes of the mark, so every icon
 * the site serves is the same tile as `app/icon.svg`:
 *
 *   app/favicon.ico              16, 32 and 48 px in one file, for search results and old browsers
 *   app/apple-icon.png           180 px, square: the system rounds the corners itself
 *   public/icons/icon-192.png    the rounded tile, for the manifest
 *   public/icons/icon-512.png    the rounded tile, for the manifest and the logo in structured data
 *   public/icons/maskable-512.png  full bleed, the mark inside the safe circle a launcher keeps
 *
 * The SVG is drawn by the Chromium that Playwright installs for the end-to-end tests, so nothing new
 * is needed: run `node scripts/gen-icon.mjs`, then `node scripts/gen-favicon.mjs`, after a change to
 * the mark. `tests/unit/favicon.test.ts` checks the files are there and the size they say.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { renderIcon } from "./gen-icon.mjs";

const at = (path) => new URL(`../${path}`, import.meta.url);

/** The tile as a PNG of `pixels` square, its corners left transparent. */
async function rasterize(page, svg, pixels) {
  await page.setViewportSize({ width: pixels, height: pixels });
  const sized = svg.replace("<svg ", `<svg width="${pixels}" height="${pixels}" `);
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">${sized}</body></html>`,
  );
  return page.screenshot({ type: "png", omitBackground: true });
}

/**
 * An ICO file holding PNG images, the form every browser since Windows Vista reads: a six byte
 * header, a sixteen byte entry per image, then the images.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ pixels, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(pixels >= 256 ? 0 : pixels, 0);
    entry.writeUInt8(pixels >= 256 ? 0 : pixels, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const tile = renderIcon();

  const favicon = [];
  for (const pixels of [16, 32, 48]) {
    favicon.push({ pixels, png: await rasterize(page, tile, pixels) });
  }
  writeFileSync(at("app/favicon.ico"), ico(favicon));

  writeFileSync(
    at("app/apple-icon.png"),
    await rasterize(page, renderIcon({ size: 180, radius: 0, fill: 0.7 }), 180),
  );

  mkdirSync(at("public/icons"), { recursive: true });
  writeFileSync(at("public/icons/icon-192.png"), await rasterize(page, tile, 192));
  writeFileSync(at("public/icons/icon-512.png"), await rasterize(page, tile, 512));
  writeFileSync(
    at("public/icons/maskable-512.png"),
    await rasterize(page, renderIcon({ size: 512, radius: 0, fill: 0.6 }), 512),
  );
  console.log("wrote app/favicon.ico, app/apple-icon.png and public/icons/*.png");
} finally {
  await browser.close();
}
