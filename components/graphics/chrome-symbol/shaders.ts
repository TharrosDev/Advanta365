/*
 * Fragment shader of the chrome symbol (GLSL ES 3.00). The vertex stage is the shared fullscreen
 * triangle from lib/gl/program.
 *
 * One orthographic ray per pixel is sphere-traced against the mark extruded along Z:
 *   field(p.xy)  exact 2-D distance to the mark = union of three capsules (analytic, no texture)
 *   map(p)       the field inset by the bevel, extruded to the half depth, rounded by the bevel
 * Shading is a mirror reflection of a small procedural studio (dark floor, bright sky, three strip
 * lights, a key and a fill highlight) with Schlick Fresnel and a four-tap SDF occlusion term,
 * tone-mapped, gamma-encoded and dithered. Output is premultiplied alpha on a transparent canvas;
 * the silhouette is anti-aliased analytically from the closest approach of the ray.
 */

/** Upper bound of sphere-tracing steps per pixel. */
export const TRACE_STEPS = 96;

export const CHROME_SYMBOL_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 u_resolution;   // drawing buffer size in device px
uniform vec2 u_view;         // orthographic half extents in glyph units
uniform vec3 u_bounds;       // half extents of the box that encloses the solid
uniform mat3 u_toObject;     // view space -> object space
uniform mat3 u_toWorld;      // object space -> view space
uniform vec4 u_seg[3];       // the three strokes of the mark: (a.xy, b.xy)
uniform float u_radius;      // stroke radius
uniform float u_depth;
uniform float u_bevel;
uniform float u_roughness;
uniform float u_parallax;
uniform float u_exposure;
uniform float u_pixel;       // glyph units per device pixel
uniform float u_normalEps;
uniform vec3 u_key;
uniform vec3 u_fill;
uniform vec3 u_tint;

out vec4 fragColor;

const int STEPS = ${TRACE_STEPS};
const float HIT = 2e-4;

float capsule(vec2 p, vec4 seg) {
  vec2 toPoint = p - seg.xy;
  vec2 along = seg.zw - seg.xy;
  float h = clamp(dot(toPoint, along) / max(dot(along, along), 1e-8), 0.0, 1.0);
  return length(toPoint - along * h);
}

// Signed distance to the flat mark, negative inside.
float field(vec2 p) {
  float d = min(capsule(p, u_seg[0]), min(capsule(p, u_seg[1]), capsule(p, u_seg[2])));
  return d - u_radius;
}

// The mark as a slab with rounded edges.
float map(vec3 p) {
  vec2 q = vec2(field(p.xy) + u_bevel, abs(p.z) - (u_depth - u_bevel));
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - u_bevel;
}

vec3 surfaceNormal(vec3 p) {
  vec2 e = vec2(u_normalEps, 0.0);
  vec3 gradient = vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  );
  float len = length(gradient);
  return len > 1e-9 ? gradient / len : vec3(0.0, 0.0, 1.0);
}

float occlusion(vec3 p, vec3 n) {
  float sum = 0.0;
  float weight = 1.0;
  for (int i = 1; i <= 4; i++) {
    float h = 0.014 * float(i);
    sum += weight * (h - map(p + n * h));
    weight *= 0.62;
  }
  return clamp(1.0 - 2.4 * sum, 0.0, 1.0);
}

// Entry and exit distance of a ray through the axis-aligned box of half extents "box".
vec2 slab(vec3 origin, vec3 direction, vec3 box) {
  vec3 dir = mix(direction, vec3(1e-5), lessThan(abs(direction), vec3(1e-5)));
  vec3 t0 = (-box - origin) / dir;
  vec3 t1 = (box - origin) / dir;
  vec3 tEnter = min(t0, t1);
  vec3 tExit = max(t0, t1);
  return vec2(max(max(tEnter.x, tEnter.y), tEnter.z), min(min(tExit.x, tExit.y), tExit.z));
}

vec3 studio(vec3 d) {
  float y = d.y;
  float blur = 0.008 + 0.3 * u_roughness;

  vec3 ground = mix(vec3(0.014, 0.016, 0.022), vec3(0.075, 0.08, 0.095), smoothstep(-0.75, -0.03, y));
  vec3 sky = mix(vec3(0.6, 0.63, 0.69), vec3(0.95, 0.96, 1.01), smoothstep(0.03, 0.7, y));
  vec3 c = mix(ground, sky, smoothstep(-blur, blur, y));

  // Three horizontal strip lights: the main warm band, one below the horizon, a blue kicker.
  c += vec3(1.0, 0.99, 0.96) * 1.05 * (1.0 - smoothstep(0.05, 0.05 + 5.0 * blur, abs(y - 0.21)));
  c += vec3(0.95, 0.97, 1.0) * 0.6 * (1.0 - smoothstep(0.03, 0.03 + 5.0 * blur, abs(y + 0.55)));
  c += vec3(0.7, 0.78, 1.0) * 0.2 * (1.0 - smoothstep(0.04, 0.04 + 5.0 * blur, abs(y + 0.28)));

  float sharp = clamp(2.0 / max(u_roughness * u_roughness, 1e-4), 4.0, 320.0);
  c += vec3(5.0) * pow(max(dot(d, u_key), 0.0), sharp);
  c += vec3(0.9, 0.94, 1.0) * 0.8 * pow(max(dot(d, u_fill), 0.0), 0.12 * sharp);
  return c;
}

vec3 toneMap(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

float gradientNoise(vec2 coord) {
  return fract(52.9829189 * fract(dot(coord, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 screen = (gl_FragCoord.xy / u_resolution * 2.0 - 1.0) * u_view;
  vec3 origin = u_toObject * vec3(screen, u_bounds.z + 1.0);
  vec3 direction = u_toObject * vec3(0.0, 0.0, -1.0);

  vec2 span = slab(origin, direction, u_bounds + (2.0 * u_pixel + 0.001));
  if (span.y <= max(span.x, 0.0)) discard;

  // The solid is shrunk by half a pixel; near misses within a pixel get partial coverage.
  float erode = 0.5 * u_pixel;
  float t = max(span.x, 0.0);
  float closest = 1e9;
  float closestT = t;
  for (int i = 0; i < STEPS; i++) {
    if (t > span.y) break;
    float d = map(origin + direction * t) + erode;
    if (d < closest) {
      closest = d;
      closestT = t;
    }
    if (d < HIT) break;
    t += max(d, HIT);
  }

  float coverage = 1.0 - smoothstep(0.0, 2.0 * erode, closest);
  if (coverage <= 0.002) discard;

  vec3 surface = origin + direction * closestT;
  vec3 normal = surfaceNormal(surface);
  vec3 N = u_toWorld * normal;
  vec3 V = vec3(0.0, 0.0, 1.0);

  // Bending the lookup by the surface position spreads the whole studio over a flat face.
  vec3 lookup = normalize(reflect(-V, N) + (u_toWorld * surface) * u_parallax);

  vec3 f0 = clamp(u_tint, 0.0, 1.0) * 0.93;
  vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);

  vec3 color = studio(lookup) * fresnel * occlusion(surface, normal);
  color = pow(toneMap(color * u_exposure), vec3(1.0 / 2.2));
  color = clamp(color + (gradientNoise(gl_FragCoord.xy) - 0.5) / 255.0, 0.0, 1.0);

  fragColor = vec4(color * coverage, coverage);
}
`;
