/**
 * GLSL ES 3.00 sources of the metallic swirl.
 *
 * The image is a field of thin, soft filaments: a point is pushed through an analytic wave field for a
 * few steps (`flow`), the direction it ends up travelling in picks a position in a repeating
 * three-colour stripe cycle (`stripeColor`), and with transparent base/mid colours only the narrow
 * highlight strip of each cycle survives. `uRadial` bends the domain into polar "beams from a centre".
 * Output is premultiplied alpha.
 */

/** Two-triangle quad from one static buffer; `vUv` runs 0..1 with y up (0 = bottom of the canvas). */
export const SWIRL_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const SWIRL_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uRes;          // drawing-buffer size in pixels
uniform float uTime;        // initialTime + animated time + eased offset
uniform float uZoom;
uniform float uIter;        // advection steps, fractional
uniform float uEps;         // finite-difference step
uniform float uTangent;
uniform float uGrad;
uniform float uBright;
uniform float uContrast;
uniform vec4 uBg;           // premultiplied
uniform float uAlpha;
uniform float uRadial;
uniform float uBeams;       // integer value
uniform float uStretch;
uniform float uFlow;
uniform float uSpinPhase;   // integral of radialSpin over time
uniform float uBeamWidth;
uniform float uTwist;
uniform float uVortex;
uniform float uHole;
uniform vec2 uCenter;
uniform float uVignette;
uniform float uColorMode;   // 1 = stripes, 0 = phase
uniform vec4 uColorA;       // highlight (straight alpha)
uniform vec4 uColorB;       // base
uniform vec4 uColorC;       // mid
uniform vec4 uTint;
uniform float uRepetition;
uniform float uSoftness;
uniform float uBandWidth;
uniform float uShiftRed;
uniform float uShiftBlue;
uniform float uStripePhase; // integral of stripeFlow over time
uniform float uStripeRadial;
uniform float uSpread;
uniform float uThreshold;
uniform float uDetailFade;
uniform float uFadeLeft;
uniform float uFadeRight;
uniform float uFadeTop;
uniform float uFadeBottom;

const float PI = 3.14159;
const float HALF_PI = 1.570795;
const float TAU = 6.28318;
const int MAX_STEPS = 12;
const float SEAM_REACH = 2.0; // pixels on each side of an angle wrap that are anti-aliased by hand

float wave(vec2 p, float t) {
  return sin(p.x + sin(p.y + 0.1 * t)) * sin(0.1 * p.x * p.y + 0.2 * t);
}

// Sign-preserving power. The floor w (about one pixel of the argument) keeps the zero crossing from
// turning into a hard, aliased edge when k is small.
float sharpen(float c, float k, float w) {
  float m = max(abs(c), max(w, 1e-4));
  return c / m * pow(m, k);
}

// Pushes st through the wave field and returns the direction of travel after the last step.
vec2 flow(vec2 st, float t) {
  float r = length(st);
  float logR = log(r + 0.05);
  float theta = r > 0.0 ? atan(st.y, st.x) : 0.0;
  float ang = theta + uSpinPhase + logR * uTwist + uVortex / (r + 0.15);

  // Angle covered by one pixel, used as the anti-aliasing floor of the lobe shaper.
  float pixel = uZoom / uRes.y;
  float core = r + 0.15;
  float anglePerPixel = pixel * (1.0 / max(r, 0.001) + abs(uTwist) / (r + 0.05) + abs(uVortex) / (core * core));

  float lobes = sharpen(cos(ang * uBeams), uBeamWidth, anglePerPixel * uBeams)
    + 0.5 * sharpen(sin(ang * (uBeams + 1.0) + 0.3 * t), uBeamWidth, anglePerPixel * (uBeams + 1.0));
  vec2 polar = vec2(lobes * PI, logR * uStretch);

  // Polar blend, forced back to cartesian at the very centre where the polar domain is singular.
  float k = uRadial * smoothstep(0.0, 0.15 * uZoom, r);
  vec2 p = mix(st, polar, k);
  float localTime = t - r * uFlow * k;

  vec2 heading = vec2(0.0);
  for (int i = 0; i < MAX_STEPS; i++) {
    float weight = clamp(uIter - float(i), 0.0, 1.0);
    if (weight <= 0.0) break;
    float here = wave(p, localTime);
    vec2 gradient = vec2(
      wave(p + vec2(uEps, 0.0), localTime) - here,
      wave(p + vec2(0.0, uEps), localTime) - here
    ) / uEps;
    vec2 tangent = vec2(-gradient.y, gradient.x);
    p += (uTangent * tangent + uGrad * gradient) * weight;
    heading = mix(heading, tangent, weight);
  }
  return heading;
}

