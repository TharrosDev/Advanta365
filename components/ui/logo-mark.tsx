import {
  MARK_BODY_D,
  MARK_DIGITS_D,
  MARK_DIGITS_STROKE_WIDTH,
  MARK_PATH_D,
  MARK_STROKE_WIDTH,
  MARK_TAIL_D,
  MARK_VIEWBOX,
} from "@/lib/brand/mark";

/**
 * The Advanta365 mark as an inline SVG. Sized by `height` (the width follows the 4:3 viewBox).
 *
 * `tone="one"` strokes the whole mark as one path in `currentColor`. `tone="two"` draws it in two
 * inks: the tail of the crossbar first, in `var(--logo-tail)` (falling back to `currentColor`), and
 * the "A" over it in `currentColor`. Two inks also bring the "365" that stands on the tail, in the
 * tail's ink and a finer pen, unless `digits` is false: they are a fifth of the mark's height, so a
 * mark under 35px high should go without them. One ink never draws them. Decorative unless a
 * `title` is given, in which case it is exposed as an image with that name (the digits add nothing
 * to it). Hook: `data-mark-digits`, on the path of the digits.
 */
export function LogoMark({
  height = "1.5em",
  className,
  title,
  tone = "one",
  digits = true,
}: {
  height?: string;
  className?: string;
  title?: string;
  tone?: "one" | "two";
  digits?: boolean;
}) {
  const style = { display: "block", aspectRatio: "4 / 3", width: "auto", height };
  const stroke = {
    strokeWidth: MARK_STROKE_WIDTH,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const paths =
    tone === "two" ? (
      <>
        <path d={MARK_TAIL_D} stroke="var(--logo-tail, currentColor)" {...stroke} />
        <path d={MARK_BODY_D} stroke="currentColor" {...stroke} />
        {digits ? (
          <path
            data-mark-digits=""
            d={MARK_DIGITS_D}
            stroke="var(--logo-tail, currentColor)"
            {...stroke}
            strokeWidth={MARK_DIGITS_STROKE_WIDTH}
          />
        ) : null}
      </>
    ) : (
      <path d={MARK_PATH_D} stroke="currentColor" {...stroke} />
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
        {paths}
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
      {paths}
    </svg>
  );
}
