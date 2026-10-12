import { MAX_DYE_LEVELS } from "./defaults";
import { FRAG, VERT } from "./shaders";

/**
 * The plumbing between the engine and the graphics context: programs with typed uniform maps,
 * render-target formats, and the targets themselves.
 */

type GL = WebGL2RenderingContext;

/** The uniforms each program reads. An array uniform is listed once, by its bare name. */
const UNIFORMS = {
  copy: ["uTex", "uScale"],
  curl: ["uVel", "uTexel"],
  force: [
    "uVel",
    "uCurl",
    "uDye",
    "uTexel",
    "uDt",
    "uConfine",
    "uDyeLod",
    "uGravity",
    "uAmbient",
    "uCalmDrag",
    "uCalm",
    "uCalmP",
    "uCalmCount",
    "uAspect",
  ],
  advectVel: ["uVel", "uScale", "uDt", "uDamp", "uVisc", "uTexel"],
  divergence: ["uVel", "uTexel", "uWalls", "uAspect", "uSwell", "uSwellCount"],
  jacobi: ["uP", "uDiv", "uTexel", "uWalls"],
  project: ["uP", "uVel", "uTexel", "uWalls"],
  advectDye: [
    "uVel",
    "uDye",
    "uSize",
    "uScale",
    "uDt",
    "uDecay",
    "uFloor",
    "uSharp",
    "uCalmDecay",
    "uMist",
    "uFarLag",
    "uFarSharp",
    "uWalls",
    "uCubic",
    "uCalm",
    "uCalmP",
    "uCalmCount",
    "uAspect",
  ],
  splatVel: ["uPoint", "uRadius", "uForce", "uSpin", "uTurb", "uSeed", "uAspect"],
  splatDye: ["uPoint", "uRadius", "uAmount", "uSeed", "uGrain", "uFiber", "uAspect", "uStretch"],
  impulse: ["uDye", "uForce", "uSeed", "uAspect"],
  composite: [
    "uDye",
    "uDyeSize",
    "uFrame",
    "uGround",
    "uBlackTint",
    "uBlackColor",
    "uBlackOpacity",
    "uBlueTint",
    "uBlueColor",
    "uBlueOpacity",
    "uBlueDeep",
    "uBlueDeepRate",
    "uBlueShade",
    "uBlueShadeTint",
    "uDensity",
    "uGamma",
    "uInkGain",
    "uFar",
    "uFarShift",
    "uLightStep",
    "uShade",
    "uShadowDepth",
    "uGrain",
    "uUpsample",
    "uDark",
    "uShadowSteps",
    "uCalm",
    "uCalmP",
    "uCalmCap",
    "uCalmCount",
    "uAspect",
  ],
} as const satisfies Record<keyof typeof FRAG, readonly string[]>;

export type ProgramName = keyof typeof UNIFORMS;
export type Program<N extends ProgramName = ProgramName> = {
  program: WebGLProgram;
  u: Record<(typeof UNIFORMS)[N][number], WebGLUniformLocation | null>;
};
export type Programs = { [N in ProgramName]: Program<N> };

const PROGRAM_NAMES = Object.keys(UNIFORMS) as ProgramName[];

