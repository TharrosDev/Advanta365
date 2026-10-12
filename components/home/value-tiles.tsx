import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./value-tiles.module.css";

export type LineDrawingName = "audiences" | "example" | "copilot";

/**
 * The drawings, 96 units square: ink line art with no ground of its own. A shape of the `sheet`
 * class is filled with the surface, so it hides the lines it lies over. Only "copilot" carries the
 * highlighter: the part that is the buyer's own.
 */
const DRAWINGS: Record<LineDrawingName, ReactNode> = {
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
 * otherwise); the manifest rows of `#inside`, its only caller, set it at 56px.
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
