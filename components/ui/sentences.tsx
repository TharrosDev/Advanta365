import type { ReactNode } from "react";
import { cssVars } from "@/lib/cx";
import styles from "./sentences.module.css";

/**
 * The words of a statement heading. A line break in `text` separates two sentences: each one is
 * then a block of its own, so the statement always breaks between its sentences and each is balanced
 * by itself (one balanced block would narrow all its lines together and strand a word). A space
 * joins the blocks, so the heading's text stays the plain statement. Goes directly inside the
 * heading; a statement of one sentence is rendered as plain text.
 *
 * `move` lets each sentence ink in as it scrolls into view, one after another (`data-move="ink-in"`
 * with its `--order`): for `.type-statement` headings only, and never for a page's h1. A statement
 * of one sentence is then one block.
 */
export function Sentences({ text, move = false }: { text: string; move?: boolean }) {
  const sentences = text.split("\n");
  if (sentences.length === 1 && !move) return <>{text}</>;

  const nodes: ReactNode[] = [];
  sentences.forEach((sentence, index) => {
    if (index > 0) nodes.push(" ");
    nodes.push(
      <span
        key={index}
        className={styles.sentence}
        data-move={move ? "ink-in" : undefined}
        style={move ? cssVars({ "--order": index }) : undefined}
      >
        {sentence}
      </span>,
    );
  });
  return <>{nodes}</>;
}
