/**
 * Sheen text engine: ONE off-DOM WebGL2 canvas and ONE program for every sheen word on the page.
 *
 * Each word owns a visible 2D canvas and an offscreen glyph mask. Per frame the shader is rendered
 * into the shared GL canvas at the word's size and composited into the word's canvas through the
 * mask (`source-over` mask, then `source-in` GL image), so the light only shows inside the glyphs.
 *
 * This module is loaded with `await import("./sheen-engine")` from an effect, never statically.
 */
import {
  FULLSCREEN_TRIANGLE_VS,
  finishProgram,
  isProgramComplete,
  linkProgramAsync,
  type PendingProgram,
} from "@/lib/gl/program";
import { isOverlayLifted, onOverlayLifted } from "@/lib/motion/page-ready";

import {
  SHEEN_FRAGMENT_SHADER,
  SHEEN_PARAMS,
  SHEEN_UNIFORMS,
  type SheenUniformName,
} from "./shaders";

export type SheenAttachOptions = {
  /**
   * `true` after the word's first WebGL paint (and again after it recovers), `false` when the word
   * cannot be painted (no WebGL2, the program failed, the word wraps or has no box). The caller
   * mirrors it to `data-live`; either value means "stop waiting for this word".
   */
  onLive: (live: boolean) => void;
};

type Rgba = readonly [number, number, number, number];

type Word = {
  el: HTMLElement;
  text: HTMLElement;
  probe: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mask: HTMLCanvasElement;
  maskCtx: CanvasRenderingContext2D;
  /** Live computed style of the word (font, letter spacing, colour). */
  style: CSSStyleDeclaration;
  heading: HTMLElement | null;
  onLive: (live: boolean) => void;
  /** Backing-store size in device px and the scale that produced it. */
  width: number;
  height: number;
  dpr: number;
  pad: number;
  /** Canvas offset inside the heading, CSS px. */
  originX: number;
  originY: number;
  /** CSS px per noise unit. */
  unit: number;
  colorText: string;
  color: Rgba;
  /** Measured with a usable, single-line box. */
  drawable: boolean;
  /** Never painted, or its mask or canvas changed: paint at the next opportunity. */
  dirty: boolean;
  /** IntersectionObserver state of the canvas. */
  visible: boolean;
  /** The canvas currently shows a WebGL frame. */
  live: boolean;
  /** Last value handed to `onLive`. */
  reported: boolean | null;
};

type Session = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  /** The context is a CPU rasteriser: shade at reduced size and rate (see ECONOMY). */
  economy: boolean;
  pending: PendingProgram | null;
  program: WebGLProgram | null;
  uniforms: Record<SheenUniformName, WebGLUniformLocation | null> | null;
  onLost: (event: Event) => void;
};

const MAX_DPR = 2;
/** Glyph overhang allowed around the word box, in em. */
const PAD_RATIO = 0.3;
/** WebGL2 guarantees at least this viewport and renderbuffer size. */
const MAX_SIDE = 2048;
/** The first context plus the re-creations allowed after a context loss. */
const MAX_CONTEXTS = 3;
/**
 * On a CPU rasteriser (SwiftShader in headless Chromium, llvmpipe, WARP) the shader runs on the
 * machine's own cores and every composite reads the frame back synchronously. The light is soft
 * and slow, so there it is shaded at a quarter of the size, scaled up under the full-size glyph
 * mask, and stepped 20 times a second. Hardware GPUs always get full size on every frame.
 */
const ECONOMY = { scale: 0.25, interval: 50 } as const;
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;
/** Text colour used until the computed colour can be read: the ink of the light theme. */
const FALLBACK_COLOR: Rgba = [24 / 255, 24 / 255, 24 / 255, 1];

const CONTEXT_OPTIONS: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
};

const words = new Set<Word>();
const wordByCanvas = new Map<Element, Word>();

