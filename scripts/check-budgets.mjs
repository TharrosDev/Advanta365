#!/usr/bin/env node
// Script budgets, measured against a running production server.
//
//   node scripts/check-budgets.mjs <baseUrl> --record   write tests/budgets/baseline.json
//   node scripts/check-budgets.mjs <baseUrl>            compare with it
//
// What is measured:
//   1. The scripts in the server HTML of "/": every <script src> that a modern browser runs
//      (nomodule polyfills are listed but not counted) and every inline script that is code
//      (the streamed page data is not). Each is gzipped at level 9 and the sizes are summed.
//      The sum may grow by at most MAX_GROWTH_BYTES over the recorded baseline.
//   2. The chunks under .next/static that hold a WebGL2 shader (they contain "#version 300 es").
//      Together they may weigh at most MAX_SHADER_BYTES gzipped, and none of them may be among
//      the initial scripts of a page that is checked.
//
// Plain Node, no dependency. Exit code 0 when every budget holds, 1 when one is broken, 2 for a
// usage error.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const KB = 1024;
const MAX_GROWTH_BYTES = 12 * KB;
const MAX_SHADER_BYTES = 40 * KB;
const SHADER_MARKER = "#version 300 es";
const DEFAULT_PAGES = ["/", "/why-advanta", "/catalog"];

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(ROOT, "tests", "budgets", "baseline.json");
const STATIC_DIR = join(ROOT, ".next", "static");

const gzipSize = (data) => gzipSync(data, { level: 9 }).length;
const kb = (bytes) => `${(bytes / KB).toFixed(1)}KB`;

function usage(message) {
  if (message) console.error(message);
  console.error(
    "usage: node scripts/check-budgets.mjs <baseUrl> [--record] [--pages=/,/why-advanta,/catalog]",
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith("--"));
const positional = args.filter((arg) => !arg.startsWith("--"));
const record = flags.includes("--record");
const pagesFlag = flags.find((flag) => flag.startsWith("--pages="));
const unknown = flags.filter((flag) => flag !== "--record" && !flag.startsWith("--pages="));
if (unknown.length > 0) usage(`unknown option: ${unknown.join(" ")}`);
if (positional.length !== 1) usage("a base URL is required");

let base;
try {
  base = new URL(positional[0]);
} catch {
  usage(`not a URL: ${positional[0]}`);
}
const pages = pagesFlag
  ? pagesFlag.slice("--pages=".length).split(",").filter(Boolean)
  : DEFAULT_PAGES;
if (pages[0] !== "/") pages.unshift("/");

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

/** The scripts of a document: external ones with their URLs, inline ones with their code. */
function scriptsOf(html) {
  const found = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1] ?? "";
    const body = match[2] ?? "";
    const src = /\bsrc="([^"]+)"/.exec(attributes)?.[1];
    const type = /\btype="([^"]+)"/.exec(attributes)?.[1] ?? "";
    if (src) {
      found.push({ kind: "src", src, legacy: /\bnoModule\b/i.test(attributes) });
    } else if (type === "" || /javascript|module/.test(type)) {
      // The streamed page data is content that grows with the copy, not a script that is shipped.
      if (/^\s*\(self\.__next_f\s*=/.test(body) || /^\s*self\.__next_f\.push/.test(body)) continue;
      if (body.trim() !== "") found.push({ kind: "inline", code: body });
    }
  }
  return found;
}

/** The path of a script URL under .next/static, or null when it is not a built chunk. */
function chunkPath(src) {
  const path = new URL(src, base).pathname;
  const marker = "/_next/static/";
  const at = path.indexOf(marker);
  return at < 0 ? null : decodeURIComponent(path.slice(at + marker.length));
}

async function measurePage(path) {
  const html = await fetchText(new URL(path, base));
  const list = [];
  for (const script of scriptsOf(html)) {
    if (script.kind === "inline") {
      list.push({ path: "(inline)", gzip: gzipSize(Buffer.from(script.code)), counted: true });
      continue;
    }
    const url = new URL(script.src, base);
    const body = Buffer.from(await (await fetch(url)).arrayBuffer());
    list.push({
      path: url.pathname,
      gzip: gzipSize(body),
      counted: !script.legacy,
      ...(script.legacy ? { legacy: true } : {}),
    });
  }
  return list;
}

