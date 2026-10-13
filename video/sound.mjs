/**
 * The launch video's sound, synthesized sample by sample from the timeline: a music bed at 96
 * beats a minute (pad, bass, plucked arpeggio, kick, hats, a build) and the sound effects (keys,
 * slams, the ink, whooshes, ticks, bells). No samples. Run alone to write video/out/sound.wav;
 * `render.mjs` then normalizes its loudness.
 *
 * Sections follow the picture: a quiet pad under the blank prompt, tension under the reply, a boom
 * for the ink, the groove from "what it is" through the rollout, a build into the counters at 0:30,
 * a breakdown on the binder and a resolve on the end card.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as T from "./timeline.mjs";

const {
  at,
  BEAT,
  BAR,
  DURATION,
  PROMPT,
  REPLY,
  TAGLINE,
  WHAT,
  ROLLOUT,
  FOLDER,
  SCALE,
  WIPE,
  NINETY,
  WHO,
  END,
  SCENES,
} = T;

const RATE = 48000;
const TAU = Math.PI * 2;
const N = Math.ceil(DURATION * RATE);

/** A seeded random source, so every render makes the same sound. */
function random(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}
const rnd = random(96);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** A stereo buffer with a helper that adds a sound made by `fn(seconds since start)`. */
function bus() {
  const l = new Float32Array(N);
  const r = new Float32Array(N);
  const add = (start, dur, fn, pan = 0, gain = 1) => {
    const i0 = Math.max(0, Math.round(start * RATE));
    const i1 = Math.min(N, Math.round((start + dur) * RATE));
    const gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
    const gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
    for (let i = i0; i < i1; i++) {
      const v = fn((i - i0) / RATE);
      l[i] += v * gl;
      r[i] += v * gr;
    }
  };
  return { l, r, add };
}

/** White noise through a one-pole lowpass at `lo`, minus a slower one at `hi` (0 for none). */
function noise(lo, hi = 0) {
  let a = 0;
  let b = 0;
  const ka = 1 - Math.exp((-TAU * lo) / RATE);
  const kb = hi ? 1 - Math.exp((-TAU * hi) / RATE) : 0;
  return () => {
    a += ka * (rnd() * 2 - 1 - a);
    b += kb * (a - b);
    return a - b;
  };
}

// The harmony: one chord a bar.
const VOICING = {
  D: { root: 38, notes: [50, 57, 62, 66, 69] },
  A: { root: 33, notes: [52, 57, 61, 64, 69] },
  Bm: { root: 35, notes: [50, 54, 59, 62, 66] },
  G: { root: 31, notes: [50, 55, 59, 62, 67] },
};
const PROGRESSION = [
  "D",
  "D",
  "Bm",
  "G",
  "Bm",
  "G",
  "D",
  "A",
  "D",
  "A",
  "Bm",
  "G",
  "D",
  "A",
  "Bm",
  "A",
  "D",
  "D",
];

/** How bright the pad is over time: a lowpass cutoff in Hz. */
function padCutoff(t) {
  const keys = [
    [0, 500],
    [at(2), 900],
    [at(4), 400],
    [at(5), 1400],
    [at(7), 2200],
    [at(11), 3200],
    [at(12), 2600],
    [at(14), 600],
    [at(15), 1400],
    [at(16), 2600],
    [DURATION, 1800],
  ];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, c0] = keys[i - 1];
      const [t1, c1] = keys[i];
      return c0 + ((c1 - c0) * (t - t0)) / (t1 - t0);
    }
  }
  return keys[keys.length - 1][1];
}

/** The kick's times, which also duck the music bed. */
function kickTimes() {
  const times = [];
  const beats = (fromBar, toBar, every = 1) => {
    for (let b = fromBar * 4; b < toBar * 4; b += every) times.push(b * BEAT);
  };
  beats(6, 7, 2);
  beats(7, 11);
  beats(11, 11.75);
  beats(12, 14);
  beats(15, 16, 2);
  times.push(at(16));
  return times;
}

