import {
  MARK_ASPECT,
  MARK_ASPECT_COMPACT,
  MARK_BODY_D,
  MARK_DIGITS_D,
  MARK_DIGITS_STROKE_WIDTH,
  MARK_PATH_D,
  MARK_STROKE_WIDTH,
  MARK_TAIL_COMPACT_D,
  MARK_TAIL_D,
  MARK_VIEWBOX,
  MARK_VIEWBOX_COMPACT,
} from "@/lib/brand/mark";

/**
 * The Advanta365 mark as an inline SVG. Sized by `height` (the width follows the viewBox: 3:2 for
 * the full form, 5:4 for the compact one).
 *
 * `tone="one"` strokes the whole mark as one path in `currentColor`, in the compact form. `tone="two"`
 * draws it in two inks: the tail of the crossbar first, in `var(--logo-tail)` (falling back to
 * `currentColor`), and the "A" over it in `currentColor`. Two inks also bring the full form, with
 * the "365" that stands on the long tail, in the tail's ink and a finer pen, unless `digits` is
 * false: they are a quarter of the mark's height, so a mark under 28px high should go without them
 * and be drawn in the compact form, with its shorter tail. One ink never draws them. Decorative
 * unless a `title` is given, in which case it is exposed as an image with that name (the digits add
 * nothing to it). Hook: `data-mark-digits`, on the path of the digits.
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
  const full = tone === "two" && digits;
  const box = full ? MARK_VIEWBOX : MARK_VIEWBOX_COMPACT;
  const aspect = full ? MARK_ASPECT : MARK_ASPECT_COMPACT;
  const style = { aspectRatio: `${aspect}`, width: "auto", height };
  const stroke = {
    strokeWidth: MARK_STROKE_WIDTH,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const paths =
    tone === "two" ? (
      <>
        <path
          d={full ? MARK_TAIL_D : MARK_TAIL_COMPACT_D}
          stroke="var(--logo-tail, currentColor)"
          {...stroke}
        />
        <path d={MARK_BODY_D} stroke="currentColor" {...stroke} />
        {full ? (
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
  const viewBox = `0 0 ${box.width} ${box.height}`;

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
