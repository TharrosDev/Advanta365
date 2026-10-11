import {
  disposePendingProgram,
  finishProgram,
  hexToRgba,
  isProgramComplete,
  linkProgramAsync,
  type PendingProgram,
} from "@/lib/gl/program";
import { isOverlayLifted, onOverlayLifted } from "@/lib/motion/page-ready";
import type { SwirlParams } from "./params";
import { SWIRL_FRAGMENT_SHADER, SWIRL_VERTEX_SHADER } from "./shaders";

/**
 * WebGL2 renderer of the metallic swirl. Loaded with `await import("./renderer")` by `MetallicSwirl`,
 * so nothing in this file reaches the first route chunk.
 *
 * Drawing rules:
 * - FIRST FRAME: drawn once, synchronously, in the animation frame that finds the program linked. It
 *   does not wait for the canvas to be in view, for the tab to be visible, for `animated` or for the
 *   entry overlay: `onReady` (which releases the page-ready claim) fires from that draw. On a hard load
 *   of `/` this canvas sits below the fold, so gating it would hold the loader until its time-out.
 * - LOOP (later frames): runs only while something can change on its own, i.e.
 *   `animated && inView && tabVisible && isOverlayLifted() && (speed !== 0 || the time offset is easing)`.
 * - IDLE: `setParams`, `setTimeOffset({ immediate })` and resizes draw a single frame on demand; while
 *   the canvas is off screen that frame is deferred until it comes back.
 */

export type MetallicSwirlRenderer = {
  /** Merges the given values into the current parameters. */
  setParams(partial: Partial<SwirlParams>): void;
  /** Sets the target of the extra time offset; it is eased at 6/s unless `immediate` or not animated. */
  setTimeOffset(target: number, opts?: { immediate?: boolean }): void;
  /** Switches self-animation on or off (reduced motion). */
  setAnimated(animated: boolean): void;
  dispose(): void;
};

export type MetallicSwirlRendererOptions = {
  params: SwirlParams;
  /** false = no time loop at all: the swirl only redraws when its parameters or size change. */
  animated: boolean;
  /** Called once, from the first drawn frame. */
  onReady: () => void;
  /** Called at most once, for a link failure or a lost context. */
  onError: (error: unknown) => void;
};

const MAX_DEVICE_PIXEL_RATIO = 1.5;
const MAX_FRAME_SECONDS = 0.1;
const OFFSET_RATE = 6;
const OFFSET_SNAP = 1e-4;
const MAX_ITERATIONS = 12;
const MIN_SAMPLE_GAP = 1e-4;
const MIN_SCALE = 1e-4;

// Two triangles covering clip space.
const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

const UNIFORM_NAMES = [
  "uRes",
  "uTime",
  "uZoom",
  "uIter",
  "uEps",
  "uTangent",
  "uGrad",
  "uBright",
  "uContrast",
  "uBg",
  "uAlpha",
  "uRadial",
  "uBeams",
  "uStretch",
  "uFlow",
  "uSpinPhase",
  "uBeamWidth",
  "uTwist",
  "uVortex",
  "uHole",
  "uCenter",
  "uVignette",
  "uColorMode",
  "uColorA",
  "uColorB",
  "uColorC",
  "uTint",
  "uRepetition",
  "uSoftness",
  "uBandWidth",
  "uShiftRed",
  "uShiftBlue",
  "uStripePhase",
  "uStripeRadial",
  "uSpread",
  "uThreshold",
  "uDetailFade",
  "uFadeLeft",
  "uFadeRight",
  "uFadeTop",
  "uFadeBottom",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];
type Uniforms = Record<UniformName, WebGLUniformLocation | null>;
type Rgba = [number, number, number, number];

/** Remembers the last parsed hex string so a still swirl does not re-parse its colours every frame. */
type ColorSlot = { hex: string; rgba: Rgba };

