import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./value-tiles.module.css";

export type ValueTileName = "tested" | "borrow" | "adapt" | "sector";

/** Every 24 units, none on the outer edge: the drafting board under each drawing. */
const BOARD = "M24 0V96M48 0V96M72 0V96M0 24H96M0 48H96M0 72H96";

/**
 * The drawings, 96 units square. Ink line art; the sheets are filled with the surface so the board
 * lines stop at their edges. The third is the only one that carries the highlighter.
 */
const DRAWINGS: Record<ValueTileName, ReactNode> = {
  // Field-tested: a box ticked off.
  tested: (
    <>
      <path className={styles.sheet} d="M24 24H72V72H24Z" />
      <path className={styles.line} d="M35 50L45 60L62 38" />
    </>
  ),
  // Experience you can borrow: one sheet laid over another, offset.
  borrow: (
    <>
      <path className={styles.line} d="M20 30H58V70H20Z" />
      <path className={styles.sheet} d="M38 18H76V58H38Z" />
    </>
  ),
  // Yours to adapt: a sheet of writing with a blank left in it.
  adapt: (
    <>
      <path className={styles.sheet} d="M24 16H72V80H24Z" />
      <path className={styles.line} d="M32 30H64M32 40H64M32 50H52" />
      <rect className={styles.blank} x="32" y="60" width="32" height="12" />
    </>
  ),
  // Built for any sector: three buildings of different heights on one ground line.
  sector: (
    <>
      <path className={styles.sheet} d="M14 80V46H34V80ZM38 80V22H60V80ZM64 80V36H82V80Z" />
      <path className={styles.line} d="M10 80H86" />
    </>
  ),
};

/**
 * A square line drawing for one of the four values on the home page: ink on a tile, 70px square
 * (56px below 40em), decoration only.
 */
export function ValueTile({ name, className }: { name: ValueTileName; className?: string }) {
  return (
    <svg
      className={cx(styles.tile, className)}
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.board} d={BOARD} />
      {DRAWINGS[name]}
    </svg>
  );
}
