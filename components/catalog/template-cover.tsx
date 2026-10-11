import type { ReactNode } from "react";
import { Chip } from "@/components/ui/chip";
import type { DeliverableType, Format } from "@/lib/catalog/schema";
import styles from "./template-cover.module.css";

/** The file-format tag printed on the cover. */
const FORMAT_TAGS: Record<Format, string> = {
  docx: "DOCX",
  pptx: "PPTX",
  xlsx: "XLSX",
  pdf: "PDF",
};

/** An 8 x 8 board: a hairline every 30 units, none on the outer edge. */
const BOARD_PATH = Array.from({ length: 7 }, (_, i) => {
  const at = (i + 1) * 30;
  return `M${at} 0V240M0 ${at}H240`;
}).join("");

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
 * One line drawing per deliverable type inside the 60..180 box of a 240 unit board. Elements are
 * outlines unless they carry the `solid` class (see template-cover.module.css).
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

/**
 * The generated cover of a template: a fine board, one glyph for the deliverable type and the file
 * format as a solid tag at the bottom-left. Decorative: render it inside an `aria-hidden` box that is
 * `position: relative` (the format tag is positioned against it).
 */
export function TemplateCover({ type, format }: { type: DeliverableType; format: Format }) {
  return (
    <>
      <svg
        className={styles.art}
        viewBox="0 0 240 240"
        width="100%"
        height="100%"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className={styles.board} d={BOARD_PATH} />
        <g className={styles.glyph}>{glyphFor(type)}</g>
      </svg>
      <Chip className={styles.format}>{FORMAT_TAGS[format]}</Chip>
    </>
  );
}
