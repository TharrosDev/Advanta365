import type { ReactNode } from "react";
import { Tag } from "@/components/ui/tag";
import type { DeliverableType, Format } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import styles from "./template-cover.module.css";

/** The file-format tag printed on the cover. */
const FORMAT_TAGS: Record<Format, string> = {
  docx: "DOCX",
  pptx: "PPTX",
  xlsx: "XLSX",
  pdf: "PDF",
};

/** The board behind the file: a line every 25 units, none on the outer edge. */
const BOARD_PATH = [
  ...Array.from({ length: 11 }, (_, i) => `M${(i + 1) * 25} 0V200`),
  ...Array.from({ length: 7 }, (_, i) => `M0 ${(i + 1) * 25}H300`),
].join("");

/** Seven spokes of the resistance fan: from the bottom-left corner to points along the top and right edges. */
const FAN_TARGETS: ReadonlyArray<readonly [number, number]> = [
  [60, 60],
  [100, 60],
  [140, 60],
  [180, 60],
  [180, 100],
  [180, 140],
  [180, 180],
];

/** Training: a 3 x 3 grid of 28-unit squares, 12-unit gaps, centre filled. */
const TRAINING_CELLS = [0, 1, 2].flatMap((row) =>
  [0, 1, 2].map((column) => ({
    x: 66 + column * 40,
    y: 66 + row * 40,
    filled: row === 1 && column === 1,
  })),
);

/** Assessment: five bars, 14 wide with 10-unit gaps, standing on a baseline at y = 180. */
const BAR_HEIGHTS = [40, 72, 56, 104, 84];

/**
 * One line drawing per deliverable type, drawn in a box from 60 to 180 on both axes; each format
 * places and scales that box inside its own page. Elements are outlines unless they carry the
 * `solid` class.
 */
function glyphFor(type: DeliverableType): ReactNode {
  switch (type) {
    case "communication":
      return (
        <>
          <path d="M70 76H170V148H100L82 166V148H70Z" />
          <path d="M84 96H156M84 112H156M84 128H127" />
        </>
      );
    case "training":
      return TRAINING_CELLS.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width={28}
          height={28}
          className={cell.filled ? styles.solid : undefined}
        />
      ));
    case "assessment":
      return (
        <>
          <path d="M60 180H180" />
          {BAR_HEIGHTS.map((height, index) => (
            <rect key={index} x={65 + index * 24} y={180 - height} width={14} height={height} />
          ))}
        </>
      );
    case "plan":
      return (
        <>
          <path d="M70 160H170" />
          <path d="M70 160A100 90 0 0 1 170 70" />
          <rect x={65} y={155} width={10} height={10} className={styles.solid} />
          <rect x={115} y={155} width={10} height={10} className={styles.solid} />
          <rect x={165} y={155} width={10} height={10} className={styles.solid} />
          <rect x={165} y={65} width={10} height={10} className={styles.solid} />
        </>
      );
    case "stakeholder":
      return (
        <>
          <circle cx={120} cy={120} r={60} />
          <circle cx={120} cy={120} r={40} />
          <circle cx={120} cy={120} r={20} className={styles.solid} />
        </>
      );
    case "sponsor":
      return (
        <>
          <rect x={72} y={72} width={96} height={96} />
          <rect x={152} y={60} width={28} height={28} className={styles.solid} />
        </>
      );
    case "resistance":
      return <path d={FAN_TARGETS.map(([x, y]) => `M60 180L${x} ${y}`).join("")} />;
    case "measurement":
      return (
        <>
          <path d="M60 180V156H90V132H120V108H150V84H180V180Z" />
          <path d="M60 150L180 60" />
          <rect x={172} y={59} width={8} height={8} className={styles.solid} />
        </>
      );
    case "governance":
      return (
        <>
          <rect x={60} y={60} width={120} height={120} />
          <rect x={80} y={80} width={80} height={80} />
          <rect x={100} y={100} width={40} height={40} />
        </>
      );
  }
}

type Box = readonly [x: number, y: number, width: number, height: number];

/** A written page: title bar at the top, the glyph, four lines of text, the blank at the foot. */
const PAGE = {
  glyph: "translate(90 10) scale(0.5)",
  lines: [
    [108, 112, 84, 4],
    [108, 122, 76, 4],
    [108, 132, 84, 4],
    [108, 142, 52, 4],
  ],
  blank: [108, 156, 84, 18],
} as const satisfies { glyph: string; lines: readonly Box[]; blank: Box };

