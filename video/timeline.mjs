/**
 * The launch video's timeline and every fact it puts on screen. The picture (`launch.html`) and the
 * sound (`sound.mjs`) both read this module, so a change to a time here moves both.
 *
 * Facts mirror `lib/site.ts` and `content/templates/`. They are copied, not imported, because this
 * module is loaded by a plain browser page and by Node without a TypeScript step.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 45;

/** Where each scene starts and ends, in seconds. Neighbours overlap by their crossfade. */
export const SCENES = {
  prompt: { start: 0, end: 7.2 },
  reply: { start: 6.2, end: 13.4 },
  ink: { start: 13.0, end: 18.4 },
  documents: { start: 18.0, end: 28.4 },
  inside: { start: 28.0, end: 36.4 },
  ninety: { start: 36.0, end: 41.4 },
  end: { start: 41.0, end: DURATION },
};

/** How long a scene takes to fade in and out where it meets its neighbours. */
export const CROSSFADE = 0.4;

export const PROMPT = {
  text: "Write a change management plan for our SharePoint rollout.",
  typeStart: 1.5,
  typeEnd: 5.4,
  send: 6.0,
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

export const REPLY = {
  lines: [
    "Here is a change management plan for your SharePoint rollout:",
    "1. Communicate early and often.",
    "2. Engage key stakeholders.",
    "3. Provide training to users.",
    "4. Monitor adoption and adjust.",
    "5. Celebrate success.",
  ],
  streamStart: 6.7,
  streamEnd: 9.9,
  plausible: 10.4,
  unproven: 11.1,
};

export const TAGLINE = {
  lines: ["Don’t start from", "a blank prompt."],
  times: [14.0, 14.5],
};

/** The six free samples, one for each of the first six phases, in phase order. */
export const DOCUMENTS = {
  heading: 18.3,
  first: 18.9,
  step: 1.15,
  note: 26.0,
  items: [
    {
      phase: "01",
      phaseName: "Make the case",
      title: "Executive Sponsor Kickoff Deck",
      format: "PowerPoint",
    },
    { phase: "02", phaseName: "Plan", title: "Change Management Strategy", format: "Word" },
    { phase: "03", phaseName: "Design", title: "SharePoint Governance Framework", format: "Word" },
    {
      phase: "04",
      phaseName: "Prepare",
      title: "SharePoint End-User Training Deck",
      format: "PowerPoint",
    },
    { phase: "05", phaseName: "Communicate", title: "Master Communications Plan", format: "Excel" },
    { phase: "06", phaseName: "Execute", title: "Go/No-Go Decision Checklist", format: "Excel" },
  ],
};

/** The counts in `TOOLKIT` in `lib/site.ts`. */
export const INSIDE = {
  heading: 28.4,
  first: 28.9,
  step: 0.55,
  count: 1.0,
  proof: 32.9,
  items: [
    { value: 59, label: "Playbooks" },
    { value: 130, label: "Templates" },
    { value: 4, label: "Field guides" },
    { value: 58, label: "Job aids" },
    { value: 3, label: "Training audiences" },
  ],
};

export const NINETY = {
  heading: 36.4,
  fillStart: 37.0,
  fillEnd: 38.8,
  rest: 39.2,
};

export const END = {
  markStart: 41.3,
  markEnd: 42.5,
  name: 42.3,
  offer: 42.9,
  cta: 43.3,
  price: "$1,499.99 CAD",
  domain: "advanta365.com",
  parent: "EchoFive",
};
