import { ViewTransition, type ReactNode } from "react";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { PaperStack } from "@/components/ui/paper-stack";
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

/** The proportions of the sheet a format is printed on. */
const RATIOS = {
  docx: "portrait",
  pdf: "portrait",
  pptx: "slide",
  xlsx: "landscape",
} as const satisfies Record<Format, "portrait" | "slide" | "landscape">;

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
 * One line drawing per deliverable type, drawn in a box from 60 to 180 on both axes. Elements are
 * outlines unless they carry the `solid` class.
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
 * The cover of a template: a sheet of paper in the proportions of its format (a Word or PDF page
 * 5 by 7, the PDF with a folded corner; a slide 16 by 9; a workbook 4 by 3), printed as the
 * template's own first page. At `md` and `lg`, with a `title`: the title, the first line of the
 * `summary` (ending on a whole word), ghost lines for the rest, the phase numeral on an index tab at the right edge, the
 * line drawing of the deliverable type, the blank (the one highlighted part, which is the
 * buyer's) and the format tag at the top right, on two sheets beneath. At `sm`, and whenever
 * there is no `title`: the tag, the numeral, three ghost lines and the blank. Everything printed
 * is sized from the sheet's own width, so a cover reads the same at any size.
 *
 * The cover is as wide as its container at `md` and `lg` and has a fixed width at `sm` (60, 84 or
 * 96px by format, never wider than its container). `lit` makes the sheet rise and take the light
 * under the pointer. `slug` makes it a shared object: on a page change it travels to the cover of
 * the same slug on the next page, so pass it at most once per page. Decoration only, hidden from
 * assistive technology. Hooks: `data-cover` and `data-format` on the sheet itself.
 */
export function TemplateCover({
  type,
  format,
  size = "md",
  lit = false,
  slug,
  title,
  summary,
  phaseNumber,
  className,
  tagClassName,
}: {
  type: DeliverableType;
  format: Format;
  size?: "sm" | "md" | "lg";
  lit?: boolean;
  slug?: string;
  title?: string;
  summary?: string;
  phaseNumber?: number;
  className?: string;
  tagClassName?: string;
}) {
  const printed = size !== "sm" && Boolean(title);
  const ratio = RATIOS[format];

  const sheet = (
    <PaperSheet
      ratio={ratio}
      size={size}
      depth={size === "sm" ? 1 : 2}
      lit={lit}
      data-cover=""
      data-format={format}
      aria-hidden={size === "sm" ? "true" : undefined}
      className={cx(
        styles.sheet,
        styles[ratio],
        styles[size],
        format === "pdf" && styles.folded,
        format === "xlsx" && styles.ruled,
        printed ? styles.printed : styles.plain,
        size === "sm" && className,
      )}
    >
      <span className={styles.face}>
        <span className={styles.page}>
          {printed ? (
            <>
              <span className={styles.title}>{title}</span>
              {summary ? <span className={styles.summary}>{summary}</span> : null}
            </>
          ) : null}
          <span className={styles.lines}>
            <i />
            <i />
            <i />
            {printed ? <i /> : null}
          </span>
          <span className={styles.foot}>
            <span className={styles.blank} />
            {printed ? (
              <svg
                className={styles.glyph}
                viewBox="54 54 132 132"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                {glyphFor(type)}
              </svg>
            ) : null}
          </span>
        </span>
        {format === "pdf" ? <span className={styles.flap} /> : null}
        {phaseNumber === undefined ? null : <span className={styles.numeral}>{phaseNumber}</span>}
        <Tag className={cx(styles.format, tagClassName)}>{FORMAT_TAGS[format]}</Tag>
      </span>
    </PaperSheet>
  );

  const cover =
    size === "sm" ? (
      sheet
    ) : (
      <PaperStack under={2} aria-hidden="true" className={cx(styles.stack, className)}>
        {sheet}
      </PaperStack>
    );

  if (!slug) return cover;

  return (
    <ViewTransition name={`cover-${slug}`} share="sheet-morph" default="none">
      {cover}
    </ViewTransition>
  );
}
