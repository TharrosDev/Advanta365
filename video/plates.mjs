/**
 * Renders the ink plates: stretches of the site's real fluid engine, frame by frame, to
 * video/out/plates/<name>/0000.jpg and on. A plate is rendered once and kept; it is rendered again
 * only when its timing, its definition in `plate-defs.mjs` or the engine changes.
 *
 *   node video/plates.mjs                  every plate that is out of date
 *   node video/plates.mjs --only flood     one plate
 *   node video/plates.mjs --force          every plate, whether or not it is out of date
 *
 * The engine needs WebGL2. Headless Chromium has it through SwiftShader on the CPU, at about three
 * seconds a frame at 1920 by 1080, so the four plates take about half an hour.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { serve, root } from "./serve.mjs";
import { PLATES, PLATE_FPS, WIDTH, HEIGHT } from "./timeline.mjs";
import { plateSource } from "./plate-defs.mjs";

export const platesDir = join(root, "video", "out", "plates");

/** The number of frames a plate holds, its first frame at its start. */
export const plateFrames = (p) => Math.round((p.end - p.start) * PLATE_FPS) + 1;

async function engineSource() {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (path.endsWith(".ts")) files.push(path);
    }
  };
  await walk(join(root, "lib", "ink"));
  files.sort();
  return Promise.all(files.map((f) => readFile(f, "utf8"))).then((all) => all.join("\n"));
}

async function plateHash(name, engine) {
  return createHash("sha256")
    .update(JSON.stringify({ name, plate: PLATES[name], fps: PLATE_FPS }))
    .update(plateSource(name))
    .update(engine)
    .digest("hex")
    .slice(0, 16);
}

async function renderPlate(browser, base, name) {
  const dir = join(platesDir, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  page.on("pageerror", (e) => console.error(`${name}: page error:`, e.message));
  await page.goto(`${base}/video/plates.html?plate=${name}`);
  const tier = await page.evaluate(() => window.plateReady);
  if (tier !== "high") throw new Error(`${name}: the engine ran at "${tier}", not "high"`);
  const frames = plateFrames(PLATES[name]);
  // A plate that starts part way through its scene is stepped there in short runs first.
  const preroll = await page.evaluate(() => window.platePreroll);
  for (let t = -preroll; t < 0; t += 0.25) await page.evaluate((s) => window.plateTo(s), t);
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.plateTo(t), i / PLATE_FPS);
    const jpg = await page.screenshot({ type: "jpeg", quality: 92, timeout: 600000 });
    await writeFile(join(dir, `${String(i).padStart(4, "0")}.jpg`), jpg);
    if (i % 15 === 0) {
      const per = (Date.now() - started) / (i + 1) / 1000;
      console.log(`${name}: ${i}/${frames} (${per.toFixed(1)} s a frame)`);
    }
  }
  await page.close();
}

export async function renderPlates({ only = null, force = false } = {}) {
  const engine = await engineSource();
  const todo = [];
  for (const name of Object.keys(PLATES)) {
    if (only && !only.includes(name)) continue;
    const hash = await plateHash(name, engine);
    const stamp = join(platesDir, name, "hash.txt");
    const have = await readFile(stamp, "utf8").catch(() => "");
    if (force || have !== hash) todo.push({ name, hash, stamp });
  }
  if (!todo.length) return console.log("plates: all up to date");

  const server = await serve();
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
  });
  try {
    // One at a time: SwiftShader already spreads a page over every core.
    for (const { name, hash, stamp } of todo) {
      await renderPlate(browser, server.base, name);
      await writeFile(stamp, hash);
      console.log(`${name}: done`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const onlyArg = process.argv.indexOf("--only");
  await renderPlates({
    only: onlyArg > 0 ? process.argv[onlyArg + 1].split(",") : null,
    force: process.argv.includes("--force"),
  });
}
