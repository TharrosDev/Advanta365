/**
 * The hero's argument, drawn: a field of nodes that opens scattered on the
 * left and resolves into a governed lattice on the right, wired by connector
 * lines — sprawl coming under an operating model. A pure server-rendered SVG
 * (no canvas, no rAF): entrance is CSS-only (`.js`-gated stagger), so no-JS
 * and reduced-motion visitors see the finished drawing and there is nothing
 * to leave stuck. Positions are computed once at module load with a fixed
 * seed, so server and client markup always match.
 */

const COLS = 8;
const ROWS = 6;
const CELL = 52;
const PAD = 26;
const W = COLS * CELL + PAD * 2;
const H = ROWS * CELL + PAD * 2;

// Deterministic PRNG (LCG) — fixed seed keeps SSR and client identical.
let seed = 20260722;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

type Node = { x: number; y: number; order: number; c: number; r: number };

const nodes: Node[] = [];
const grid: Node[][] = [];
for (let c = 0; c <= COLS; c++) {
  grid[c] = [];
  for (let r = 0; r <= ROWS; r++) {
    // Settle gradient: left third scattered, right half locked to the lattice.
    const order = Math.min(1, Math.max(0, (c - 1) / (COLS - 3)));
    const jitter = (1 - order) * CELL * 0.58;
    const node: Node = {
      x: PAD + c * CELL + (rnd() - 0.5) * jitter * 2,
      y: PAD + r * CELL + (rnd() - 0.5) * jitter * 2,
      order,
      c,
      r,
    };
    grid[c][r] = node;
    nodes.push(node);
  }
}

// Connector lines on the governed (settled) side, horizontal + vertical.
type Line = { x1: number; y1: number; x2: number; y2: number; c: number };
const lines: Line[] = [];
for (let c = 0; c <= COLS; c++) {
  for (let r = 0; r <= ROWS; r++) {
    const a = grid[c][r];
    const right = c < COLS ? grid[c + 1][r] : null;
    const down = r < ROWS ? grid[c][r + 1] : null;
    if (right && Math.min(a.order, right.order) >= 0.55)
      lines.push({ x1: a.x, y1: a.y, x2: right.x, y2: right.y, c });
    if (down && Math.min(a.order, down.order) >= 0.62)
      lines.push({ x1: a.x, y1: a.y, x2: down.x, y2: down.y, c });
  }
}

const SCAN_COL = 6; // the cobalt column — the "governed" reference line

export default function HeroSchematic() {
  return (
    <div className="hero-fig" aria-hidden="true">
      <div className="hero-fig-head">
        <span className="hero-fig-tag">Fig. 01</span>
        <span className="hero-fig-tag">Sprawl → governed</span>
      </div>
      <svg
        className="hero-fig-svg"
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {lines.map((l, i) => (
          <line
            key={`l${i}`}
            className="fig-line"
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--color-line-cobalt)"
            strokeWidth="1"
            pathLength="1"
            style={{ ["--d" as string]: l.c }}
          />
        ))}
        {nodes.map((n, i) => {
          const scan = n.c === SCAN_COL;
          const s = scan ? 7 : 4 + n.order * 2;
          return (
            <rect
              key={`n${i}`}
              className="fig-node"
              x={n.x - s / 2}
              y={n.y - s / 2}
              width={s}
              height={s}
              rx={scan ? 0 : 1}
              fill={
                scan
                  ? "var(--color-cobalt)"
                  : `oklch(0.25 0.016 64 / ${0.22 + n.order * 0.42})`
              }
              style={{ ["--d" as string]: n.c * 1.5 + n.r * 0.4 }}
            />
          );
        })}
      </svg>
    </div>
  );
}
