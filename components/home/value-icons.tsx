import type { ReactNode } from "react";

/*
 * The three glyphs of the "Why Advanta365" cells. Original artwork: solid silhouettes in
 * `currentColor`, drawn on a 96-unit grid (no stroke thinner than 6 units, so they hold their weight at
 * 64px). Cut-outs use `fill-rule="evenodd"`.
 *
 * All three share the 96 x 96 box, so one CSS height gives them the same scale. Each glyph is moved by
 * the empty margin of its own artwork (`inset` to the left, `drop` down), so its left and bottom edges
 * sit exactly on the edges of the box and therefore on the text column and the spacing below it, the
 * way the reference's tightly cropped icons do.
 */
type GlyphProps = { className?: string };

function Glyph({
  inset,
  drop,
  className,
  children,
}: {
  inset: number;
  drop: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      style={{ aspectRatio: "1 / 1" }}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={`translate(${-inset} ${drop})`}>{children}</g>
    </svg>
  );
}

/** "SharePoint-first": a rhombus with two chevron bands under it, three stacked sites. */
export function LayersIcon({ className }: GlyphProps) {
  return (
    <Glyph inset={8} drop={7} className={className}>
      <path d="M48 8L88 30L48 52L8 30Z" />
      <path d="M8 37L48 59L88 37V48.5L48 70.5L8 48.5Z" />
      <path d="M8 55.5L48 77.5L88 55.5V67L48 89L8 67Z" />
    </Glyph>
  );
}

/** "Every step": three rising steps with a pennant on the top one, the way to handover. */
export function StepsIcon({ className }: GlyphProps) {
  return (
    <Glyph inset={8} drop={6} className={className}>
      <path d="M8 64H34V90H8Z" />
      <path d="M35 38H61V90H35Z" />
      <path d="M62 12H88V90H62Z" />
      <path d="M72 0H78L92 4.5L78 9V13H72Z" />
    </Glyph>
  );
}

/** "Private and public": an office tower with a window grid next to a civic hall. */
export function BuildingsIcon({ className }: GlyphProps) {
  return (
    <Glyph inset={6} drop={6} className={className}>
      <path d="M6 84H90V90H6Z" />
      <path
        fillRule="evenodd"
        d={[
          "M10 14H40V85H10Z",
          // two columns by four rows of 8-unit window cut-outs
          "M15 24H23V32H15Z",
          "M27 24H35V32H27Z",
          "M15 38H23V46H15Z",
          "M27 38H35V46H27Z",
          "M15 52H23V60H15Z",
          "M27 52H35V60H27Z",
          "M15 66H23V74H15Z",
          "M27 66H35V74H27Z",
        ].join("")}
      />
      <path d="M68 26L88 44H48Z" />
      <path d="M48 47H88V53H48Z" />
      <path d="M50 52H56V85H50Z" />
      <path d="M60 52H66V85H60Z" />
      <path d="M70 52H76V85H70Z" />
      <path d="M80 52H86V85H80Z" />
    </Glyph>
  );
}
