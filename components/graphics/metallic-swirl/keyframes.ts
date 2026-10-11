import { createKeyframeSampler } from "./interpolate";
import { METALLIC_SWIRL_DEFAULTS, type SwirlParams } from "./params";

/**
 * Scroll keyframes of the home swirl band. `SwirlBand` maps them to: band top, the centre of each
 * section listed in `stops`, band bottom. Pure data (no DOM), so the unit test can import it.
 * Every keyframe lists all the values that morph, so one stop can be tuned without touching another.
 */

/** Values shared by every home keyframe: transparent canvas, only the thin highlight strips survive. */
const BAND_BASE: SwirlParams = {
  ...METALLIC_SWIRL_DEFAULTS,
  initialTime: 0,
  contrast: 1,
  vignette: 0,
  detailFade: 1,
  backgroundColor: "#00000000",
  opacity: 1,
  colorMode: "stripes",
  beams: 5,
  bandWidth: 0.12,
  stripeRadial: 0,
  colorB: "#00000000",
  colorC: "#dfeaff00",
  tintColor: "#ffffff00",
  fadeLeft: 0,
  fadeRight: 0,
  fadeTop: 0.5,
  fadeBottom: 0.5,
};

/** Band top: cartesian curls anchored to a centre near the top-left corner. */
const K0: SwirlParams = {
  ...BAND_BASE,
  speed: 0,
  zoom: 2.1,
  iterations: 2,
  sampleGap: 0.14,
  tangentForce: 0.83,
  gradientForce: 0.27,
  centerX: 0.17,
  centerY: 0.95,
  radialMix: 0,
  beamWidth: 0.62,
  radialStretch: 1.46,
  radialFlow: 2,
  radialSpin: -0.3,
  twist: -0.19,
  vortex: -0.55,
  hole: 0.16,
  colorA: "#a8d2ff",
  softness: 0.7,
  shiftRed: 0.3,
  shiftBlue: 0.2,
  repetition: 3,
  stripeFlow: 0.56,
  spread: 0.03,
  brightness: 1,
  threshold: 0.69,
};

/** First section centred: the same curls, their centre slid down to mid-height. */
const K1: SwirlParams = {
  ...BAND_BASE,
  speed: 0,
  zoom: 2.11,
  iterations: 2,
  sampleGap: 0.14,
  tangentForce: 0.83,
  gradientForce: 0.27,
  centerX: 0.17,
  centerY: 0.45,
  radialMix: 0,
  beamWidth: 1,
  radialStretch: 0.69,
  radialFlow: -2.07,
  radialSpin: -0.3,
  twist: -0.19,
  vortex: -0.55,
  hole: 0,
  colorA: "#a8d2ff",
  softness: 0.31,
  shiftRed: 0.3,
  shiftBlue: 0.2,
  repetition: 1.9,
  stripeFlow: 0.99,
  spread: 0.02,
  brightness: 1,
  threshold: 0.72,
};

/** Second section centred: screen centre, zoomed far in and dimmed: a near-blank "breath". */
const K2: SwirlParams = {
  ...BAND_BASE,
  speed: 0,
  zoom: 0.25,
  iterations: 2,
  sampleGap: 0.147,
  tangentForce: 0.83,
  gradientForce: 0.2,
  centerX: 0.5,
  centerY: 0.59,
  radialMix: 0.39,
  beamWidth: 0.84,
  radialStretch: 1.3,
  radialFlow: -2.07,
  radialSpin: -0.3,
  twist: 0.12,
  vortex: -0.52,
  hole: 1,
  colorA: "#a8d2ff",
  softness: 0.31,
  shiftRed: 0.3,
  shiftBlue: 0.2,
  repetition: 3.5,
  stripeFlow: 0.99,
  spread: 0.02,
  brightness: 0.14,
  threshold: 0.72,
};

/** Dark section centred: a fully polar five-beam burst in white, the only stop that animates itself. */
const K3: SwirlParams = {
  ...BAND_BASE,
  speed: 0.1,
  zoom: 2,
  iterations: 3,
  sampleGap: 0.147,
  tangentForce: -1.2,
  gradientForce: 0.5,
  centerX: 0.5,
  centerY: 0.594,
  radialMix: 1,
  beamWidth: 1,
  radialStretch: 2,
  radialFlow: 1.91,
  radialSpin: -0.24,
  twist: 0,
  vortex: 0,
  hole: 1,
  colorA: "#ffffffff",
  softness: 0.41,
  shiftRed: -0.7,
  shiftBlue: -0.59,
  repetition: 1.14,
  stripeFlow: 0.99,
  spread: 0.02,
  brightness: 1,
  threshold: 0.72,
};

/** Band bottom: the same burst, its centre pushed to the top edge, frozen. */
const K4: SwirlParams = {
  ...K3,
  speed: 0,
  centerY: 1,
};

/**
 * The extra stop for `#featured`, between the breath and the burst. The page is still light there, so
 * the lines stay pale blue and still. Brightness is held low on purpose (the plain sample would be
 * about 0.44): six template cards sit on this stop, so the breath is carried through the card grid and
 * the beams only swell as `#practice` arrives. 0.28 is a tuning knob (useful range 0.14 to 0.44).
 */
const KF: SwirlParams = {
  ...createKeyframeSampler([K0, K1, K2, K3, K4])(2.4),
  colorA: "#a8d2ffff",
  speed: 0,
  brightness: 0.28,
};

/** Band top, `#inside`, `#bundles`, `#featured`, `#practice`, band bottom. */
export const HOME_SWIRL_KEYFRAMES: readonly SwirlParams[] = [K0, K1, K2, KF, K3, K4];
