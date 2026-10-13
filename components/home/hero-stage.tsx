import { TemplateCover } from "@/components/catalog/template-cover";
import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { DEFAULT_CRITERIA } from "@/lib/catalog/query";
import type { Format, Phase, Template } from "@/lib/catalog/schema";
import { catalogHref } from "@/lib/catalog/search-params";
import { cssVars } from "@/lib/cx";
import styles from "./hero-stage.module.css";

/** How wide the cover of each format is drawn, against the others. */
const WIDTHS: Record<Format, number> = { docx: 17, pdf: 17, xlsx: 22, pptx: 25 };

/** The height of a cover over its width: a page is 5 by 7, a workbook 4 by 3, a slide 16 by 9. */
const RISE: Record<Format, number> = { docx: 7 / 5, pdf: 7 / 5, xlsx: 3 / 4, pptx: 9 / 16 };

/**
 * How much of a cover's width must show when the next one lies over its right-hand side: the
 * part that carries its format tag and its whole title, and a little more for the lean.
 */
const SHOWN: Record<Format, number> = { docx: 0.88, pdf: 0.88, xlsx: 0.74, pptx: 0.72 };

/** The upright pages are the tall ones; a workbook is lower, a slide lowest. */
const TALLNESS: Record<Format, number> = { docx: 2, pdf: 2, xlsx: 1, pptx: 0 };

/**
 * One row of the hand, left to right: how each document leans, in degrees, and how far below the
 * row's middle line it hangs, in hundredths of the stage's width before the row is scaled.
 */
type Row = { turns: readonly number[]; drops: readonly number[] };

/** From 40em the six are one hand; narrower, two hands of three, one under the other. */
const WIDE: readonly Row[] = [{ turns: [-9, -5, -2, 2, 5, 9], drops: [2.6, 1.1, 0, 0, 1.1, 2.6] }];
const NARROW: readonly Row[] = [
  { turns: [-6, -2, 4], drops: [1.4, 0, 0.6] },
  { turns: [-4, 2, 6], drops: [0.6, 0, 1.4] },
];

/** The air between two rows, in hundredths of the stage's width. */
const ROW_GAP = 5;

/** The shadow deepens toward the middle of the six. */
const DEPTHS = [1, 2, 3, 3, 2, 1] as const;

/** The turn in which each of the six arrives: the middle two first, the ends last. */
const TURN_IN = [4, 2, 0, 1, 3, 5] as const;

/**
 * The order of the hand. The tallest documents stand in the middle and the lowest at the ends, so
 * the hand rises to its centre like one held in a fist; documents of one height keep the order
 * they came in (the phases'), the earlier one to the left.
 */
function arrange(samples: readonly Template[]): Template[] {
  const byHeight = samples
    .map((template, index) => ({ template, index }))
    .sort((a, b) => TALLNESS[b.template.format] - TALLNESS[a.template.format] || a.index - b.index);
  const left: Template[] = [];
  const right: Template[] = [];
  // Dealt from the middle outwards, in pairs: the first of a pair to the left, the second right.
  byHeight.forEach(({ template }, position) => {
    if (position % 2 === 0) left.unshift(template);
    else right.push(template);
  });
  return [...left, ...right];
}

type Place = { x: number; y: number; w: number; turn: number };

/**
 * Where each document stands when the hand is laid out in `rows`, and how tall the whole is; all
 * of it in hundredths of the stage's width. In a row each document lies over the right-hand side
 * of the one before it and leaves `SHOWN` of that one in sight, so no title and no tag is ever
 * under a neighbour; the last one shows whole. Every row is drawn at one scale, the largest at
 * which the longest row fills the stage, and a shorter row is centred.
 */
function layOut(
  hand: readonly Template[],
  rows: readonly Row[],
): { places: Place[]; height: number } {
  let start = 0;
  const drafts = rows.map((row) => {
    const members = hand.slice(start, start + row.turns.length);
    start += members.length;
    let x = 0;
    const docs = members.map((template, index) => {
      const w = WIDTHS[template.format];
      const doc = { x, w, h: w * RISE[template.format], turn: row.turns[index] ?? 0 };
      x += w * SHOWN[template.format];
      return { ...doc, drop: row.drops[index] ?? 0 };
    });
    const last = docs[docs.length - 1];
    return { docs, length: last ? last.x + last.w : 0 };
  });
  const scale = 100 / Math.max(1, ...drafts.map((draft) => draft.length));

  const places: Place[] = [];
  let top = 0;
  for (const draft of drafts) {
    // A leaning document reaches above and below its own box by the rise of its half-width.
    const reach = (doc: (typeof draft.docs)[number]) =>
      (doc.w / 2) * Math.sin((Math.abs(doc.turn) * Math.PI) / 180);
    const above = Math.max(...draft.docs.map((doc) => doc.h / 2 - doc.drop + reach(doc)));
    const below = Math.max(...draft.docs.map((doc) => doc.h / 2 + doc.drop + reach(doc)));
    const inset = (100 - draft.length * scale) / 2;
    for (const doc of draft.docs) {
      places.push({
        x: inset + doc.x * scale,
        y: top + (above - doc.h / 2 + doc.drop) * scale,
        w: doc.w * scale,
        turn: doc.turn,
      });
    }
    top += (above + below) * scale + ROW_GAP;
  }
  return { places, height: top - ROW_GAP };
}