function music() {
  const m = bus();
  const kicks = kickTimes();

  // Pad: five additive voices a chord, each two slightly detuned oscillators, with a lowpass
  // rolloff of the harmonics that follows the cutoff curve.
  for (let bar = 0; bar < PROGRESSION.length; bar++) {
    const chord = VOICING[PROGRESSION[bar]];
    const start = bar * BAR;
    const dur = Math.min(BAR + 0.6, DURATION - start);
    chord.notes.forEach((note, v) => {
      for (const detune of [-0.006, 0.006]) {
        const f = hz(note) * (1 + detune);
        const H = Math.min(14, Math.floor(9000 / f));
        const phases = Array.from({ length: H }, () => rnd() * TAU);
        const weights = new Float64Array(H);
        let block = -1;
        m.add(
          start,
          dur,
          (s) => {
            const b = Math.floor(s * RATE) >> 8;
            if (b !== block) {
              block = b;
              const cut = padCutoff(start + s);
              for (let h = 0; h < H; h++)
                weights[h] = 1 / (h + 1) / (1 + ((f * (h + 1)) / cut) ** 4);
            }
            let sum = 0;
            for (let h = 0; h < H; h++)
              sum += weights[h] * Math.sin(TAU * f * (h + 1) * s + phases[h]);
            const env = Math.min(1, s / 0.35) * Math.min(1, (dur - s) / 0.6);
            return 0.03 * env * sum;
          },
          (v - 2) * 0.35 + detune * 30,
        );
      }
    });
  }

  // Bass: long notes early, eighths once the groove starts.
  for (let bar = 2; bar < PROGRESSION.length; bar++) {
    const f = hz(VOICING[PROGRESSION[bar]].root);
    const groove = (bar >= 7 && bar < 14) || bar === 15;
    if (bar === 4 || bar === 14) {
      m.add(
        bar * BAR,
        BAR,
        (s) =>
          0.22 *
          Math.min(1, s / 0.05) *
          Math.exp(-s / 2.5) *
          (Math.sin(TAU * f * s) + 0.25 * Math.sin(TAU * 2 * f * s)),
      );
      continue;
    }
    const notes = groove ? 8 : 2;
    const len = BAR / notes;
    for (let k = 0; k < notes; k++) {
      m.add(bar * BAR + k * len, len, (s) => {
        const env =
          Math.min(1, s / 0.008) *
          Math.exp(-s / (groove ? 0.16 : 0.9)) *
          Math.min(1, (len - s) / 0.01);
        return (
          0.26 *
          env *
          (Math.sin(TAU * f * s) +
            0.35 * Math.sin(TAU * 2 * f * s) +
            0.1 * Math.sin(TAU * 3 * f * s))
        );
      });
    }
  }

  // Plucked arpeggio in eighths: chord tones, an octave up.
  const PATTERN = [0, 2, 1, 3, 2, 4, 3, 1];
  for (let bar = 2; bar < PROGRESSION.length - 1; bar++) {
    if (bar === 4 || bar === 5 || bar === 14) continue;
    const chord = VOICING[PROGRESSION[bar]];
    const gain = bar < 4 ? 0.045 : 0.07;
    PATTERN.forEach((n, k) => {
      const f = hz(chord.notes[n] + 12);
      m.add(
        bar * BAR + k * (BEAT / 2),
        0.6,
        (s) => {
          const env = Math.min(1, s / 0.003) * Math.exp(-s / 0.18);
          return (
            gain *
            env *
            (Math.sin(TAU * f * s) +
              0.3 * Math.sin(TAU * 3 * f * s) * Math.exp(-s / 0.05) +
              0.12 * Math.sin(TAU * 5 * f * s) * Math.exp(-s / 0.03))
          );
        },
        k % 2 ? 0.35 : -0.35,
      );
    });
  }

  // The kick ducks everything else in the bed, then lands on top of it.
  const duck = new Float32Array(N).fill(1);
  for (const k of kicks) {
    const i0 = Math.round(k * RATE);
    for (let i = i0; i < Math.min(N, i0 + RATE * 0.4); i++)
      duck[i] = Math.min(duck[i], 1 - 0.55 * Math.exp(-(i - i0) / RATE / 0.11));
  }
  for (let i = 0; i < N; i++) {
    m.l[i] *= duck[i];
    m.r[i] *= duck[i];
  }
  for (const k of kicks) {
    const click = noise(5000, 1500);
    let phase = 0;
    m.add(k, 0.45, (s) => {
      phase += (TAU * (48 + 110 * Math.exp(-s / 0.035))) / RATE;
      return 0.75 * Math.exp(-s / 0.2) * Math.sin(phase) + 0.12 * click() * Math.exp(-s / 0.004);
    });
  }

  // Hats on the offbeats in the groove, sixteenths in the drop.
  const hat = (start, gain) => {
    const n = noise(12000, 6000);
    m.add(start, 0.08, (s) => gain * n() * Math.exp(-s / 0.022), (rnd() - 0.5) * 0.4);
  };
  for (let b = at(7); b < at(14) - 1e-6; b += BEAT) {
    if (b >= at(11) && b < at(12)) continue;
    hat(b + BEAT / 2, 0.22);
    if (b >= at(12)) {
      hat(b + BEAT / 4, 0.1);
      hat(b + (3 * BEAT) / 4, 0.1);
    }
  }
  for (let b = at(15); b < at(16) - 1e-6; b += BEAT) hat(b + BEAT / 2, 0.14);

  // The build into the drop: a snare roll that quickens over a noise riser.
  for (let s = at(11, 2), k = 0; s < at(12) - 0.02; k++) {
    const n = noise(5000, 900);
    const g = 0.06 + 0.22 * ((s - at(11, 2)) / (2 * BEAT));
    m.add(s, 0.12, (x) => g * n() * Math.exp(-x / 0.05), 0.1);
    s += k < 2 ? BEAT / 2 : k < 6 ? BEAT / 4 : BEAT / 8;
  }
  {
    const n = noise(3000, 600);
    m.add(at(11), BAR, (s) => 0.18 * (s / BAR) ** 2 * n());
  }
  return m;
}

