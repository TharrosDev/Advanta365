/**
 * Static, on-brand hero visual — a "governed lattice" node-network as an SVG.
 * Fills its (framed) container. Used for SSR / first paint, the dynamic loading
 * state, mobile, and prefers-reduced-motion. The 3D <Canvas> mounts into the same
 * box, so there is no layout shift.
 *
 * Server-renderable, fully deterministic (no random/Date) so SSR and client match.
 */

const CX = 240;
const CY = 240;

function ring(count: number, radius: number, offset: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2 + offset;
    return { x: CX + Math.cos(a) * radius, y: CY + Math.sin(a) * radius };
  });
}

const inner = ring(6, 78, 0);
const outer = ring(10, 150, 0.32);

const spokes = inner.map((n) => [{ x: CX, y: CY }, n] as const);
const innerLoop = inner.map((n, i) => [n, inner[(i + 1) % inner.length]] as const);
const outerLoop = outer.map((n, i) => [n, outer[(i + 1) % outer.length]] as const);
const ties = inner.map((n, i) => [n, outer[(i * 2) % outer.length]] as const);

const fmt = (v: number) => v.toFixed(2);

export default function HeroFallback() {
  return (
    <svg
      viewBox="0 0 480 480"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="An abstract network of connected nodes — people and systems brought together under one governed model."
    >
      {/* faint orbital guides */}
      <circle cx={CX} cy={CY} r={78} fill="none" stroke="var(--rule)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={150} fill="none" stroke="var(--rule)" strokeWidth={1} />

      {/* edges */}
      <g stroke="var(--ink)" strokeWidth={1} opacity={0.45}>
        {[...innerLoop, ...outerLoop, ...ties].map(([a, b], i) => (
          <line key={`e${i}`} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} />
        ))}
      </g>

      {/* governance spokes — the single redline signal reaches every node */}
      <g stroke="var(--redline)" strokeWidth={1.25} opacity={0.85}>
        {spokes.map(([a, b], i) => (
          <line key={`s${i}`} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} />
        ))}
      </g>

      {/* outer nodes */}
      {outer.map((n, i) => (
        <rect
          key={`o${i}`}
          x={fmt(n.x - 4)}
          y={fmt(n.y - 4)}
          width={8}
          height={8}
          fill="var(--paper-panel)"
          stroke="var(--ink)"
          strokeWidth={1.25}
        />
      ))}

      {/* inner nodes */}
      {inner.map((n, i) => (
        <rect
          key={`i${i}`}
          x={fmt(n.x - 5)}
          y={fmt(n.y - 5)}
          width={10}
          height={10}
          fill="var(--paper-panel)"
          stroke="var(--ink)"
          strokeWidth={1.5}
        />
      ))}

      {/* governed core */}
      <rect x={CX - 8} y={CY - 8} width={16} height={16} fill="var(--redline)" />
    </svg>
  );
}
