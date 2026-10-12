// The stills of the ink layer: capture them, check them, measure the light blue, save contact sheets.
//
//   node scripts/ink-stills.mjs                  capture the eleven stills into public/ink/
//   node scripts/ink-stills.mjs --check          caps under every calm zone, at seven widths
//   node scripts/ink-stills.mjs --blue           the light blue stays light (hero 8s and 30s, intro 1.3s)
//   node scripts/ink-stills.mjs --sheets         contact sheets of every scene into .qa-shots/final/
//
// Options: --base=http://localhost:3100 (a running production server; without one the script starts
// `next start` on port 3100 from the last build and stops it again), --only=hero-wide,title (capture
// only these; with --sheets, scene and viewport names such as spill,phone), --out=<dir> (where
// --sheets writes).
//
// A still is a settled frame of the real engine, captured on the real page so that its composition
// matches the layout. The captures need a GPU: Chromium is started with the same arguments the
// browser specs of the `gpu` project use. Exit codes: 0 all fine, 1 a check failed, 2 usage or an
// environment that cannot run the engine.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// The scene table and the zone rules are read from the source of the layer itself, so that this
// script and the page cannot disagree. Node runs the TypeScript files as they are; the one warning
// it prints about a package without a module type is switched off in a child process.
const QUIET = "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON";
if (!process.execArgv.includes(QUIET)) {
  const child = spawnSync(process.execPath, [QUIET, ...process.argv.slice(1)], {
    stdio: "inherit",
  });
  process.exit(child.status ?? 2);
}
const { STAGES } = await import("../lib/ink/stage.ts");
const { WIDE_FROM, calmZone, capFor, isCalmKind } = await import("../lib/ink/zones.ts");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STILLS = JSON.parse(readFileSync(path.join(root, "lib/ink/stills.json"), "utf8"));
const OUT_DIR = path.join(root, "public/ink");

const ARGS = ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"];
const INTRO_FLAG = "advanta365.intro.v1";
const INK_KEY = "advanta365.ink.v1";

const MAX_BYTES = 90 * 1024;
const MAX_TOTAL = 600 * 1024;
const QUALITY_START = 0.86;
const QUALITY_FLOOR = 0.7;
const QUALITY_STEP = 0.04;

const WIDTHS = [320, 390, 768, 1088, 1280, 1440, 1920];
const CHECK_ROUTES = [
  "/",
  "/about",
  "/purchase",
  "/sample",
  "/phases/prepare",
  "/catalog",
  "/nope",
];
const TOLERANCE = 0.02;
const BORROW_MARGIN = 24;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const BASE = (option("base") ?? "http://localhost:3100").replace(/\/$/, "");

// ---------------------------------------------------------------------------------------------
// The server
// ---------------------------------------------------------------------------------------------
async function answers(url) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    return response.status < 500;
  } catch {
    return false;
  }
}

/** Uses the server at BASE, or starts the production server from the last build and stops it later. */
async function withServer(run) {
  if (await answers(`${BASE}/`)) return run();
  if (option("base")) throw new Error(`nothing answers at ${BASE}`);
  if (!existsSync(path.join(root, ".next/BUILD_ID"))) {
    console.error("There is no build: run `corepack pnpm build` first.");
    process.exit(2);
  }
  const port = new URL(BASE).port || "3100";
  const next = path.join(root, "node_modules/next/dist/bin/next");
  const server = spawn(process.execPath, [next, "start", "-p", port], {
    cwd: root,
    stdio: "ignore",
  });
  try {
    for (let i = 0; i < 120 && !(await answers(`${BASE}/`)); i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!(await answers(`${BASE}/`))) throw new Error("the production server did not start");
    return await run();
  } finally {
    server.kill();
  }
}

