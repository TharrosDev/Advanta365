import styles from "./chain-lock.module.css";

/** The drawing's box: a square of 120 units, the well of a tile. */
const BOX = 120;
/** One link: its length, its width and the thickness of its wire. A fine chain, links of a hair. */
const LINK = { length: 9, width: 5.8, wire: 1.6 };
/**
 * The distance from the middle of one link to the middle of the next: a little under the hole of
 * a link (5.8), so that the chain lies taut and its links overlap.
 */
const PITCH = 5.4;
/** The two chains cross here, inside the bow of the padlock, each turned this far from level. */
const CROSSING = { x: 60, y: 49 };
const TURN = 33;
/** Links that lie flat, counted from the crossing to one end: just enough to run past the box. */
const REACH = 6;
/** The dark line around every piece of steel. */
const EDGE = 0.5;

/**
 * The padlock, measured from the crossing it hangs on. Its bow is the loop the chains run through:
 * `half` its width from the middle to the middle of its wire, `rise` the height of its top above the
 * crossing and `foot` the depth its legs end at, inside the body. Its body is a flat dark block
 * standing `top` under the crossing. Its keyhole is a round head of radius `head` whose middle is
 * `drop` under the top of the body, and a slot below it, `neck` wide at the top and `foot` wide at
 * the bottom, `length` long.
 */
const LOCK = {
  bow: { half: 7, stroke: 3, rise: 7.4, foot: 7.7 },
  body: { half: 12.25, top: 4.9, height: 19.5, radius: 3.2 },
  hole: { drop: 6.3, head: 1.5, neck: 0.75, foot: 1.2, length: 4.2 },
};

/** The names the drawing is kept under: its two parts, and the paints its steel is made of. */
const PARTS = { chains: "chain-lock-chains", padlock: "chain-lock-padlock" };
const PAINT = {
  ring: "chain-lock-ring",
  bar: "chain-lock-bar",
  bow: "chain-lock-bow",
};

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * One chain through the crossing, drawn level and then turned. Its links alternate: one lies flat
 * (a ring) and the next stands on edge (a bar through the two rings beside it). The bars are one
 * dashed line; each ring is its edge, its steel and the light along its upper side.
 */
