/**
 * The public shape of the ink engine (`lib/ink/engine`). Types only: this file is safe to import
 * from first-load code, the engine itself is not.
 *
 * Coordinates: x runs 0 (left) to 1 (right), y runs 0 (top) to 1 (bottom). Lengths and velocities
 * are in canvas heights and canvas heights per second. Times are seconds of animation.
 */

export type Tier = "high" | "medium" | "low";
export type SceneName = "intro" | "hero" | "title" | "ninety" | "bloom" | "wisps" | "spill";
/** "pale" is the black channel on a dark ground. */
export type InkName = "black" | "blue" | "pale";
export type InkAmount = InkName | { black?: number; blue?: number };
export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];
export type Vec4 = readonly [number, number, number, number];
/** sRGB, each channel 0 to 1. */
export type Rgb = readonly [number, number, number];
export type Pigments = { paper: Rgb; binder: Rgb; black: Rgb; blue: Rgb; blueDark: Rgb; pale: Rgb };
export type Rect = { x: number; y: number; width: number; height: number };

/**
 * A rectangle that stays calm. In CSS pixels from the canvas's top-left corner, or in fractions of
 * the canvas with `unit: "fraction"`. `feather` is the soft edge, `floor` the share of the ink that
 * may still show, `hold` how strongly the water is slowed, `fade` how strongly ink that drifts in
 * is dissolved, `cap` the relative luminance the picture may not cross inside the rectangle.
 */
export type Zone = Rect & {
  unit?: "px" | "fraction";
  feather?: number;
  floor?: number;
  hold?: number;
  fade?: number;
  cap?: number;
};
export type Zones = Zone | readonly Zone[] | (() => Zone | readonly Zone[] | null) | null;

export type InkOptions = {
  /** No colour lives in the engine: the six pigments arrive here. */
  pigments: Pigments;
  preset?: SceneName | null;
  quality?: "auto" | Tier;
  maxDpr?: number;
  autoStart?: boolean;
  autoResize?: boolean;
  autoPause?: boolean;
  interactive?: boolean;
  scrollImpulse?: boolean;
  pointerTarget?: EventTarget;
  seed?: number;
  stepsPerSecond?: number;
  adapt?: boolean;
};

export type InkStats = {
  supported: boolean;
  tier: Tier;
  running: boolean;
  lost: boolean;
  preset: string | null;
  steps: number;
  time: number;
  fps: number;
  /** Mean interval between frames, in milliseconds. */
  frameMs: number;
  worstFrameMs: number;
  canvas: Vec2;
  css: Vec2;
  dpr: number;
  velocity: Vec2;
  dye: Vec2;
  pressureIterations: number;
};

export type InkEvents = {
  ready: { tier: Tier; probeMs: number | null };
  end: { preset: string };
  cleared: undefined;
  quality: { tier: Tier };
  lost: undefined;
  restored: { tier: Tier; probeMs: number | null };
  unsupported: undefined;
  slow: undefined;
  rest: undefined;
};

export type InkDrop = {
  x?: number;
  y?: number;
  ink?: InkAmount;
  amount?: number;
  radius?: number;
  velocity?: Vec2;
  fiber?: number;
  turbulence?: number;
  depth?: number;
  push?: number;
  spin?: number;
  swell?: number;
  swellTime?: number;
};

export type InkStir = {
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  radius?: number;
  spin?: number;
};

export type InkStream = {
  x?: number;
  y?: number;
  ink?: InkAmount;
  rate?: number;
  radius?: number;
  velocity?: Vec2;
  duration?: number;
  wobble?: number;
  fiber?: number;
  turbulence?: number;
};

export type PresetOverrides = {
  sim?: object;
  look?: object;
  /** Rectangles a scene aims at, in fractions of the canvas. */
  anchors?: Record<string, Rect>;
};

export type Ink = {
  /** Known at once: whether this canvas will ever draw. */
  readonly supported: boolean;
  readonly ready: Promise<Ink>;
  readonly canvas: HTMLCanvasElement;
  preset(name: SceneName, o?: PresetOverrides): Ink;
  start(): Ink;
  stop(): Ink;
  /** Ease the water to a standstill, stop the loop, emit "rest". */
  rest(o?: { duration?: number }): Ink;
  /** n fixed steps and one draw; deterministic. */
  step(n?: number): Ink;
  /** One settled frame of a scene, computed in batches of 24 steps. */
  still(name?: SceneName, steps?: number): Promise<Ink>;
  drop(d: InkDrop): Ink;
  stir(s: InkStir): Ink;
  stream(s: InkStream): { stop(): void };
  impulse(i: { dx?: number; dy?: number }): Ink;
  /** Run a named trigger of the scene, once until the water is next cleared. */
  fire(name: string): Ink;
  /** Up to eight zones; a function is asked again after every resize. */
  setCalmZone(zones: Zones): Ink;
  clear(o?: { duration?: number }): Ink;
  set(v: { sim?: object; look?: object }): Ink;
  setQuality(tier: Tier): Ink;
  /** Choose the tier by measuring real frames. Clears the water. */
  probe(): number | null;
  resize(): Ink;
  render(): Ink;
  /** Mean milliseconds of one step and one draw. */
  measureCost(frames?: number): number | null;
  stats(): InkStats;
  on<K extends keyof InkEvents>(name: K, fn: (detail: InkEvents[K]) => void): () => void;
  off<K extends keyof InkEvents>(name: K, fn: (detail: InkEvents[K]) => void): void;
  destroy(): void;
};
