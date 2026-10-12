import { expect, test } from "vitest";
import { createScrimPress } from "@/lib/scrim";

test("a press and a release on the dimmed page, then the click, close", () => {
  const scrim = createScrimPress();
  scrim.press(true);
  scrim.release(true);
  expect(scrim.click(true)).toBe(true);
});

test("a selection that starts in the panel and ends on the dimmed page does not close", () => {
  const scrim = createScrimPress();
  scrim.press(false);
  scrim.release(true);
  expect(scrim.click(true)).toBe(false);
});

test("a drag that starts on the dimmed page and ends in the panel does not close", () => {
  const scrim = createScrimPress();
  scrim.press(true);
  scrim.release(false);
  expect(scrim.click(true)).toBe(false);
});

test("a click whose target is inside the panel never closes", () => {
  const scrim = createScrimPress();
  scrim.press(true);
  scrim.release(true);
  expect(scrim.click(false)).toBe(false);
});

test("a click with no press before it does not close", () => {
  expect(createScrimPress().click(true)).toBe(false);
});

test("each gesture starts clean: a close does not carry over to the next click", () => {
  const scrim = createScrimPress();
  scrim.press(true);
  scrim.release(true);
  expect(scrim.click(true)).toBe(true);
  expect(scrim.click(true)).toBe(false);

  scrim.press(true);
  scrim.release(true);
  expect(scrim.click(false)).toBe(false);
  expect(scrim.click(true)).toBe(false);
});
