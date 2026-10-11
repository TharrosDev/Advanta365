import { MAX_CALM, MAX_SWELL } from "./defaults";

/**
 * The shaders of the ink engine, as GLSL ES 3.00 strings. Numbers only: every colour arrives as a
 * uniform. The picture is matte: absorption, a soft self-shadow and a limb term, nothing that shines.
 */

export const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 vUv;
out vec4 o;
`;

const NOISE = `
uint mixBits(uint x) {
  x ^= x >> 16; x *= 2246822519u;
  x ^= x >> 13; x *= 3266489917u;
  x ^= x >> 16;
  return x;
}
float hash(ivec2 p, uint s) {
  uint h = mixBits(uint(p.x) * 2654435769u + mixBits(uint(p.y) + s * 668265263u + 374761393u));
  return float(h >> 8) * (1.0 / 16777216.0);
}
float vnoise(vec2 p, uint s) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  ivec2 c = ivec2(i);
  float a = hash(c, s);
  float b = hash(c + ivec2(1, 0), s);
  float d = hash(c + ivec2(0, 1), s);
  float e = hash(c + ivec2(1, 1), s);
  return mix(mix(a, b, u.x), mix(d, e, u.x), u.y);
}
`;

// Soft rectangles that stay calm. Shared by the simulation (drag, decay) and the picture (thinning,
// and the cap on how far a pixel may leave the ground).
const CALM = `
uniform vec4 uCalm[${MAX_CALM}];
uniform vec4 uCalmP[${MAX_CALM}];
uniform int uCalmCount;
uniform float uAspect;
float calmMask(vec2 uv, int i) {
  vec4 r = uCalm[i];
  vec2 c = 0.5 * (r.xy + r.zw);
  vec2 h = 0.5 * (r.zw - r.xy);
  vec2 d = abs(uv - c) - h;
  d.x *= uAspect;
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  return 1.0 - smoothstep(-0.25 * uCalmP[i].x, uCalmP[i].x, dist);
}
// The same rectangle for the cap: whole inside it, easing off across the feather outside.
float capMask(vec2 uv, int i) {
  vec4 r = uCalm[i];
  vec2 c = 0.5 * (r.xy + r.zw);
  vec2 h = 0.5 * (r.zw - r.xy);
  vec2 d = abs(uv - c) - h;
  d.x *= uAspect;
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  return 1.0 - smoothstep(0.0, uCalmP[i].x, dist);
}
`;

export const FRAG = {
  copy: `${HEAD}
