/**
 * Sheen text: the fragment stage that fills headline glyphs with the text colour plus a slow,
 * soft, slightly chromatic band of light. The vertex stage is the shared fullscreen triangle of
 * `@/lib/gl/program`. Loaded only through the dynamic import of `sheen-engine`.
 */

/** Tuning values of the effect. `unit` and `speed` are applied in the engine, the rest is baked into the shader. */
export const SHEEN_PARAMS = {
  /** Pattern scale: one noise unit spans this many em of the heading's font size. */
  unit: 5,
  /** Multiplier from wall-clock seconds to shader time. */
  speed: 0.75,
  /** Bands per noise unit. */
  repetition: 1,
  /** How far the noise field bends the bands. */
  warp: 0.1,
  /** Phase lead of the red channel (the green channel leads by 0.35 of it). */
  shiftRed: 0.045,
  /** Phase lag of the blue channel. */
  shiftBlue: 0.04,
  /** Widens the tail of the band and its edge blur. */
  softness: 1,
  /** Picks the region of the noise field. */
  seed: 204,
  /** Dark text on a light surface (text r + g + b <= 1.5). */
  onLight: { lit: [0.93, 0.96, 1.0], chroma: 1 },
  /** Light text on a dark surface (text r + g + b > 1.5). */
  onDark: { lit: [0.82, 0.86, 0.95], chroma: 0.5 },
} as const;

/** Names of the uniforms the engine writes per word (plus `u_time` once per frame). */
export const SHEEN_UNIFORMS = [
  "u_resolution",
  "u_origin",
  "u_dpr",
  "u_unit",
  "u_time",
  "u_text",
  "u_lit",
  "u_chroma",
] as const;

export type SheenUniformName = (typeof SHEEN_UNIFORMS)[number];

