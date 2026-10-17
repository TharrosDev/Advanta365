"use client";

import { useEffect, useRef, useState } from "react";
import { cssVars } from "@/lib/cx";
import styles from "./split-flap.module.css";

/** Every letter a cell can show, measured once: a blank, then the alphabet. */
const LETTERS = " abcdefghijklmnopqrstuvwxyz";

/** A blank cell at rest holds this: no width, but a baseline, so the board's line keeps its height. */
const BLANK = "\u200b";

/** A letter's one flap falls in this time, its top half and then its bottom half. */
const FLIP = 240;

/** Each cell flips this long after the cell to its left, so the word turns left to right. */
const STAGGER = 45;

/** The first word stands this long once the hero's clock has started: past the hand's landing. */
const FIRST_HOLD = 3600;

/** Every later word stands this long once its last letter is down. */
const HOLD = 2600;

/**
 * One cell of the board. `char` is the letter it shows, `prev` the one whose flap is falling over
 * it (null when the cell stands still), `flips` counts the flaps so each one is drawn afresh,
 * `wait` is how many staggers the cell lets pass before it flips, `age` how many have passed since
 * it flipped, and `index` its place. Its width is always its shown letter's, so it changes at the
 * moment the cell flips and never ahead of it.
 */
type Cell = {
  char: string;
  target: string;
  prev: string | null;
  flips: number;
  wait: number;
  age: number;
  index: number;
};

const moving = () => document.documentElement.dataset.motion === "on";

function standing(word: string, length: number): Cell[] {
  return Array.from({ length }, (_, index) => {
    const char = word[index] ?? " ";
    return { char, target: char, prev: null, flips: 0, wait: 0, age: 0, index };
  });
}

/** Every cell is set to turn to its letter of `word`, a stagger after the cell to its left. */
function aim(cells: readonly Cell[], word: string): Cell[] {
  return cells.map((cell) => ({ ...cell, target: word[cell.index] ?? " ", wait: cell.index }));
}

/**
 * One stagger of the board. A cell that is due and has a new letter flips once, straight from its
 * old letter to the new one; a cell whose letter stays never flips; a flap is cleared once it has
 * had the whole of `FLIP` to fall.
 */
function advance(cells: readonly Cell[]): Cell[] {
  return cells.map((cell) => {
    if (cell.wait > 0) return { ...cell, wait: cell.wait - 1 };
    if (cell.char !== cell.target) {
      return { ...cell, prev: cell.char, char: cell.target, flips: cell.flips + 1, age: 0 };
    }
    if (cell.prev === null) return cell;
    const age = cell.age + 1;
    return age * STAGGER >= FLIP ? { ...cell, prev: null, age: 0 } : { ...cell, age };
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
 * the next of `words`, each letter that changes flipping once, straight to its new one, left to
 * right, and the board widening or narrowing with the word. The first word is the one that
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

  // Every letter a cell can show, measured once in the board's own type, in ems.
  useEffect(() => {
    if (!moving()) return;
    let gone = false;
    void document.fonts.ready.then(() => {
      const span = ruler.current;
      if (gone || !span) return;
      const size = parseFloat(getComputedStyle(span).fontSize);
      const measured: Record<string, number> = {};
      for (const char of LETTERS) {
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
      current = advance(aim(current, words[index] ?? ""));
      setCells(current);
      ticker = setInterval(step, STAGGER);
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
        style={cssVars({ "--flip": `${FLIP}ms` })}
      >
        {cells.map((cell, position) => (
          <span
            key={position}
            className={styles.cell}
            data-flap-cell=""
            style={
              widths
                ? {
                    width: `${widths[cell.char] ?? 0}em`,
                    ...cssVars({
                      "--run": `${FLIP}ms`,
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
