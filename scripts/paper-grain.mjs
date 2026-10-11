// Writes public/paper/grain.png: the tooth of the paper, as a 128px tile that repeats.
//
//   node scripts/paper-grain.mjs
//
// The tile is an indexed PNG with a palette of four entries, all of them the ink at a different
// alpha (0, 0.03, 0.06 and 0.09), two bits a pixel. The grain comes from a seeded generator, so
// the file is the same every time it is written. Most pixels are clear and the darker a speck is
// the rarer it is: that is what paper looks like, and it keeps the file under its budget of 4KB.
// Plain Node, no dependency.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const SIZE = 128;
const SEED = 365;
const BUDGET = 4096;
const INK = [11, 13, 18];
const ALPHAS = [0, 0.03, 0.06, 0.09];
/** The share of pixels at each palette entry. */
const SHARES = [0.8, 0.13, 0.05, 0.02];

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/paper/grain.png");

/** A small seeded generator (mulberry32): the same numbers on every run. */
function generator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, check]);
}

function entryFor(value) {
  let edge = 0;
  for (let index = 0; index < SHARES.length; index += 1) {
    edge += SHARES[index];
    if (value < edge) return index;
  }
  return 0;
}

const random = generator(SEED);
const stride = 1 + SIZE / 4; // one filter byte, then four pixels to a byte
const raw = Buffer.alloc(stride * SIZE);
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    const at = y * stride + 1 + (x >> 2);
    raw[at] |= entryFor(random()) << (6 - (x & 3) * 2);
  }
}

const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header[8] = 2; // bit depth
header[9] = 3; // indexed colour
const palette = Buffer.from(ALPHAS.flatMap(() => INK));
const alphas = Buffer.from(ALPHAS.map((alpha) => Math.round(alpha * 255)));

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", header),
  chunk("PLTE", palette),
  chunk("tRNS", alphas),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

if (png.length > BUDGET) {
  console.error(`grain.png would be ${png.length} bytes, over its budget of ${BUDGET}`);
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`${OUT}: ${SIZE}x${SIZE}, ${png.length} bytes`);
