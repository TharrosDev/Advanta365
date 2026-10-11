/**
 * WebGL2 renderer for the hero ribbons: one fullscreen fragment pass over three mask textures.
 * No buffers, no blending, no framebuffers; the canvas is premultiplied-alpha and composited by the
 * browser over the page. Loaded with `await import("./renderer")`, never in the first route chunk.
 *
 * Timing contract (lib/motion/page-ready):
 *   - the FIRST frame is drawn in the very callback that finds the program linked, whatever the
 *     scroll position, tab state or entry overlay, and `onActive` fires from it (that releases the
 *     page-ready claim);
 *   - every later frame needs: in view, tab visible, entry overlay lifted. The clock only advances
 *     while the loop runs, so the draw-in starts at the instant the loader lifts.
 * There is no pointer input and no scroll-driven uniform: time only.
 */

import {
  disposePendingProgram,
  finishProgram,
  isProgramComplete,
  linkProgramAsync,
  type PendingProgram,
} from "@/lib/gl/program";
import { isOverlayLifted, onOverlayLifted } from "@/lib/motion/page-ready";

import {
  BRANCH_COUNT,
  CROP_ASPECT,
  OVERFLOW_SCALE,
  REGION,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
} from "./geometry";
import type { LiquidMask } from "./mask";
import { LIQUID_FRAGMENT_SHADER, LIQUID_VERTEX_SHADER } from "./shaders";

/** Look of the liquid metal. `speed` is a CPU-side multiplier of the clock, the rest are uniforms. */
export const HERO_LIQUID_EFFECT = {
  /** Stripe cycles per unit of phase. */
  repetition: 1.79,
  /** Base stripe blur (0.05 * softness). */
  softness: 1,
  /** Red / blue phase dispersion (divided by 20 in the shader): the warm and cool fringes. */
  shiftRed: 0.61,
  shiftBlue: 0.33,
  /** Blue added to the dark stripe colour (lavender shadows). */
  shadowBlue: 0.075,
  /** How much the simplex noise perturbs the edge value. */
  distortion: 0.07,
  /** How strongly the edge field bends the stripes: 0 flat, 1 full tube. */
  contour: 0.97,
  /** Degrees; rotates the diagonal bias axis (effective angle 70 - angle). */
  angle: 0,
  /** 1 = stripes travel left to right, 0 = they swirl around the centre. */
  flow: 1,
  /** Shader seconds per real second: bands move at 0.3 * 0.48 = 0.144 cycles per second. */
  speed: 0.48,
} as const;

/** Trim-path draw-in: each ribbon grows from the left along its own curve. Seconds. */
export const HERO_LIQUID_INTRO = {
  startDelay: 0,
  /** Branch i starts at startDelay + (3 - i) * stagger, so the bottom ribbon (and the trunk) leads. */
  stagger: 0.13,
  duration: 2.5,
  /** Softness of the reveal front, in arc-length units. */
  feather: 0.2,
} as const;

export type LiquidRendererOptions = {
  /** Play the draw-in. With false the ribbons are complete from the first frame. */
  intro: boolean;
  /** Called once, synchronously after the first frame was drawn. */
  onActive: () => void;
  /** Called at most once (link failure, context loss). The renderer has stopped for good. */
  onError: (error: unknown) => void;
};

export type LiquidRenderer = { dispose(): void };

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "high-performance",
};

const MAX_DEVICE_PIXEL_RATIO = 2;
/** Drawing-buffer budget in pixels; above it the pixel ratio is scaled down. */
const PIXEL_BUDGET = 12.5e6;
/** Longest step the clock takes in one frame (seconds), so a stalled tab never jumps the animation. */
const MAX_FRAME_DELTA = 0.1;

/** Reveal value that shows a whole ribbon: full length + rim lag + fade width + a margin (1.42). */
const REVEAL_COMPLETE = 1 + 2 * HERO_LIQUID_INTRO.feather + 0.02;
/** Pinned once the draw-in is over. */
const REVEAL_SETTLED = 2;

/** Canvas -> mask UV: the visible 1440 x 1012.5 art box inside the padded texture region. */
const UV_SPAN_X = VIEWBOX_WIDTH / REGION.width;
const UV_SPAN_Y = (VIEWBOX_HEIGHT * OVERFLOW_SCALE) / REGION.height;
const UV_ORIGIN_X = -REGION.x / REGION.width;
const UV_ORIGIN_Y = -REGION.y / REGION.height;

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/**
 * Creates the renderer on `canvas`. Throws when WebGL2 is unavailable or the mask cannot be uploaded;
 * the caller then shows the static fallback.
 */
