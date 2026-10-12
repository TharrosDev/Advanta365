/**
 * How far a row that scrolls sideways must move so that one of its items stands in it, clear of
 * the row's scroll padding. Edges are in viewport pixels, as `getBoundingClientRect` gives them. An
 * item already wholly in view stays where it is (0); otherwise the item's start is brought to the
 * padding, which is where a row that snaps its items to their start can rest, so the browser does
 * not snap it back out of view. A negative answer scrolls toward the start, a positive one toward
 * the end; the browser stops at the row's own ends.
 */
export function intoViewOffset(
  row: { left: number; right: number },
  item: { left: number; right: number },
  padding = 0,
): number {
  const start = row.left + padding;
  const end = row.right - padding;
  if (item.left >= start && item.right <= end) return 0;
  return item.left - start;
}

/** Scrolls the row at once, without moving the page, so its current item is in view. */
export function scrollCurrentIntoView(row: HTMLElement): void {
  const current = row.querySelector("[aria-current]")?.closest("li");
  if (!current || row.scrollWidth <= row.clientWidth) return;
  const padding = parseFloat(getComputedStyle(row).scrollPaddingInlineStart) || 0;
  row.scrollLeft += intoViewOffset(
    row.getBoundingClientRect(),
    current.getBoundingClientRect(),
    padding,
  );
}
