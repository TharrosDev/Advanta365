/**
 * Loads the hero ribbon mask: a module worker with OffscreenCanvas when both exist, otherwise (or
 * when the worker fails, or stays silent) a cooperative build on the main thread.
 * Results are cached per `width:shadeFloor`, so coming back to the home page is instant.
 */

import { CROP_ASPECT, OVERFLOW_SCALE } from "./geometry";
import type { LiquidMask, LiquidMaskRequest, MaskWorkerReply } from "./mask";

const LARGE_MASK_WIDTH = 2048;
const SMALL_MASK_WIDTH = 1024;
/** The larger mask is used once the hero canvas can be at least this wide (CSS px). */
const LARGE_MASK_MIN_EXTENT = 1024;
/**
 * The main-thread build always uses the small mask, whatever the viewport: a quarter of the pixels,
 * because it shares the thread with hydration and the loader animation.
 */
const MAIN_THREAD_MASK_WIDTH = SMALL_MASK_WIDTH;
/** A worker that has not answered by then is abandoned for the main-thread build. */
const WORKER_TIMEOUT = 5000;
const MEASURE_NAME = "hero-liquid-mask";

const cache = new Map<string, Promise<LiquidMask>>();

/** Mask width for the current viewport. Decided once, at mount; not re-chosen on resize. */
export function chooseMaskWidth(): number {
  if (typeof window === "undefined") return SMALL_MASK_WIDTH;
  const extent = Math.max(window.innerWidth, window.innerHeight * OVERFLOW_SCALE * CROP_ASPECT);
  return extent >= LARGE_MASK_MIN_EXTENT ? LARGE_MASK_WIDTH : SMALL_MASK_WIDTH;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function buildInWorker(request: LiquidMaskRequest): Promise<LiquidMask> {
  return new Promise<LiquidMask>((resolve, reject) => {
    // A constructor that throws (blocked by policy, no module workers) rejects this promise.
    const worker = new Worker(new URL("./mask.worker.ts", import.meta.url), { type: "module" });
    let settled = false;

    const timer = setTimeout(() => {
      finish(() => reject(new Error("hero-liquid: the mask worker timed out")));
    }, WORKER_TIMEOUT);

    // One reply (or one failure) per worker; it is terminated either way.
    function finish(settle: () => void): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      settle();
    }

    worker.onmessage = (event: MessageEvent<MaskWorkerReply | null | undefined>) => {
      const data = event.data;
      if (data && data.type === "mask") {
        finish(() => resolve(data.mask));
      } else {
        const message = data && data.type === "error" ? data.message : "unexpected reply";
        finish(() => reject(new Error(`hero-liquid: the mask worker failed (${message})`)));
      }
    };
    worker.onerror = (event) => {
      // Handled here (the main thread takes over), so it is not reported as an uncaught error.
      event.preventDefault();
      finish(() => reject(new Error("hero-liquid: the mask worker could not run")));
    };
    worker.onmessageerror = () => {
      finish(() => reject(new Error("hero-liquid: the mask worker reply could not be read")));
    };

    worker.postMessage(request);
  });
}

/**
 * Cooperative fallback. Starts in a later task, always builds the small mask and yields to the event
 * loop between the builder's stages, so it never blocks the page with one long task.
 */
async function buildOnMainThread(shadeFloor: number): Promise<LiquidMask> {
  await yieldToMain();
  const { buildLiquidMask, createRasterizer } = await import("./mask");
  const { rasterize, release } = createRasterizer((width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext("2d", { willReadFrequently: true });
  });
  try {
    return await buildLiquidMask(
      { width: MAIN_THREAD_MASK_WIDTH, shadeFloor, pause: yieldToMain },
      rasterize,
    );
  } finally {
    release();
  }
}

async function build(request: LiquidMaskRequest): Promise<LiquidMask> {
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    try {
      return await buildInWorker(request);
    } catch {
      // Worker blocked, failed to load, threw or timed out: the main thread takes over.
    }
  }
  return buildOnMainThread(request.shadeFloor);
}

async function measured(request: LiquidMaskRequest): Promise<LiquidMask> {
  const startMark = `${MEASURE_NAME}-start`;
  try {
    performance.mark(startMark);
  } catch {
    // Timing is informational only.
  }
  try {
    return await build(request);
  } finally {
    try {
      performance.measure(MEASURE_NAME, startMark);
    } catch {
      // Timing is informational only.
    }
  }
}

/** Promise-cached per `width:shadeFloor`. A rejected build is evicted so the next mount can retry. */
export function loadLiquidMask({ width, shadeFloor }: LiquidMaskRequest): Promise<LiquidMask> {
  const key = `${width}:${shadeFloor}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = measured({ width, shadeFloor });
  cache.set(key, promise);
  promise.catch(() => {
    if (cache.get(key) === promise) cache.delete(key);
  });
  return promise;
}
