import type { Tier, Vec2, Vec3, Vec4 } from "../types";

/**
 * Quality tiers, the physics and the look of the ink. A scene overrides any of the last two.
 * Sizes are budgets in cells or pixels, so the cost is the same for every aspect.
 */

export type TierSpec = {
  simCells: number;
  dyePixels: number;
  dyeScale: number;
  pressure: number;
  dprCap: number;
  canvasPixels: number;
  shadowSteps: number;
  cubic: boolean;
  far: boolean;
  farSharp: boolean;
};

export const TIERS: Record<Tier, TierSpec> = {
  high: {
    simCells: 112000,
    dyePixels: 1300000,
    dyeScale: 1,
    pressure: 26,
    dprCap: 2,
    canvasPixels: 2400000,
    shadowSteps: 5,
    cubic: true,
    far: true,
    farSharp: true,
  },
  medium: {
    simCells: 62000,
    dyePixels: 760000,
    dyeScale: 0.8,
    pressure: 20,
    dprCap: 1.75,
    canvasPixels: 1700000,
    shadowSteps: 4,
    cubic: true,
    far: true,
    farSharp: false,
  },
  low: {
    simCells: 34000,
    dyePixels: 420000,
    dyeScale: 0.62,
    pressure: 16,
    dprCap: 1.5,
    canvasPixels: 1000000,
    shadowSteps: 3,
    cubic: true,
    far: true,
    farSharp: false,
  },
};

export const TIER_ORDER: readonly [Tier, Tier, Tier] = ["low", "medium", "high"];

export function isTier(value: unknown): value is Tier {
  return value === "high" || value === "medium" || value === "low";
}

/**
 * Milliseconds of GPU work per frame a tier may cost in the probe. A probe runs cold and reads
 * about half as much again as the steady state, so these leave 60 frames a second plenty of room;
 * if frames still run slow later, the watch in the loop steps down once more.
 */
export const BUDGET: Record<Tier, number> = { high: 9, medium: 10, low: Infinity };

export const MAX_DYE_LEVELS = 7;
export const MAX_CALM = 8;
export const MAX_SWELL = 4;

export type Sim = {
  /** Simulated seconds per real second. */
  speed: number;
  /** Sinking acceleration per unit of density: black, blue. */
  gravity: Vec2;
  /** How much the far layer weighs. */
  farWeight: number;
  /** The far layer moves at this share of the water's speed. */
  farLag: number;
  /** Keep filaments in the far layer too (high tier only). */
  farSharp: boolean;
  /** Vorticity confinement. */
  confinement: number;
  /** Per second. */
  velocityDamping: number;
  /** Per second: near black, near blue, far black, far blue. */
  dyeDecay: Vec4;
  /** Subtracted per second, so thin ink clears to exactly nothing. */
  dyeFloor: number;
  /** 0 is soft (bilinear) advection, 1 is sharp (limited cubic). */
  sharpness: number;
  /** Strength, spatial frequency and rate of change of the slow ambient currents. */
  ambient: number;
  ambientScale: number;
  ambientSpeed: number;
  /** Left, right, bottom, top: 1 is solid, 0 is open. */
  walls: Vec4;
  /** Velocity damping and extra dye decay inside a calm zone, per second. */
  calmDrag: number;
  calmDecay: number;
  /** 0 to 1: how much the water resists fine eddies. */
  viscosity: number;
  /** Physics passes per step: 2 plays the same water twice as fast. */
  substeps: number;
  /** The weight of the ink is felt through a soft average, so billows stay large. */
  massBlur: number;
};

export const SIM_DEFAULTS: Sim = {
  speed: 1,
  gravity: [0.14, 0.12],
  farWeight: 0.6,
  farLag: 0.72,
  farSharp: true,
  confinement: 3.5,
  velocityDamping: 0.8,
  dyeDecay: [0.03, 0.03, 0.06, 0.06],
  dyeFloor: 0.0015,
  sharpness: 0.92,
  ambient: 0.02,
  ambientScale: 2.2,
  ambientSpeed: 0.06,
  walls: [0, 0, 0, 0],
  calmDrag: 5,
  calmDecay: 0.9,
  viscosity: 0.08,
  substeps: 1,
  massBlur: 0.4,
};

export type Look = {
  /** Which pigment the ground is, and whether it is the dark one (ink scatters light there). */
  ground: "paper" | "binder";
  dark: boolean;
  density: number;
  /** Above 1: thin haze reads thinner and dense ink denser. */
  gamma: number;
  /** Optical density of each ink on its own. */
  blackGain: number;
  blueGain: number;
  /** Black ink: a little chromatic absorption (thin veils are cool grey), then opacity. */
  blackTint: Vec3;
  blackOpacity: number;
  blackPigment: "black" | "pale";
  /** Blue ink: absorbs red, then green; it stays light. */
  blueTint: Vec3;
  blueOpacity: number;
  bluePigment: "blue" | "blueDark";
  blueDeep: Vec3;
  blueDeepRate: number;
  /** How much of the self-shadow the blue ink takes, and per channel. */
  blueShade: number;
  blueShadeTint: Vec3;
  farDensity: number;
  farLod: number;
  farScale: number;
  /** Direction toward the light, x right, y up. */
  light: Vec2;
  /** Canvas heights. */
  shadowReach: number;
  shadowStrength: number;
  /** How much shadowed ink deepens. */
  shadowDepth: number;
  ambientLight: number;
  /** Edges of ink sheets read denser. */
  limb: number;
  /** Draw the near layer through a smooth filter: no texel pattern, no stair-steps. */
  smooth: boolean;
  /** Soft shadow of the ink on the ground behind it. */
  groundShadow: number;
  grain: number;
};

/** The light-ground look: near-black ink and a blue that stays light however dense it gets. */
export const LOOK_DEFAULTS: Look = {
  ground: "paper",
  dark: false,
  density: 1.3,
  gamma: 1.35,
  blackGain: 0.8,
  blueGain: 0.6,
  blackTint: [0.34, 0.22, 0.06],
  blackOpacity: 1.7,
  blackPigment: "black",
  blueTint: [1.1, 0.45, 0.02],
  blueOpacity: 0.4,
  bluePigment: "blue",
  blueDeep: [0.66, 0.9, 0.97],
  blueDeepRate: 0,
  blueShade: 0.5,
  blueShadeTint: [1, 0.5, 0.25],
  farDensity: 0.45,
  farLod: 0.9,
  farScale: 0.94,
  light: [-0.45, 0.89],
  shadowReach: 0.11,
  shadowStrength: 0.7,
  shadowDepth: 0.5,
  ambientLight: 0.4,
  limb: 0.15,
  smooth: true,
  groundShadow: 0.05,
  grain: 0.006,
};

/** The dark-ground look of the footer: faint pale and light-blue wisps that scatter light. */
export const LOOK_DARK: Partial<Look> = {
  ground: "binder",
  dark: true,
  density: 1,
  gamma: 1.5,
  blackTint: [0, 0, 0],
  blackPigment: "pale",
  blackOpacity: 0.1,
  blueTint: [0, 0, 0],
  bluePigment: "blueDark",
  blueOpacity: 0.15,
  blueDeep: [1, 1, 1],
  blueShade: 1,
  blueShadeTint: [1, 1, 1],
  blackGain: 1,
  blueGain: 1,
  farDensity: 0.7,
  farLod: 1.6,
  ambientLight: 0.62,
  shadowStrength: 0.9,
  shadowDepth: 0,
  limb: 0.3,
  groundShadow: 0,
  grain: 0.004,
};
