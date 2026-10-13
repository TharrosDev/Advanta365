/**
 * The launch video's sound, synthesized sample by sample from the timeline: keystrokes, a hum
 * while the reply streams, two dull thuds for the verdict, a swell under the ink, a paper drop per
 * document, a tick per counter, highlighter swishes, a rising tone for the 90 percent and a chime
 * for the end card. No samples, no music. Run alone to write video/out/sound.wav.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DURATION,
  PROMPT,
  keystrokeTimes,
  REPLY,
  SCENES,
  DOCUMENTS,
  INSIDE,
  NINETY,
  END,
} from "./timeline.mjs";

const RATE = 48000;
const TAU = Math.PI * 2;

/** A seeded random source, so every render makes the same sound. */
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function synthesize() {
  const n = Math.ceil(DURATION * RATE);
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  const rnd = random(365);

  /** Adds a sound made by `fn(seconds since start)` from `at` for `dur`, panned -1 (left) to 1. */
  function add(at, dur, fn, pan = 0) {
    const i0 = Math.max(0, Math.round(at * RATE));
    const i1 = Math.min(n, Math.round((at + dur) * RATE));
    const gl = Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = i0; i < i1; i++) {
      const v = fn((i - i0) / RATE);
      left[i] += v * gl;
      right[i] += v * gr;
    }
  }

  /** Noise through a one-pole lowpass; `hp` subtracts a slower lowpass to take out the rumble. */
  function noise(cut, hp = 0) {
    let lo = 0;
    let lo2 = 0;
    const a = 1 - Math.exp((-TAU * cut) / RATE);
    const b = hp ? 1 - Math.exp((-TAU * hp) / RATE) : 0;
    return () => {
      lo += a * (rnd() * 2 - 1 - lo);
      lo2 += b * (lo - lo2);
      return lo - lo2;
    };
  }

  // Keystrokes: a short bright click and a little body, each slightly different.
  for (const k of keystrokeTimes()) {
    const nz = noise(6000, 900);
    const pitch = 1800 + rnd() * 700;
    const gain = 0.5 + rnd() * 0.15;
    add(
      k - 0.004,
      0.06,
      (s) =>
        gain *
        (nz() * Math.exp(-s / 0.007) + 0.5 * Math.sin(TAU * pitch * s) * Math.exp(-s / 0.004)),
      (rnd() - 0.5) * 0.3,
    );
  }
  // The send key: heavier, with a low thump.
  {
    const nz = noise(4000, 400);
    add(
      PROMPT.send,
      0.18,
      (s) =>
        0.35 * nz() * Math.exp(-s / 0.012) + 0.4 * Math.sin(TAU * 140 * s) * Math.exp(-s / 0.05),
    );
  }

  // The reply's hum: soft, faintly busy, and it stops dead when the reply ends.
  {
    const start = REPLY.streamStart - 0.2;
    const dur = REPLY.streamEnd - start;
    add(start, dur, (s) => {
      const env = Math.min(1, s / 0.4) * Math.min(1, (dur - s) / 0.02);
      const trem = 0.75 + 0.25 * Math.sin(TAU * 7 * s);
      return (
        0.07 *
        env *
        trem *
        (Math.sin(TAU * 196 * s) + 0.5 * Math.sin(TAU * 294 * s) + 0.25 * Math.sin(TAU * 392 * s))
      );
    });
  }

  // The verdict: two dull thuds, the second lower.
  for (const [at, f] of [
    [REPLY.plausible, 90],
    [REPLY.unproven, 70],
  ]) {
    const nz = noise(500);
    add(
      at,
      0.5,
      (s) => 0.4 * Math.exp(-s / 0.11) * (Math.sin(TAU * f * s * (1 - 0.25 * s)) + 0.4 * nz()),
    );
  }

  // Highlighter swishes: band-limited noise that rises and falls.
  const swish = (at, dur = 0.45) => {
    const nz = noise(3500, 1200);
    add(at, dur, (s) => 0.22 * Math.sin((Math.PI * s) / dur) ** 2 * nz());
  };
  swish(REPLY.unproven + 0.35);
  swish(DOCUMENTS.note + 0.4);
  swish(END.cta + 0.4);

  // The swell under the ink: noise opening up over a low tone, peaking with the tagline.
  {
    const start = SCENES.ink.start - 0.3;
    const peak = 1.6;
    const dur = 4.6;
    let lo = 0;
    add(start, dur, (s) => {
      const env = s < peak ? (s / peak) ** 2 : Math.exp(-(s - peak) / 0.9);
      const cut = 200 + 2400 * env;
      const a = 1 - Math.exp((-TAU * cut) / RATE);
      lo += a * (rnd() * 2 - 1 - lo);
      return env * (0.32 * lo + 0.22 * Math.sin(TAU * 55 * s) + 0.1 * Math.sin(TAU * 82.5 * s));
    });
  }

  // Paper drops, panned across as the documents land left to right.
  DOCUMENTS.items.forEach((_, i) => {
    const land = DOCUMENTS.first + i * DOCUMENTS.step + 0.3;
    const nz = noise(2200, 150);
    const pan = -0.6 + (1.2 * i) / (DOCUMENTS.items.length - 1);
    add(
      land,
      0.35,
      (s) =>
        0.5 * (nz() * Math.exp(-s / 0.045) + 0.5 * Math.sin(TAU * 95 * s) * Math.exp(-s / 0.06)),
      pan,
    );
  });

  // A woody tick as each counter lands.
  INSIDE.items.forEach((_, i) => {
    const at = INSIDE.first + i * INSIDE.step + INSIDE.count * 0.85;
    const pan = -0.5 + (1.0 * i) / (INSIDE.items.length - 1);
    add(
      at,
      0.15,
      (s) =>
        0.32 * Math.exp(-s / 0.025) * (Math.sin(TAU * 1250 * s) + 0.5 * Math.sin(TAU * 2600 * s)),
      pan,
    );
  });

  // The rising tone for the bar, then a bright ping for the last 10 percent.
  {
    const dur = NINETY.fillEnd - NINETY.fillStart + 0.15;
    let phase = 0;
    add(NINETY.fillStart, dur, (s) => {
      const x = s / dur;
      const f = 196 * 2 ** (x * 1.1);
      phase += (TAU * f) / RATE;
      const env = Math.min(1, s / 0.3) * Math.min(1, (dur - s) / 0.08);
      return (
        0.08 * env * (Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.15 * Math.sin(3 * phase))
      );
    });
    add(
      NINETY.rest,
      1.4,
      (s) =>
        0.22 * Math.exp(-s / 0.35) * (Math.sin(TAU * 880 * s) + 0.5 * Math.sin(TAU * 1320 * s)),
    );
  }

  // The chime: a soft bell chord, struck as the mark finishes.
  {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const at = END.markEnd - 0.1 + i * 0.05;
      const dur = DURATION - at;
      add(
        at,
        dur,
        (s) => {
          const env =
            Math.exp(-s / (1.6 - i * 0.2)) * Math.min(1, s / 0.004) * Math.min(1, (dur - s) / 0.3);
          return (
            0.1 *
            env *
            (Math.sin(TAU * f * s) +
              0.3 * Math.sin(TAU * f * 2.01 * s) +
              0.1 * Math.sin(TAU * f * 3.98 * s))
          );
        },
        (i - 1.5) * 0.25,
      );
    });
  }

  // Normalize to a peak of -2 dBFS, which leaves the AAC encoder room for its overshoot.
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const g = peak > 0 ? 10 ** (-2 / 20) / peak : 1;
  for (let i = 0; i < n; i++) {
    left[i] *= g;
    right[i] *= g;
  }
  return { left, right };
}

function wav({ left, right }) {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
  }
  return buf;
}

export async function writeSound(path) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, wav(synthesize()));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = join(dirname(fileURLToPath(import.meta.url)), "out", "sound.wav");
  await writeSound(path);
  console.log(`wrote ${path}`);
}
