import { describe, expect, it } from "vitest";
import {
  CADENCE_FRAMES,
  MAX_CAPPED_CADENCE_MS,
  medianOf,
  SLOW_FRAME_MS,
  slowFrameMs,
} from "@/lib/ink/engine/defaults";

// What the engine's adaptive watch counts as a slow frame: against the display's own rhythm, so a
// display capped at 30 Hz is not taken for a machine that cannot keep up.

/** The watch's counter over a run of frame intervals, as `watch` in the engine keeps it. */
function framesUntilStepDown(intervals: number[], cadence: number): number | null {
  let slow = 0;
  for (let i = 0; i < intervals.length; i++) {
    slow = intervals[i]! > slowFrameMs(cadence) ? slow + 1 : Math.max(0, slow - 2);
    if (slow > 75) return i + 1;
  }
  return null;
}

describe("medianOf", () => {
  it("is the middle value, whatever the order", () => {
    expect(medianOf([30, 10, 20])).toBe(20);
    expect(medianOf([16.7, 16.6, 90, 16.7, 16.8])).toBe(16.7);
  });

  it("takes the upper one of two, and 0 of nothing", () => {
    expect(medianOf([10, 20])).toBe(20);
    expect(medianOf([])).toBe(0);
  });

  it("leaves its input as it was", () => {
    const values = [3, 1, 2];
    medianOf(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

describe("slowFrameMs", () => {
  it("stays at 24 ms on a display faster than 60 Hz, and within a millisecond of it at 60 Hz", () => {
    expect(slowFrameMs(8.3)).toBe(SLOW_FRAME_MS);
    expect(slowFrameMs(6.9)).toBe(SLOW_FRAME_MS);
    expect(slowFrameMs(16.7)).toBeLessThan(SLOW_FRAME_MS + 1.5);
    // A dropped frame at 60 Hz (33 ms) is slow, as it always was.
    expect(33.3).toBeGreaterThan(slowFrameMs(16.7));
  });

  it("is 24 ms while the cadence is not known", () => {
    expect(slowFrameMs(0)).toBe(SLOW_FRAME_MS);
    expect(slowFrameMs(Number.NaN)).toBe(SLOW_FRAME_MS);
  });

  it("makes a 33 ms frame normal on a display capped at 30 Hz", () => {
    expect(slowFrameMs(33.3)).toBeGreaterThan(36);
    expect(slowFrameMs(33.3)).toBeGreaterThan(33.3 + 8);
  });

  it("does not forgive a cadence slower than a 30 Hz cap", () => {
    expect(slowFrameMs(MAX_CAPPED_CADENCE_MS + 1)).toBe(SLOW_FRAME_MS);
    expect(slowFrameMs(60)).toBe(SLOW_FRAME_MS);
  });

  it("never asks for less than 24 ms", () => {
    for (const cadence of [1, 8, 12, 16, 20, 24, 30, 33.3, 36, 40, 100]) {
      expect(slowFrameMs(cadence)).toBeGreaterThanOrEqual(SLOW_FRAME_MS);
    }
  });
});

describe("the watch against the cadence", () => {
  const frames = (ms: number, count: number) => Array.from({ length: count }, () => ms);

  it("steps down a 60 Hz display whose frames run at 33 ms", () => {
    // The cadence was learned at 60 Hz; the frames then slow to 33 ms and stay there.
    expect(framesUntilStepDown(frames(33.3, 400), 16.7)).toBe(76);
  });

  it("leaves a display capped at 30 Hz alone for as long as it runs", () => {
    expect(framesUntilStepDown(frames(33.3, 20000), 33.3)).toBeNull();
  });

  it("still catches a capped display whose frames then stall", () => {
    expect(framesUntilStepDown(frames(66.7, 400), 33.3)).toBe(76);
  });

  it("learns the cadence from a fixed number of frames", () => {
    expect(CADENCE_FRAMES).toBeGreaterThanOrEqual(10);
    // A run that hitches while it is timed still reads its display's rhythm.
    const timed = [...frames(33.3, CADENCE_FRAMES - 4), 90, 100, 85, 95];
    expect(medianOf(timed)).toBe(33.3);
  });
});
