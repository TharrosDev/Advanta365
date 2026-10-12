import { TemplateCover } from "@/components/catalog/template-cover";
import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { DEFAULT_CRITERIA } from "@/lib/catalog/query";
import type { Format, Phase, Template } from "@/lib/catalog/schema";
import { catalogHref } from "@/lib/catalog/search-params";
import { cssVars } from "@/lib/cx";
import styles from "./hero-stage.module.css";

/** How wide the cover of each format stands in the hand, in hundredths of the stage's width. */
const WIDTHS: Record<Format, number> = { docx: 16.5, pdf: 16.5, xlsx: 21.5, pptx: 24.5 };

/**
 * The hand, left to right: how each document leans (in degrees), how far below the middle two it
 * hangs (in hundredths of the stage's width), which lies over which, and how deep its shadow is.
 * The middle two stand highest and cast the deepest shadow. Each lies over the one to its left,
 * as cards do in a hand, because a cover prints its title at its left edge.
 */
const TURNS = [-9, -5, -2, 2, 5, 9] as const;
const DROPS = [3.4, 1.5, 0, 0, 1.5, 3.4] as const;
const LAYERS = [1, 2, 3, 4, 5, 6] as const;
const DEPTHS = [1, 2, 3, 3, 2, 1] as const;

/** The upright pages are the tall ones; a workbook is lower, a slide lowest. */
const TALLNESS: Record<Format, number> = { docx: 2, pdf: 2, xlsx: 1, pptx: 0 };

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

/**
 * The stage of the home page's first screen, where the tagline is acted out: an empty prompt box
 * with a caret, and the six free samples as a hand of finished documents standing where the box
 * was. Both are in the page from the start, in the same place. Without movement (no script, or
 * reduced motion) the box is not displayed and the documents simply stand there. With it, the box
 * holds for a moment, dissolves as the ink opens over it, and the documents settle one after the
 * other as the ink clears: app/motion.css, on the hooks below, by the clock that starts when the
 * cover of a first visit has gone.
 *
 * The box is decoration, hidden from assistive technology: the outline of a field drawn on the
 * paper, with a caret, a key for adding something and a send key. It has no ground of its own, so
 * the drop that lands in it is seen in it. Each document is one link to the catalog with that
 * sample's pop-up open, named by the template's title: its real cover, printed with its title,
 * lit, in its format's proportions. They overlap and fan (`TURNS`), the tall pages in the middle
 * (`arrange`), and the order on the page is the tab order; the one under the pointer or the
 * keyboard straightens and comes to the front. Every measure of the hand is a share of the
 * stage's own width, and below 40em each document is drawn larger against it, so a phone gets a
 * short, closely overlapping row.
 *
 * For the ink the stage is the `open` anchor (the first drop lands in its middle) and, once the
 * scene has cleared its water, a calm rectangle of the `display` kind. Hooks: `data-hero-stage`,
 * `data-hero-prompt`, `data-hero-doc`.
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
  const first = WIDTHS[hand[0]?.format ?? "docx"];
  const last = WIDTHS[hand[hand.length - 1]?.format ?? "docx"];

  return (
    <div
      data-hero-stage=""
      data-ink-anchor="open"
      data-ink-calm="display"
      data-ink-calm-after="clear"
      className={styles.stage}
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
          const share = hand.length > 1 ? index / (hand.length - 1) : 0.5;
          const width = WIDTHS[template.format];
          // The centres are spread evenly from the first document's to the last one's. The left
          // edge is `--a` shares of the scale the documents are drawn at, plus `--t` of the stage.
          const offset = first / 2 - (first / 2 + last / 2) * share - width / 2;
          const at = index % TURNS.length;
          return (
            <li
              key={template.slug}
              data-lit-scope=""
              data-depth={DEPTHS[at]}
              className={styles.doc}
              style={cssVars({
                "--w": width,
                "--a": offset.toFixed(3),
                "--t": share.toFixed(3),
                "--turn": `${TURNS[at]}deg`,
                "--drop": DROPS[at],
                "--z": LAYERS[at],
                "--i": index,
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
                  summary={template.summary}
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