const fixed = (value: number) => value.toFixed(2);

/**
 * The stage of the home page's first screen, where the tagline is acted out: an empty prompt box
 * with a caret, and the six free samples as a hand of finished documents standing where the box
 * was. Both are in the page from the start, in the same place. Where movement is wanted the box
 * stands empty for a moment with its caret blinking, dissolves, and the documents land one after
 * the other, the middle ones first: app/motion.css, on the hooks below, by the clock that starts
 * when the cover of a first visit has gone. Without it (no script, reduced motion) the box is not
 * displayed and the documents simply stand there.
 *
 * The box is decoration, hidden from assistive technology: the outline of a field drawn on the
 * paper, with a caret, a key for adding something and a send key. Each document is one link to the
 * catalog with that sample's pop-up open, named by the template's title: its real cover, printed
 * with its title, lit, in its format's proportions, its format tag at the top left, where it always
 * shows. They overlap and fan, the tall pages in the middle (`arrange`), each lying over the one to
 * its left as cards do in a hand and leaving that one's title in sight (`layOut`). The order on the
 * page is the tab order; the one under the pointer or the keyboard straightens and comes to the
 * front. From 40em the six are one hand; narrower they are two hands of three, so every document
 * keeps its words and a strip of its own wide enough for a finger.
 *
 * Every measure is a share of the stage's own width. The stage publishes the height of the hand as
 * `--hand` (hundredths of its width) and takes `--hero-room` from the band it stands in: the height
 * there is for it, which narrows the stage, and the hand with it, on a low window. Hooks:
 * `data-hero-stage`, `data-hero-prompt`, `data-hero-doc`.
 */
export function HeroStage({
  samples,
  phases,
}: {
  samples: readonly Template[];
  phases: readonly Phase[];
}) {
  const orderOf = new Map(phases.map((phase) => [phase.slug, phase.order]));
  const hand = arrange(samples);
  const wide = layOut(hand, WIDE);
  const narrow = layOut(hand, NARROW);

  return (
    <div
      data-hero-stage=""
      className={styles.stage}
      style={cssVars({ "--hand": fixed(wide.height), "--hand-narrow": fixed(narrow.height) })}
    >
      <div data-hero-prompt="" aria-hidden="true" className={styles.prompt}>
        <span data-caret="" className={styles.caret} />
        <span className={styles.keys}>
          <span className={styles.chip}>
            <Icon name="plus" size={16} />
          </span>
          <span className={styles.send}>
            <Icon name="arrow" size={18} className={styles.sendArrow} />
          </span>
        </span>
      </div>

      <ul className={styles.hand}>
        {hand.map((template, index) => {
          const at = wide.places[index];
          const small = narrow.places[index];
          if (!at || !small) return null;
          return (
            <li
              key={template.slug}
              data-lit-scope=""
              data-depth={DEPTHS[index % DEPTHS.length]}
              className={styles.doc}
              style={cssVars({
                "--x": fixed(at.x),
                "--y": fixed(at.y),
                "--w": fixed(at.w),
                "--turn": `${at.turn}deg`,
                "--x-narrow": fixed(small.x),
                "--y-narrow": fixed(small.y),
                "--w-narrow": fixed(small.w),
                "--turn-narrow": `${small.turn}deg`,
                "--z": index + 1,
                "--i": TURN_IN[index % TURN_IN.length],
              })}
            >
              <TransitionLink
                data-hero-doc=""
                className={styles.link}
                href={catalogHref(DEFAULT_CRITERIA, template.slug)}
                aria-label={template.title}
                prefetch={false}
              >
                <TemplateCover
                  type={template.deliverableType}
                  format={template.format}
                  lit
                  title={template.title}
                  phaseOrder={orderOf.get(template.phase)}
                  tagClassName={styles.coverTag}
                />
              </TransitionLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
