/**
 * Shared WebGL2 program helpers for every canvas on the site (hero ribbons, metallic swirl, chrome
 * symbol, sheen text). Shaders are compiled and linked without blocking the main thread: start the
 * link, poll `isProgramComplete()` once per animation frame, then `finishProgram()`.
 *
 * Pure functions over a context that the caller owns; no `window` / `document`, so the module is
 * safe to import in workers and on the server.
 */

export type PendingProgram = {
  program: WebGLProgram;
  vertex: WebGLShader;
  fragment: WebGLShader;
  /** `COMPLETION_STATUS_KHR` when KHR_parallel_shader_compile is available, otherwise null. */
  completionStatus: number | null;
};

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL: could not create a shader (context lost?)");
  gl.shaderSource(shader, source);
  // No status check here: reading COMPILE_STATUS would block until the compile finishes.
  gl.compileShader(shader);
  return shader;
}

/**
 * Compiles both shaders and starts linking. Returns at once; nothing is checked yet.
 * Throws only when the context cannot create shader or program objects (a lost context).
 */
export function linkProgramAsync(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): PendingProgram {
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  let fragment: WebGLShader;
  try {
    fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  } catch (error) {
    gl.deleteShader(vertex);
    throw error;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error("WebGL: could not create a program (context lost?)");
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return {
    program,
    vertex,
    fragment,
    completionStatus: parallel ? parallel.COMPLETION_STATUS_KHR : null,
  };
}

/**
 * Non-blocking poll. True when the extension is missing (then `finishProgram` simply blocks for the
 * rest of the link) and true on a lost context (so the caller reaches `finishProgram`, which throws
 * and sends it down its fallback path instead of polling forever).
 */
export function isProgramComplete(gl: WebGL2RenderingContext, pending: PendingProgram): boolean {
  if (pending.completionStatus === null) return true;
  if (gl.isContextLost()) return true;
  return gl.getProgramParameter(pending.program, pending.completionStatus) === true;
}

/**
 * Reads the link result. On success the shaders are released and the program is returned. On
 * failure everything is deleted and an Error carrying the shader and program info logs is thrown.
 */
export function finishProgram(gl: WebGL2RenderingContext, pending: PendingProgram): WebGLProgram {
  const { program, vertex, fragment } = pending;
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.detachShader(program, vertex);
    gl.detachShader(program, fragment);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return program;
  }

  const logs = [
    gl.isContextLost() ? "context lost" : "",
    gl.getShaderInfoLog(vertex) ?? "",
    gl.getShaderInfoLog(fragment) ?? "",
    gl.getProgramInfoLog(program) ?? "",
  ]
    // Drivers terminate their logs with NUL characters.
    .map((log) => log.split("\0").join("").trim())
    .filter((log) => log !== "");
  disposePendingProgram(gl, pending);
  throw new Error(`WebGL: program failed to link${logs.length > 0 ? `\n${logs.join("\n")}` : ""}`);
}

/**
 * Deletes the two shaders and the program of a link that is abandoned (unmount, context loss).
 *
 * Meant for teardown. Chrome queues a GL_INVALID_VALUE on the context when a program is deleted
 * while its parallel link is still running, so a context that lives on after this call should not
 * read `gl.getError()` as a verdict on its own next operation without draining it first.
 */
export function disposePendingProgram(gl: WebGL2RenderingContext, pending: PendingProgram): void {
  gl.deleteShader(pending.vertex);
  gl.deleteShader(pending.fragment);
  gl.deleteProgram(pending.program);
}

/**
 * GLSL ES 3.00 vertex shader: one attribute-less triangle that covers the whole viewport, built
 * from `gl_VertexID` (no buffers). Declares `out vec2 v_uv;` running 0..1 across the visible canvas
 * with the origin at the bottom-left. Draw with `gl.drawArrays(gl.TRIANGLES, 0, 3)`.
 */
export const FULLSCREEN_TRIANGLE_VS: string = [
  "#version 300 es",
  "out vec2 v_uv;",
  "void main() {",
  "  vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));",
  "  v_uv = pos;",
  "  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);",
  "}",
  "",
].join("\n");

/**
 * Parses `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa` (the hash is optional) into 0..1 components.
 * Alpha defaults to 1. Anything else yields opaque black.
 */
export function hexToRgba(hex: string): [number, number, number, number] {
  let digits = hex.trim();
  if (digits.startsWith("#")) digits = digits.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(digits)) return [0, 0, 0, 1];

  if (digits.length === 3 || digits.length === 4) {
    digits = Array.from(digits, (digit) => digit + digit).join("");
  }
  if (digits.length !== 6 && digits.length !== 8) return [0, 0, 0, 1];

  const channel = (offset: number) => Number.parseInt(digits.slice(offset, offset + 2), 16) / 255;
  return [channel(0), channel(2), channel(4), digits.length === 8 ? channel(6) : 1];
}
