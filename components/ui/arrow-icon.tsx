export type ArrowDirection = "up-right" | "right" | "down" | "up" | "left";

const ROTATION: Record<ArrowDirection, number> = {
  "up-right": 0,
  right: 45,
  down: 135,
  left: 225,
  up: -45,
};

/**
 * The site's one arrow glyph: a diagonal shaft with an open corner head, drawn in a tall 10 x 21 box so it
 * sits on a text line. Other directions are the same glyph rotated around its centre.
 */
export function ArrowIcon({
  direction = "up-right",
  size = 21,
  className,
}: {
  direction?: ArrowDirection;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={(size * 10) / 21}
      height={size}
      viewBox="0 0 10 21"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ transform: `rotate(${ROTATION[direction]}deg)`, overflow: "visible" }}
    >
      <path d="M1 15L9 7M3.2 7H9V12.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
