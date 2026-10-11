import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./value-tiles.module.css";

export type LineDrawingName =
  "tested" | "borrow" | "adapt" | "sector" | "audiences" | "example" | "copilot";

/**
 * The drawings, 96 units square: ink line art with no ground of its own. A shape of the `sheet`
 * class is filled with the surface, so it hides the lines it lies over. Only "adapt" and
 * "copilot" carry the highlighter: the part that is the buyer's own.
 */
const DRAWINGS: Record<LineDrawingName, ReactNode> = {
  // Field-tested: a box ticked off.
  tested: (
    <>
      <path className={styles.sheet} d="M20 20H76V76H20Z" />
      <path className={styles.line} d="M33 50L44 61L64 36" />
    </>
  ),
  // Experience you can borrow: one sheet laid over another, offset.
  borrow: (
    <>
      <path className={styles.line} d="M16 30H58V78H16Z" />
      <path className={styles.sheet} d="M38 16H80V64H38Z" />
    </>
  ),
  // Yours to adapt: a sheet of writing with a blank left in it.
  adapt: (
    <>
      <path className={styles.sheet} d="M22 12H74V84H22Z" />
      <path className={styles.line} d="M32 28H64M32 39H64M32 50H50" />
      <rect className={styles.blank} x="32" y="61" width="32" height="13" />
    </>
  ),
  // Built for any sector: three buildings of different heights on one ground line.
  sector: (
    <>
      <path className={styles.sheet} d="M18 80V46H36V80ZM40 80V20H60V80ZM64 80V34H82V80Z" />
      <path className={styles.line} d="M16 80H88" />
    </>
  ),
  // Training for three audiences: three people, the middle one in front.
  audiences: (
    <>
      <circle className={styles.line} cx="24" cy="36" r="9" />
      <path className={styles.line} d="M8 72C8 60 15 53 24 53S40 60 40 72" />
      <circle className={styles.line} cx="72" cy="36" r="9" />
      <path className={styles.line} d="M56 72C56 60 63 53 72 53S88 60 88 72" />
      <circle className={styles.sheet} cx="48" cy="40" r="11" />
      <path className={styles.sheet} d="M28 84C28 69 37 60 48 60S68 69 68 84" />
    </>
  ),
  // A complete worked example: a sheet written to its last line.
  example: (
    <>
      <path className={styles.sheet} d="M22 12H74V84H22Z" />
      <path className={styles.line} d="M32 28H64M32 39H64M32 50H64M32 61H64M32 72H52" />
    </>
  ),
  // Copilot-ready: a sheet with a prompt beside it.
  copilot: (
    <>
      <path className={styles.sheet} d="M14 14H60V76H14Z" />
      <path className={styles.line} d="M24 30H50M24 41H50M24 52H40" />
      <path className={styles.blank} d="M46 48H86V72H68L60 82V72H46Z" />
    </>
  ),
};

/**
 * A square line drawing, decoration only. It is `--drawing` wide (84px unless a caller says
 * otherwise): the four values of the home page use it at that size, the manifest rows at 56px.
 */
export function LineDrawing({ name, className }: { name: LineDrawingName; className?: string }) {
  return (
    <svg
      className={cx(styles.drawing, className)}
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
    >
      {DRAWINGS[name]}
    </svg>
  );
}