let session: Session | null = null;
/** WebGL2 or the program is unavailable: every word stays on the CSS fallback for this page. */
let unsupported = false;
let contextsCreated = 0;
let rafId = 0;
let measurePending = false;
let firstFrameTime: number | null = null;
/** Time of the last frame that advanced the light (paces the economy mode). */
let lastStepTime = Number.NEGATIVE_INFINITY;
let listening = false;
let intersectionObserver: IntersectionObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let unsubscribeLifted: (() => void) | null = null;
let colorProbe: CanvasRenderingContext2D | null = null;

function noop(): void {}

/* ----------------------------------------------------------------------------------------------
 * Colour
 * -------------------------------------------------------------------------------------------- */

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function parseChannel(part: string | undefined, scale: number): number {
  if (part === undefined) return Number.NaN;
  const value = Number.parseFloat(part);
  return part.endsWith("%") ? value / 100 : value / scale;
}

/** Parses the serialisations browsers use for computed colours: `rgb()`, `rgba()`, `color(srgb …)`. */
function parseComputedColor(value: string): Rgba | null {
  const open = value.indexOf("(");
  const close = value.lastIndexOf(")");
  if (open < 0 || close < open) return null;
  const name = value.slice(0, open).trim().toLowerCase();
  const parts = value
    .slice(open + 1, close)
    .split(/[\s,/]+/)
    .filter((part) => part !== "");

  let channels: Array<string | undefined>;
  let scale: number;
  if (name === "rgb" || name === "rgba") {
    channels = parts;
    scale = 255;
  } else if (name === "color" && parts[0] === "srgb") {
    channels = parts.slice(1);
    scale = 1;
  } else {
    return null;
  }

  const r = parseChannel(channels[0], scale);
  const g = parseChannel(channels[1], scale);
  const b = parseChannel(channels[2], scale);
  const a = channels[3] === undefined ? 1 : parseChannel(channels[3], 1);
  if (![r, g, b, a].every(Number.isFinite)) return null;
  return [clamp01(r), clamp01(g), clamp01(b), clamp01(a)];
}

/** Any other colour syntax: let a 1 x 1 canvas resolve it. */
function rasterizeColor(value: string): Rgba | null {
  try {
    if (!colorProbe) {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      colorProbe = canvas.getContext("2d", { willReadFrequently: true });
    }
    if (!colorProbe) return null;
    colorProbe.clearRect(0, 0, 1, 1);
    colorProbe.fillStyle = "#000";
    colorProbe.fillStyle = value;
    colorProbe.fillRect(0, 0, 1, 1);
    const data = colorProbe.getImageData(0, 0, 1, 1).data;
    const a = (data[3] ?? 255) / 255;
    if (a === 0) return [0, 0, 0, 0];
    // getImageData returns straight alpha.
    return [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255, a];
  } catch {
    return null;
  }
}

/** Follows the computed text colour; parses only when the string changes (theme cross-fade). */
function updateColor(word: Word): void {
  const value = word.style.color;
  if (value === word.colorText) return;
  word.colorText = value;
  word.color = parseComputedColor(value) ?? rasterizeColor(value) ?? word.color;
}

/* ----------------------------------------------------------------------------------------------
 * Measuring and the glyph mask
 * -------------------------------------------------------------------------------------------- */

/** Layout offset from the page origin: `offsetLeft/Top` summed up the `offsetParent` chain (ignores transforms). */
function pageOffset(element: HTMLElement | null): [number, number] {
  let x = 0;
  let y = 0;
  let node: Element | null = element;
  while (node instanceof HTMLElement) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return [x, y];
}

function transformText(text: string, transform: string): string {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") return text.charAt(0).toUpperCase() + text.slice(1);
  return text;
}

function setLive(word: Word, live: boolean): void {
  word.live = live;
  if (word.reported === live) return;
  word.reported = live;
  word.onLive(live);
}

