import { MARK_PATH_D, MARK_STROKE_WIDTH, MARK_VIEWBOX } from "@/lib/brand/mark";

/**
 * The Advanta365 mark as an inline SVG in `currentColor`. Sized by `height` (the width follows the 4:3
 * viewBox). Decorative unless a `title` is given, in which case it is exposed as an image with that name.
 */
export function LogoMark({
  height = "1.5em",
  className,
  title,
}: {
  height?: string;
  className?: string;
  title?: string;
}) {
  const style = { display: "block", aspectRatio: "4 / 3", width: "auto", height };
  const path = (
    <path
      d={MARK_PATH_D}
      stroke="currentColor"
      strokeWidth={MARK_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const viewBox = `0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`;

  if (title) {
    return (
      <svg
        className={className}
        viewBox={viewBox}
        style={style}
        fill="none"
        role="img"
        focusable="false"
      >
        <title>{title}</title>
        {path}
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox={viewBox}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}
