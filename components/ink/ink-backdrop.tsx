import { cx } from "@/lib/cx";
import { stillPath, type StillPair } from "@/lib/ink/stills";
import type { SceneName } from "@/lib/ink/types";
import type { Edge } from "@/lib/ink/zones";
import styles from "./ink-backdrop.module.css";

type Edges =
  Edge | `${Edge} ${Edge}` | `${Edge} ${Edge} ${Edge}` | `${Edge} ${Edge} ${Edge} ${Edge}`;

type InkBackdropProps = {
  scene: SceneName;
  /** The settled frame that stands in for the live ink. Absent for the cover of a first visit. */
  still?: StillPair;
  /** The sides where ink must thin to nothing before the backdrop ends, space separated. */
  edges?: Edges;
  /**
   * The still is in the first screen, where it is the largest thing painted for a visitor without
   * live ink: it is asked for at high priority. It stays lazy, so it is still never fetched where
   * it is not displayed.
   */
  priority?: boolean;
  className?: string;
};

/**
 * Where ink may appear. A backdrop is the bottom layer of a stage: a still image of the scene and
 * an empty slot. The ink layer (`ink-layer.tsx`) moves the one canvas of the document into the slot
 * of the backdrop that matters most on screen; without it, the still is the picture.
 *
 * The parent must be positioned. Whatever follows the backdrop in it is lifted above it. Children
 * of the stage say where ink must keep clear with `data-ink-calm="text" | "display" | "veil"` and
 * what a scene may aim at with `data-ink-anchor="open" | "tenth"`.
 *
 * It is decoration: `aria-hidden`, deaf to the pointer, and gone under raised contrast and forced
 * colours. Hooks: `data-ink-backdrop`, `data-scene`, `data-edges`, `data-ink-state`,
 * `data-ink-still`, `data-ink-slot`.
 */
export function InkBackdrop({
  scene,
  still,
  edges,
  priority = false,
  className,
}: InkBackdropProps) {
  return (
    <div
      data-ink-backdrop=""
      data-scene={scene}
      data-edges={edges}
      data-ink-state="idle"
      aria-hidden="true"
      className={cx(styles.backdrop, className)}
    >
      {still && (
        <picture data-ink-still="" className={styles.still}>
          {/* The pages lay themselves out for a narrow window up to 68em, so the tall frame
              is the one that belongs there. */}
          {still.tall && <source media="(min-width: 68em)" srcSet={stillPath(still.wide)} />}
          {/* A static, pre-sized frame of the engine: it must reach the browser as it was
              captured, not re-encoded or resized, or its calm zones would stop holding their caps.
              (The lint rule about raw images does not fire inside a picture element.) */}
          <img
            src={stillPath(still.tall ?? still.wide)}
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority={priority ? "high" : "low"}
          />
        </picture>
      )}
      <div data-ink-slot="" className={styles.slot} />
    </div>
  );
}