/** A slide: title and three lines at the left, the glyph at the right, the blank under the lines. */
const SLIDE = {
  title: [52, 51, 78, 8],
  glyph: "translate(140 15) scale(0.6)",
  lines: [
    [52, 71, 92, 4],
    [52, 83, 80, 4],
    [52, 95, 88, 4],
  ],
  blank: [52, 127, 104, 22],
} as const satisfies { title: Box; glyph: string; lines: readonly Box[]; blank: Box };

/** A workbook: a header row, a first column of labels, the glyph as a chart, the last row blank. */
const GRID = {
  columns: [102, 150, 198],
  rows: [72, 98, 124, 150],
  heads: [64, 112, 160, 208],
  cells: [57, 83, 109, 135],
  glyph: "translate(96 20) scale(0.65)",
  blank: [58, 154, 184, 20],
} as const;

function bar([x, y, width, height]: Box, className: string | undefined, key?: number) {
  return <rect key={key} x={x} y={y} width={width} height={height} className={className} />;
}

/** The page of a Word file, or of a PDF with its corner folded. */
function page(type: DeliverableType, folded: boolean) {
  return (
    <>
      {folded ? (
        <>
          <path className={styles.sheet} d="M96 14H180L204 38V186H96Z" />
          <path className={styles.fold} d="M180 14V38H204" />
        </>
      ) : (
        <rect className={styles.sheet} x={96} y={14} width={108} height={172} />
      )}
      {bar([108, 26, folded ? 48 : 54, 6], styles.title)}
      <g className={styles.glyph} transform={PAGE.glyph}>
        {glyphFor(type)}
      </g>
      {PAGE.lines.map((line, index) => bar(line, styles.line, index))}
      {bar(PAGE.blank, styles.blank)}
    </>
  );
}

function slide(type: DeliverableType) {
  return (
    <>
      <rect className={styles.sheet} x={38} y={37} width={224} height={126} />
      {bar(SLIDE.title, styles.title)}
      {SLIDE.lines.map((line, index) => bar(line, styles.line, index))}
      <g className={styles.glyph} transform={SLIDE.glyph}>
        {glyphFor(type)}
      </g>
      {bar(SLIDE.blank, styles.blank)}
    </>
  );
}

function workbook(type: DeliverableType) {
  const ruling =
    GRID.columns.map((x) => `M${x} 22V178`).join("") +
    GRID.rows.map((y) => `M54 ${y}H246`).join("");

  return (
    <>
      <rect className={styles.ground} x={54} y={22} width={192} height={156} />
      <rect className={styles.head} x={54} y={22} width={192} height={24} />
      <path className={styles.ruling} d={ruling} />
      {GRID.heads.map((x) => bar([x, 32, 28, 5], styles.title, x))}
      {GRID.cells.map((y) => bar([64, y, 26, 5], styles.line, y))}
      {/* The outline goes over the header fill and the ruling, so its ink edge stays whole. */}
      <rect className={styles.outline} x={54} y={22} width={192} height={156} />
      <rect className={styles.backing} x={106} y={50} width={136} height={96} />
      <g className={styles.glyph} transform={GRID.glyph}>
        {glyphFor(type)}
      </g>
      {bar(GRID.blank, styles.blank)}
    </>
  );
}

function fileFor(type: DeliverableType, format: Format) {
  switch (format) {
    case "docx":
      return page(type, false);
    case "pdf":
      return page(type, true);
    case "pptx":
      return slide(type);
    case "xlsx":
      return workbook(type);
  }
}

/**
 * The cover of a template, drawn as the file itself: a 3:2 tile with a fine board, and on it the
 * outline of a page, a folded page, a slide or a workbook, depending on the format. Inside the
 * outline sit a title bar, a few lines of text, one line drawing for the deliverable type and, at the
 * foot, the blank: the one highlighted part, which is the buyer's to fill in. The format is printed
 * as a tag in the top-right corner (`tagClassName` lets a small cover put the tag elsewhere).
 * Decoration only, so the whole tile is hidden from assistive technology.
 */
export function TemplateCover({
  type,
  format,
  className,
  tagClassName,
}: {
  type: DeliverableType;
  format: Format;
  className?: string;
  tagClassName?: string;
}) {
  return (
    <div className={cx(styles.tile, className)} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox="0 0 300 200"
        width="100%"
        height="100%"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className={styles.board} d={BOARD_PATH} />
        {fileFor(type, format)}
      </svg>
      <Tag className={cx(styles.format, tagClassName)}>{FORMAT_TAGS[format]}</Tag>
    </div>
  );
}