function drawMask(word: Word, fontSize: number, baseline: number): void {
  const { maskCtx: ctx, style } = word;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, word.width, word.height);
  ctx.setTransform(word.dpr, 0, 0, word.dpr, 0, 0);

  // Older engines lack these two canvas text properties; probe them without narrowing the type.
  const optional = ctx as { fontKerning?: unknown; letterSpacing?: unknown };

  ctx.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  const kerning = style.fontKerning;
  if (
    typeof optional.fontKerning === "string" &&
    (kerning === "auto" || kerning === "normal" || kerning === "none")
  ) {
    ctx.fontKerning = kerning;
  }
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";

  const text = transformText(word.text.textContent ?? "", style.textTransform);
  const spacing = Number.parseFloat(style.letterSpacing) || 0; // "normal" parses to NaN -> 0
  const x = word.pad;
  const y = word.pad + baseline;

  if (typeof optional.letterSpacing === "string") {
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
  } else if (spacing === 0) {
    ctx.fillText(text, x, y);
  } else {
    // No canvas letter-spacing: place the characters one by one.
    let cursor = x;
    for (const character of text) {
      ctx.fillText(character, cursor, y);
      cursor += ctx.measureText(character).width + spacing;
    }
  }
}

function measureWord(word: Word): void {
  const { el, canvas, style } = word;

  const fontSize = Number.parseFloat(style.fontSize) || 0;
  const pad = Math.ceil(PAD_RATIO * fontSize);
  if (pad !== word.pad) {
    word.pad = pad;
    el.style.setProperty("--sheen-pad", `${pad}px`);
  }

  const cssWidth = canvas.offsetWidth;
  const cssHeight = canvas.offsetHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  if (cssWidth > 0 && cssHeight > 0) dpr = Math.min(dpr, MAX_SIDE / cssWidth, MAX_SIDE / cssHeight);
  const width = Math.round(cssWidth * dpr);
  const height = Math.round(cssHeight * dpr);

  // A word that wraps inside its own box cannot be drawn as one line of glyphs: it keeps the CSS fallback.
  const singleLine = word.text.getClientRects().length <= 1;
  word.drawable = fontSize > 0 && width > 0 && height > 0 && singleLine;
  if (!word.drawable) {
    word.dirty = true;
    setLive(word, false);
    return;
  }

  if (width !== word.width || height !== word.height || dpr !== word.dpr) {
    word.width = width;
    word.height = height;
    word.dpr = dpr;
    canvas.width = width;
    canvas.height = height;
    word.mask.width = width;
    word.mask.height = height;
  }

  // The zero-size inline-block probe sits on the text baseline.
  const baseline = word.probe.offsetTop;

  // A heading-relative origin keeps the light pattern continuous across all words of one heading.
  const [canvasX, canvasY] = pageOffset(canvas);
  const [headingX, headingY] = pageOffset(word.heading);
  word.originX = canvasX - headingX;
  word.originY = canvasY - headingY;
  word.unit = fontSize * SHEEN_PARAMS.unit;

  drawMask(word, fontSize, baseline);
  word.dirty = true;
}

/** A word that cannot be measured keeps the CSS fallback; the next resize tries again. */
function measureSafely(word: Word): void {
  try {
    measureWord(word);
  } catch {
    word.drawable = false;
    word.dirty = true;
    setLive(word, false);
  }
}

/* ----------------------------------------------------------------------------------------------
 * The shared WebGL session
 * -------------------------------------------------------------------------------------------- */

function isSoftwareRenderer(gl: WebGL2RenderingContext): boolean {
  try {
    let renderer = String(gl.getParameter(gl.RENDERER) ?? "");
    // Chromium and Safari mask RENDERER; only they are asked for the unmasked string (Firefox
    // answers above and logs a deprecation warning when the extension is requested).
    if (/webkit/i.test(renderer)) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? renderer);
    }
    return SOFTWARE_RENDERER.test(renderer);
  } catch {
    return false;
  }
}

