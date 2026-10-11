import type { ReactNode } from "react";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { SectionLabel } from "@/components/ui/section-label";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./section-intro.module.css";

/**
 * Section opener: optional label strip, a word-revealed title, optional body copy and actions.
 *
 * The reveal order is built in: the label fades first (coarse 0), the title words rise on the fine step
 * from `wordOffset`, the body fades on the first coarse step after the last word and the actions follow
 * one step later. It contains no `RevealGroup`: the caller decides what pauses the sequence.
 *
 * `actions` are rendered in a full-width block without a layout of its own: pass one element, or a
 * wrapper that arranges several.
 */
export function SectionIntro({
  label,
  labelBold,
  title,
  titleAs: Title = "h2",
  titleClassName = "t-display-fluid",
  body,
  actions,
  center = false,
  wordOffset,
  className,
}: {
  label?: string;
  labelBold?: boolean;
  title: string;
  titleAs?: "h2" | "h3";
  titleClassName?: string;
  body?: string;
  actions?: ReactNode;
  center?: boolean;
  wordOffset?: number;
  className?: string;
}) {
  const firstWord = wordOffset ?? (label ? 1 : 0);
  const bodyIndex = coarseIndexAfter(firstWord + countWords(title));

  return (
    <div className={cx(styles.root, center && styles.center, className)}>
      {label ? (
        <Reveal as="div" effect="fade" index={0}>
          <SectionLabel bold={labelBold}>{label}</SectionLabel>
        </Reveal>
      ) : null}
      <div className={styles.text}>
        <Title className={cx(styles.title, titleClassName)}>
          <RevealWords text={title} offset={firstWord} />
        </Title>
        {body ? (
          <p className={cx("t-body-large", "c-fg-60", styles.body)}>
            <Reveal effect="fade" index={bodyIndex}>
              {body}
            </Reveal>
          </p>
        ) : null}
        {actions ? (
          <Reveal as="div" effect="fade-up" index={bodyIndex + 1} className={styles.actions}>
            {actions}
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
