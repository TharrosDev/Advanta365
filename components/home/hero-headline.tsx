"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";
import { SplitFlap } from "./split-flap";

/**
 * The hero's headline and the control that stops its last word. The headline is the h1, in two
 * parts: the second stands on the highlighter, and its last word turns on a split-flap board
 * through `blanks`. The first of them is the one that stands at load and the one the heading is
 * read with.
 *
 * The word turns for as long as it is in sight, so the button under the headline pauses it and
 * plays it again (WCAG 2.2.2). It is named for what a press does, "Pause the turning word" or
 * "Play the turning word", and its visible label is the first word of that name. It stands only
 * where the word moves: the stylesheet shows it under `data-motion="on"` alone, so under reduced
 * motion and without a script, where the word stands still, there is nothing to stop and no button.
 * Hook: `data-flap-control`.
 */
export function HeroHeadline({
  headline,
  blanks,
}: {
  headline: string;
  blanks: readonly string[];
}) {
  const [paused, setPaused] = useState(false);
  const action = paused ? "Play" : "Pause";

  return (
    <>
      <h1 className={cx("type-hero", styles.heroTitle)}>
        {headline}{" "}
        <span data-mark="">
          blank <SplitFlap words={blanks} tail="." paused={paused} />
        </span>
      </h1>
      <button
        type="button"
        className={cx("type-note", styles.flapControl)}
        data-flap-control=""
        onClick={() => setPaused((was) => !was)}
      >
        <Icon name={paused ? "play" : "pause"} size={16} />
        <span>
          {action}
          <span className="visually-hidden"> the turning word</span>
        </span>
      </button>
    </>
  );
}
