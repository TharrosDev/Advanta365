/**
 * Tells a click on the dimmed page from a drag that merely ended there.
 *
 * A dialog's dimmed page is its own backdrop, so a click on it has the dialog as its target. But a
 * browser sends a click to the nearest common ancestor of the element the press landed on and the
 * one the release landed on: a text selection that starts in the panel and ends over the dimmed
 * page (or the other way round) is therefore a "click" on the dialog too, and must not close it.
 * Only a click whose press and release both landed on the dialog itself counts.
 *
 * Feed it the three events of one gesture, each with whether its target is the dialog itself:
 * `press` on the pointer going down, `release` on it going up, and `click` on the click that
 * follows, which answers whether to close and starts the next gesture clean.
 */
export function createScrimPress() {
  let started = false;
  let ended = false;

  return {
    press(onDialog: boolean): void {
      started = onDialog;
    },
    release(onDialog: boolean): void {
      ended = onDialog;
    },
    click(onDialog: boolean): boolean {
      const close = onDialog && started && ended;
      started = false;
      ended = false;
      return close;
    },
  };
}