/** Every file under .next/static that ends in .js, as paths relative to it. */
function builtScripts() {
  if (!existsSync(STATIC_DIR)) {
    throw new Error(`${relative(ROOT, STATIC_DIR)} is missing: run a production build first`);
  }
  const found = [];
  const visit = (directory) => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) visit(path);
      else if (name.endsWith(".js")) found.push(path);
    }
  };
  visit(STATIC_DIR);
  return found;
}

function shaderChunks() {
  const chunks = [];
  for (const file of builtScripts()) {
    const data = readFileSync(file);
    if (data.includes(SHADER_MARKER)) {
      chunks.push({
        path: relative(STATIC_DIR, file).replaceAll("\\", "/"),
        gzip: gzipSize(data),
      });
    }
  }
  return chunks.sort((a, b) => a.path.localeCompare(b.path));
}

const total = (list) =>
  list.reduce((sum, entry) => sum + (entry.counted === false ? 0 : entry.gzip), 0);

const home = await measurePage("/");
const homeTotal = total(home);
const shaders = shaderChunks();
const shaderTotal = shaders.reduce((sum, chunk) => sum + chunk.gzip, 0);

if (record) {
  const baseline = {
    page: "/",
    gzipTotal: homeTotal,
    scripts: home.map(({ path, gzip, counted, legacy }) => ({
      path,
      gzip,
      ...(counted === false ? { counted: false } : {}),
      ...(legacy ? { legacy: true } : {}),
    })),
    shaderChunks: shaders,
    shaderGzipTotal: shaderTotal,
  };
  mkdirSync(dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    `recorded ${relative(ROOT, BASELINE)}: / loads ${home.length} scripts, ${kb(homeTotal)} gzip; ` +
      `${shaders.length} shader chunk(s), ${kb(shaderTotal)} gzip`,
  );
  process.exit(0);
}

if (!existsSync(BASELINE)) usage(`${relative(ROOT, BASELINE)} is missing: run with --record first`);
const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));

const problems = [];
const grown = homeTotal - baseline.gzipTotal;
console.log(
  `scripts in the HTML of /: ${kb(homeTotal)} gzip (baseline ${kb(baseline.gzipTotal)}, ` +
    `${grown >= 0 ? "+" : "-"}${kb(Math.abs(grown))}, allowed +${kb(MAX_GROWTH_BYTES)})`,
);
if (grown > MAX_GROWTH_BYTES) {
  problems.push(`the scripts of / grew by ${kb(grown)}, more than ${kb(MAX_GROWTH_BYTES)}`);
}

console.log(
  shaders.length === 0
    ? "shader chunks: none"
    : `shader chunks: ${shaders.length}, ${kb(shaderTotal)} gzip (at most ${kb(MAX_SHADER_BYTES)})`,
);
for (const chunk of shaders) console.log(`  ${chunk.path}  ${kb(chunk.gzip)}`);
if (shaderTotal > MAX_SHADER_BYTES) {
  problems.push(`the shader chunks weigh ${kb(shaderTotal)}, more than ${kb(MAX_SHADER_BYTES)}`);
}

const shaderPaths = new Set(shaders.map((chunk) => chunk.path));
for (const path of pages) {
  const list = path === "/" ? home : await measurePage(path);
  const initial = list.map((entry) => (entry.path === "(inline)" ? null : chunkPath(entry.path)));
  const inside = initial.filter((chunk) => chunk !== null && shaderPaths.has(chunk));
  console.log(
    `initial scripts of ${path}: ${list.length}, shader chunks among them: ${inside.length}`,
  );
  for (const chunk of inside) problems.push(`${path} loads the shader chunk ${chunk} up front`);
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`over budget: ${problem}`);
  process.exit(1);
}
console.log("budgets hold");