function effects() {
  const e = bus();

  // Keystrokes: a short bright click and a little body, each slightly different.
  for (const k of T.keystrokeTimes()) {
    const n = noise(6000, 900);
    const pitch = 1800 + rnd() * 700;
    const g = 0.5 + rnd() * 0.15;
    e.add(
      k - 0.004,
      0.06,
      (s) =>
        g * (n() * Math.exp(-s / 0.007) + 0.5 * Math.sin(TAU * pitch * s) * Math.exp(-s / 0.004)),
      (rnd() - 0.5) * 0.4,
    );
  }
  {
    const n = noise(4000, 400);
    e.add(
      PROMPT.send,
      0.25,
      (s) => 0.5 * n() * Math.exp(-s / 0.014) + 0.5 * Math.sin(TAU * 140 * s) * Math.exp(-s / 0.06),
    );
  }
  // The giant cursor: a soft tick on each beat before typing starts.
  for (let b = 0; b < PROMPT.typeStart - 0.05; b += BEAT) {
    e.add(b, 0.05, (s) => 0.12 * Math.sin(TAU * 2400 * s) * Math.exp(-s / 0.008));
  }
  // The reply: a light tick as each line arrives.
  for (let i = 0; i <= REPLY.lines.length; i++) {
    const t0 =
      REPLY.streamStart + ((REPLY.streamEnd - REPLY.streamStart) * i) / (REPLY.lines.length + 1);
    e.add(
      t0,
      0.05,
      (s) => 0.14 * Math.sin(TAU * (1500 + i * 40) * s) * Math.exp(-s / 0.01),
      i % 2 ? 0.3 : -0.3,
    );
  }

  // Slams: a low hit with a burst of air.
  const slam = (t0, f, gain = 0.8) => {
    const n = noise(2500, 120);
    e.add(
      t0,
      0.9,
      (s) =>
        gain *
        (Math.sin(TAU * f * s * (1 - 0.3 * s)) * Math.exp(-s / 0.18) +
          0.5 * n() * Math.exp(-s / 0.05)),
    );
  };
  slam(REPLY.plausible, 70);
  slam(REPLY.unproven, 58);

  // The ink: a deep boom on the downbeat, after a short dark breath in.
  {
    const n = noise(400);
    e.add(
      SCENES.ink.start,
      3,
      (s) => 0.9 * Math.sin(TAU * 38 * s) * Math.exp(-s / 0.9) + 0.4 * n() * Math.exp(-s / 0.6),
    );
    let lo = 0;
    e.add(SCENES.ink.start - 0.6, 0.6, (s) => {
      lo += 0.05 * (rnd() * 2 - 1 - lo);
      return 0.5 * (s / 0.6) ** 3 * lo;
    });
  }

  // Whooshes: band-limited noise that swells and falls.
  const whoosh = (t0, dur, gain = 0.35, cut = 2500) => {
    let lo = 0;
    let lo2 = 0;
    e.add(t0, dur, (s) => {
      const x = s / dur;
      const k = 1 - Math.exp((-TAU * cut * (0.4 + x)) / RATE);
      lo += k * (rnd() * 2 - 1 - lo);
      lo2 += 0.02 * (lo - lo2);
      return gain * Math.sin(Math.PI * x) ** 2 * (lo - lo2);
    });
  };
  whoosh(SCENES.what.start - 0.45, 0.6);
  whoosh(SCENES.rollout.start - 0.4, 0.6);

  // The documents rise, one on each dotted quarter: a soft whoosh and a paper landing.
  ROLLOUT.items.forEach((_, i) => {
    const t0 = ROLLOUT.first + i * ROLLOUT.step;
    whoosh(t0 - 0.12, 0.45, 0.22, 3500);
    const n = noise(2200, 150);
    e.add(
      t0 + 0.3,
      0.3,
      (s) =>
        0.35 * (n() * Math.exp(-s / 0.04) + 0.5 * Math.sin(TAU * 110 * s) * Math.exp(-s / 0.06)),
      -0.5 + i / 6,
    );
  });
  // The folder gathers them and closes.
  whoosh(FOLDER.gather - 0.1, 0.9, 0.3, 2000);
  slam(FOLDER.close + 0.45, 80, 0.6);

  // The counters: a hit on each, and a short tick as the number lands.
  SCALE.items.forEach((_, i) => {
    const t0 = SCALE.first + i * SCALE.step;
    const n = noise(3000, 300);
    e.add(t0, 0.3, (s) => 0.35 * n() * Math.exp(-s / 0.03), -0.6 + i * 0.3);
    e.add(
      t0 + SCALE.count,
      0.12,
      (s) =>
        0.25 * Math.exp(-s / 0.02) * (Math.sin(TAU * 1250 * s) + 0.5 * Math.sin(TAU * 2600 * s)),
      -0.6 + i * 0.3,
    );
  });

  // The wipe: a rising rumble that cuts dead on the binder.
  {
    let lo = 0;
    const dur = WIPE.black - WIPE.start + 0.2;
    e.add(WIPE.start - 0.2, dur, (s) => {
      const x = s / dur;
      lo += (0.02 + 0.2 * x) * (rnd() * 2 - 1 - lo);
      return 0.7 * x ** 2 * lo * Math.min(1, (dur - s) / 0.01);
    });
    slam(WIPE.black, 42, 0.7);
  }

  // The bar fills on a rising tone; a bright ping for the last tenth.
  {
    const dur = NINETY.fillEnd - NINETY.fillStart + 0.1;
    let phase = 0;
    e.add(NINETY.fillStart, dur, (s) => {
      phase += (TAU * 196 * 2 ** ((s / dur) * 1.1)) / RATE;
      const env = Math.min(1, s / 0.3) * Math.min(1, (dur - s) / 0.06);
      return (
        0.12 * env * (Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.15 * Math.sin(3 * phase))
      );
    });
    e.add(
      NINETY.rest,
      1.6,
      (s) =>
        0.3 * Math.exp(-s / 0.4) * (Math.sin(TAU * hz(81) * s) + 0.5 * Math.sin(TAU * hz(88) * s)),
      0.5,
    );
  }
  // Who it is for: a woody tick on each role.
  WHO.roles.forEach((_, i) => {
    e.add(
      WHO.first + i * WHO.step,
      0.15,
      (s) =>
        0.3 * Math.exp(-s / 0.025) * (Math.sin(TAU * 1050 * s) + 0.5 * Math.sin(TAU * 2300 * s)),
      -0.3 + i * 0.2,
    );
  });
  // The apps land with a soft pop each.
  WHAT.apps.forEach((_, i) => {
    e.add(
      WHAT.appsStart + i * WHAT.appStep,
      0.1,
      (s) => 0.18 * Math.exp(-s / 0.03) * Math.sin(TAU * (700 + i * 90) * s),
      -0.5 + i * 0.25,
    );
  });

  // Bells: "Introducing", the cut to the end card, and the chord as the mark finishes.
  const bell = (t0, notes, gain, decay) =>
    notes.forEach((midi, i) => {
      const f = hz(midi);
      const start = t0 + i * 0.04;
      const dur = Math.min(DURATION - start, decay * 4);
      e.add(
        start,
        dur,
        (s) => {
          const env = Math.min(1, s / 0.003) * Math.exp(-s / decay) * Math.min(1, (dur - s) / 0.3);
          return (
            gain *
            env *
            (Math.sin(TAU * f * s) +
              0.3 * Math.sin(TAU * f * 2.01 * s) +
              0.1 * Math.sin(TAU * f * 3.98 * s))
          );
        },
        (i - (notes.length - 1) / 2) * 0.3,
      );
    });
  bell(TAGLINE.introducing, [74, 78, 81], 0.1, 1.2);
  bell(SCENES.end.start, [62, 69], 0.1, 2.2);
  bell(END.markEnd - 0.1, [74, 78, 81, 86], 0.12, 1.8);
  return e;
}