// ---------------------------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------------------------
async function openPage(browser, { width, height, ratio = 1, ink, test = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: ratio,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(
    ([flagName, inkKey, stored, testing]) => {
      try {
        window.sessionStorage.setItem(flagName, "1");
        if (stored) window.sessionStorage.setItem(inkKey, stored);
      } catch {
        // Storage is not available: the defaults apply.
      }
      if (testing) window.__INK_TEST__ = true;
    },
    [INTRO_FLAG, INK_KEY, ink ?? null, test],
  );
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text().slice(0, 200)}`);
  });
  return { context, page, problems };
}

/** Opens a route and waits for the live ink layer, with the test hook, to be there. */
async function openLive(browser, entry) {
  const [width, height] = entry.viewport;
  const opened = await openPage(browser, {
    width,
    height,
    ratio: entry.ratio,
    ink: "high",
    test: true,
  });
  const { page } = opened;
  await page.goto(`${BASE}${entry.route}`, { waitUntil: "load", timeout: 90_000 });
  // A page the server answered with 404 is built in the browser, and its boot script runs a moment
  // after the load event: wait for the attribute to be set.
  await page
    .waitForFunction(() => document.documentElement.hasAttribute("data-ink"), undefined, {
      timeout: 10_000,
    })
    .catch(() => undefined);
  const mode = await page.evaluate(() => document.documentElement.getAttribute("data-ink"));
  if (mode !== "live") {
    await opened.context.close();
    throw new Error(
      `data-ink is "${mode}" on ${entry.route}: the engine needs a GPU (WebGL2 on hardware)`,
    );
  }
  // Put the backdrop of the scene on screen: the layer fetches the engine when one is near.
  await page.evaluate(async (scene) => {
    const backdrop = document.querySelector(`[data-ink-backdrop][data-scene="${scene}"]`);
    backdrop?.scrollIntoView({ behavior: "instant", block: "center" });
    for (let i = 0; i < 200 && !window.__inkTest; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }, entry.scene);
  await page.waitForFunction(() => !!window.__inkTest, undefined, { timeout: 30_000 });
  return opened;
}

const dataUrlBytes = (url) => Buffer.from(url.slice(url.indexOf(",") + 1), "base64");

/**
 * The rectangles of the zones another page has in the same stage, relative to the stage, from a page
 * of the same window size; they are laid over this page as invisible calm elements.
 */
async function borrowZones(browser, entry) {
  const [width, height] = entry.viewport;
  const found = [];
  for (const source of entry.borrow ?? []) {
    const { context, page } = await openPage(browser, {
      width,
      height,
      ratio: entry.ratio,
      ink: "off",
    });
    try {
      await page.goto(`${BASE}${source.route}`, { waitUntil: "load", timeout: 90_000 });
      const rects = await page.evaluate(
        ([scene, kind]) => {
          const backdrop = document.querySelector(`[data-ink-backdrop][data-scene="${scene}"]`);
          const stage = backdrop?.parentElement;
          if (!stage) return [];
          const origin = stage.getBoundingClientRect();
          return [...stage.querySelectorAll(`[data-ink-calm="${kind}"]`)].map((element) => {
            const box = element.getBoundingClientRect();
            return {
              x: box.left - origin.left,
              y: box.top - origin.top,
              width: box.width,
              height: box.height,
            };
          });
        },
        [entry.scene, source.kind],
      );
      // The same zone on a sibling page (another numeral, another sentence) is a little larger or
      // smaller: a margin all round keeps the cap under all of them.
      for (const rect of rects) {
        found.push({
          kind: source.kind,
          x: rect.x - BORROW_MARGIN,
          y: rect.y - BORROW_MARGIN,
          width: rect.width + 2 * BORROW_MARGIN,
          height: rect.height + 2 * BORROW_MARGIN,
        });
      }
    } finally {
      await context.close();
    }
  }
  return found;
}

/** One settled frame of a scene at a given quality, as a data URL, through the hook and the engine. */
function frameAt(page, scene, quality) {
  return page.evaluate(
    async ([name, q]) => {
      const hook = window.__inkTest;
      if (!hook) return null;
      if (q === null) return hook.still(name);
      if (!(await hook.hold(name))) return null;
      const ink = hook.engine();
      const canvas = document.querySelector("canvas[data-ink-canvas]");
      if (!ink || !canvas) return null;
      await ink.still(name);
      ink.render();
      return canvas.toDataURL("image/webp", q);
    },
    [scene, quality],
  );
}

// ---------------------------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------------------------
async function capture(browser) {
  mkdirSync(OUT_DIR, { recursive: true });
  const only = option("only")?.split(",");
  const entries = STILLS.filter((entry) => !only || only.includes(entry.name));
  const sizes = new Map();
  for (const entry of entries) {
    const borrowed = await borrowZones(browser, entry);
    const { context, page } = await openLive(browser, entry);
    try {
      if (borrowed.length) {
        await page.evaluate(
          ([scene, list]) => {
            const stage = document.querySelector(
              `[data-ink-backdrop][data-scene="${scene}"]`,
            )?.parentElement;
            if (!stage) return;
            for (const rect of list) {
              const zone = document.createElement("div");
              zone.setAttribute("data-ink-calm", rect.kind);
              zone.setAttribute("aria-hidden", "true");
              zone.style.cssText = `position:absolute;pointer-events:none;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px`;
              stage.append(zone);
            }
          },
          [entry.scene, borrowed],
        );
      }
      let quality = QUALITY_START;
      let bytes = null;
      while (quality >= QUALITY_FLOOR - 1e-9) {
        const url = await frameAt(page, entry.scene, quality === QUALITY_START ? null : quality);
        if (!url) throw new Error(`no frame for ${entry.name}`);
        bytes = dataUrlBytes(url);
        if (bytes.length <= MAX_BYTES) break;
        quality = Math.round((quality - QUALITY_STEP) * 100) / 100;
      }
      if (!bytes || bytes.length > MAX_BYTES) {
        throw new Error(`${entry.name} is ${bytes?.length} bytes at quality ${quality}`);
      }
      writeFileSync(path.join(OUT_DIR, `${entry.name}.webp`), bytes);
      sizes.set(entry.name, bytes.length);
      console.log(`${entry.name}: ${(bytes.length / 1024).toFixed(1)}KB at quality ${quality}`);
    } finally {
      await context.close();
    }
  }
  // Every still, the ones not captured this time included.
  let total = 0;
  for (const entry of STILLS) {
    const file = path.join(OUT_DIR, `${entry.name}.webp`);
    total += existsSync(file) ? statSync(file).size : 0;
  }
  console.log(`total: ${(total / 1024).toFixed(1)}KB of ${MAX_TOTAL / 1024}KB`);
  if (total > MAX_TOTAL) {
    console.error("The stills are over budget together: lower the quality of the largest.");
    return 1;
  }
  return 0;
}

// ---------------------------------------------------------------------------------------------
// --check: the caps hold in the stills, at every width
// ---------------------------------------------------------------------------------------------
/** What a page says about its backdrops that show a still. */
function measureBackdrops() {
  const found = [];
  for (const backdrop of document.querySelectorAll("[data-ink-backdrop]")) {
    const img = backdrop.querySelector("img");
    const box = backdrop.getBoundingClientRect();
    if (!img || !box.width || !box.height) continue;
    if (getComputedStyle(img.closest("picture") ?? img).display === "none") continue;
    const stage = backdrop.parentElement ?? backdrop;
    const calm = [];
    for (const element of stage.querySelectorAll("[data-ink-calm]")) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      calm.push({
        kind: element.getAttribute("data-ink-calm"),
        rect: {
          x: rect.left - box.left,
          y: rect.top - box.top,
          width: rect.width,
          height: rect.height,
        },
      });
    }
    found.push({
      index: found.length,
      scene: backdrop.getAttribute("data-scene"),
      src: img.currentSrc,
      width: box.width,
      height: box.height,
      image: (() => {
        const at = img.getBoundingClientRect();
        return { x: at.left - box.left, y: at.top - box.top, width: at.width, height: at.height };
      })(),
      calm,
    });
  }
  return found;
}

/** Reads the luminance extremes of a still under zones, given as rectangles in backdrop pixels. */
async function readExtremes([list]) {
  const out = [];
  for (const item of list) {
    const img = new Image();
    img.src = item.src;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(img, 0, 0);
    // The frame is scaled by the width of its backdrop and anchored at the top or the bottom.
    const scale = item.image.width / img.naturalWidth;
    const offsetX = item.image.x;
    const offsetY = item.image.y;
    for (const zone of item.zones) {
      const x0 = Math.max(0, Math.floor((Math.max(0, zone.x) - offsetX) / scale));
      const y0 = Math.max(0, Math.floor((Math.max(0, zone.y) - offsetY) / scale));
      const x1 = Math.min(
        img.naturalWidth,
        Math.ceil((Math.min(item.width, zone.x + zone.width) - offsetX) / scale),
      );
      const y1 = Math.min(
        img.naturalHeight,
        Math.ceil((Math.min(item.height, zone.y + zone.height) - offsetY) / scale),
      );
      if (x1 <= x0 || y1 <= y0) continue;
      const { data } = context.getImageData(x0, y0, x1 - x0, y1 - y0);
      const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      let extreme = zone.dark ? 0 : 1;
      for (let i = 0; i < data.length; i += 4) {
        const y =
          0.2126 * lin(data[i] / 255) +
          0.7152 * lin(data[i + 1] / 255) +
          0.0722 * lin(data[i + 2] / 255);
        extreme = zone.dark ? Math.max(extreme, y) : Math.min(extreme, y);
      }
      out.push({ index: zone.index, kind: zone.kind, cap: zone.cap, dark: zone.dark, extreme });
    }
  }
  return out;
}

async function check(browser) {
  let failures = 0;
  let zones = 0;
  const widths = option("widths")?.split(",").map(Number) ?? WIDTHS;
  const routes = option("routes")?.split(",") ?? CHECK_ROUTES;
  for (const width of widths) {
    const { context, page } = await openPage(browser, { width, height: 900, ink: "off" });
    try {
      for (const route of routes) {
        await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 90_000 });
        // The stills load lazily: bring every backdrop's image in and wait for it.
        await page.evaluate(async () => {
          for (const img of document.querySelectorAll("[data-ink-backdrop] img")) {
            img.loading = "eager";
          }
          await Promise.all(
            [...document.querySelectorAll("[data-ink-backdrop] img")].map((img) =>
              img.decode().catch(() => undefined),
            ),
          );
        });
        const backdrops = await page.evaluate(measureBackdrops);
        const items = backdrops.map((item) => {
          const ground = STAGES[item.scene]?.ground ?? "paper";
          const wide = width >= WIDE_FROM;
          const list = item.calm
            .filter((entry) => isCalmKind(entry.kind))
            .map((entry, index) => {
              const zone = calmZone(entry, ground, wide);
              return {
                index,
                kind: entry.kind,
                cap: capFor(entry.kind, ground),
                dark: ground === "binder",
                x: zone.x,
                y: zone.y,
                width: zone.width,
                height: zone.height,
              };
            });
          return { ...item, zones: list };
        });
        const read = await page.evaluate(readExtremes, [items]);
        for (const row of read) {
          zones += 1;
          const broken = row.dark
            ? row.extreme > row.cap + TOLERANCE
            : row.extreme < row.cap - TOLERANCE;
          if (broken) {
            failures += 1;
            console.error(
              `FAIL ${route} @${width}: ${row.kind} zone ${row.dark ? "highest" : "lowest"} luminance ` +
                `${row.extreme.toFixed(3)} breaks its cap ${row.cap}`,
            );
          }
        }
      }
    } finally {
      await context.close();
    }
    console.log(`width ${width}: checked`);
  }
  console.log(`${zones} zones checked, ${failures} over the cap`);
  return failures ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------
// --blue: light blue stays light
// ---------------------------------------------------------------------------------------------
/**
 * The darkest 1% of the saturated blue of the canvas, from the page: blue is the largest channel,
 * blue minus red is over 70 and saturation is over 0.55. Returns the
 * luminance and the hue at the edge of that darkest 1%, the lightest pixel in it.
 */
function measureBlue() {
  const canvas = document.querySelector("canvas[data-ink-canvas]");
  const ink = window.__inkTest?.engine();
  if (!canvas || !ink) return null;
  ink.render();
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  const context = copy.getContext("2d", { willReadFrequently: true });
  context.drawImage(canvas, 0, 0);
  const { data } = context.getImageData(0, 0, copy.width, copy.height);
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const found = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const high = Math.max(r, g, b);
    const low = Math.min(r, g, b);
    if (b !== high || b - r <= 70 || (high - low) / high <= 0.55) continue;
    found.push([0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255), r, g, b]);
  }
  if (found.length < 100) return { count: found.length };
  // The darkest 1%: the pixel at the first percentile of luminance, which is the lightest of them.
  found.sort((a, b) => a[0] - b[0]);
  const edge = found[Math.max(0, Math.floor(found.length / 100) - 1)];
  const [, r, g, b] = edge;
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  let hue = 0;
  if (delta) {
    if (high === r) hue = (((g - b) / delta) % 6) * 60;
    else if (high === g) hue = ((b - r) / delta + 2) * 60;
    else hue = ((r - g) / delta + 4) * 60;
  }
  if (hue < 0) hue += 360;
  return { count: found.length, luminance: edge[0], hue };
}

async function blue(browser) {
  let failures = 0;
  const frames = [
    { label: "hero 8s", scene: "hero", seconds: 8 },
    { label: "hero 30s", scene: "hero", seconds: 30 },
    { label: "intro 1.3s", scene: "intro", seconds: 1.3 },
  ];
  for (const frame of frames) {
    const entry = { route: "/", viewport: [1440, 900], ratio: 1, scene: frame.scene };
    const { context, page } = await openLive(browser, entry);
    try {
      if (frame.scene === "intro") {
        // The cover is shown by hand, so that its slot has the size of the window.
        await page.evaluate(() => {
          document.documentElement.setAttribute("data-intro", "leave");
        });
      }
      const result = await page.evaluate(
        async ([scene, seconds]) => {
          const hook = window.__inkTest;
          if (!hook || !(await hook.hold(scene))) return null;
          const ink = hook.engine();
          if (!ink) return null;
          ink.step(Math.round(seconds * 60));
          return "ready";
        },
        [frame.scene, frame.seconds],
      );
      if (!result) throw new Error(`the ${frame.scene} scene could not be held`);
      const measured = await page.evaluate(measureBlue);
      const ok =
        measured &&
        typeof measured.luminance === "number" &&
        measured.luminance >= 0.25 &&
        measured.hue >= 205 &&
        measured.hue <= 216;
      if (!ok) failures += 1;
      console.log(
        `${ok ? "ok  " : "FAIL"} ${frame.label}: ${
          measured && typeof measured.luminance === "number"
            ? `darkest 1% of ${measured.count} saturated blue pixels: luminance ${measured.luminance.toFixed(3)}, hue ${measured.hue.toFixed(1)}`
            : JSON.stringify(measured)
        }`,
      );
    } finally {
      await context.close();
    }
  }
  return failures ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------
// --sheets: contact sheets of every scene
// ---------------------------------------------------------------------------------------------
const SHEET_SCENES = [
  { scene: "hero", route: "/", times: [3, 8, 16, 30] },
  { scene: "intro", route: "/", times: [0.4, 0.8, 1.5, 2.4, 3.0, 3.5] },
  { scene: "ninety", route: "/", times: [1, 4, 9] },
  { scene: "bloom", route: "/", times: [3, 8, 16] },
  { scene: "wisps", route: "/about", times: [4, 10, 18] },
  { scene: "title", route: "/about", times: [3, 8, 14] },
  { scene: "spill", route: "/nope", times: [2, 4, 9] },
];
const SHEET_VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, ratio: 1 },
  { name: "phone", width: 390, height: 844, ratio: 2 },
];

async function sheets(browser) {
  const out = path.resolve(option("out") ?? path.join(root, ".qa-shots/final"));
  mkdirSync(out, { recursive: true });
  const only = option("only")?.split(",");
  const wanted = (kind, name) =>
    !only || !only.some((entry) => kind.includes(entry)) || only.includes(name);
  for (const view of SHEET_VIEWPORTS.filter((v) => wanted(["desktop", "phone"], v.name))) {
    for (const item of SHEET_SCENES.filter((s) => wanted(Object.keys(STAGES), s.scene))) {
      const entry = {
        route: item.route,
        viewport: [view.width, view.height],
        ratio: view.ratio,
        scene: item.scene,
      };
      const { context, page } = await openLive(browser, entry);
      try {
        if (item.scene === "intro") {
          await page.evaluate(() => document.documentElement.setAttribute("data-intro", "leave"));
        }
        const frames = await page.evaluate(
          async ([scene, times]) => {
            const hook = window.__inkTest;
            if (!hook || !(await hook.hold(scene))) return [];
            const ink = hook.engine();
            const canvas = document.querySelector("canvas[data-ink-canvas]");
            if (!ink || !canvas) return [];
            const frames = [];
            let at = 0;
            for (const time of times) {
              ink.step(Math.round((time - at) * 60));
              at = time;
              ink.render();
              const copy = document.createElement("canvas");
              const scale = Math.min(1, 900 / canvas.width);
              copy.width = Math.round(canvas.width * scale);
              copy.height = Math.round(canvas.height * scale);
              copy.getContext("2d").drawImage(canvas, 0, 0, copy.width, copy.height);
              frames.push({ time, url: copy.toDataURL("image/png") });
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
            return frames;
          },
          [item.scene, item.times],
        );
        if (!frames.length) {
          console.error(`no frames for ${item.scene} at ${view.name}`);
          continue;
        }
        const columns =
          view.name === "phone" ? Math.min(frames.length, 3) : Math.min(frames.length, 2);
        const sheet = await context.newPage();
        await sheet.setViewportSize({ width: 1400, height: 900 });
        await sheet.setContent(
          `<body style="margin:0;background:#ccc;font:14px sans-serif">
            <div style="display:grid;grid-template-columns:repeat(${columns},1fr);gap:12px;padding:12px">
              ${frames
                .map(
                  (frame) =>
                    `<figure style="margin:0"><img src="${frame.url}" style="width:100%;display:block;outline:1px solid #888"><figcaption style="padding:4px 0">${item.scene}, ${frame.time}s, ${view.width}x${view.height}</figcaption></figure>`,
                )
                .join("")}
            </div></body>`,
        );
        await sheet.waitForFunction(() => [...document.images].every((img) => img.complete));
        const file = path.join(out, `sheet-${view.name}-${item.scene}.png`);
        await sheet.screenshot({ path: file, fullPage: true });
        console.log(file);
      } finally {
        await context.close();
      }
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------------------------
async function main() {
  const modes = ["check", "blue", "sheets"].filter(flag);
  if (modes.length > 1) {
    console.error("usage: ink-stills.mjs [--check | --blue | --sheets] [--base=url]");
    return 2;
  }
  const needsGpu = modes.length === 0 || modes[0] !== "check";
  const browser = await chromium.launch({ args: needsGpu ? ARGS : [] });
  try {
    return await withServer(() => {
      if (modes[0] === "check") return check(browser);
      if (modes[0] === "blue") return blue(browser);
      if (modes[0] === "sheets") return sheets(browser);
      return capture(browser);
    });
  } finally {
    await browser.close();
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(2);
  },
);
