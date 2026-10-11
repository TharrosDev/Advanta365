import type { ReactNode } from "react";
import { splitCompounds } from "@/lib/compounds";
import styles from "./keep-compounds.module.css";

/**
 * A title with its hyphenated compounds ("ready-to-use", "End-User") kept whole.
 *
 * A browser may break a line after any hyphen, and the balanced wrapping of headings often takes
 * that break: "SharePoint End- / User Training Deck". Each compound becomes an inline block, so the
 * title breaks at its spaces instead. The text is not changed: `textContent` and the accessible name
 * stay the plain title. Goes directly inside the heading or its link.
 */
export function KeepCompounds({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  for (const part of splitCompounds(text)) {
    nodes.push(
      part.kind === "compound" ? (
        <span key={nodes.length} className={styles.compound}>
          {part.text}
        </span>
      ) : (
        part.text
      ),
    );
  }
  return <>{nodes}</>;
}
