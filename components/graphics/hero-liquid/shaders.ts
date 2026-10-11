/**
 * GLSL ES 3.00 sources for the hero ribbons. One fullscreen fragment pass, no geometry, no normals,
 * no environment map: the chrome look is a repeating light/dark "reflection stripe" ramp whose phase
 * is bent across each ribbon by the edge field, with the red and blue channels phase-shifted for thin
 * warm and cool fringes. The ribbon shapes come from the three mask textures (see mask.ts).
 */

import { FULLSCREEN_TRIANGLE_VS } from "@/lib/gl/program";

/** Attribute-less fullscreen triangle; provides `v_uv` (0..1, origin bottom-left). */
export const LIQUID_VERTEX_SHADER = FULLSCREEN_TRIANGLE_VS;

export const LIQUID_FRAGMENT_SHADER = `#version 300 es
precision highp float;
// The meta texture packs a 16-bit arc length into two bytes and the edge field is a float texture:
// neither survives a low-precision sampler.
precision highp sampler2D;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_image;   // R feathered coverage, G crisp coverage, B premultiplied tone
uniform sampler2D u_meta;    // R branch id, G:B 16-bit arc length (nearest filtered)
uniform sampler2D u_edge;    // 0 on a ribbon's ridge .. 1 at its rims (half resolution, float)

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_repetition;
uniform float u_softness;
uniform float u_shiftRed;
uniform float u_shiftBlue;
uniform float u_shadowBlue;
uniform float u_distortion;
uniform float u_contour;
uniform float u_angle;
uniform float u_flow;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform float u_branchReveal[4];
uniform float u_feather;

const float PI = 3.14159265358979;

vec2 rotate(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Soft band-pass: rises over a..b, falls over c..d.
float band(float a, float b, float c, float d, float x) {
  return smoothstep(a, b, x) * (1.0 - smoothstep(c, d, x));
}

vec3 permute289(vec3 x) {
  return mod((x * 34.0 + 1.0) * x, 289.0);
}

// 2-D simplex noise, about -1..1.
float simplexNoise(vec2 p) {
  const float SKEW = 0.366025403784439;       // (sqrt(3) - 1) / 2
  const float UNSKEW = 0.211324865405187;     // (3 - sqrt(3)) / 6
  const float FAR_CORNER = -0.577350269189626; // 2 * UNSKEW - 1
  const float GRADIENT_STEP = 0.024390243902439; // 1 / 41

  vec2 cell = floor(p + (p.x + p.y) * SKEW);
  vec2 d0 = p - cell + (cell.x + cell.y) * UNSKEW;
  vec2 middle = d0.x > d0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 d1 = d0 + UNSKEW - middle;
  vec2 d2 = d0 + FAR_CORNER;

  cell = mod(cell, 289.0);
  vec3 hash = permute289(
    permute289(cell.y + vec3(0.0, middle.y, 1.0)) + cell.x + vec3(0.0, middle.x, 1.0));

  vec3 falloff = max(0.5 - vec3(dot(d0, d0), dot(d1, d1), dot(d2, d2)), 0.0);
  falloff *= falloff;
  falloff *= falloff;

  vec3 gx = 2.0 * fract(hash * GRADIENT_STEP) - 1.0;
  vec3 gy = abs(gx) - 0.5;
  gx -= floor(gx + 0.5);
  falloff *= 1.79284291400159 - 0.85373472095314 * (gx * gx + gy * gy);

  vec3 corners = vec3(
    gx.x * d0.x + gy.x * d0.y,
    gx.y * d1.x + gy.y * d1.y,
    gx.z * d2.x + gy.z * d2.y);
  return 130.0 * dot(falloff, corners);
}

// Cubic B-spline reconstruction of the edge field from four bilinear taps. Plain bilinear shows the
// texel grid as creases once the field is raised to a power and used as a stripe phase.
float edgeField(vec2 uv) {
  vec2 size = vec2(textureSize(u_edge, 0));
  vec2 coord = uv * size - 0.5;
  vec2 f = fract(coord);
  vec2 cell = coord - f;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;

  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;

  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 p0 = (cell - 1.0 + w1 / g0 + 0.5) / size;
  vec2 p1 = (cell + 1.0 + w3 / g1 + 0.5) / size;

  float lower = g0.x * texture(u_edge, vec2(p0.x, p0.y)).r + g1.x * texture(u_edge, vec2(p1.x, p0.y)).r;
  float upper = g0.x * texture(u_edge, vec2(p0.x, p1.y)).r + g1.x * texture(u_edge, vec2(p1.x, p1.y)).r;
  return g0.y * lower + g1.y * upper;
}

// One stripe cycle for one colour channel, x in 0..1: a thin light line, a thin dark line (with an
// extra hairline pair where the bump is low), then a long light-to-dark gradient.
float stripe(float light, float dark, float x, vec3 widths, float blur, float bump) {
  float lift = smoothstep(0.2, 0.8, bump);
  float hairlineOn = widths.x + 0.4 * (1.0 - lift) * widths.y;
  float hairlineOff = widths.x + 0.5 * (1.0 - lift) * widths.y;
  float wide = widths.x + widths.y;

  float value = mix(dark, light, smoothstep(0.0, 2.0 * blur, x));
  value = mix(value, dark, smoothstep(widths.x, widths.x + 2.0 * blur, x));
  value = mix(value, light, smoothstep(hairlineOn, hairlineOn + 2.0 * blur, x));
  value = mix(value, dark, smoothstep(hairlineOff, hairlineOff + 2.0 * blur, x));
  value = mix(value, light, smoothstep(wide, wide + 2.0 * blur, x));
  float gradient = mix(light, dark, smoothstep(0.0, 1.0, (x - wide) / widths.z));
  return mix(value, gradient, smoothstep(wide, wide + 0.5 * blur, x));
}

// Screen-space width of a CONTINUOUS phase (never of its fract). Moderate derivatives are capped,
// because their per-quad noise shows as a checkerboard on some GPUs; very large ones (stripe cycles
// squeezed into a few pixels on a ribbon's flank) pass through so they blur instead of sparkling.
float phaseWidth(float phase, float cap) {
  float width = fwidth(phase);
  return mix(min(width, cap), width, smoothstep(4.0 * cap, 12.0 * cap, width));
}

void main() {
  float tau = 0.3 * (u_time + 2.8);

  // Canvas -> mask space. Row 0 of the textures is the top of the artwork.
  vec2 uv = u_uvOffset + vec2(v_uv.x, 1.0 - v_uv.y) * u_uvScale;
  vec2 uvDx = dFdx(uv);
  vec2 uvDy = dFdy(uv);
  vec4 base = textureGrad(u_image, uv, uvDx, uvDy);
  vec4 meta = textureGrad(u_meta, uv, uvDx, uvDy);

  // Trim-path reveal: each ribbon is drawn in along its own arc length, rims lagging the ridge.
  int branch = clamp(int(meta.r * 4.0), 0, 3);
  float along = (meta.g * 65280.0 + meta.b * 255.0) / 65535.0;
  float edge0 = clamp(edgeField(uv), 0.0, 1.0);
  float reveal = u_branchReveal[branch];
  float front = along + u_feather * edge0;
  float visible = 1.0 - smoothstep(reveal - u_feather, reveal, front);

  // Silhouette: the crisp coverage re-thresholded against its own screen-space derivative.
  float coverageWidth = max(fwidth(base.g), 1e-4);
  float alpha = clamp((base.g - 0.5) / coverageWidth + 0.5, 0.0, 1.0) * visible;

  // Two colours per pixel from the un-premultiplied branch tone.
  float shade = clamp(base.b / max(base.r, 0.004), 0.0, 1.0);
  float lightLevel = min(1.0, 0.72 + 0.5 * shade);
  float darkLevel = 0.05 + 0.85 * shade;
  vec3 light = vec3(0.98 * lightLevel, 0.98 * lightLevel, lightLevel);
  vec3 dark = vec3(darkLevel, darkLevel, darkLevel + u_shadowBlue);

  // Auxiliary fields.
  vec2 turned = rotate(uv - 0.5, radians(70.0 - u_angle)) + 0.5;
  float diagonal = turned.x - turned.y;
  float edge = pow(edge0, 1.6) * smoothstep(0.0, 0.4, u_contour);

  vec2 centred = uv - 0.5;
  float dist = length(centred + vec2(0.0, 0.2 * diagonal));
  centred = rotate(centred, (1.0 - u_flow) * (0.25 - 0.2 * diagonal) * PI);
  float phase = centred.x;

  float bump = (1.0 - pow(1.8 * dist, 1.2)) * pow(uv.y, 0.3);

  // Stripe widths use the bump before its extra vertical factor below.
  float thin1 = 0.12 / u_repetition * (1.0 - 0.4 * bump);
  float thin2 = 0.07 / u_repetition * (1.0 + 0.4 * bump);
  vec3 widths = vec3(u_repetition * thin1, u_repetition * thin2, 1.0 - thin1 - thin2);

  float noise = simplexNoise(uv - mix(vec2(tau), vec2(tau, 0.0), u_flow));
  edge += (1.0 - edge) * u_distortion * noise;
  float edgeSmooth = smoothstep(0.0, 1.0, edge);
  float contour = smoothstep(0.5, 1.0, u_contour);

  // Stripe phase. The order of these steps matters.
  phase += mix(1.0, 0.3, u_flow) * diagonal;
  phase -= 2.0 * noise * diagonal * edgeSmooth * (1.0 - edgeSmooth);
  phase *= mix(1.0, 1.0 - edge, contour);
  phase -= 1.7 * edge * contour;
  phase += 0.2 * pow(u_contour, 4.0) * (1.0 - edgeSmooth);
  bump *= clamp(pow(uv.y, 0.1), 0.3, 1.0);
  phase *= 0.1 + (1.1 - edge) * mix(bump, 0.6, u_flow);
  phase *= 0.4 + 0.6 * (1.0 - smoothstep(0.5, 1.0, edge));
  phase += 0.18 * band(0.1, 0.2, 0.2, 0.4, uv.y) + 0.03 * band(0.1, 0.2, 0.2, 0.4, 1.0 - uv.y);
  phase *= mix(0.5 + 0.5 * uv.y * uv.y, 1.0, u_flow);
  phase *= u_repetition;
  phase -= tau;

  // Chromatic dispersion: red runs ahead of green, blue behind it.
  float spread = clamp(1.0 - bump, 0.0, 1.0);
  float shiftRed = spread + 0.03 * bump * noise
    + 5.0 * band(-0.1, 0.2, 0.1, 0.5, uv.y) * band(0.4, 0.6, 0.4, 1.0, bump) - diagonal;
  float shiftBlue = 1.3 * spread
    + band(0.0, 0.4, 0.1, 0.8, uv.y) * band(0.4, 0.6, 0.4, 0.8, bump) - 0.2 * edge;
  shiftRed *= u_shiftRed / 20.0;
  shiftBlue *= u_shiftBlue / 20.0;

  // Edge softness.
  float softness = 0.05 * u_softness;
  float blur = softness
    + 0.5 * smoothstep(1.0, 10.0, u_repetition) * edgeSmooth
    + (1.0 - smoothstep(100.0, 500.0, min(u_resolution.x, u_resolution.y))) * edgeSmooth;
  float blurRed = softness * (0.05 + 0.1 * (u_shiftRed / 20.0) * bump);
  float blurGreen = softness * 0.05 / max(0.001, abs(1.0 - diagonal));
  widths.y -= 0.02 * smoothstep(0.0, 1.0, edge + bump);

  float cap = 0.2 * blur;
  float phaseRed = phase + shiftRed;
  float phaseBlue = phase - shiftBlue;
  float red = stripe(light.r, dark.r, fract(phaseRed), widths,
    blur + phaseWidth(phaseRed, cap) + blurRed, bump);
  float green = stripe(light.g, dark.g, fract(phase), widths,
    blur + phaseWidth(phase, cap) + blurGreen, bump);
  float blue = stripe(light.b, dark.b, fract(phaseBlue), widths,
    blur + phaseWidth(phaseBlue, cap), bump);

  // Premultiplied output with an interleaved-gradient-noise dither of +-0.5/255.
  float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5;
  vec3 color = vec3(red, green, blue) * alpha;
  color = clamp(color + dither * alpha / 255.0, 0.0, alpha);
  fragColor = vec4(color, alpha);
}
`;
