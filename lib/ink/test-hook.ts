import type { LayerHandle } from "@/components/ink/ink-controller";
import { STILL_QUALITY } from "./stills";
import type { Ink, InkStats, SceneName } from "./types";

/**
 * `window.__inkTest`: what the browser specs and the stills script ask of the ink layer. Imported
 * only when the page set `window.__INK_TEST__` before the layer mounted, so it is never part of a
 * visitor's page.
 */

export type ZoneExtreme = {
  kind: string;
  /** The luminance the zone promises: a floor on a light ground, a ceiling on a dark one. */
  cap: number;
  dark: boolean;
  /** The lowest (light ground) or highest (dark ground) relative luminance under the zone. */
  extreme: number;
};

export type InkTest = {
  /** One settled frame of a scene in its own backdrop, as a WebP data URL. */
  still(scene: SceneName): Promise<string | null>;
  loseContext(): void;
  restoreContext(): void;
  zoneExtremes(): ZoneExtreme[];
  /** Mean milliseconds of one step and one draw. */
  cost(frames?: number): number | null;
  stats(): InkStats | null;
  /** The engine itself, for frame-by-frame checks. */
  engine(): Ink | null;
  /** Puts the canvas in a scene's backdrop without starting the loop. */
  hold(scene: SceneName): Promise<boolean>;
};

declare global {
  interface Window {
    __inkTest?: InkTest;
  }
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

/** Relative luminance (WCAG) of an 8-bit sRGB pixel. */
export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(b / 255);
}

/** Sets the hook up on `window`; the function it returns takes it down again. */
export function installInkTest(layer: LayerHandle): () => void {
  let loser: WEBGL_lose_context | null = null;
  const context = () => layer.canvas()?.getContext("webgl2") ?? null;

  const hook: InkTest = {
    async still(scene) {
      const ink = await layer.hold(scene);
      const canvas = layer.canvas();
      if (!ink || !canvas) return null;
      await ink.still(scene);
      // The drawing buffer is only readable in the task that drew it.
      ink.render();
      return canvas.toDataURL("image/webp", STILL_QUALITY);
    },
    loseContext() {
      loser = context()?.getExtension("WEBGL_lose_context") ?? null;
      loser?.loseContext();
    },
    restoreContext() {
      loser?.restoreContext();
    },
    zoneExtremes() {
      const ink = layer.ink();
      const canvas = layer.canvas();
      const gl = context();
      if (!ink || !canvas || !gl) return [];
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return [];
      const sx = canvas.width / box.width;
      const sy = canvas.height / box.height;
      ink.render();
      return layer.calm().flatMap(({ kind, rect, cap, dark }) => {
        const x0 = Math.max(0, Math.floor(rect.x * sx));
        const x1 = Math.min(canvas.width, Math.ceil((rect.x + rect.width) * sx));
        // The buffer's origin is its bottom-left corner.
        const y0 = Math.max(0, Math.floor(canvas.height - (rect.y + rect.height) * sy));
        const y1 = Math.min(canvas.height, Math.ceil(canvas.height - rect.y * sy));
        if (x1 <= x0 || y1 <= y0) return [];
        const pixels = new Uint8Array((x1 - x0) * (y1 - y0) * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.readPixels(x0, y0, x1 - x0, y1 - y0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let extreme = dark ? 0 : 1;
        for (let i = 0; i < pixels.length; i += 4) {
          const y = luminance(pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0);
          extreme = dark ? Math.max(extreme, y) : Math.min(extreme, y);
        }
        return [{ kind, cap, dark, extreme }];
      });
    },
    cost: (frames) => layer.ink()?.measureCost(frames) ?? null,
    stats: () => layer.ink()?.stats() ?? null,
    engine: () => layer.ink(),
    hold: async (scene) => !!(await layer.hold(scene)),
  };

  window.__inkTest = hook;
  return () => {
    if (window.__inkTest === hook) delete window.__inkTest;
  };
}