// 1 at the swirl's centre, falling to 0 a little over half a zoom unit out.
float centreBump(float r) {
  return clamp(1.0 - pow(1.8 * r / uZoom, 1.2), 0.0, 1.0);
}

float burn(float v, float tint) {
  return mix(v, 1.0 - min(1.0, (1.0 - v) / max(tint, 1e-4)), uTint.a);
}

// One channel of the stripe cycle at phase p (0..1): a = highlight, b = base, c = mid.
// widths = (thin strip, second strip, wide strip), k = edge softness.
float stripeChannel(float a, float b, float c, float p, float k, float tint, vec3 widths, float bump) {
  float soft = max(2.0 * k, 1e-5);
  float second = widths.x + widths.y;
  float v = mix(b, a, smoothstep(0.0, soft, p));
  v = mix(v, c, smoothstep(widths.x, widths.x + soft, p));
  float edge = widths.x + 0.4 * (1.0 - bump) * widths.y;
  v = mix(v, a, smoothstep(edge, edge + soft, p));
  edge = widths.x + 0.5 * (1.0 - bump) * widths.y;
  v = mix(v, c, smoothstep(edge, edge + soft, p));
  v = mix(v, a, smoothstep(second, second + soft, p));
  float tail = mix(c, b, smoothstep(0.0, max(uSpread, 1e-4), (p - second) / max(widths.z, 1e-4)));
  v = mix(v, tail, smoothstep(second, second + max(0.5 * k, 1e-5), p));
  return burn(v, tint);
}

// The stripe cycle at three channel phases (in cycles, not wrapped). footprint = phase covered by one
// pixel, per channel; density = stripe cycles per pixel. Returns premultiplied rgba.
vec4 stripeLayer(vec3 phases, vec3 footprint, float density, float bump) {
  float thin = uBandWidth / uRepetition * (1.0 - 0.4 * bump);
  float second = uBandWidth * 0.5833 / uRepetition * (1.0 + 0.4 * bump);
  vec3 widths = vec3(
    thin * uRepetition,
    second * uRepetition - 0.02 * smoothstep(0.0, 1.0, bump),
    1.0 - thin - second
  );
  float k = uSoftness / 3.0;
  vec3 p = fract(phases);

  vec4 a = vec4(uColorA.rgb * uColorA.a, uColorA.a);
  vec4 b = vec4(uColorB.rgb * uColorB.a, uColorB.a);
  vec4 c = vec4(uColorC.rgb * uColorC.a, uColorC.a);

  vec4 rgba = vec4(
    stripeChannel(a.r, b.r, c.r, p.r, k + footprint.r, uTint.r, widths, bump),
    stripeChannel(a.g, b.g, c.g, p.g, k + footprint.g, uTint.g, widths, bump),
    stripeChannel(a.b, b.b, c.b, p.b, k + footprint.b, uTint.b, widths, bump),
    stripeChannel(a.a, b.a, c.a, p.g, k + footprint.g, 1.0, widths, bump)
  );
  return rgba * (1.0 - uDetailFade * smoothstep(0.05, 0.2, density));
}

// heading = direction of travel; its angle picks the place in the stripe cycle. Premultiplied rgba.
vec4 stripeColor(vec2 heading, float r) {
  bool moving = dot(heading, heading) > 0.0;
  float angle = moving ? atan(heading.y, heading.x) : 0.0;
  // The same direction measured from the opposite axis: continuous exactly where angle wraps.
  float flipped = moving ? atan(-heading.y, -heading.x) : PI;

  // Chromatic fringes grow away from the centre.
  float bump = centreBump(r);
  float dispersion = clamp(1.0 - bump, 0.0, 1.0);
  vec3 fringe = vec3(dispersion * uShiftRed / 20.0, 0.0, -dispersion * 1.3 * uShiftBlue / 20.0);
  float offset = uStripeRadial * r / uZoom - uStripePhase;

  vec3 phases = angle / TAU * uRepetition + offset + fringe;
  vec3 footprint = fwidth(fract(phases));
  // The two fract() seams are half a cycle apart, so the minimum ignores them.
  float density = min(footprint.g, fwidth(fract(phases.g + 0.5)));

  // Where the angle wraps from +PI to -PI the phase jumps by uRepetition cycles, which is a hard edge
  // whenever that is not a whole number. Screen-space derivatives are useless across the jump, so the
  // pixels beside it take their footprint from the flipped angle and blend the two sides over one
  // pixel. Everything is derived here, before the branch, as derivatives must be.
  vec3 smoothFootprint = fwidth(flipped / TAU * uRepetition + offset + fringe);
  float turn = length(vec2(dFdx(flipped), dFdy(flipped))); // radians per pixel
  float seam = abs(flipped) < HALF_PI ? abs(flipped) / max(turn, 1e-6) : SEAM_REACH; // pixels to the wrap
  if (seam >= SEAM_REACH) return stripeLayer(phases, footprint, density, bump);

  float jump = angle < 0.0 ? uRepetition : -uRepetition;
  vec4 here = stripeLayer(phases, smoothFootprint, smoothFootprint.g, bump);
  vec4 there = stripeLayer(phases + jump, smoothFootprint, smoothFootprint.g, bump);
  return mix(there, here, clamp(0.5 + seam, 0.0, 1.0));
}