/** A small stereo room: four combs and two allpasses a side (Schroeder), added in place. */
function reverb(l, r, wet) {
  const room = (input, spread) => {
    const y = new Float32Array(N);
    for (const d of [1557, 1617, 1491, 1422]) {
      const len = Math.round(((d + spread) * RATE) / 44100);
      const buf = new Float32Array(len);
      let idx = 0;
      let damp = 0;
      for (let i = 0; i < N; i++) {
        const o = buf[idx];
        damp = o * 0.6 + damp * 0.4;
        buf[idx] = input[i] + damp * 0.82;
        idx = (idx + 1) % len;
        y[i] += o * 0.25;
      }
    }
    for (const d of [225, 556]) {
      const len = Math.round(((d + spread) * RATE) / 44100);
      const buf = new Float32Array(len);
      let idx = 0;
      for (let i = 0; i < N; i++) {
        const b = buf[idx];
        const v = y[i];
        buf[idx] = v + b * 0.5;
        y[i] = b - v * 0.5;
        idx = (idx + 1) % len;
      }
    }
    return y;
  };
  const yl = room(l, 0);
  const yr = room(r, 23);
  for (let i = 0; i < N; i++) {
    l[i] += yl[i] * wet;
    r[i] += yr[i] * wet;
  }
}

export function synthesize() {
  const m = music();
  const e = effects();
  reverb(m.l, m.r, 0.35);
  reverb(e.l, e.r, 0.18);
  const left = new Float32Array(N);
  const right = new Float32Array(N);
  // The music fades in under the cursor and out at the very end; a soft clip keeps peaks round.
  for (let i = 0; i < N; i++) {
    const t = i / RATE;
    const g = Math.min(1, t / 1.2) * Math.min(1, (DURATION - t) / 0.4);
    left[i] = Math.tanh((m.l[i] * 0.9 + e.l[i]) * g * 1.1);
    right[i] = Math.tanh((m.r[i] * 0.9 + e.r[i]) * g * 1.1);
  }
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const k = peak > 0 ? 10 ** (-3 / 20) / peak : 1;
  for (let i = 0; i < N; i++) {
    left[i] *= k;
    right[i] *= k;
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