function ensureSession(): Session | null {
  if (session) return session;
  if (unsupported) return null;
  if (contextsCreated >= MAX_CONTEXTS) {
    unsupported = true;
    return null;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const gl = canvas.getContext("webgl2", CONTEXT_OPTIONS);
    if (!gl) {
      unsupported = true;
      return null;
    }
    contextsCreated += 1;
    const onLost = (event: Event): void => {
      event.preventDefault();
      if (session?.canvas !== canvas) return;
      recoverFromLoss();
      kick();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    const created: Session = {
      canvas,
      gl,
      economy: isSoftwareRenderer(gl),
      pending: null,
      program: null,
      uniforms: null,
      onLost,
    };
    session = created;
    created.pending = linkProgramAsync(gl, FULLSCREEN_TRIANGLE_VS, SHEEN_FRAGMENT_SHADER);
    return created;
  } catch {
    if (session) dropSession();
    unsupported = true;
    return null;
  }
}

/** Forgets the context (lost or unusable). */
function dropSession(): void {
  const current = session;
  if (!current) return;
  session = null;
  current.canvas.removeEventListener("webglcontextlost", current.onLost);
  current.pending = null;
  current.program = null;
  current.uniforms = null;
}

/**
 * The context was lost. A frozen frame could not follow a theme flip (the menu flips the page on
 * every open), so every word is queued for a repaint: the next frame asks for a fresh context,
 * the words show the CSS fallback until it has linked, and they stay on the fallback when no
 * context can be created any more.
 */
function recoverFromLoss(): void {
  dropSession();
  for (const word of words) word.dirty = true;
}

/** Nothing can be painted any more: every word goes back to (or stays on) the CSS fallback. */
function fallBack(): void {
  unsupported = true;
  dropSession();
  for (const word of [...words]) {
    word.dirty = false;
    setLive(word, false);
  }
  stopListening();
}

/** Finishes the asynchronous link. Returns false while still compiling or when the session is gone. */
function resolveProgram(current: Session): boolean {
  const { gl } = current;
  if (current.program) return true;
  const pending = current.pending;
  if (!pending) return false;
  try {
    if (!isProgramComplete(gl, pending)) return false;
    const program = finishProgram(gl, pending);
    current.pending = null;
    current.program = program;
    gl.useProgram(program);
    const uniforms = {} as Record<SheenUniformName, WebGLUniformLocation | null>;
    for (const name of SHEEN_UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);
    current.uniforms = uniforms;
    return true;
  } catch {
    if (gl.isContextLost()) recoverFromLoss();
    else fallBack();
    return false;
  }
}

/* ----------------------------------------------------------------------------------------------
 * Painting
 * -------------------------------------------------------------------------------------------- */

/** The time loop runs only on a visible tab and, on the home intro, once the entry overlay has lifted. */
function canAnimate(): boolean {
  return !document.hidden && isOverlayLifted();
}

function hasDirtyWord(): boolean {
  for (const word of words) if (word.drawable && word.dirty) return true;
  return false;
}

function hasVisibleWord(): boolean {
  for (const word of words) if (word.drawable && word.visible) return true;
  return false;
}

/**
 * Paints every word that needs a frame: dirty words always (first frame, re-measure), visible
 * words while the time loop may run. The first frame of a word ignores visibility on purpose.
 */
function paint(current: Session, now: number): void {
  const { gl, canvas, uniforms } = current;
  if (!current.program || !uniforms) return;

  // Economy mode steps the light at its own pace; frames in between only serve dirty words.
  const scale = current.economy ? ECONOMY.scale : 1;
  const paced = current.economy && now - lastStepTime < ECONOMY.interval - 4;
  const animate = canAnimate() && !paced;

  const targets: Word[] = [];
  let maxWidth = 0;
  let maxHeight = 0;
  for (const word of words) {
    if (!word.drawable) continue;
    if (!word.dirty && !(animate && word.visible)) continue;
    targets.push(word);
    maxWidth = Math.max(maxWidth, Math.ceil(word.width * scale));
    maxHeight = Math.max(maxHeight, Math.ceil(word.height * scale));
  }
  if (targets.length === 0) return;
  if (animate) lastStepTime = now;

  // The shared canvas only ever grows.
  if (canvas.width < maxWidth || canvas.height < maxHeight) {
    canvas.width = Math.max(canvas.width, maxWidth);
    canvas.height = Math.max(canvas.height, maxHeight);
  }

  if (firstFrameTime === null) firstFrameTime = now;
  const time = (Math.max(0, now - firstFrameTime) / 1000) * SHEEN_PARAMS.speed;
  gl.uniform1f(uniforms.u_time, time);

  for (const word of targets) {
    const { width, height, ctx } = word;
    // Size of the shaded image; equal to the word canvas unless economy mode scales it down.
    const shadedWidth = Math.ceil(width * scale);
    const shadedHeight = Math.ceil(height * scale);
    updateColor(word);
    const [r, g, b, a] = word.color;
    const tone = r + g + b > 1.5 ? SHEEN_PARAMS.onDark : SHEEN_PARAMS.onLight;

    gl.viewport(0, 0, shadedWidth, shadedHeight);
    gl.uniform2f(uniforms.u_resolution, shadedWidth, shadedHeight);
    gl.uniform2f(uniforms.u_origin, word.originX, word.originY);
    gl.uniform1f(uniforms.u_dpr, (word.dpr * shadedWidth) / width);
    gl.uniform1f(uniforms.u_unit, word.unit);
    gl.uniform3f(uniforms.u_text, r, g, b);
    gl.uniform3f(uniforms.u_lit, tone.lit[0], tone.lit[1], tone.lit[2]);
    gl.uniform1f(uniforms.u_chroma, tone.chroma);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Glyph mask first, then the GL image only where the mask is. The GL viewport is the
    // bottom-left corner of the shared canvas, hence the source y offset.
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(word.mask, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.globalAlpha = a;
    ctx.drawImage(
      canvas,
      0,
      canvas.height - shadedHeight,
      shadedWidth,
      shadedHeight,
      0,
      0,
      width,
      height,
    );
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    word.dirty = false;
    setLive(word, true);
  }
}

/** Polls the link, then paints. Safe to call from a frame or synchronously from `attach`. */
function render(now: number): void {
  let current = session;
  if (!current) {
    // No context (it was lost): ask for a fresh one only when a word is waiting for a frame.
    if (!hasDirtyWord()) return;
    current = ensureSession();
    if (!current) {
      fallBack();
      return;
    }
  }

  if (current.gl.isContextLost()) {
    recoverFromLoss();
    return;
  }
  if (!resolveProgram(current)) return;

  try {
    paint(current, now);
  } catch {
    if (current.gl.isContextLost()) recoverFromLoss();
    else fallBack();
  }
}

/** A word that waits for a frame while no program is linked shows the CSS fallback meanwhile. */
function releaseStaleWords(): void {
  if (session?.program) return;
  for (const word of [...words]) {
    if (word.dirty && word.live) setLive(word, false);
  }
}

/* ----------------------------------------------------------------------------------------------
 * Scheduling
 * -------------------------------------------------------------------------------------------- */

function needsFrame(): boolean {
  if (unsupported || words.size === 0) return false;
  if (measurePending) return true;
  if (!session) return hasDirtyWord();
  if (session.pending) return true;
  if (!session.program) return false;
  if (hasDirtyWord()) return true;
  return canAnimate() && hasVisibleWord();
}

function kick(): void {
  if (rafId !== 0 || !needsFrame()) return;
  rafId = requestAnimationFrame(frame);
}

function frame(now: number): void {
  rafId = 0;
  if (unsupported || words.size === 0) return;

  if (measurePending) {
    measurePending = false;
    for (const word of [...words]) measureSafely(word);
  }

  render(now);
  releaseStaleWords();
  kick();
}

function scheduleMeasure(): void {
  if (unsupported || words.size === 0) return;
  measurePending = true;
  kick();
}

function onIntersect(entries: IntersectionObserverEntry[]): void {
  for (const entry of entries) {
    const word = wordByCanvas.get(entry.target);
    if (word) word.visible = entry.isIntersecting;
  }
  kick();
}

function startListening(): void {
  if (listening) return;
  listening = true;
  if (typeof IntersectionObserver === "function") {
    intersectionObserver = new IntersectionObserver(onIntersect);
  }
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(scheduleMeasure);
  }
  window.addEventListener("resize", scheduleMeasure, { passive: true });
  document.addEventListener("visibilitychange", kick);
  const fonts = document.fonts as FontFaceSet | undefined;
  if (fonts) {
    fonts.addEventListener("loadingdone", scheduleMeasure);
    fonts.ready.then(scheduleMeasure, noop);
  }
  unsubscribeLifted = onOverlayLifted(kick);
}

function stopListening(): void {
  if (!listening) return;
  listening = false;
  intersectionObserver?.disconnect();
  intersectionObserver = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener("resize", scheduleMeasure);
  document.removeEventListener("visibilitychange", kick);
  (document.fonts as FontFaceSet | undefined)?.removeEventListener("loadingdone", scheduleMeasure);
  unsubscribeLifted?.();
  unsubscribeLifted = null;
  if (rafId !== 0) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  measurePending = false;
}

/* ----------------------------------------------------------------------------------------------
 * Public API
 * -------------------------------------------------------------------------------------------- */

function detachWord(word: Word): void {
  if (!words.delete(word)) return;
  wordByCanvas.delete(word.canvas);
  intersectionObserver?.unobserve(word.canvas);
  resizeObserver?.unobserve(word.el);
  const heading = word.heading;
  if (heading) {
    let shared = false;
    for (const other of words) {
      if (other.heading === heading) {
        shared = true;
        break;
      }
    }
    if (!shared) resizeObserver?.unobserve(heading);
  }
  word.el.style.removeProperty("--sheen-pad");
  word.mask.width = 0;
  word.mask.height = 0;
  // The shared context is kept for the page lifetime; only the loop and the listeners stop.
  if (words.size === 0) stopListening();
}

/** Builds the record of one word, or null when its DOM or a 2D context is not usable. */
function createWord(el: HTMLElement, onLive: (live: boolean) => void): Word | null {
  const [text, probe, canvas] = Array.from(el.children);
  if (
    !(text instanceof HTMLElement) ||
    !(probe instanceof HTMLElement) ||
    !(canvas instanceof HTMLCanvasElement)
  ) {
    return null;
  }
  try {
    const mask = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const maskCtx = mask.getContext("2d");
    if (!ctx || !maskCtx) return null;
    const heading = el.closest("h1, h2, h3");
    return {
      el,
      text,
      probe,
      canvas,
      ctx,
      mask,
      maskCtx,
      style: getComputedStyle(el),
      heading: heading instanceof HTMLElement ? heading : null,
      onLive,
      width: 0,
      height: 0,
      dpr: 0,
      pad: 0,
      originX: 0,
      originY: 0,
      unit: 1,
      colorText: "",
      color: FALLBACK_COLOR,
      drawable: false,
      dirty: true,
      // Without an IntersectionObserver every word counts as visible.
      visible: typeof IntersectionObserver !== "function",
      live: false,
      reported: null,
    };
  } catch {
    return null;
  }
}

/**
 * Starts the sheen on one word element (`[data-sheen-word]`: text span, probe span, canvas).
 * Returns the detach function. Never throws: on any failure the word keeps its CSS fallback
 * and `onLive(false)` is reported.
 */
export function attach(el: HTMLElement, options: SheenAttachOptions): () => void {
  const word = unsupported ? null : createWord(el, options.onLive);
  if (!word) {
    options.onLive(false);
    return noop;
  }
  if (!ensureSession()) {
    // No WebGL2 (or no context left): nothing on this page can be painted.
    fallBack();
    options.onLive(false);
    return noop;
  }

  words.add(word);
  wordByCanvas.set(word.canvas, word);
  startListening();
  intersectionObserver?.observe(word.canvas);
  resizeObserver?.observe(el);
  if (word.heading) resizeObserver?.observe(word.heading);

  measureSafely(word);
  // When the program is already linked the first frame is drawn right here, whatever the
  // visibility, the tab state or the entry overlay say.
  render(performance.now());
  kick();

  return () => detachWord(word);
}
