import { TemplateCover } from "@/components/catalog/template-cover";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Folder } from "@/components/ui/folder";
import { Tag } from "@/components/ui/tag";
import { Tally } from "@/components/ui/tally";
import type { PhaseCoverage } from "@/lib/catalog/coverage";
import type { Format, Template } from "@/lib/catalog/schema";
import { cssVars, cx } from "@/lib/cx";
import { OFFER } from "@/lib/site";
import styles from "./portfolio.module.css";
import { PriceTag } from "./price-tag";

/** How wide the cover of each format stands in the folder, in hundredths of the folder's width. */
const WIDTHS: Record<Format, number> = { docx: 26, pdf: 26, pptx: 32, xlsx: 29 };

/** The upright pages go to the back, where there is the height for them. */
const TALLNESS: Record<Format, number> = { docx: 2, pdf: 2, xlsx: 1, pptx: 0 };

/**
 * The two ranks of the pocket. A rank spreads its covers from one side to the other, `inset` from
 * the folder's edges; `top` is how far under the back panel's edge its covers begin, `drops` what
 * each one adds to that and `turns` how each one leans, in degrees. All lengths are hundredths of
 * the folder's width.
 */
const BACK = { inset: 7, top: 3, drops: [0.6, 0, 1.3], turns: [-2, 1.2, 2.4] } as const;
const FRONT = { inset: 3.5, top: 14.5, drops: [0.5, 1.5, 0], turns: [-1.2, 0.8, -1.8] } as const;

type Placed = { template: Template; x: number; y: number; w: number; turn: number };

/**
 * Where each cover stands. Half of them (the upright ones first) make the back rank and stand
 * high; the others make the front rank, lower, so a strip of every cover in the back shows above
 * them. The list comes back in painting order: the back rank, then the front.
 */
function arrange(covers: readonly Template[]): Placed[] {
  const byHeight = covers
    .map((template, index) => ({ template, index }))
    .sort((a, b) => TALLNESS[b.template.format] - TALLNESS[a.template.format] || a.index - b.index);
  const behind = new Set(
    byHeight.slice(0, Math.ceil(covers.length / 2)).map((entry) => entry.index),
  );

  const place = (rank: typeof BACK | typeof FRONT, members: readonly Template[]) =>
    members.map((template, position): Placed => {
      const w = WIDTHS[template.format];
      const share = members.length > 1 ? position / (members.length - 1) : 0.5;
      return {
        template,
        w,
        x: rank.inset + (100 - 2 * rank.inset - w) * share,
        y: rank.top + rank.drops[position % rank.drops.length]!,
        turn: rank.turns[position % rank.turns.length]!,
      };
    });

  return [
    ...place(
      BACK,
      covers.filter((_, index) => behind.has(index)),
    ),
    ...place(
      FRONT,
      covers.filter((_, index) => !behind.has(index)),
    ),
  ];
}

const FORMATS = ["DOCX", "PPTX", "XLSX", "PDF"] as const;

/**
 * The toolkit as the one object it is sold as: a folder at the scale of a page, its tab naming the
 * offer, the covers of real templates (`covers`, the free samples) standing in its pocket in two
 * ranks, and the price on a paper tag tied to its top right corner. Under it, as wide as the
 * folder, a tally of the numbered phases the toolkit reaches (`phases`, from `phaseCoverage`),
 * which is an image named by those steps, and a line that says the same in words.
 *
 * `size="page"` is the folder of the purchase page: 34rem wide at most, centred in what holds it
 * (the page stands it at the start of its columns from 68em, beside the contents leaf, through
 * `className`), its front headed by the page's one `h1` (that page has no title block); from 68em
 * the tag hangs outwards, off the folder's edge. `size="section"` is the same object as part of a section that has a heading of its own
 * (so the front is headed by an `h3`), 30rem at most, the tag always lying on the front.
 * Everything in and on the folder is measured from the folder's own width, so it is one object at
 * every size.
 *
 * Under the pointer the covers rise and fan a little, and the tag swings; the covers do the same
 * under keyboard focus where an element around the portfolio carries `data-folder-scope`. Hook:
 * `data-portfolio` on the folder and its tag.
 */
export function Portfolio({
  size,
  covers,
  phases,
  className,
}: {
  size: "page" | "section";
  covers: readonly Template[];
  phases: readonly PhaseCoverage[];
  className?: string;
}) {
  const Title = size === "page" ? "h1" : "h3";
  const numberOf = new Map(phases.map((phase) => [phase.slug, phase.number]));
  const reached = phases.filter((phase) => phase.covered);
  const first = phases[0];
  const last = phases[phases.length - 1];

  const sheets = arrange(covers).map(({ template, x, y, w, turn }) => (
    <span
      key={template.slug}
      className={styles.cover}
      style={cssVars({ "--x": x.toFixed(2), "--y": y, "--w": w, "--turn": `${turn}deg` })}
    >
      <TemplateCover
        type={template.deliverableType}
        format={template.format}
        title={template.title}
        summary={template.summary}
        phaseNumber={numberOf.get(template.phase)}
        tagClassName={styles.coverTag}
      />
    </span>
  ));

  return (
    <div className={cx(styles.root, styles[size], className)}>
      <div data-portfolio="" className={styles.object}>
        <Folder
          size="page"
          tab={OFFER.name}
          sheets={sheets}
          className={styles.folder}
          frontClassName={styles.front}
        >
          <BrandLockup variant="tile" size="sm" className={styles.maker} />
          <Title className={cx("type-page", styles.title)}>Eleven phases in one folder.</Title>
          <p className={cx("type-copy", styles.summary)}>
            The change management and user adoption toolkit behind real SharePoint Online rollouts,
            ready to adapt by hand or with AI.
          </p>
          <ul className={styles.formats} aria-label="File formats">
            {FORMATS.map((format) => (
              <li key={format}>
                <Tag>{format}</Tag>
              </li>
            ))}
          </ul>
        </Folder>
        <PriceTag className={styles.tag} />
      </div>

      <div className={styles.reach}>
        <Tally
          total={phases.length}
          filled={reached.map((phase) => phase.number)}
          size="md"
          numerals
          animate
          label={`Phases: ${reached.map((phase) => phase.name).join(", ")}`}
        />
        <p className={cx("type-note", styles.reachLine)}>
          {first && last && reached.length === phases.length
            ? `Every phase of a rollout, from ${first.name} to ${last.name}.`
            : `${reached.length} of the ${phases.length} phases of a rollout.`}
        </p>
      </div>
    </div>
  );
}
