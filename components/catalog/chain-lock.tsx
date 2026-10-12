import styles from "./chain-lock.module.css";

/** The drawing's box: a square of 120 units, the well of a tile. */
const BOX = 120;
/** One link: its length, its width and the thickness of its wire. */
const LINK = { length: 15, width: 9.6, wire: 3 };
/** The distance from the middle of one link to the middle of the next. */
const PITCH = 9.4;
/** The two chains cross here, inside the bow of the padlock, each turned this far from level. */
const CROSSING = { x: 60, y: 49 };
const TURN = 33;
/** Links that lie flat, counted from the crossing to one end: just enough to run past the box. */
const REACH = 3;
/** The dark line around every piece of steel. */
const EDGE = 1;

/** The names the drawing is kept under: its two parts, and the paints its steel is made of. */
const PARTS = { chains: "chain-lock-chains", padlock: "chain-lock-padlock" };
const PAINT = {
  ring: "chain-lock-ring",
  bar: "chain-lock-bar",
  body: "chain-lock-body",
  bow: "chain-lock-bow",
  plate: "chain-lock-plate",
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
        d={`M${round(start + 2)} -0.7H${round(end)}`}
        strokeWidth={0.8}
        strokeDasharray={`${round(dash - 4)} ${round(gap + 4)}`}
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
              d={`M${round(x + inner.height * 0.22)} ${round(y - 0.55)}H${round(x + inner.width - inner.height / 2)}`}
              strokeWidth={0.8}
            />
          </g>
        );
      })}
    </g>
  );
}

const STEEL = (
  <>
    <stop offset="0" className={styles.stopLight} />
    <stop offset="0.4" className={styles.stopSteel} />
    <stop offset="1" className={styles.stopShade} />
  </>
);

/**
 * The drawing itself, once for a whole grid of tiles: the two chains and the padlock, with the
 * gradients that paint their steel. It takes up no room and shows nothing; every `ChainLock` on
 * the page draws from it, so a page of locked tiles carries the chain once and not once per tile.
 * `TileGrid` renders it. Two of them on one page are the same drawing twice, which does no harm.
 */
export function ChainLockParts() {
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
        <linearGradient id={PAINT.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={styles.stopLockLight} />
          <stop offset="0.3" className={styles.stopLock} />
          <stop offset="1" className={styles.stopLockShade} />
        </linearGradient>
        <linearGradient id={PAINT.bow} gradientUnits="userSpaceOnUse" x1="47" y1="0" x2="73" y2="0">
          <stop offset="0" className={styles.stopSteel} />
          <stop offset="0.3" className={styles.stopLight} />
          <stop offset="0.62" className={styles.stopSteel} />
          <stop offset="1" className={styles.stopShade} />
        </linearGradient>
        <linearGradient id={PAINT.plate} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={styles.stopLight} />
          <stop offset="1" className={styles.stopShade} />
        </linearGradient>
        <g id={PARTS.chains}>
          <Chain turn={TURN} />
          <Chain turn={-TURN} />
        </g>
        <g id={PARTS.padlock} className={styles.padlock}>
          <path className={styles.edge} d="M50.5 60V47.5a9.5 9.5 0 0 1 19 0V60" strokeWidth={6.4} />
          <path
            className={styles.steel}
            d="M50.5 60V47.5a9.5 9.5 0 0 1 19 0V60"
            stroke={`url(#${PAINT.bow})`}
            strokeWidth={5.2}
          />
          <path
            className={styles.glint}
            d="M49.4 58V47.5a10.6 10.6 0 0 1 9 -10.4"
            strokeWidth={0.9}
          />
          <rect className={styles.bodyEdge} x="42.5" y="56" width="35" height="28" rx="4.6" />
          <rect x="43.2" y="56.7" width="33.6" height="26.6" rx="4" fill={`url(#${PAINT.body})`} />
          <path className={styles.bevel} d="M46.6 58.4H73.4" />
          <circle className={styles.plateEdge} cx="60" cy="68.6" r="5.5" />
          <circle
            className={styles.plate}
            cx="60"
            cy="68.6"
            r="4.9"
            fill={`url(#${PAINT.plate})`}
          />
          <path
            className={styles.hole}
            d="M60 65.9a1.9 1.9 0 0 1 1.05 3.48L61.6 72.3H58.4L58.95 69.38A1.9 1.9 0 0 1 60 65.9Z"
          />
        </g>
      </defs>
    </svg>
  );
}

/**
 * The lock on a template that is not a free sample: two steel chains crossed over the cover, from
 * beyond one edge of the well to beyond the other, and a padlock hung where they cross, at the
 * centre. It fills its positioned parent, which cuts the chains off at its edges, and it casts a
 * shadow on what lies under it. It draws from `ChainLockParts`, which must be on the page.
 *
 * A drawing only: hidden from assistive technology and deaf to the pointer. The tile's button says
 * "locked". Hooks: `data-chain-lock` on the drawing and `data-lock` on the padlock, which rattles
 * about the top of its bow while the tile denies (app/motion.css).
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
      <use href={`#${PARTS.padlock}`} data-lock="" className={styles.lock} />
    </svg>
  );
}
