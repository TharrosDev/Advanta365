/**
 * Parameters of the metallic swirl shader. Pure data: safe to import from server components, client
 * components and unit tests. The meaning of every field is documented next to the uniform it feeds in
 * `shaders.ts`; `docs/graphics-tuning.md` explains how to tune them.
 */
export type SwirlParams = {
  /** Shader time units per second (0 = frozen; the swirl then only moves when its parameters change). */
  speed: number;
  /** Time offset added to the running clock. */
  initialTime: number;
  /** Field scale: larger = zoomed out. */
  zoom: number;
  /** Advection steps (fractional allowed, the last step is blended in; hard maximum 12). */
  iterations: number;
  /** Finite-difference step of the wave field: larger = smoother, lazier curls. */
  sampleGap: number;
  /** Advection along the iso-lines (swirl strength; the sign flips the direction). */
  tangentForce: number;
  /** Advection along the gradient (convergence / divergence). */
  gradientForce: number;
  /** Gain applied after the contrast. */
  brightness: number;
  /** Contrast about half of the coverage. */
  contrast: number;
  /** Fill behind the lines (hex, alpha honoured). */
  backgroundColor: string;
  /** Global alpha multiplier. */
  opacity: number;
  /** 0 = cartesian flowing field, 1 = polar "beams from a centre". */
  radialMix: number;
  /** Number of angular lobes (rounded). */
  beams: number;
  /** Log-radius scale of the polar domain. */
  radialStretch: number;
  /** Radial time delay (waves travelling out or in). */
  radialFlow: number;
  /** Rotation rate, radians per time unit. */
  radialSpin: number;
  /** Exponent of the lobe shaper (1 = pure cosine, below 1 = squarer). */
  beamWidth: number;
  /** Logarithmic spiral twist. */
  twist: number;
  /** Extra rotation near the centre. */
  vortex: number;
  /** Radius of a soft transparent hole at the centre. */
  hole: number;
  /** Centre in canvas uv, x from the left edge. */
  centerX: number;
  /** Centre in canvas uv, y up (1 = top edge). */
  centerY: number;
  /** Corner darkening amount. */
  vignette: number;
  /** Colouring algorithm. */
  colorMode: "stripes" | "phase";
  /** Highlight colour (hex). */
  colorA: string;
  /** Base colour (hex). */
  colorB: string;
  /** Mid colour (hex). */
  colorC: string;
  /** Colour-burn tint; its alpha is the strength. */
  tintColor: string;
  /** Stripe cycles per full turn of the flow direction. */
  repetition: number;
  /** Stripe edge blur. */
  softness: number;
  /** Width of the thin highlight strips. */
  bandWidth: number;
  /** Chromatic phase offset of the red channel. */
  shiftRed: number;
  /** Chromatic phase offset of the blue channel. */
  shiftBlue: number;
  /** Stripe scroll rate, cycles per time unit. */
  stripeFlow: number;
  /** Adds the radius to the stripe phase (rings). */
  stripeRadial: number;
  /** Length of the mid-to-base gradient at the start of the wide strip. */
  spread: number;
  /** Threshold of the "phase" colour mode. */
  threshold: number;
  /** Fades regions whose stripes are too dense to resolve (anti-moire). */
  detailFade: number;
  /** Width (in canvas uv) of a fade-in from the left edge. */
  fadeLeft: number;
  /** Width (in canvas uv) of a fade-in from the right edge. */
  fadeRight: number;
  /** Width (in canvas uv) of a fade-in from the top edge. */
  fadeTop: number;
  /** Width (in canvas uv) of a fade-in from the bottom edge. */
  fadeBottom: number;
};

/** The shader's own defaults: every other parameter set is these values plus overrides. */
export const METALLIC_SWIRL_DEFAULTS: SwirlParams = {
  speed: 0.11,
  initialTime: 0,
  zoom: 0.9,
  iterations: 4,
  sampleGap: 0.005,
  tangentForce: 0.81,
  gradientForce: 0.08,
  brightness: 1,
  contrast: 1,
  backgroundColor: "#000000ff",
  opacity: 1,
  radialMix: 1,
  beams: 5,
  radialStretch: 0.49,
  radialFlow: 3,
  radialSpin: 0.2,
  beamWidth: 0.2,
  twist: 1.4,
  vortex: 0,
  hole: 0,
  centerX: 0.5,
  centerY: 0.5,
  vignette: 0,
  colorMode: "stripes",
  colorA: "#fafaff",
  colorB: "#000000",
  colorC: "#8b93a6",
  tintColor: "#ffffff00",
  repetition: 1.1,
  softness: 0.2,
  bandWidth: 0.12,
  shiftRed: 0,
  shiftBlue: 0,
  stripeFlow: -1.69,
  stripeRadial: 0,
  spread: 0.02,
  threshold: 0.72,
  detailFade: 0,
  fadeLeft: 0,
  fadeRight: 0,
  fadeTop: 0,
  fadeBottom: 0,
};

/**
 * Section backdrop for inner pages: two slow, wide beams sweeping in from beyond the top-right corner,
 * thin pale-blue filaments on a transparent canvas. Use it as
 * `<SectionShell backdrop={<MetallicSwirl params={INNER_SWIRL_PARAMS} className={...} />}>`.
 */
export const INNER_SWIRL_PARAMS: Partial<SwirlParams> = {
  speed: 0.1,
  initialTime: 100,
  zoom: 2.53,
  iterations: 1,
  sampleGap: 0.145,
  tangentForce: 1.7,
  gradientForce: 0.49,
  centerX: 1.07,
  centerY: 0.88,
  radialMix: 1,
  beams: 2,
  beamWidth: 0.62,
  radialStretch: -0.16,
  radialFlow: 1.61,
  radialSpin: 0.57,
  twist: -0.39,
  vortex: 0.08,
  hole: 1,
  colorMode: "stripes",
  colorA: "#a8d2ffff",
  colorB: "#00000000",
  colorC: "#dfeaff00",
  tintColor: "#ffffff00",
  softness: 0.44,
  shiftRed: 0.57,
  shiftBlue: 0.32,
  repetition: 1.14,
  stripeFlow: 0.99,
  spread: 0.02,
  bandWidth: 0.1,
  threshold: 0.72,
  brightness: 1,
  contrast: 1,
  vignette: 0,
  detailFade: 1,
  backgroundColor: "#00000000",
  opacity: 1,
  fadeTop: 0.17,
  fadeBottom: 0.15,
};