function shaderOf(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("ink: no shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/** Lets a task end before the next piece of work starts. */
export const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Compiles and links every program. Where the browser can do that off the main thread
 * (KHR_parallel_shader_compile) nothing blocks: the promise resolves when the GPU is done.
 * Elsewhere each program is linked and checked in a task of its own.
 *
 * `stopped` is asked while waiting; when it says yes the promise rejects.
 */
export async function buildPrograms(gl: GL, stopped: () => boolean): Promise<Programs> {
  const parallel = gl.getExtension("KHR_parallel_shader_compile") as {
    COMPLETION_STATUS_KHR: number;
  } | null;
  const vs = shaderOf(gl, gl.VERTEX_SHADER, VERT);
  const pending: { name: ProgramName; fs: WebGLShader; program: WebGLProgram }[] = [];

  const begin = (name: ProgramName) => {
    const fs = shaderOf(gl, gl.FRAGMENT_SHADER, FRAG[name]);
    const program = gl.createProgram();
    if (!program) throw new Error("ink: no program");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    pending.push({ name, fs, program });
  };

  const finish = <N extends ProgramName>(name: N, fs: WebGLShader, program: WebGLProgram) => {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      throw new Error(`ink: the "${name}" shader failed to build`);
    }
    const u = {} as Record<string, WebGLUniformLocation | null>;
    for (const uniform of UNIFORMS[name]) u[uniform] = gl.getUniformLocation(program, uniform);
    gl.deleteShader(fs);
    return { program, u } as Program<N>;
  };

  const built = {} as Record<ProgramName, Program>;
  if (parallel) {
    for (const name of PROGRAM_NAMES) begin(name);
    for (;;) {
      if (stopped()) throw new Error("ink: stopped while building");
      const done = pending.every(
        (p) => gl.getProgramParameter(p.program, parallel.COMPLETION_STATUS_KHR) as boolean,
      );
      if (done) break;
      await new Promise<void>((resolve) => setTimeout(resolve, 4));
    }
    for (const p of pending) built[p.name] = finish(p.name, p.fs, p.program);
  } else {
    for (const name of PROGRAM_NAMES) {
      await nextTask();
      if (stopped()) throw new Error("ink: stopped while building");
      begin(name);
      const p = pending[pending.length - 1];
      if (p) built[name] = finish(name, p.fs, p.program);
    }
  }
  gl.deleteShader(vs);
  return built as Programs;
}

export function deletePrograms(gl: GL, programs: Programs | null): void {
  if (!programs) return;
  for (const name of PROGRAM_NAMES) gl.deleteProgram(programs[name].program);
}

/** Whether the build can run off the main thread. */
export function buildsInParallel(gl: GL): boolean {
  return !!gl.getExtension("KHR_parallel_shader_compile");
}

export type Formats = { rgba: number; rg: number; r: number };

function renderable(gl: GL, internal: number): boolean {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, internal, 4, 4);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  return ok;
}

/** Half-float formats this context can render to, or null when it cannot hold the fields at all. */
export function pickFormats(gl: GL): Formats | null {
  const full = gl.getExtension("EXT_color_buffer_float");
  const half = gl.getExtension("EXT_color_buffer_half_float");
  if (!full && !half) return null;
  if (!renderable(gl, gl.RGBA16F)) return null;
  const rg = renderable(gl, gl.RG16F) ? gl.RG16F : gl.RGBA16F;
  const r = renderable(gl, gl.R16F) ? gl.R16F : rg;
  return { rgba: gl.RGBA16F, rg, r };
}

export type Target = {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
  levels: number;
};

export type DoubleTarget = { read: Target; write: Target; w: number; h: number; swap(): void };

export function makeTarget(gl: GL, w: number, h: number, internal: number, mips: boolean): Target {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const levels = mips ? Math.min(MAX_DYE_LEVELS, Math.floor(Math.log2(Math.max(w, h))) + 1) : 1;
  gl.texStorage2D(gl.TEXTURE_2D, levels, internal, w, h);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (mips) gl.generateMipmap(gl.TEXTURE_2D);
  return { tex, fbo, w, h, levels };
}

export function makeDouble(
  gl: GL,
  w: number,
  h: number,
  internal: number,
  mips: boolean,
): DoubleTarget {
  const pair: DoubleTarget = {
    read: makeTarget(gl, w, h, internal, mips),
    write: makeTarget(gl, w, h, internal, mips),
    w,
    h,
    swap() {
      const t = pair.read;
      pair.read = pair.write;
      pair.write = t;
    },
  };
  return pair;
}

export function freeTarget(gl: GL, target: Target | DoubleTarget): void {
  if ("read" in target) {
    freeTarget(gl, target.read);
    freeTarget(gl, target.write);
    return;
  }
  gl.deleteTexture(target.tex);
  gl.deleteFramebuffer(target.fbo);
}

/** Empties a target to zero. */
export function emptyTarget(gl: GL, target: Target): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
  gl.viewport(0, 0, target.w, target.h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/** Binds a target's texture to a unit and returns the unit, for a sampler uniform. */
export function bind(gl: GL, unit: number, target: Target): number {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, target.tex);
  return unit;
}

/** Draws the one triangle into a target, or onto the canvas when there is none. */
export function draw(gl: GL, target: Target | null): void {
  if (target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, target.w, target.h);
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