/** Formats a number as a GLSL float literal (always with a decimal point). */
function float(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

export const SHEEN_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution; // word canvas size, device px
uniform vec2 u_origin;     // word canvas offset inside its heading, CSS px
uniform float u_dpr;       // device px per CSS px
uniform float u_unit;      // CSS px per noise unit
uniform float u_time;      // seconds, already scaled by the speed
uniform vec3 u_text;       // computed text colour
uniform vec3 u_lit;        // colour of the light band
uniform float u_chroma;    // how much of the red/blue fringe survives

out vec4 outColor;

const float SEED = ${float(SHEEN_PARAMS.seed)};
const float REPETITION = ${float(SHEEN_PARAMS.repetition)};
const float WARP = ${float(SHEEN_PARAMS.warp)};
const float SHIFT_RED = ${float(SHEEN_PARAMS.shiftRed)};
const float SHIFT_BLUE = ${float(SHEEN_PARAMS.shiftBlue)};
const float SOFTNESS = ${float(SHEEN_PARAMS.softness)};

// Textureless 3D simplex noise (the permutation-polynomial method of McEwan and Gustavson),
// written out for this effect. Returns roughly -1..1.
vec3 wrap289(vec3 v) { return v - floor(v / 289.0) * 289.0; }
vec4 wrap289(vec4 v) { return v - floor(v / 289.0) * 289.0; }
vec4 shuffle(vec4 v) { return wrap289((v * 34.0 + 1.0) * v); }

float simplex(vec3 v) {
  // Skew onto the simplex lattice: cell origin and the offset from it.
  vec3 cell = floor(v + (v.x + v.y + v.z) / 3.0);
  vec3 d0 = v - cell + (cell.x + cell.y + cell.z) / 6.0;

  // Rank the offset components to find the two middle corners of the tetrahedron.
  vec3 ahead = step(d0.yzx, d0.xyz);
  vec3 behind = 1.0 - ahead;
  vec3 c1 = min(ahead, behind.zxy);
  vec3 c2 = max(ahead, behind.zxy);

  vec3 d1 = d0 - c1 + 1.0 / 6.0;
  vec3 d2 = d0 - c2 + 1.0 / 3.0;
  vec3 d3 = d0 - 0.5;

  // One hash per corner.
  cell = wrap289(cell);
  vec4 hash = shuffle(
    shuffle(shuffle(cell.z + vec4(0.0, c1.z, c2.z, 1.0)) + cell.y + vec4(0.0, c1.y, c2.y, 1.0)) +
      cell.x +
      vec4(0.0, c1.x, c2.x, 1.0)
  );

  // Gradients: 49 points of a 7 x 7 grid folded onto an octahedron.
  vec4 slot = hash - 49.0 * floor(hash / 49.0);
  vec4 column = floor(slot / 7.0);
  vec4 row = slot - 7.0 * column;
  vec4 gx = column * (2.0 / 7.0) - 13.0 / 14.0;
  vec4 gy = row * (2.0 / 7.0) - 13.0 / 14.0;
  vec4 gz = 1.0 - abs(gx) - abs(gy);
  vec4 fold = step(gz, vec4(0.0));
  gx -= fold * (step(0.0, gx) * 2.0 - 1.0);
  gy -= fold * (step(0.0, gy) * 2.0 - 1.0);

  vec3 g0 = vec3(gx.x, gy.x, gz.x);
  vec3 g1 = vec3(gx.y, gy.y, gz.y);
  vec3 g2 = vec3(gx.z, gy.z, gz.z);
  vec3 g3 = vec3(gx.w, gy.w, gz.w);

  // First-order approximation of 1 / sqrt(length squared).
  vec4 scale =
    1.79284291400159 - 0.85373472095314 * vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3));
  g0 *= scale.x;
  g1 *= scale.y;
  g2 *= scale.z;
  g3 *= scale.w;

  vec4 falloff = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
  falloff *= falloff;
  return 42.0 * dot(falloff * falloff, vec4(dot(g0, d0), dot(g1, d1), dot(g2, d2), dot(g3, d3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float gain = 0.55;
  for (int octave = 0; octave < 3; octave++) {
    value += gain * simplex(p);
    p = p * 2.1 + vec3(3.7, 1.9, 5.3);
    gain *= 0.45;
  }
  return value;
}

// Soft asymmetric band: fast rise, long tail.
float glow(float s, float blur) {
  float rise = smoothstep(0.0, 0.1 + blur, s);
  float tail = 1.0 - smoothstep(0.1, 0.55 + 0.3 * SOFTNESS, s);
  return pow(rise * tail, 1.6);
}

// Thin bright line on the leading edge of the band.
float glint(float s, float blur) {
  return 1.0 - smoothstep(0.015, 0.03 + blur, abs(s - 0.05));
}

void main() {
  // CSS px, y down, relative to the heading so the pattern runs through all of its words.
  vec2 px = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y) / u_dpr + u_origin;
  vec2 p = px / u_unit + vec2(13.7, 7.3) * SEED;
  float t = u_time + 100.0 * SEED;
  vec2 drift = vec2(-0.1 * t, 0.0);

  // Domain warp.
  vec2 q = vec2(
    fbm(vec3(0.7 * p + 0.5 * drift, 0.12 * t)),
    fbm(vec3(0.7 * p + vec2(4.1, 2.3) + 0.9 * drift, 0.12 * t + 7.0))
  );
  float field = fbm(vec3(0.9 * p + 1.4 * q + drift, 0.09 * t));

  // Slanted bands that travel to the right, gently wobbled by the field.
  float phase = REPETITION * (p.x + 0.3 * p.y) + WARP * field - 0.14 * t;
  float blur = 0.5 * fwidth(phase) + 0.02 * SOFTNESS;

  // Chromatic split: each channel reads the band at a slightly different phase.
  vec3 s = fract(vec3(phase - SHIFT_RED, phase - 0.35 * SHIFT_RED, phase + SHIFT_BLUE));
  vec3 body = vec3(glow(s.r, blur), glow(s.g, blur), glow(s.b, blur));
  vec3 edge = vec3(glint(s.r, blur), glint(s.g, blur), glint(s.b, blur));

  // Patchiness: the band comes and goes along its length.
  float amp = smoothstep(-0.15, 0.55, fbm(vec3(0.5 * p + 2.0 * q + 0.4 * drift, 0.07 * t)));

  vec3 sheen = min(0.95 * body + 0.5 * edge, 1.0) * amp;
  float weight = max(sheen.r, max(sheen.g, sheen.b));
  vec3 hue = sheen / max(weight, 1e-4);
  vec3 lit = u_lit * mix(vec3(1.0), hue, u_chroma);

  // Half an 8-bit step of ordered noise against banding.
  float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5;
  outColor = vec4(clamp(mix(u_text, lit, weight) + dither / 255.0, 0.0, 1.0), 1.0);
}
`;