uniform sampler2D uTex;
uniform float uScale;
void main() { o = textureLod(uTex, vUv, 0.0) * uScale; }`,

  curl: `${HEAD}
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float l = texture(uVel, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float b = texture(uVel, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uVel, vUv + vec2(0.0, uTexel.y)).x;
  o = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`,

  // velocity += dt * (vorticity confinement + weight of the ink + ambient currents), minus calm-zone drag
  force: `${HEAD}
${NOISE}
${CALM}
uniform sampler2D uVel;
uniform sampler2D uCurl;
uniform sampler2D uDye;
uniform vec2 uTexel;
uniform float uDt;
uniform float uConfine;
uniform float uDyeLod;
uniform vec3 uGravity;   // black, blue, far weight
uniform vec4 uAmbient;   // strength, scale, time, seed
uniform float uCalmDrag;
float potential(vec2 p) {
  float t = uAmbient.z;
  float t0 = floor(t);
  float k = t - t0;
  k = k * k * (3.0 - 2.0 * k);
  uint s = uint(uAmbient.w) + uint(t0) * 7u;
  float a = mix(vnoise(p, s), vnoise(p, s + 7u), k);
  float b = mix(vnoise(p * 2.13 + 4.7, s + 3u), vnoise(p * 2.13 + 4.7, s + 10u), k);
  return a + 0.45 * b;
}
void main() {
  vec2 v = texture(uVel, vUv).xy;
  float c = texture(uCurl, vUv).x;
  float cl = abs(texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x);
  float cr = abs(texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x);
  float cb = abs(texture(uCurl, vUv - vec2(0.0, uTexel.y)).x);
  float ct = abs(texture(uCurl, vUv + vec2(0.0, uTexel.y)).x);
  vec2 g = vec2(cr - cl, ct - cb);
  vec2 n = g / (length(g) + 1e-6);
  v += uDt * uConfine * c * vec2(n.y, -n.x);

  vec4 d = max(textureLod(uDye, vUv, uDyeLod), 0.0);
  float mass = uGravity.x * (d.r + uGravity.z * d.b) + uGravity.y * (d.g + uGravity.z * d.a);
  v.y -= uDt * mass;

  if (uAmbient.x > 0.0) {
    vec2 p = vec2(vUv.x * uAspect, vUv.y) * uAmbient.y;
    float e = 0.02;
    float px = potential(p + vec2(e, 0.0)) - potential(p - vec2(e, 0.0));
    float py = potential(p + vec2(0.0, e)) - potential(p - vec2(0.0, e));
    v += uDt * uAmbient.x * vec2(py, -px) / (2.0 * e);
  }

  float drag = 0.0;
  for (int i = 0; i < ${MAX_CALM}; i++) {
    if (i < uCalmCount) drag = max(drag, calmMask(vUv, i) * uCalmP[i].z);
  }
  v *= exp(-uDt * uCalmDrag * drag);
  o = vec4(v, 0.0, 1.0);
}`,

  advectVel: `${HEAD}
uniform sampler2D uVel;
uniform vec2 uScale;   // heights -> uv
uniform float uDt;
uniform float uDamp;
uniform float uVisc;
uniform vec2 uTexel;
void main() {
  vec2 v = texture(uVel, vUv).xy;
  vec2 mid = vUv - 0.5 * uDt * v * uScale;
  vec2 back = vUv - uDt * texture(uVel, mid).xy * uScale;
  vec2 r = texture(uVel, back).xy;
  if (uVisc > 0.0) {
    vec2 around =
      texture(uVel, back + vec2(uTexel.x, 0.0)).xy + texture(uVel, back - vec2(uTexel.x, 0.0)).xy +
      texture(uVel, back + vec2(0.0, uTexel.y)).xy + texture(uVel, back - vec2(0.0, uTexel.y)).xy;
    r = mix(r, 0.25 * around, uVisc);
  }
  o = vec4(r * uDamp, 0.0, 1.0);
}`,

  divergence: `${HEAD}
uniform sampler2D uVel;
uniform vec2 uTexel;
uniform vec4 uWalls;
uniform float uAspect;
uniform vec4 uSwell[${MAX_SWELL}];   // x, y, radius, strength
uniform int uSwellCount;
void main() {
  vec2 c = texture(uVel, vUv).xy;
  float l = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVel, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;
  if (vUv.x - uTexel.x < 0.0 && uWalls.x > 0.5) l = -c.x;
  if (vUv.x + uTexel.x > 1.0 && uWalls.y > 0.5) r = -c.x;
  if (vUv.y - uTexel.y < 0.0 && uWalls.z > 0.5) b = -c.y;
  if (vUv.y + uTexel.y > 1.0 && uWalls.w > 0.5) t = -c.y;
  float div = 0.5 * (r - l + t - b);
  for (int i = 0; i < ${MAX_SWELL}; i++) {
    if (i < uSwellCount) {
      vec2 d = vUv - uSwell[i].xy;
      d.x *= uAspect;
      float q = dot(d, d) / (uSwell[i].z * uSwell[i].z);
      div -= uSwell[i].w * uTexel.y * exp(-q);
    }
  }
  o = vec4(div, 0.0, 0.0, 1.0);
}`,

  jacobi: `${HEAD}
uniform sampler2D uP;
uniform sampler2D uDiv;
uniform vec2 uTexel;
uniform vec4 uWalls;
void main() {
  float l = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  // outside a solid wall the pressure repeats (clamped sample); outside an open edge it is zero
  if (vUv.x - uTexel.x < 0.0) l *= uWalls.x;
  if (vUv.x + uTexel.x > 1.0) r *= uWalls.y;
  if (vUv.y - uTexel.y < 0.0) b *= uWalls.z;
  if (vUv.y + uTexel.y > 1.0) t *= uWalls.w;
  float div = texture(uDiv, vUv).x;
  o = vec4((l + r + b + t - div) * 0.25, 0.0, 0.0, 1.0);
}`,

  project: `${HEAD}
uniform sampler2D uP;
uniform sampler2D uVel;
uniform vec2 uTexel;
uniform vec4 uWalls;
void main() {
  float l = texture(uP, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uP, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uP, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uP, vUv + vec2(0.0, uTexel.y)).x;
  bool el = vUv.x - uTexel.x < 0.0;
  bool er = vUv.x + uTexel.x > 1.0;
  bool eb = vUv.y - uTexel.y < 0.0;
  bool et = vUv.y + uTexel.y > 1.0;
  if (el) l *= uWalls.x;
  if (er) r *= uWalls.y;
  if (eb) b *= uWalls.z;
  if (et) t *= uWalls.w;
  vec2 v = texture(uVel, vUv).xy - 0.5 * vec2(r - l, t - b);
  if (el && uWalls.x > 0.5) v.x = max(v.x, 0.0);
  if (er && uWalls.y > 0.5) v.x = min(v.x, 0.0);
  if (eb && uWalls.z > 0.5) v.y = max(v.y, 0.0);
  if (et && uWalls.w > 0.5) v.y = min(v.y, 0.0);
  o = vec4(v, 0.0, 1.0);
}`,

  // The dye moves with the water. A limited cubic filter keeps filaments from blurring away.
  advectDye: `${HEAD}
${CALM}
uniform sampler2D uVel;
uniform sampler2D uDye;
uniform vec2 uSize;      // dye texels
uniform vec2 uScale;     // heights -> uv
uniform float uDt;
uniform vec4 uDecay;     // multiplier per channel for this step
uniform float uFloor;
uniform float uSharp;
uniform float uCalmDecay;
uniform float uMist;     // 0..1: how much the ink diffuses this step (used while clearing)
uniform float uFarLag;   // the far layer moves at this share of the water's speed
uniform float uFarSharp; // 1: the far layer keeps its filaments too (costs a second cubic lookup)
uniform vec4 uWalls;
uniform float uCubic;
vec4 sampleSharp(vec2 uv) {
  if (uCubic < 0.5) return textureLod(uDye, uv, 0.0);
  vec2 p = uv * uSize;
  vec2 c = floor(p - 0.5) + 0.5;
  vec2 f = p - c;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (c - 1.0) / uSize;
  vec2 t12 = (c + w2 / w12) / uSize;
  vec2 t3 = (c + 2.0) / uSize;
  vec4 r =
    textureLod(uDye, vec2(t0.x, t0.y), 0.0) * (w0.x * w0.y) +
    textureLod(uDye, vec2(t12.x, t0.y), 0.0) * (w12.x * w0.y) +
    textureLod(uDye, vec2(t3.x, t0.y), 0.0) * (w3.x * w0.y) +
    textureLod(uDye, vec2(t0.x, t12.y), 0.0) * (w0.x * w12.y) +
    textureLod(uDye, vec2(t12.x, t12.y), 0.0) * (w12.x * w12.y) +
    textureLod(uDye, vec2(t3.x, t12.y), 0.0) * (w3.x * w12.y) +
    textureLod(uDye, vec2(t0.x, t3.y), 0.0) * (w0.x * w3.y) +
    textureLod(uDye, vec2(t12.x, t3.y), 0.0) * (w12.x * w3.y) +
    textureLod(uDye, vec2(t3.x, t3.y), 0.0) * (w3.x * w3.y);
  // never leave the range of the four texels around the sample: no ringing, no new extremes
  vec2 q0 = c / uSize;
  vec2 q1 = (c + 1.0) / uSize;
  vec4 a = textureLod(uDye, q0, 0.0);
  vec4 b = textureLod(uDye, vec2(q1.x, q0.y), 0.0);
  vec4 d = textureLod(uDye, vec2(q0.x, q1.y), 0.0);
  vec4 e = textureLod(uDye, q1, 0.0);
  vec4 lo = min(min(a, b), min(d, e));
  vec4 hi = max(max(a, b), max(d, e));
  vec4 soft = mix(mix(a, b, f.x), mix(d, e, f.x), f.y);
  return mix(soft, clamp(r, lo, hi), uSharp);
}
float inside(vec2 p) {
  // nothing flows in through an open edge
  vec2 e = 1.5 / uSize;
  return
    mix(smoothstep(-e.x, e.x, p.x), 1.0, uWalls.x) *
    mix(smoothstep(-e.x, e.x, 1.0 - p.x), 1.0, uWalls.y) *
    mix(smoothstep(-e.y, e.y, p.y), 1.0, uWalls.z) *
    mix(smoothstep(-e.y, e.y, 1.0 - p.y), 1.0, uWalls.w);
}
void main() {
  vec2 v = texture(uVel, vUv).xy;
  vec2 mid = vUv - 0.5 * uDt * v * uScale;
  vec2 back = vUv - uDt * texture(uVel, mid).xy * uScale;
  vec4 d = sampleSharp(back);
  d.rg *= inside(back);
  // the far layer drifts more slowly and more softly: depth, not a copy
  vec2 midF = vUv - 0.5 * uDt * uFarLag * v * uScale;
  vec2 backF = vUv - uDt * uFarLag * texture(uVel, midF).xy * uScale;
  d.ba = (uFarSharp > 0.5 ? sampleSharp(backF).ba : textureLod(uDye, backF, 0.0).ba) * inside(backF);
  if (uMist > 0.0) d = mix(d, textureLod(uDye, back, 2.0), uMist);
  float calm = 0.0;
  for (int i = 0; i < ${MAX_CALM}; i++) {
    if (i < uCalmCount) calm = max(calm, calmMask(vUv, i) * uCalmP[i].w);
  }
  d *= uDecay * exp(-uDt * uCalmDecay * calm);
  o = max(d - uFloor, 0.0);
}`,

  // Adds momentum: a soft push, optionally with a twist.
  splatVel: `${HEAD}
${NOISE}
uniform vec2 uPoint;
uniform float uRadius;
uniform vec2 uForce;
uniform float uSpin;
uniform float uTurb;
uniform float uSeed;
uniform float uAspect;
void main() {
  vec2 d = vUv - uPoint;
  d.x *= uAspect;
  float q = dot(d, d) / (uRadius * uRadius);
  float g = exp(-q);
  vec2 f = uForce * g + uSpin * vec2(-d.y, d.x) / uRadius * g;
  if (uTurb > 0.0) {
    // small eddies inside the push, so the body of a drop is churned and not just carried
    vec2 p = d / uRadius * 2.4;
    uint s = uint(uSeed);
    float e = 0.06;
    float nx = vnoise(p + vec2(e, 0.0), s) - vnoise(p - vec2(e, 0.0), s);
    float ny = vnoise(p + vec2(0.0, e), s) - vnoise(p - vec2(0.0, e), s);
    f += uTurb * vec2(ny, -nx) / (2.0 * e) * g;
  }
  o = vec4(f, 0.0, 0.0);
}`,

  // Adds ink: a soft body with veins in it, so that shear has something to draw into filaments.
  splatDye: `${HEAD}
${NOISE}
uniform vec2 uPoint;
uniform float uRadius;
uniform vec4 uAmount;    // near black, near blue, far black, far blue
uniform float uSeed;
uniform float uGrain;
uniform float uFiber;
uniform float uAspect;
uniform vec2 uStretch;   // elongation along an axis: direction * (factor - 1)
float veins(vec2 q, uint s) {
  vec2 w = vec2(vnoise(q * 0.6 + 3.1, s + 11u), vnoise(q * 0.6 - 1.7, s + 23u)) - 0.5;
  q += w * 1.6;
  float a = 1.0 - abs(2.0 * vnoise(q, s) - 1.0);
  float b = 1.0 - abs(2.0 * vnoise(q * 2.3 + 5.2, s + 37u) - 1.0);
  return a * a * 0.62 + b * b * b * 0.38;
}
void main() {
  vec2 d = vUv - uPoint;
  d.x *= uAspect;
  float along = dot(d, normalize(uStretch + vec2(1e-6, 0.0)));
  float k = length(uStretch);
  d -= normalize(uStretch + vec2(1e-6, 0.0)) * along * (k / (1.0 + k));
  float r = length(d) / uRadius;
  uint s = uint(uSeed);
  float lump = vnoise(d / uRadius * 1.7 + 9.0, s + 5u);
  float rn = r * (0.82 + 0.4 * lump);
  float body = exp(-rn * rn * 1.4);
  float halo = exp(-r * r * 0.42);
  vec2 q = d / uRadius * uGrain;
  float vn = veins(q, s);
  float vf = veins(q * 0.55 + 7.3, s + 101u);
  float nearInk = body * mix(1.0, 0.18 + 2.3 * vn, uFiber) + 0.03 * halo;
  float wide = exp(-rn * rn * 0.75);
  float farInk = wide * mix(1.0, 0.2 + 2.1 * vf, uFiber) + 0.04 * halo;
  o = vec4(uAmount.rg * nearInk, uAmount.ba * farInk);
}`,

  // A push on everything that carries ink (a scroll, a nudge): the ink lags and curls.
  impulse: `${HEAD}
${NOISE}
uniform sampler2D uDye;
uniform vec2 uForce;
uniform float uSeed;
uniform float uAspect;
void main() {
  vec4 d = max(textureLod(uDye, vUv, 3.0), 0.0);
  float m = clamp((d.r + d.g + 0.6 * (d.b + d.a)) * 2.5, 0.0, 1.0);
  float n = vnoise(vec2(vUv.x * uAspect, vUv.y) * 3.3, uint(uSeed));
  o = vec4(uForce * (0.15 + 0.85 * m) * (0.35 + 1.3 * n), 0.0, 0.0);
}`,

  composite: `${HEAD}
${NOISE}
${CALM}
uniform sampler2D uDye;
uniform vec2 uDyeSize;
uniform float uFrame;
uniform vec3 uGround;
uniform vec3 uBlackTint;
uniform vec3 uBlackColor;
uniform float uBlackOpacity;
uniform vec3 uBlueTint;
uniform vec3 uBlueColor;
uniform float uBlueOpacity;
uniform vec3 uBlueDeep;
uniform float uBlueDeepRate;
uniform float uBlueShade;
uniform vec3 uBlueShadeTint;
uniform float uDensity;
uniform float uGamma;
uniform vec2 uInkGain;
uniform vec4 uFar;        // density, lod, scale, unused
uniform vec2 uFarShift;
uniform vec2 uLightStep;  // uv step toward the light
uniform vec4 uShade;      // shadow strength, ambient light, limb, ground shadow
uniform float uShadowDepth;
uniform float uGrain;
uniform float uUpsample;
uniform float uDark;      // 1: the ground is dark, ink scatters light
uniform float uCalmCap[${MAX_CALM}];   // relative luminance a zone guarantees; below zero: none
uniform int uShadowSteps;

vec4 smoothTex(vec2 uv, float lod) {
  vec2 size = uDyeSize / exp2(lod);
  vec2 p = uv * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / size;
  vec2 h1 = (i + 1.5 + w3 / g1) / size;
  return
    textureLod(uDye, vec2(h0.x, h0.y), lod) * (g0.x * g0.y) +
    textureLod(uDye, vec2(h1.x, h0.y), lod) * (g1.x * g0.y) +
    textureLod(uDye, vec2(h0.x, h1.y), lod) * (g0.x * g1.y) +
    textureLod(uDye, vec2(h1.x, h1.y), lod) * (g1.x * g1.y);
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float mass(vec4 d) { return d.r + 0.8 * d.g + 0.5 * (d.b + 0.8 * d.a); }
vec3 inkOver(vec3 bg, float k, float b, float light) {
  // in its own shadow blue ink loses red and green first: it stays blue, it does not go dark
  vec3 lit = mix(vec3(1.0), vec3(light), uBlueShade * uBlueShadeTint);
  vec3 c = mix(bg * exp(-uBlueTint * b), uBlueColor * lit, 1.0 - exp(-uBlueOpacity * b));
  c *= mix(vec3(1.0), uBlueDeep, 1.0 - exp(-uBlueDeepRate * b));
  c = mix(c * exp(-uBlackTint * k), uBlackColor * light, 1.0 - exp(-uBlackOpacity * k));
  return c;
}
vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  vec2 uv = vUv;
  float calm = 1.0;
  for (int i = 0; i < ${MAX_CALM}; i++) {
    if (i < uCalmCount) calm = min(calm, mix(1.0, uCalmP[i].y, calmMask(uv, i)));
  }
  float gain = calm * uDensity;

  vec4 dn = uUpsample > 0.5 ? smoothTex(uv, 0.0) : textureLod(uDye, uv, 0.0);
  dn = pow(max(dn, 0.0), vec4(uGamma));
  float nk = dn.r * gain * uInkGain.x;
  float nb = dn.g * gain * uInkGain.y;

  if (uShade.z > 0.0) {
  // the edge of a sheet of ink seen side-on is denser than its face
  vec2 px = 1.6 / uDyeSize;
  vec4 gx = textureLod(uDye, uv + vec2(px.x, 0.0), 1.0) - textureLod(uDye, uv - vec2(px.x, 0.0), 1.0);
  vec4 gy = textureLod(uDye, uv + vec2(0.0, px.y), 1.0) - textureLod(uDye, uv - vec2(0.0, px.y), 1.0);
  nk += uShade.z * gain * uInkGain.x * length(vec2(gx.r, gy.r));
  nb += uShade.z * gain * uInkGain.y * length(vec2(gx.g, gy.g));
  }

  // soft self-shadow: how much ink lies between this point and the light
  float occ = 0.0;
  for (int i = 0; i < uShadowSteps; i++) {
    float t = float(i) + 0.75;
    occ += mass(max(textureLod(uDye, uv + uLightStep * t, 2.5 + 0.45 * float(i)), 0.0));
  }
  occ *= gain / float(uShadowSteps);
  float shadow = exp(-uShade.x * occ);
  float light = uShade.y + (1.0 - uShade.y) * shadow;
  float deepen = 1.0 + uShadowDepth * (1.0 - shadow);

  vec3 col = uGround;
  if (uFar.x > 0.0) {
  vec2 uvF = (uv - 0.5) * uFar.z + 0.5 + uFarShift;
  vec4 df = pow(max(smoothTex(uvF, uFar.y), 0.0), vec4(uGamma));
  float fk = df.b * gain * uFar.x * uInkGain.x;
  float fb = df.a * gain * uFar.x * uInkGain.y;
  if (uShade.w > 0.0) {
    // the ink hangs in front of the ground and shades it, softly and a little below
    vec4 gs = max(smoothTex(uv - uLightStep * 2.2, 4.0), 0.0);
    col *= 1.0 - uShade.w * (1.0 - exp(-1.2 * mass(gs) * gain));
  }
  col = inkOver(col, fk, fb, mix(1.0, light, 0.5));
  }
  col = inkOver(col, nk * deepen, nb * deepen, light);

  // The guarantee of a calm zone, in linear light: the pixel is pulled toward the ground until its
  // relative luminance is no lower (light ground) or no higher (dark ground) than the cap.
  float side = uDark > 0.5 ? -1.0 : 1.0;
  float bound = uDark > 0.5 ? 1.0 : 0.0;
  float guarded = 0.0;
  for (int i = 0; i < ${MAX_CALM}; i++) {
    if (i < uCalmCount && uCalmCap[i] >= 0.0) {
      float m = capMask(uv, i);
      float held = mix(uDark > 0.5 ? 1.0 : 0.0, uCalmCap[i], m);
      bound = uDark > 0.5 ? min(bound, held) : max(bound, held);
      guarded = max(guarded, m);
    }
  }
  float yg = luma(uGround);
  float away = side * (yg - luma(col));
  float room = max(side * (yg - bound), 0.0);
  if (away > room) col = uGround + (col - uGround) * (room / away);

  vec3 c = encode(col);
  vec3 g = encode(uGround);
  float presence = clamp(dot(abs(c - g), vec3(1.0)) * 6.0, 0.0, 1.0);
  ivec2 fc = ivec2(gl_FragCoord.xy);
  uint fs = uint(uFrame);
  float n1 = hash(fc, fs);
  float n2 = hash(fc + ivec2(31, 17), fs + 1u);
  float tri = n1 - n2;
  // no grain where a cap is promised: only the one-step dither that hides banding
  c += tri * (1.0 / 255.0 + uGrain * (1.0 - guarded)) * presence;

  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
};
