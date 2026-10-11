/**
 * Module worker that builds the hero ribbon mask off the main thread (OffscreenCanvas).
 * Protocol: one `{ width, shadeFloor }` message in, one `{ type: "mask" | "error" }` reply out, then
 * the worker closes. Relative imports only: this file is bundled as its own worker chunk.
 */

import {
  buildLiquidMask,
  createRasterizer,
  type LiquidMaskRequest,
  type MaskWorkerReply,
} from "./mask";

type WorkerScope = {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent) => void) | null;
  close?: () => void;
};

const scope = self as unknown as WorkerScope;

function reply(message: MaskWorkerReply, transfer: Transferable[] = []): void {
  scope.postMessage(message, transfer);
  scope.close?.();
}

async function build(request: Partial<LiquidMaskRequest> | null | undefined): Promise<void> {
  try {
    const width = request?.width;
    const shadeFloor = request?.shadeFloor;
    if (typeof width !== "number" || !Number.isFinite(width) || width < 16) {
      throw new Error("hero-liquid: invalid mask width");
    }
    if (typeof shadeFloor !== "number" || !Number.isFinite(shadeFloor)) {
      throw new Error("hero-liquid: invalid shade floor");
    }

    const { rasterize } = createRasterizer((canvasWidth, canvasHeight) =>
      new OffscreenCanvas(canvasWidth, canvasHeight).getContext("2d", { willReadFrequently: true }),
    );
    const mask = await buildLiquidMask({ width, shadeFloor }, rasterize);
    reply({ type: "mask", mask }, [mask.base.buffer, mask.meta.buffer, mask.field.buffer]);
  } catch (error) {
    reply({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
}

scope.onmessage = (event) => {
  // One job per worker.
  scope.onmessage = null;
  void build(event.data as Partial<LiquidMaskRequest> | null | undefined);
};