const HEX_COLOR = /^#?(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function readColor(slot: ColorSlot, hex: string): Rgba {
  if (slot.hex !== hex) {
    slot.hex = hex;
    // A malformed value keeps the previous colour (parsed, it would paint opaque black).
    if (HEX_COLOR.test(hex.trim())) slot.rgba = hexToRgba(hex);
  }
  return slot.rgba;
}

/** Keeps a divisor away from zero without changing its sign. */
function awayFromZero(value: number): number {
  if (Math.abs(value) >= MIN_SCALE) return value;
  return value < 0 ? -MIN_SCALE : MIN_SCALE;
}

export function createMetallicSwirlRenderer(
  canvas: HTMLCanvasElement,
  options: MetallicSwirlRendererOptions,
): MetallicSwirlRenderer {
  // No multisampling: the only triangle edges are the canvas border, and every edge inside the image
  // is anti-aliased by the shader itself.
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!context || context.isContextLost()) throw new Error("WebGL2 is not available");
  const gl: WebGL2RenderingContext = context;

  const params: SwirlParams = { ...options.params };
  let animated = options.animated;

  let pending: PendingProgram | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let vertexArray: WebGLVertexArrayObject | null = null;
  let uniforms: Uniforms | null = null;

  let disposed = false;
  let failed = false;
  let painted = false;
  let stale = false; // an on-demand frame was skipped while off screen
  let inView = typeof IntersectionObserver !== "function";

  let pollFrame = 0;
  let loopFrame = 0;
  let previous: number | null = null;

  // Time model: time = initialTime + animatedTime + offset. The two phases are integrated so a change
  // of stripeFlow / radialSpin bends their speed instead of making them jump.
  let animatedTime = 0;
  let offset = 0;
  let offsetTarget = 0;
  let phasesStarted = false;
  let lastTime = 0;
  let stripePhase = 0;
  let spinPhase = 0;

  const colors: Record<"bg" | "a" | "b" | "c" | "tint", ColorSlot> = {
    bg: { hex: "", rgba: [0, 0, 0, 0] },
    a: { hex: "", rgba: [0, 0, 0, 0] },
    b: { hex: "", rgba: [0, 0, 0, 0] },
    c: { hex: "", rgba: [0, 0, 0, 0] },
    tint: { hex: "", rgba: [0, 0, 0, 0] },
  };

  const tabVisible = (): boolean => document.visibilityState === "visible";

  const resize = (): boolean => {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (canvas.width === width && canvas.height === height) return false;
    canvas.width = width;
    canvas.height = height;
    return true;
  };

  const draw = (): void => {
    if (!program || !uniforms) return;
    const u = uniforms;

    const time = params.initialTime + animatedTime + offset;
    if (!phasesStarted) {
      phasesStarted = true;
      lastTime = time;
      stripePhase = time * params.stripeFlow;
      spinPhase = time * params.radialSpin;
    }
    const elapsed = time - lastTime;
    lastTime = time;
    stripePhase += elapsed * params.stripeFlow;
    spinPhase += elapsed * params.radialSpin;

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vertexArray);

    gl.uniform2f(u.uRes, width, height);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uZoom, Math.max(params.zoom, MIN_SCALE));
    gl.uniform1f(u.uIter, Math.min(Math.max(params.iterations, 0), MAX_ITERATIONS));
    gl.uniform1f(u.uEps, Math.max(params.sampleGap, MIN_SAMPLE_GAP));
    gl.uniform1f(u.uTangent, params.tangentForce);
    gl.uniform1f(u.uGrad, params.gradientForce);
    gl.uniform1f(u.uBright, params.brightness);
    gl.uniform1f(u.uContrast, params.contrast);
    const bg = readColor(colors.bg, params.backgroundColor);
    gl.uniform4f(u.uBg, bg[0] * bg[3], bg[1] * bg[3], bg[2] * bg[3], bg[3]);
    gl.uniform1f(u.uAlpha, params.opacity);
    gl.uniform1f(u.uRadial, params.radialMix);
    gl.uniform1f(u.uBeams, Math.round(params.beams));
    gl.uniform1f(u.uStretch, params.radialStretch);
    gl.uniform1f(u.uFlow, params.radialFlow);
    gl.uniform1f(u.uSpinPhase, spinPhase);
    gl.uniform1f(u.uBeamWidth, params.beamWidth);
    gl.uniform1f(u.uTwist, params.twist);
    gl.uniform1f(u.uVortex, params.vortex);
    gl.uniform1f(u.uHole, params.hole);
    gl.uniform2f(u.uCenter, params.centerX, params.centerY);
    gl.uniform1f(u.uVignette, params.vignette);
    gl.uniform1f(u.uColorMode, params.colorMode === "stripes" ? 1 : 0);
    gl.uniform4fv(u.uColorA, readColor(colors.a, params.colorA));
    gl.uniform4fv(u.uColorB, readColor(colors.b, params.colorB));
    gl.uniform4fv(u.uColorC, readColor(colors.c, params.colorC));
    gl.uniform4fv(u.uTint, readColor(colors.tint, params.tintColor));
    gl.uniform1f(u.uRepetition, awayFromZero(params.repetition));
    gl.uniform1f(u.uSoftness, params.softness);
    gl.uniform1f(u.uBandWidth, params.bandWidth);
    gl.uniform1f(u.uShiftRed, params.shiftRed);
    gl.uniform1f(u.uShiftBlue, params.shiftBlue);
    gl.uniform1f(u.uStripePhase, stripePhase);
    gl.uniform1f(u.uStripeRadial, params.stripeRadial);
    gl.uniform1f(u.uSpread, params.spread);
    gl.uniform1f(u.uThreshold, params.threshold);
    gl.uniform1f(u.uDetailFade, params.detailFade);
    gl.uniform1f(u.uFadeLeft, params.fadeLeft);
    gl.uniform1f(u.uFadeRight, params.fadeRight);
    gl.uniform1f(u.uFadeTop, params.fadeTop);
    gl.uniform1f(u.uFadeBottom, params.fadeBottom);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    stale = false;
  };

  /** The run condition of the time loop. It never applies to the first frame. */
  const shouldRun = (): boolean =>
    !disposed &&
    !failed &&
    painted &&
    animated &&
    inView &&
    tabVisible() &&
    isOverlayLifted() &&
    (params.speed !== 0 || offset !== offsetTarget);

  const frame = (now: number): void => {
    loopFrame = 0;
    if (!shouldRun()) return;
    const seconds =
      previous === null ? 0 : Math.min(Math.max((now - previous) / 1000, 0), MAX_FRAME_SECONDS);
    previous = now;

    animatedTime += seconds * params.speed;
    if (offset !== offsetTarget) {
      offset += (offsetTarget - offset) * (1 - Math.exp(-OFFSET_RATE * seconds));
      if (Math.abs(offsetTarget - offset) < OFFSET_SNAP) offset = offsetTarget;
    }

    draw();
    if (shouldRun()) loopFrame = requestAnimationFrame(frame);
  };

  /** Starts or stops the loop to match `shouldRun()`. Clocks only advance while it runs. */
  const sync = (): void => {
    if (shouldRun()) {
      if (!loopFrame) {
        previous = null;
        loopFrame = requestAnimationFrame(frame);
      }
    } else if (loopFrame) {
      cancelAnimationFrame(loopFrame);
      loopFrame = 0;
    }
  };

  /** One frame on demand, for changes that happen while the loop is idle. */
  const drawIdle = (): void => {
    if (disposed || failed || !painted || loopFrame) return;
    if (inView && tabVisible()) draw();
    else stale = true;
  };

  /** Called whenever the canvas may have become visible again. */
  const wake = (): void => {
    if (disposed || failed) return;
    sync();
    if (stale) drawIdle();
  };

  const stop = (): void => {
    if (pollFrame) cancelAnimationFrame(pollFrame);
    if (loopFrame) cancelAnimationFrame(loopFrame);
    pollFrame = 0;
    loopFrame = 0;
  };

  const fail = (error: unknown): void => {
    if (disposed || failed) return;
    failed = true;
    stop();
    options.onError(error);
  };

  const poll = (): void => {
    pollFrame = 0;
    if (disposed || failed || !pending) return;
    if (!isProgramComplete(gl, pending)) {
      pollFrame = requestAnimationFrame(poll);
      return;
    }

    const linking = pending;
    pending = null;
    try {
      const linked = finishProgram(gl, linking);
      program = linked;

      buffer = gl.createBuffer();
      vertexArray = gl.createVertexArray();
      if (!buffer || !vertexArray) throw new Error("WebGL buffer allocation failed");
      gl.bindVertexArray(vertexArray);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
      const position = Math.max(gl.getAttribLocation(linked, "aPosition"), 0);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const found = {} as Uniforms;
      for (const name of UNIFORM_NAMES) found[name] = gl.getUniformLocation(linked, name);
      uniforms = found;

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // First frame: unconditional (see the header comment).
      resize();
      draw();
    } catch (error) {
      fail(error);
      return;
    }

    painted = true;
    options.onReady();
    sync();
  };

  const onContextLost = (event: Event): void => {
    event.preventDefault();
    fail(new Error("WebGL context lost"));
  };

  const onVisibilityChange = (): void => wake();

  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  let unsubscribeOverlay: () => void = () => {};

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    unsubscribeOverlay();

    // A context that is already lost has nothing left to free (and must not be "lost" twice).
    if (!gl.isContextLost()) {
      if (pending) disposePendingProgram(gl, pending);
      if (buffer) gl.deleteBuffer(buffer);
      if (vertexArray) gl.deleteVertexArray(vertexArray);
      if (program) gl.deleteProgram(program);
      // A real unmount has already taken the canvas out of the document: hand the GPU memory back at
      // once. While the canvas is still attached (an effect re-run in development) the context is
      // kept, because a lost context could not be used again by the next renderer on this canvas.
      if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    pending = null;
    buffer = null;
    vertexArray = null;
    program = null;
    uniforms = null;
  };

  try {
    pending = linkProgramAsync(gl, SWIRL_VERTEX_SHADER, SWIRL_FRAGMENT_SHADER);

    canvas.addEventListener("webglcontextlost", onContextLost);
    document.addEventListener("visibilitychange", onVisibilityChange);
    unsubscribeOverlay = onOverlayLifted(wake);

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => {
        if (disposed || failed || !painted) return;
        if (!resize()) return;
        // Resizing clears the drawing buffer, so repaint in the same frame even while the loop runs.
        if (inView && tabVisible()) draw();
        else stale = true;
      });
      resizeObserver.observe(canvas);
    }

    if (typeof IntersectionObserver === "function") {
      intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        inView = entry.isIntersecting;
        wake();
      });
      intersectionObserver.observe(canvas);
    }

    pollFrame = requestAnimationFrame(poll);
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    setParams(partial) {
      if (disposed) return;
      for (const [key, value] of Object.entries(partial)) {
        if (value !== undefined) Object.assign(params, { [key]: value });
      }
      sync();
      drawIdle();
    },
    setTimeOffset(target, opts) {
      if (disposed || !Number.isFinite(target)) return;
      offsetTarget = target;
      if (opts?.immediate || !animated) {
        offset = target;
        sync();
        drawIdle();
        return;
      }
      sync();
    },
    setAnimated(next) {
      if (disposed || animated === next) return;
      animated = next;
      if (!animated && offset !== offsetTarget) {
        offset = offsetTarget;
        sync();
        drawIdle();
        return;
      }
      sync();
    },
    dispose,
  };
}
