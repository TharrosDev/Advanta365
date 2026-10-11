import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import type { SwirlParams } from "./params";
import { SwirlBackdrop } from "./swirl-backdrop";
import styles from "./swirl-band.module.css";

/**
 * A run of sections that share one sticky swirl backdrop.
 *
 * The children MUST be direct `<section>` elements (use `SectionShell`) whose ids are listed, in order,
 * in `stops`: the band makes them transparent, stacks them above the backdrop, and the scroll driver
 * morphs the swirl from keyframe to keyframe as each one passes the middle of the viewport.
 * `keyframes` needs `stops.length + 2` entries (band top, each section centre, band bottom) and
 * defaults to the home page set.
 */
export function SwirlBand({
  stops,
  keyframes,
  className,
  children,
}: {
  stops: readonly string[];
  keyframes?: readonly SwirlParams[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx(styles.band, className)} data-swirl-band="">
      <div className={styles.layer} aria-hidden="true">
        <SwirlBackdrop stops={stops} keyframes={keyframes} />
      </div>
      {children}
    </div>
  );
}