function Chain({ turn }: { turn: number }) {
  const { length, width, wire } = LINK;
  const dash = length - wire;
  const gap = 2 * PITCH - dash;
  const start = -(2 * REACH + 1) * PITCH - dash / 2;
  const end = -start;
  const run = `M${round(start)} 0H${round(end)}`;
  const inner = { width: length - wire, height: width - wire };
  const light = -wire * 0.2;

  return (
    <g transform={`translate(${CROSSING.x} ${CROSSING.y}) rotate(${turn})`}>
      <path
        className={styles.edge}
        d={run}
        strokeWidth={wire + EDGE}
        strokeDasharray={`${round(dash)} ${round(gap)}`}
      />
      <path
        className={styles.steel}
        d={run}
        stroke={`url(#${PAINT.bar})`}
        strokeWidth={wire}
        strokeDasharray={`${round(dash)} ${round(gap)}`}
      />
      <path
        className={styles.glint}
        d={`M${round(start + wire / 2)} ${round(light)}H${round(end)}`}
        strokeWidth={0.4}
        strokeDasharray={`${round(dash - wire)} ${round(gap + wire)}`}
      />
      {Array.from({ length: 2 * REACH + 1 }, (_, index) => {
        const x = (index - REACH) * 2 * PITCH - inner.width / 2;
        const y = -inner.height / 2;
        const box = {
          x: round(x),
          y: round(y),
          width: round(inner.width),
          height: round(inner.height),
          rx: round(inner.height / 2),
        };
        return (
          <g key={index}>
            <rect className={styles.edge} {...box} strokeWidth={wire + EDGE} />
            <rect
              className={styles.steel}
              {...box}
              stroke={`url(#${PAINT.ring})`}
              strokeWidth={wire}
            />
            <path
              className={styles.glint}
              d={`M${round(x + inner.height * 0.3)} ${round(y + light)}H${round(x + inner.width - inner.height * 0.3)}`}
              strokeWidth={0.4}
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * The padlock: a bow of steel with a hairline edge, hung on the crossing, over a body that is
 * nearly flat, with the light along its top edge and a small keyhole.
 */
function Padlock() {
  const { bow, body, hole } = LOCK;
  const { x, y } = CROSSING;
  const arc = y - bow.rise + bow.half;
  const bowPath = `M${round(x - bow.half)} ${round(y + bow.foot)}V${round(arc)}a${bow.half} ${bow.half} 0 0 1 ${2 * bow.half} 0V${round(y + bow.foot)}`;
  const left = x - body.half;
  const top = y + body.top;
  const face = { x: round(left), y: round(top), width: 2 * body.half, height: body.height };
  // The keyhole is one outline, head and slot both run clockwise, so that it is filled once and
  // is of one tone where the two meet.
  const middle = top + hole.drop;
  const keyhole =
    `M${round(x - hole.head)} ${round(middle)}A${hole.head} ${hole.head} 0 0 1 ${round(x + hole.head)} ${round(middle)}` +
    `A${hole.head} ${hole.head} 0 0 1 ${round(x - hole.head)} ${round(middle)}Z` +
    `M${round(x - hole.neck)} ${round(middle)}H${round(x + hole.neck)}L${round(x + hole.foot)} ${round(middle + hole.length)}H${round(x - hole.foot)}Z`;
  // The light on the bow: a line along the outer side of its left leg and over the top of its arch.
  const lit = bow.half + bow.stroke * 0.2;
  const sweep = (60 * Math.PI) / 180;
  const glint = `M${round(x - lit)} ${round(arc + 2.4)}V${round(arc)}A${round(lit)} ${round(lit)} 0 0 1 ${round(x - lit * Math.cos(sweep))} ${round(arc - lit * Math.sin(sweep))}`;

  return (
    <>
      <path className={styles.edge} d={bowPath} strokeWidth={bow.stroke + EDGE} />
      <path
        className={styles.steel}
        d={bowPath}
        stroke={`url(#${PAINT.bow})`}
        strokeWidth={bow.stroke}
      />
      <path className={styles.glint} d={glint} strokeWidth={0.4} />
      <rect className={styles.body} {...face} rx={body.radius} />
      <path
        className={styles.topLight}
        d={`M${round(left + body.radius)} ${round(top + 0.6)}H${round(left + 2 * body.half - body.radius)}`}
      />
      <path className={styles.hole} d={keyhole} />
    </>
  );
}

const STEEL = (
  <>
    <stop offset="0" className={styles.stopLight} />
    <stop offset="1" className={styles.stopShade} />
  </>
);

/**
 * The drawing itself, once for a whole grid of tiles: the two chains and the padlock, with the
 * gradients that paint their steel. It takes up no room and shows nothing; every `ChainLock` on
 * the page draws from it, so a page of locked tiles carries the chain once and not once per tile.
 * `TileGrid` renders it; a page with several grids renders it once itself, since its gradients
 * are found by their ids and an id belongs to one element of a page.
 */
export function ChainLockParts() {
  const reach = LOCK.bow.half + LOCK.bow.stroke / 2 + EDGE;
  return (
    <svg className={styles.parts} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id={PAINT.ring}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={-LINK.width / 2}
          x2="0"
          y2={LINK.width / 2}
        >
          {STEEL}
        </linearGradient>
        <linearGradient
          id={PAINT.bar}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={-LINK.wire / 2}
          x2="0"
          y2={LINK.wire / 2}
        >
          {STEEL}
        </linearGradient>
        <linearGradient
          id={PAINT.bow}
          gradientUnits="userSpaceOnUse"
          x1={CROSSING.x - reach}
          y1="0"
          x2={CROSSING.x + reach}
          y2="0"
        >
          {STEEL}
        </linearGradient>
        <g id={PARTS.chains}>
          <Chain turn={TURN} />
          <Chain turn={-TURN} />
        </g>
        <g id={PARTS.padlock}>
          <Padlock />
        </g>
      </defs>
    </svg>
  );
}

/**
 * The lock on a template that is not a free sample: two fine steel chains crossed over the cover,
 * from beyond one edge of the well to beyond the other, and a small padlock hung where they cross,
 * at the centre. It fills its positioned parent, which cuts the chains off at its edges, and it
 * casts one soft shadow on what lies under it. It draws from `ChainLockParts`, which must be on
 * the page.
 *
 * A drawing only: hidden from assistive technology and deaf to the pointer. The tile's button says
 * "locked". Hooks: `data-chain-lock` on the drawing and `data-lock` on the padlock, which rattles
 * about the crossing it hangs on while the tile denies (app/motion.css).
 */
export function ChainLock() {
  return (
    <svg
      className={styles.root}
      viewBox={`0 0 ${BOX} ${BOX}`}
      aria-hidden="true"
      focusable="false"
      data-chain-lock=""
    >
      <use href={`#${PARTS.chains}`} />
      <use
        href={`#${PARTS.padlock}`}
        data-lock=""
        className={styles.lock}
        style={{ transformOrigin: `${CROSSING.x}px ${CROSSING.y}px` }}
      />
    </svg>
  );
}
