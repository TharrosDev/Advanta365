import { MARK_RADIUS_NORMALIZED, normalizedMarkSegments } from "@/lib/brand/mark";
import {
  FULLSCREEN_TRIANGLE_VS,
  disposePendingProgram,
  finishProgram,
  isProgramComplete,
  linkProgramAsync,
  type PendingProgram,
} from "@/lib/gl/program";
import {
  FIELD_HALF_HEIGHT,
  GLYPH_HALF_HEIGHT,
  GLYPH_HALF_WIDTH,
  NORMAL_EPSILON,
  type ChromeSymbolParams,
} from "./constants";
import { createIntroTimeline } from "./intro-timeline";
import { CHROME_SYMBOL_FRAGMENT } from "./shaders";

export type ChromeSymbolSession = {
  /** Merges into the resting parameters and redraws. */
  setParams(partial: Partial<ChromeSymbolParams>): void;
  /** Drawing-buffer size in device pixels. Applied on the next frame. */
  resize(width: number, height: number): void;
  /** Pauses (false) or resumes (true) drawing. The intro clock is wall time and keeps running. */
  setVisible(visible: boolean): void;
  /** Ends the spin. Without an intro, or once it is over, `onLanded` is delivered straight away. */
  land(): void;
  dispose(): void;
};

export type ChromeSymbolSessionOptions = {
  params: ChromeSymbolParams;
  intro?: boolean;
  spin?: boolean;
  /** true after the first drawn frame; false when the session dies (link error, context loss). */
  onLive?: (live: boolean) => void;
  /** Delivered at most once. */
  onLanded?: () => void;
};

const UNIFORM_NAMES = [
  "u_resolution",
  "u_view",
  "u_bounds",
  "u_toObject",
  "u_toWorld",
  "u_seg",
  "u_radius",
  "u_depth",
  "u_bevel",
  "u_roughness",
  "u_parallax",
  "u_exposure",
  "u_pixel",
  "u_normalEps",
  "u_key",
  "u_fill",
  "u_tint",
] as const;

type Uniforms = Record<(typeof UNIFORM_NAMES)[number], WebGLUniformLocation | null>;

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
};

/** Longest step the idle clock takes in one frame, in seconds. */
const MAX_CLOCK_STEP = 0.1;

/**
 * Below this half thickness nothing is drawn. At exactly zero depth the edge-on slab would still
 * leave a half-covered one-pixel line (the silhouette anti-aliasing), and the first 120ms of the
 * intro are meant to be empty.
 */
const MIN_VISIBLE_DEPTH = 1e-5;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

