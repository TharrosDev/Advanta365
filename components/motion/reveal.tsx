import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cssVars, cx } from "@/lib/cx";
import { splitWords } from "@/lib/motion/words";
import styles from "./reveal.module.css";

export type RevealEffect = "rise" | "fade" | "fade-up" | "wipe";
export type RevealTag =
  | "span"
  | "div"
  | "li"
  | "p"
  | "ul"
  | "ol"
  | "section"
  | "header"
  | "footer"
  | "nav"
  | "dl"
  | "dt"
  | "dd"
  | "h2"
  | "h3"
  | "figure";
export type RevealProps = {
  as?: RevealTag;
  effect?: RevealEffect;
  /** Stagger integer. Delay = --reveal-delay + index * step. */
  index?: number;
  /** 0.1s ("coarse") or 50ms ("fine") per index. */
  step?: "coarse" | "fine";
  /** false renders the bare element: no reveal classes, no --stagger. */
  enabled?: boolean;
} & HTMLAttributes<HTMLElement>;

const EFFECT_CLASS: Record<RevealEffect, string | undefined> = {
  rise: styles.rise,
  fade: styles.fade,
  "fade-up": styles.fadeUp,
  wipe: styles.wipe,
};

/** For elements that cannot be wrapped: the class list that puts a reveal on your own element. */
export function revealClass(effect: RevealEffect, step: "coarse" | "fine" = "coarse"): string {
  return cx(styles.root, EFFECT_CLASS[effect], step === "fine" && styles.fine);
}

/** Companion of `revealClass`: the inline style that carries the stagger index. */
export function revealStyle(index: number): CSSProperties {
  return cssVars({ "--stagger": index });
}

/**
 * CSS-only entrance animation. Server-safe (no hooks). It plays when its element is inserted,
 * unless an ancestor pauses it: a `RevealGroup` that is not in view yet, or the entry overlay on
 * "/". `rise` forces `display: inline-block` and is for text; blocks use `fade-up`, labels and
 * copy use `fade`.
 */
export function Reveal({
  as: Tag = "span",
  effect = "rise",
  index = 0,
  step = "coarse",
  enabled = true,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  if (!enabled) {
    return (
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }
  return (
    <Tag
      className={cx(revealClass(effect, step), className)}
      style={{ ...style, ...revealStyle(index) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * One reveal span per word with the whitespace re-emitted as plain text between the spans, so the
 * sentence wraps naturally and the parent's `textContent` stays the plain sentence. Goes directly
 * inside a heading: `<h1><RevealWords text={title} /></h1>`.
 */
export function RevealWords({
  text,
  offset = 0,
  step = "fine",
  effect = "rise",
  wordClassName,
}: {
  text: string;
  offset?: number;
  step?: "coarse" | "fine";
  effect?: RevealEffect;
  wordClassName?: string;
}) {
  const nodes: ReactNode[] = [];
  let wordIndex = offset;
  for (const token of splitWords(text)) {
    if (token.kind === "space") {
      nodes.push(token.text);
      continue;
    }
    nodes.push(
      <Reveal
        key={nodes.length}
        effect={effect}
        step={step}
        index={wordIndex}
        className={wordClassName}
      >
        {token.text}
      </Reveal>,
    );
    wordIndex += 1;
  }
  return <>{nodes}</>;
}