export function createLiquidRenderer(
  canvas: HTMLCanvasElement,
  mask: LiquidMask,
  { intro, onActive, onError }: LiquidRendererOptions,
): LiquidRenderer {
  const context = canvas.getContext("webgl2", CONTEXT_ATTRIBUTES);
  if (!context) throw new Error("hero-liquid: WebGL2 is not available");
  if (context.isContextLost()) throw new Error("hero-liquid: the WebGL context is lost");
  const gl: WebGL2RenderingContext = context;

  let disposed = false;
  let stopped = false;
  let glReleased = false;
  let detached = false;

  let pending: PendingProgram | null = null;
  let program: WebGLProgram | null = null;
  const textures: WebGLTexture[] = [];

  let timeLocation: WebGLUniformLocation | null = null;
  let resolutionLocation: WebGLUniformLocation | null = null;
  let uvScaleLocation: WebGLUniformLocation | null = null;
  let uvOffsetLocation: WebGLUniformLocation | null = null;
  let revealLocation: WebGLUniformLocation | null = null;

  let pollFrame = 0;
  let frame = 0;
  let running = false;
  let lastTimestamp = 0;
  /** Seconds, accumulated only while the loop runs. */
  let clock = 0;
  let inView = true;
  let tabVisible = document.visibilityState !== "hidden";
  let firstFrameDone = false;

  // The draw-in is timed on the clock itself: it begins with the first running frame.
  let introDone = !intro;
  const reveal = new Float32Array(BRANCH_COUNT).fill(intro ? 0 : REVEAL_SETTLED);

  const releaseGl = () => {
    if (glReleased) return;
    glReleased = true;
    for (const texture of textures) gl.deleteTexture(texture);
    textures.length = 0;
    if (pending) {
      disposePendingProgram(gl, pending);
      pending = null;
    }
    if (program) {
      gl.deleteProgram(program);
      program = null;
    }
    // Hand the GPU memory back now instead of waiting for garbage collection.
    if (!gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  const createTexture = (unit: number, filter: number) => {
    const texture = gl.createTexture();
    if (!texture) throw new Error("hero-liquid: could not create a texture");
    textures.push(texture);
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };

  // Textures stay bound to units 0 (base), 1 (meta), 2 (field) for the life of the context.
  // Row 0 of the data is the top of the artwork: no flip, no premultiply; the shader flips v.
  try {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    createTexture(0, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      mask.width,
      mask.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      mask.base,
    );

    // NEAREST keeps the branch id and the two arc-length bytes of one texel together.
    createTexture(1, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      mask.width,
      mask.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      mask.meta,
    );

    createTexture(2, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R16F,
      mask.fieldWidth,
      mask.fieldHeight,
      0,
      gl.RED,
      gl.FLOAT,
      mask.field,
    );

    // (Upload errors are read once the program has linked, see start(): asking for them here would
    // stall the main thread on a GPU round trip while the loader animates.)
    pending = linkProgramAsync(gl, LIQUID_VERTEX_SHADER, LIQUID_FRAGMENT_SHADER);
  } catch (error) {
    releaseGl();
    throw error;
  }

  const shouldRun = () =>
    !disposed &&
    !stopped &&
    program !== null &&
    firstFrameDone &&
    inView &&
    tabVisible &&
    isOverlayLifted();

  /** Per-branch trim-path position after `elapsed` seconds of running time. */
  const advanceIntro = (elapsed: number) => {
    const { startDelay, stagger, duration } = HERO_LIQUID_INTRO;
    let complete = true;
    for (let i = 0; i < BRANCH_COUNT; i += 1) {
      const delay = startDelay + (BRANCH_COUNT - 1 - i) * stagger;
      const progress = Math.min(1, Math.max(0, (elapsed - delay) / duration));
      reveal[i] = easeInOutCubic(progress) * REVEAL_COMPLETE;
      if (progress < 1) complete = false;
    }
    if (complete) {
      introDone = true;
      reveal.fill(REVEAL_SETTLED);
    }
  };

  const draw = (seconds: number) => {
    gl.uniform1f(timeLocation, seconds * HERO_LIQUID_EFFECT.speed);
    if (!introDone) {
      advanceIntro(seconds);
      gl.uniform1fv(revealLocation, reveal);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const tick = (timestamp: number) => {
    frame = 0;
    if (!running) return;
    frame = requestAnimationFrame(tick);
    const delta = lastTimestamp
      ? Math.min(Math.max(timestamp - lastTimestamp, 0) / 1000, MAX_FRAME_DELTA)
      : 0;
    lastTimestamp = timestamp;
    clock += delta;
    draw(clock);
    if (!shouldRun()) setRunning(false);
  };

  function setRunning(on: boolean): void {
    if (disposed || on === running) return;
    running = on;
    if (on) {
      // The first frame after a pause takes no time step.
      lastTimestamp = 0;
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  const recheck = () => setRunning(shouldRun());

  /**
   * Drawing-buffer size, viewport and the canvas -> mask UV transform. A canvas at least as wide as
   * CROP_ASPECT stretches the art box to fill it; a narrower one shows the centre of a square layout.
   */
  const syncSize = () => {
    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    const measurable = clientWidth > 0 && clientHeight > 0;

    if (measurable) {
      let ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const pixels = clientWidth * clientHeight * ratio * ratio;
      if (pixels > PIXEL_BUDGET) ratio *= Math.sqrt(PIXEL_BUDGET / pixels);
      const width = Math.max(1, Math.round(clientWidth * ratio));
      const height = Math.max(1, Math.round(clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!program) return;
    const crop = measurable ? Math.min(1, clientWidth / clientHeight / CROP_ASPECT) : 1;
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(uvScaleLocation, UV_SPAN_X * crop, UV_SPAN_Y);
    gl.uniform2f(uvOffsetLocation, UV_ORIGIN_X + (UV_SPAN_X * (1 - crop)) / 2, UV_ORIGIN_Y);
  };

  const onResize = () => {
    if (disposed || stopped) return;
    syncSize();
    // Resizing clears the drawing buffer, and resize observers run after this frame's animation
    // callbacks: repaint now (same clock), or the ribbons would blink while a window is dragged.
    if (program && firstFrameDone) draw(clock);
  };

  const onVisibilityChange = () => {
    tabVisible = document.visibilityState !== "hidden";
    recheck();
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    fail(new Error("hero-liquid: WebGL context lost"));
  };

  const intersectionObserver =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          inView = entry.isIntersecting;
          recheck();
        });
  const resizeObserver =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
  let unsubscribeOverlay: () => void = () => {};

  const detach = () => {
    if (detached) return;
    detached = true;
    cancelAnimationFrame(pollFrame);
    cancelAnimationFrame(frame);
    pollFrame = 0;
    frame = 0;
    running = false;
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    if (!resizeObserver) window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    unsubscribeOverlay();
  };

  function fail(error: unknown): void {
    if (disposed || stopped) return;
    stopped = true;
    detach();
    releaseGl();
    onError(error);
  }

  /** The program has linked: wire the uniforms, draw the first frame, report, then start or park. */
  const start = (linked: WebGLProgram) => {
    // A driver that rejected a mask upload (the float field above all) must end in the static
    // fallback, not in blank ribbons. Reading the link status has just synchronised with the GPU
    // process, so this check costs nothing extra here.
    if (gl.getError() !== gl.NO_ERROR) throw new Error("hero-liquid: mask texture upload failed");

    gl.useProgram(linked);
    const locate = (name: string) => gl.getUniformLocation(linked, name);

    gl.uniform1i(locate("u_image"), 0);
    gl.uniform1i(locate("u_meta"), 1);
    gl.uniform1i(locate("u_edge"), 2);
    gl.uniform1f(locate("u_repetition"), HERO_LIQUID_EFFECT.repetition);
    gl.uniform1f(locate("u_softness"), HERO_LIQUID_EFFECT.softness);
    gl.uniform1f(locate("u_shiftRed"), HERO_LIQUID_EFFECT.shiftRed);
    gl.uniform1f(locate("u_shiftBlue"), HERO_LIQUID_EFFECT.shiftBlue);
    gl.uniform1f(locate("u_shadowBlue"), HERO_LIQUID_EFFECT.shadowBlue);
    gl.uniform1f(locate("u_distortion"), HERO_LIQUID_EFFECT.distortion);
    gl.uniform1f(locate("u_contour"), HERO_LIQUID_EFFECT.contour);
    gl.uniform1f(locate("u_angle"), HERO_LIQUID_EFFECT.angle);
    gl.uniform1f(locate("u_flow"), HERO_LIQUID_EFFECT.flow);
    gl.uniform1f(locate("u_feather"), HERO_LIQUID_INTRO.feather);

    timeLocation = locate("u_time");
    resolutionLocation = locate("u_resolution");
    uvScaleLocation = locate("u_uvScale");
    uvOffsetLocation = locate("u_uvOffset");
    revealLocation = locate("u_branchReveal");
    gl.uniform1fv(revealLocation, reveal);

    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    syncSize();

    // First frame: unconditional. With the intro on, every reveal is still 0, so it is blank.
    draw(clock);
    firstFrameDone = true;
    onActive();
    recheck();
  };

  /** One completion poll per animation frame; linking never blocks the main thread. */
  const pollLink = () => {
    pollFrame = 0;
    if (disposed || stopped || !pending) return;
    if (!isProgramComplete(gl, pending)) {
      pollFrame = requestAnimationFrame(pollLink);
      return;
    }
    const linking = pending;
    pending = null;
    try {
      // On failure finishProgram has already deleted the shaders and the program.
      program = finishProgram(gl, linking);
      start(program);
    } catch (error) {
      fail(error);
    }
  };

  canvas.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", onVisibilityChange);
  intersectionObserver?.observe(canvas);
  if (resizeObserver) resizeObserver.observe(canvas);
  else window.addEventListener("resize", onResize);
  unsubscribeOverlay = onOverlayLifted(recheck);
  syncSize();
  pollFrame = requestAnimationFrame(pollLink);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      detach();
      releaseGl();
    },
  };
}