function lightDirection(azimuth: number, elevation: number): [number, number, number] {
  const az = radians(azimuth);
  const el = radians(elevation);
  return [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
}

function releaseContext(gl: WebGL2RenderingContext): void {
  try {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    // Nothing left to release.
  }
}

/**
 * Starts rendering the chrome symbol into `canvas`. Returns null when WebGL2 is not available
 * (the caller then shows the flat glyph).
 *
 * The shader links asynchronously; the first frame is drawn as soon as it is ready and starts the
 * intro clock. After that the loop is on demand: a frame is requested only while the intro runs,
 * the idle clock moves (`speed`), or parameters or size changed.
 */
export function createSession(
  canvas: HTMLCanvasElement,
  options: ChromeSymbolSessionOptions,
): ChromeSymbolSession | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", CONTEXT_ATTRIBUTES);
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const context = gl;

  let pending: PendingProgram | null;
  try {
    pending = linkProgramAsync(context, FULLSCREEN_TRIANGLE_VS, CHROME_SYMBOL_FRAGMENT);
  } catch {
    releaseContext(context);
    return null;
  }

  const rest: ChromeSymbolParams = { ...options.params };
  const toObject = new Float32Array(9);
  const toWorld = new Float32Array(9);

  let program: WebGLProgram | null = null;
  let uniforms: Uniforms | null = null;
  let width = Math.max(1, canvas.width);
  let height = Math.max(1, canvas.height);
  let frame = 0;
  let visible = true;
  let paramsDirty = true;
  let sizeDirty = true;
  let failed = false;
  let disposed = false;
  let painted = false;
  let startTime: number | null = null;
  let lastTime: number | null = null;
  let clock = 0;
  let landRequested = false;
  let landedPending = false;
  let landedDelivered = false;

  const timeline = options.intro
    ? createIntroTimeline(() => rest, {
        spin: options.spin,
        onLanded: () => {
          landedPending = true;
        },
      })
    : null;

  const introRunning = () => timeline !== null && !timeline.isFinished();

  function deliverLanded(): void {
    landedPending = false;
    if (landedDelivered) return;
    landedDelivered = true;
    options.onLanded?.();
  }

  function schedule(): void {
    if (disposed || failed || frame !== 0 || !visible) return;
    if (program && !introRunning() && rest.speed === 0 && !paramsDirty && !sizeDirty) return;
    frame = requestAnimationFrame(tick);
  }

  function fail(): void {
    if (failed || disposed) return;
    failed = true;
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
    options.onLive?.(false);
  }

  function prepare(linked: WebGLProgram): void {
    context.useProgram(linked);
    const found = {} as Uniforms;
    for (const name of UNIFORM_NAMES) found[name] = context.getUniformLocation(linked, name);
    uniforms = found;

    const segments = new Float32Array(12);
    normalizedMarkSegments().forEach((segment, index) => {
      segments.set([segment.a[0], segment.a[1], segment.b[0], segment.b[1]], index * 4);
    });
    context.uniform4fv(found.u_seg, segments);
    context.uniform1f(found.u_radius, MARK_RADIUS_NORMALIZED);
    context.uniform1f(found.u_normalEps, NORMAL_EPSILON);
  }

  function upload(u: Uniforms, p: ChromeSymbolParams): void {
    const fit = p.fit > 0 ? p.fit : 1;
    const viewHalfHeight = FIELD_HALF_HEIGHT / fit;
    context.uniform2f(u.u_resolution, width, height);
    context.uniform2f(u.u_view, (viewHalfHeight * width) / height, viewHalfHeight);
    context.uniform1f(u.u_pixel, (2 * viewHalfHeight) / height);
    context.uniform3f(u.u_bounds, GLYPH_HALF_WIDTH, GLYPH_HALF_HEIGHT, p.depth);
    context.uniform1f(u.u_depth, p.depth);
    context.uniform1f(u.u_bevel, Math.min(p.bevel, 0.98 * p.depth));
    context.uniform1f(u.u_roughness, p.roughness);
    context.uniform1f(u.u_parallax, p.parallax);
    context.uniform1f(u.u_exposure, p.exposure);
    context.uniform3fv(u.u_key, lightDirection(p.keyAzimuth, p.keyElevation));
    context.uniform3fv(u.u_fill, lightDirection(p.fillAzimuth, p.fillElevation));
    context.uniform3f(u.u_tint, p.tintR, p.tintG, p.tintB);

    // toWorld = Rx(pitch) * Ry(yaw); toObject is its transpose. Both are filled column-major.
    const yaw = radians(p.yaw + p.sway * Math.sin(0.8 * clock));
    const pitch = radians(p.pitch + 0.55 * p.sway * Math.sin(0.53 * clock + 1.1));
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    toObject.set([cy, 0, sy, sy * sp, cp, -cy * sp, -sy * cp, sp, cy * cp]);
    toWorld.set([cy, sy * sp, -sy * cp, 0, cp, sp, sy, -cy * sp, cy * cp]);
    context.uniformMatrix3fv(u.u_toObject, false, toObject);
    context.uniformMatrix3fv(u.u_toWorld, false, toWorld);
  }

  function tick(now: number): void {
    frame = 0;
    if (disposed || failed) return;

    if (!program) {
      if (!pending) return;
      try {
        if (!isProgramComplete(context, pending)) {
          schedule();
          return;
        }
        const linked = finishProgram(context, pending);
        pending = null;
        prepare(linked);
        program = linked;
      } catch {
        pending = null;
        fail();
        return;
      }
    }
    if (!uniforms) return;

    // The first ready frame starts the intro clock.
    if (startTime === null) startTime = now;
    if (lastTime !== null) clock += Math.min((now - lastTime) / 1000, MAX_CLOCK_STEP) * rest.speed;
    lastTime = now;

    if (sizeDirty) {
      canvas.width = width;
      canvas.height = height;
    }
    const current =
      timeline && !timeline.isFinished() ? timeline.sample((now - startTime) / 1000) : rest;
    paramsDirty = false;
    sizeDirty = false;

    context.viewport(0, 0, width, height);
    context.clearColor(0, 0, 0, 0);
    context.clear(context.COLOR_BUFFER_BIT);
    if (current.depth > MIN_VISIBLE_DEPTH) {
      upload(uniforms, current);
      context.drawArrays(context.TRIANGLES, 0, 3);
    }

    if (!painted) {
      painted = true;
      options.onLive?.(true);
    }
    if (landedPending) deliverLanded();
    schedule();
  }

  function onContextLost(event: Event): void {
    event.preventDefault();
    fail();
  }
  canvas.addEventListener("webglcontextlost", onContextLost);

  schedule();

  return {
    setParams(partial) {
      if (disposed) return;
      Object.assign(rest, partial);
      paramsDirty = true;
      schedule();
    },
    resize(nextWidth, nextHeight) {
      if (disposed) return;
      const w = Math.max(1, Math.round(nextWidth));
      const h = Math.max(1, Math.round(nextHeight));
      if (w === width && h === height) return;
      width = w;
      height = h;
      sizeDirty = true;
      schedule();
    },
    setVisible(next) {
      if (disposed || next === visible) return;
      visible = next;
      if (visible) {
        schedule();
        return;
      }
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
    },
    land() {
      if (disposed || landRequested) return;
      landRequested = true;
      if (failed || !timeline) {
        deliverLanded();
        return;
      }
      // Already over: the timeline delivered (or is about to deliver) the landing itself.
      if (timeline.isFinished()) return;
      timeline.land(startTime === null ? 0 : (performance.now() - startTime) / 1000);
      schedule();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (pending) disposePendingProgram(context, pending);
      pending = null;
      if (program) context.deleteProgram(program);
      program = null;
      releaseContext(context);
    },
  };
}
