"use client";

import { useEffect, useRef, useState } from "react";
import { cssVars } from "@/lib/cx";
import styles from "./split-flap.module.css";

/** The drum of every cell, in the order its flaps fall: a blank, then the alphabet. */
const DRUM = " abcdefghijklmnopqrstuvwxyz";

/** A blank cell at rest holds this: no width, but a baseline, so the board's line keeps its height. */
const BLANK = "\u200b";

/** One letter's flap falls in this time, its top half and then its bottom half. */
const STEP = 70;

/** The first word stands this long once the hero's clock has started: past the hand's landing. */
const FIRST_HOLD = 3600;

/** Every later word stands this long once its last letter is down. */
const HOLD = 2600;

/**
 * One cell of the board. `char` is the letter it shows, `prev` the one whose flap is falling over
 * it (null when the cell stands still), `flips` counts the flaps so each one is drawn afresh, and
 * `wait` is how many steps the cell lets pass before it starts, so the board turns left to right.
 * `run` and `delay` time the change of its width, in steps.
 */
type Cell = {
  char: string;
  target: string;
  prev: string | null;
  flips: number;
  wait: number;
  run: number;
  delay: number;
};

const moving = () => document.documentElement.dataset.motion === "on";

/** How many flaps fall between two letters on the drum, which only ever turns forwards. */
const distance = (from: string, to: string) =>
  (DRUM.indexOf(to) - DRUM.indexOf(from) + DRUM.length) % DRUM.length;

function standing(word: string, length: number): Cell[] {
  return Array.from({ length }, (_, index) => {
    const char = word[index] ?? " ";
    return { char, target: char, prev: null, flips: 0, wait: 0, run: 0, delay: 0 };
  });
}

/** Every cell is set to turn to its letter of `word`, a step after the cell to its left. */
function aim(cells: readonly Cell[], word: string): Cell[] {
  return cells.map((cell, index) => {
    const target = word[index] ?? " ";
    return { ...cell, target, wait: index, run: distance(cell.char, target), delay: index };
  });
}

/** One step of the board: every cell that is due lets one flap fall. */
function advance(cells: readonly Cell[]): Cell[] {
  return cells.map((cell) => {
    if (cell.wait > 0) return { ...cell, wait: cell.wait - 1 };
    if (cell.char === cell.target) return cell.prev === null ? cell : { ...cell, prev: null };
    const next = DRUM[(DRUM.indexOf(cell.char) + 1) % DRUM.length] ?? " ";
    return { ...cell, prev: cell.char, char: next, flips: cell.flips + 1 };
  });
}

const settled = (cells: readonly Cell[]) =>
  cells.every((cell) => cell.char === cell.target && cell.prev === null);

/**
 * How much room is left on the board's line, in pixels: the width of the block it stands in, less
 * the width of what stands on that line with it.
 */
function room(board: HTMLElement): number {
  let block = board.parentElement;
  while (block && getComputedStyle(block).display.startsWith("inline")) {
    block = block.parentElement;
  }
  if (!block) return 0;
  const style = getComputedStyle(block);
  const width = block.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const box = board.getBoundingClientRect();
  const middle = (box.top + box.bottom) / 2;
  const range = document.createRange();
  range.selectNodeContents(block);
  const line = [...range.getClientRects()].filter(
    (rect) => rect.width > 0 && rect.top <= middle && rect.bottom >= middle,
  );
  if (line.length === 0) return 0;
  const left = Math.min(...line.map((rect) => rect.left));
  const right = Math.max(...line.map((rect) => rect.right));
  return width - (right - left);
}

/**
 * A word on a split-flap board, as on a station's departures board: every few seconds it turns to
 * the next of `words`, each letter falling flap by flap through the alphabet to its new one, left
 * to right, and the board widening or narrowing with the word. The first word is the one that
 * stands at load, under reduced motion and without a script, and it is the only one a screen
 * reader is given: the turning letters are decoration. `tail` (the sentence's full stop) follows
 * the board on its line and in what is read, with no gap before it.
 *
 * The board waits for the hero's clock (the root element losing `data-intro`) and for the page's
 * fonts, so its letters can be measured, and it holds still while it is out of sight. It never
 * breaks its line: a word wider than the first goes up only if the line has room for it then,
 * and is passed over otherwise (on a phone, or where the first word's line is already full).
 */
