import { cx } from "@/lib/cx";
import { TOOLKIT } from "@/lib/site";
import styles from "./home.module.css";

/** "30+ years" as a figure and its unit. */
const [EXPERIENCE = "", EXPERIENCE_UNIT = ""] = TOOLKIT.experience.split(" ");

/** The four facts, each a figure and the word it counts. The numbers are the toolkit's own. */
const FACTS = [
  { figure: EXPERIENCE, label: EXPERIENCE_UNIT },
  { figure: String(TOOLKIT.playbooks), label: "playbooks" },
  { figure: String(TOOLKIT.templates), label: "templates" },
  { figure: "One", label: "purchase" },
] as const;

/**
 * The proof strip on the bottom edge of the hero: four facts about the toolkit in one ruled row
 * (two by two below 40em), each a figure in the display face and its word as a label. It is a
 * list, named for assistive technology. Ink passes behind it as it does behind the footer's
 * links: capped, so the words keep their contrast, and never slowed. It stops short of the band's
 * right-hand corner, where the ink layer puts its pause button.
 */
export function ProofStrip() {
  return (
    <ul className={styles.proof} aria-label="The toolkit in numbers" data-ink-calm="veil">
      {FACTS.map((fact) => (
        <li key={fact.label} className={styles.proofItem}>
          <span className={cx("type-section", styles.proofFigure)}>{fact.figure}</span>{" "}
          <span className={cx("type-eyebrow", styles.proofLabel)}>{fact.label}</span>
        </li>
      ))}
    </ul>
  );
}
