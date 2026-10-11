"use client";

import { useCallback, useState } from "react";
import { WipeBars, releaseWipe, settleWipe, spawnWipe } from "@/components/ui/wipe";
import type { Wipe } from "@/components/ui/wipe";
import { cx } from "@/lib/cx";
import styles from "./wipe-rule.module.css";

/**
 * A hairline that draws a solid 1.5px line over itself while `active` and lets it leave to the right
 * when `active` ends. It runs on the stacking bar engine: a line that is still leaving keeps leaving
 * while a new one draws in, so moving back and forth between rows never makes a half-gone line pop.
 * Mounted with `active`, it starts filled without an animation.
 */
export function WipeRule({ active = false, className }: { active?: boolean; className?: string }) {
  const [previous, setPrevious] = useState(active);
  const [wipes, setWipes] = useState<Wipe[]>(() => (active ? spawnWipe([], true) : []));

  // React to the prop during render (the "previous prop in state" pattern): no effect, and the ids
  // come from the list itself, so nothing is read from a ref here.
  if (active !== previous) {
    setPrevious(active);
    setWipes((list) => (active ? spawnWipe(list) : releaseWipe(list)));
  }

  const settle = useCallback((id: number) => setWipes((list) => settleWipe(list, id)), []);

  return (
    <div
      className={cx(styles.rule, className)}
      aria-hidden="true"
      data-active={active ? "" : undefined}
    >
      <div className={styles.base} />
      <WipeBars wipes={wipes} settle={settle} />
    </div>
  );
}
