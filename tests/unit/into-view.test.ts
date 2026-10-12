import { describe, expect, it } from "vitest";
import { intoViewOffset } from "@/lib/scroll/into-view";

describe("intoViewOffset", () => {
  const row = { left: 0, right: 390 };

  it("leaves an item that is already in view", () => {
    expect(intoViewOffset(row, { left: 21, right: 120 }, 21)).toBe(0);
  });

  it("brings an item cut off at the end to the start padding, where the row can snap", () => {
    expect(intoViewOffset(row, { left: 346, right: 434 }, 21)).toBe(325);
  });

  it("brings an item off the start back to the start padding", () => {
    expect(intoViewOffset(row, { left: -80, right: 10 }, 21)).toBe(-101);
  });
});
