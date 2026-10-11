import type { ReactNode } from "react";
import styles from "./sentences.module.css";

/**
 * The words of a statement heading. A line break in `text` separates two sentences: each one is
 * then a block of its own, so the statement always breaks between its sentences and each is balanced
 * by itself (one balanced block would narrow all its lines together and strand a word). A space
 * joins the blocks, so the heading's text stays the plain statement. Goes directly inside the
 * heading; a statement of one sentence is rendered as plain text.
 */
export function Sentences({ text }: { text: string }) {
  const sentences = text.split("\n");
  if (sentences.length === 1) return <>{text}</>;

  const nodes: ReactNode[] = [];
  sentences.forEach((sentence, index) => {
    if (index > 0) nodes.push(" ");
    nodes.push(
      <span key={index} className={styles.sentence}>
        {sentence}
      </span>,
    );
  });
  return <>{nodes}</>;
}
