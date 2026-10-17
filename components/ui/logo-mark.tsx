import { MARK_ASPECT, MARK_HUE_D, MARK_INK_D, MARK_PATH_D, MARK_VIEWBOX } from "@/lib/brand/mark";

/**
 * The Advanta365 mark as an inline SVG. Sized by `height` (the width follows the viewBox, 12:11).
 *
 * `tone="one"` fills the whole "A" as one shape in `currentColor`. `tone="two"` draws it in two
 * inks: the right half first, in `var(--logo-half)` (falling back to `currentColor`), and the arm
 * over it in `currentColor`. Decorative unless a `title` is given, in which case it is exposed as
 * an image with that name.
 */
export function LogoMark({
  height = "1.5em",
  className,
  title,
  tone = "one",
}: {
  height?: string;
  className?: string;
  title?: string;
  tone?: "one" | "two";
}) {
  const style = { aspectRatio: `${MARK_ASPECT}`, width: "auto", height };
  const shapes =
    tone === "two" ? (
      <>
        <path d={MARK_HUE_D} fill="var(--logo-half, currentColor)" />
        <path d={MARK_INK_D} fill="currentColor" />
      </>
    ) : (
      <path d={MARK_PATH_D} fill="currentColor" />
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
        {shapes}
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
      {shapes}
    </svg>
  );
}