float ramp(float b, float c, float a, float s) {
  return s < 0.5 ? mix(b, c, 2.0 * s) : mix(c, a, 2.0 * s - 1.0);
}

// "phase" colour mode: a thresholded sine of the field value instead of a stripe cycle.
vec4 phaseColor(float value, float along, float r) {
  float dispersion = clamp(1.0 - centreBump(r), 0.0, 1.0);
  float val = value + uStripeRadial * TAU * r / uZoom;
  float shiftR = clamp(dispersion * uShiftRed * 12.0 * along, -4.0, 4.0);
  float shiftB = clamp(dispersion * uShiftBlue * 12.0 * along, -4.0, 4.0);
  float soft = mix(0.02, 0.5, uSoftness) + min(abs(along), 0.2) * 0.5;

  vec3 s = vec3(sin(3.11 + val + shiftR), sin(3.11 + val), sin(3.11 + val - shiftB)) * 0.5 + 0.5;
  s = smoothstep(uThreshold - soft, uThreshold + soft, s);

  vec4 a = vec4(uColorA.rgb * uColorA.a, uColorA.a);
  vec4 b = vec4(uColorB.rgb * uColorB.a, uColorB.a);
  vec4 c = vec4(uColorC.rgb * uColorC.a, uColorC.a);

  vec4 rgba = vec4(
    burn(ramp(b.r, c.r, a.r, s.r), uTint.r),
    burn(ramp(b.g, c.g, a.g, s.g), uTint.g),
    burn(ramp(b.b, c.b, a.b, s.b), uTint.b),
    burn(ramp(b.a, c.a, a.a, s.g), 1.0)
  );
  return rgba * (1.0 - uDetailFade * smoothstep(0.05, 0.2, fwidth(val) / TAU));
}

float edgeFade(float distanceFromEdge, float width) {
  return width > 1e-4 ? smoothstep(0.0, width, distanceFromEdge) : 1.0;
}

void main() {
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 st = (vUv - uCenter) * aspect * uZoom;
  float r = length(st);
  vec2 heading = flow(st, uTime);

  bool stripes = uColorMode > 0.5;

  // "phase" mode also reads the field one pixel further out and one pixel further in. That sits in a
  // branch of its own, free of derivative calls, so "stripes" mode never pays for the two extra
  // evaluations on drivers that flatten every branch containing a derivative.
  float along = 0.0;
  if (!stripes) {
    vec2 px = st / max(r, 0.001) * (uZoom / uRes.y);
    vec2 outer = flow(st + px, uTime);
    vec2 inner = flow(st - px, uTime);
    along = ((outer.x - outer.y) - (inner.x - inner.y)) * 0.5;
  }

  // Both colourings take screen-space derivatives, so both run outside any branch; they are cheap
  // next to flow().
  vec4 striped = stripeColor(heading, r);
  vec4 phased = phaseColor(heading.x - heading.y, along, r);
  vec4 layer = stripes ? striped : phased;

  vec3 color = layer.rgb;
  float cover = layer.a;
  color = (color - 0.5 * cover) * uContrast + 0.5 * cover;
  color *= uBright;

  float corner = length((vUv - 0.5) * aspect) / length(aspect * 0.5);
  float edges = edgeFade(vUv.x, uFadeLeft) * edgeFade(1.0 - vUv.x, uFadeRight)
    * edgeFade(1.0 - vUv.y, uFadeTop) * edgeFade(vUv.y, uFadeBottom);
  float shape = smoothstep(0.0, max(uHole * uZoom * 0.25, 0.001), r)
    * (1.0 - uVignette * smoothstep(0.35, 1.1, corner)) * edges;
  color *= shape;
  cover *= shape;

  // Dim lines are thinned further: alpha follows four times the luminance.
  float mask = clamp(4.0 * dot(color, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
  vec3 rgb = mix(uBg.rgb, color, mask);
  float alpha = uBg.a + (1.0 - uBg.a) * cover * mask;
  fragColor = vec4(rgb, alpha) * uAlpha;
}
`;
