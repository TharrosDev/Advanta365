/**
 * One observer for everything that waits to be seen. An element is marked `data-seen` once, when
 * it comes into view, and is then left alone; the stylesheets do the rest (app/motion.css for
 * `[data-move]` and `[data-ninety]`, the modules for `[data-watch]`).
 *
 * The bottom 12% of the viewport does not count, so a block is clear of the edge when it arrives.
 * An element asks for more with `data-watch="half"`, and `[data-ninety]` always does: half of it,
 * or half of the viewport where it is taller than that, must be in view.
 */

const SEEN = "data-seen";
const ROOT_MARGIN = "0px 0px -12% 0px";
const VISIBLE_SHARE = 0.88;
const STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

/** Present wherever movement is on: a tally or a figure that starts when it is seen. */
export const WATCHED = "[data-watch]";
/** Added where view timelines are missing, to do in script what CSS does elsewhere. */
export const MOVED = '[data-move]:not([data-when="load"]), [data-ninety]';

function needsHalf(element: Element): boolean {
  return element.hasAttribute("data-ninety") || element.getAttribute("data-watch") === "half";
}

/** Whether the element has arrived, read from the layout as it is now. Anything above counts. */
export function hasArrived(element: Element, viewport = window.innerHeight): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const line = viewport * VISIBLE_SHARE;
  if (!needsHalf(element)) return rect.top < line;
  if (rect.bottom <= 0) return true;
  const visible = Math.min(rect.bottom, line) - Math.max(rect.top, 0);
  return visible >= Math.min(rect.height, line) / 2;
}

function mark(element: Element) {
  element.setAttribute(SEEN, "");
}

/**
 * Marks what is already in view, synchronously, and then watches the rest, including elements
 * that are added later. Returns the function that stops it.
 */
export function watchSeen(selector: string): () => void {
  const pending = `:is(${selector}):not([${SEEN}])`;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target;
        const passed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
        if (!passed && !(entry.isIntersecting && arrived(entry))) continue;
        mark(element);
        observer.unobserve(element);
      }
    },
    { rootMargin: ROOT_MARGIN, threshold: STEPS },
  );

  const take = (scope: ParentNode) => {
    for (const element of scope.querySelectorAll(pending)) {
      if (hasArrived(element)) mark(element);
      else observer.observe(element);
    }
  };

  take(document);

  const additions = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(pending)) observer.observe(node);
        for (const element of node.querySelectorAll(pending)) observer.observe(element);
      }
    }
  });
  additions.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    additions.disconnect();
  };
}

function arrived(entry: IntersectionObserverEntry): boolean {
  if (!needsHalf(entry.target)) return true;
  const room = entry.rootBounds?.height ?? window.innerHeight * VISIBLE_SHARE;
  const whole = Math.min(entry.boundingClientRect.height, room);
  return entry.intersectionRect.height >= whole / 2 - 1;
}

/**
 * Calls `onSeen` once, when `share` of the element is in view. Returns the function that gives
 * up waiting.
 */
export function whenSeen(element: Element, share: number, onSeen: () => void): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= share))
        return;
      observer.disconnect();
      onSeen();
    },
    { threshold: share },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
