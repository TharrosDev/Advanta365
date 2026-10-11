import { cx } from "@/lib/cx";
import styles from "./blank.module.css";

/**
 * The blank: a highlighted empty field with a text caret, standing for the part of a document that
 * is left for the buyer to fill in. Always decoration. `caret="blink"` blinks the caret three times
 * after first paint and then leaves it solid; `steady` draws it solid; `none` leaves it out.
 * `size` is the height of the field (28, 42 or 56px); it is as wide as its container.
 *
 * Hooks: `data-blank` on the field, `data-caret` on the caret.
 */
export function Blank({
  caret = "steady",
  size = "md",
  className,
}: {
  caret?: "blink" | "steady" | "none";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span data-blank="" aria-hidden="true" className={cx(styles.root, styles[size], className)}>
      {caret === "none" ? null : (
        <span data-caret="" className={cx(styles.caret, caret === "blink" && styles.blink)} />
      )}
    </span>
  );
}