export function SplitFlap({ words, tail = "" }: { words: readonly string[]; tail?: string }) {
  const first = words[0] ?? "";
  const length = Math.max(...words.map((word) => word.length));
  const [cells, setCells] = useState(() => standing(first, length));
  const [widths, setWidths] = useState<Record<string, number> | null>(null);
  const board = useRef<HTMLSpanElement>(null);
  const ruler = useRef<HTMLSpanElement>(null);

  // Every letter of the drum, measured once in the board's own type, in ems.
  useEffect(() => {
    if (!moving()) return;
    let gone = false;
    void document.fonts.ready.then(() => {
      const span = ruler.current;
      if (gone || !span) return;
      const size = parseFloat(getComputedStyle(span).fontSize);
      const measured: Record<string, number> = {};
      for (const char of DRUM) {
        span.textContent = char;
        measured[char] = char === " " ? 0 : span.getBoundingClientRect().width / size;
      }
      span.textContent = "";
      setWidths(measured);
    });
    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    const element = board.current;
    if (!widths || !element) return;
    const root = document.documentElement;
    let current = standing(first, length);
    let index = 0;
    const wide = (word: string) => [...word].reduce((sum, char) => sum + (widths[char] ?? 0), 0);
    let seen = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ticker: ReturnType<typeof setInterval> | undefined;

    const sight = new IntersectionObserver(([entry]) => {
      seen = entry?.isIntersecting ?? true;
    });
    sight.observe(element);

    const step = () => {
      current = advance(current);
      setCells(current);
      if (!settled(current)) return;
      clearInterval(ticker);
      timer = setTimeout(turn, HOLD);
    };

    const turn = () => {
      if (!moving()) return;
      if (document.hidden || !seen) {
        timer = setTimeout(turn, HOLD);
        return;
      }
      const size = parseFloat(getComputedStyle(element).fontSize);
      const budget = Math.max(wide(first), wide(words[index] ?? "") + room(element) / size);
      let next = index;
      do next = (next + 1) % words.length;
      while (next !== index && wide(words[next] ?? "") > budget);
      index = next;
      current = aim(current, words[index] ?? "");
      setCells(current);
      ticker = setInterval(step, STEP);
    };

    const intro = new MutationObserver(() => {
      if (root.hasAttribute("data-intro")) return;
      intro.disconnect();
      timer = setTimeout(turn, FIRST_HOLD);
    });
    if (root.hasAttribute("data-intro")) {
      intro.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
    } else {
      timer = setTimeout(turn, FIRST_HOLD);
    }

    return () => {
      intro.disconnect();
      sight.disconnect();
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, [widths, words, first, length]);

  return (
    <>
      <span className="visually-hidden">
        {first}
        {tail}
      </span>
      <span
        ref={board}
        className={styles.board}
        data-split-flap=""
        aria-hidden="true"
        style={cssVars({ "--flip": `${STEP}ms` })}
      >
        {cells.map((cell, position) => (
          <span
            key={position}
            className={styles.cell}
            data-flap-cell=""
            style={
              widths
                ? {
                    width: `${widths[cell.target] ?? 0}em`,
                    ...cssVars({
                      "--run": `${cell.run * STEP}ms`,
                      "--wait": `${cell.delay * STEP}ms`,
                    }),
                  }
                : undefined
            }
          >
            {cell.prev === null ? (
              <span className={styles.glyph}>{cell.char === " " ? BLANK : cell.char}</span>
            ) : (
              <>
                <span className={styles.glyph} data-half="top">
                  {cell.char}
                </span>
                <span className={styles.glyph} data-half="bottom">
                  {cell.prev}
                </span>
                <span key={`fall-${cell.flips}`} className={styles.glyph} data-flap="top">
                  {cell.prev}
                </span>
                <span key={`rise-${cell.flips}`} className={styles.glyph} data-flap="bottom">
                  {cell.char}
                </span>
              </>
            )}
          </span>
        ))}
        {tail}
        <span ref={ruler} className={styles.ruler} />
      </span>
    </>
  );
}
