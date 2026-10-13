/**
 * The launch video's timeline and every fact it puts on screen. The picture (`launch.html`), the
 * ink plates (`plates.mjs`) and the sound (`sound.mjs`) all read this module, so a change to a time
 * here moves all three.
 *
 * The video is cut to music at 96 beats a minute: a beat is 0.625 s, a bar of four beats 2.5 s, and
 * the 45 seconds are exactly 18 bars. Scene times are written in bars and beats with `at`.
 *
 * Facts mirror `lib/site.ts`, `content/templates/` and `PRODUCT.md`. They are copied, not imported,
 * because this module is loaded by a plain browser page and by Node without a TypeScript step.
 */

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BPM = 96;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const BARS = 18;
export const DURATION = BAR * BARS;

/** Seconds at a bar and beat (both counted from 0). */
export const at = (bar, beat = 0) => bar * BAR + beat * BEAT;

/** Where each scene starts and ends, in seconds. */
export const SCENES = {
  hook: { start: 0, end: at(1) },
  typing: { start: at(1), end: at(2) },
  reply: { start: at(2), end: at(3) },
  verdict: { start: at(3), end: at(4) },
  ink: { start: at(4), end: at(5) },
  turn: { start: at(5), end: at(7) },
  what: { start: at(7), end: at(8) },
  rollout: { start: at(8), end: at(11) },
  folder: { start: at(11), end: at(12) },
  scale: { start: at(12), end: at(14) },
  ninety: { start: at(14), end: at(15) },
  who: { start: at(15), end: at(16) },
  end: { start: at(16), end: DURATION },
};

export const PROMPT = {
  placeholder: "Ask anything",
  text: "Write a change management plan for our SharePoint rollout.",
  typeStart: at(1, 0.1),
  typeEnd: at(1, 3.3),
  send: at(1, 3.75),
};

/** The time each character of the prompt appears: an even pace, with a pause after each word. */
export function keystrokeTimes() {
  const { text, typeStart, typeEnd } = PROMPT;
  const weights = [...text].map((c, i) => (i > 0 && text[i - 1] === " " ? 2.2 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const times = [];
  let acc = 0;
  for (const w of weights) {
    acc += w;
    times.push(typeStart + ((typeEnd - typeStart) * acc) / total);
  }
  return times;
}

/** The generic reply: plausible, and true of any rollout. */
export const REPLY = {
  intro: "Here is a change management plan for your SharePoint rollout:",
  lines: [
    "Communicate early and often.",
    "Engage key stakeholders.",
    "Identify change champions.",
    "Provide training to users.",
    "Address resistance to change.",
    "Ensure leadership buy-in.",
    "Monitor adoption and adjust.",
    "Gather feedback regularly.",
    "Celebrate quick wins.",
    "Sustain the change.",
  ],
  streamStart: at(2, 0.2),
  streamEnd: at(2, 3.6),
  plausible: at(3),
  unproven: at(3, 2),
};

export const TAGLINE = {
  lines: ["Don’t start from", "a blank prompt."],
  times: [at(5), at(5, 0.5)],
  introducing: at(6),
};

export const WHAT = {
  line1: "The change management and user adoption toolkit",
  line2: ["for", "Microsoft 365", "and", "SharePoint", "rollouts."],
  apps: ["SharePoint", "Teams", "OneDrive", "Outlook", "Copilot"],
  start: at(7, 0.2),
  /** Seconds between words. */
  wordStep: BEAT / 8,
  appsStart: at(7, 2),
  appStep: BEAT / 4,
};

/**
 * The seven phases, each with one template from its phase. The first six are the free samples;
 * Sustain has none, so it shows one of its templates from the catalog.
 */
export const ROLLOUT = {
  heading: at(8),
  first: at(8, 0.5),
  /** A dotted quarter between phases. */
  step: BEAT * 1.5,
  items: [
    {
      phase: "01",
      name: "Make the case",
      title: "Executive Sponsor Kickoff Deck",
      format: "PowerPoint",
    },
    { phase: "02", name: "Plan", title: "Change Management Strategy", format: "Word" },
    { phase: "03", name: "Design", title: "SharePoint Governance Framework", format: "Word" },
    {
      phase: "04",
      name: "Prepare",
      title: "SharePoint End-User Training Deck",
      format: "PowerPoint",
    },
    { phase: "05", name: "Communicate", title: "Master Communications Plan", format: "Excel" },
    { phase: "06", name: "Execute", title: "Go/No-Go Decision Checklist", format: "Excel" },
    { phase: "07", name: "Sustain", title: "90-Day Adoption Scorecard", format: "Excel" },
  ],
};

export const FOLDER = {
  gather: at(11),
  close: at(11, 2),
};

/** The counts in `TOOLKIT` in `lib/site.ts`, one on each beat. */
export const SCALE = {
  first: at(12),
  step: BEAT,
  count: 0.42,
  items: [
    { value: 59, label: "Playbooks" },
    { value: 130, label: "Templates" },
    { value: 4, label: "Field guides" },
    { value: 58, label: "Job aids" },
    { value: 3, label: "Training audiences" },
  ],
  proof: at(13, 1),
  proofLines: ["Field-tested across real client rollouts.", "30+ years of practice."],
};

/** The ink that floods the frame from paper to the binder. */
export const WIPE = { start: at(13, 3), black: at(14, 0.6) };

export const NINETY = {
  heading: at(14, 0.4),
  fillStart: at(14, 1),
  fillEnd: at(14, 3),
  rest: at(14, 3.2),
};

export const WHO = {
  lead: "Built for",
  roles: ["Change leads.", "IT project managers.", "Records leads.", "CIOs and sponsors."],
  first: at(15),
  step: BEAT,
};

export const END = {
  markStart: at(16, 0.2),
  markEnd: at(16, 1.6),
  name: at(16, 1.2),
  offer: at(16, 2.2),
  cta: at(16, 3),
  price: "$1,499.99 CAD",
  domain: "advanta365.com",
  parent: "EchoFive",
};

/**
 * The ink plates: stretches of the real fluid engine (`lib/ink/engine`), rendered once by
 * `plates.mjs` at 30 frames a second and laid under or over the scenes. `start` is the video time
 * of the plate's first frame.
 */
export const PLATE_FPS = 30;
export const PLATES = {
  flood: { start: at(4), end: at(7, 0.5) },
  wipe: { start: WIPE.start, end: WIPE.black + 0.1 },
  ninety: { start: at(14), end: at(16) },
  bloom: { start: at(16), end: DURATION },
};
