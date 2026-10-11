import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Sentences } from "@/components/ui/sentences";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";
import { LineDrawing, type LineDrawingName } from "./value-tiles";

type Value = {
  title: string;
  body: string;
  drawing: LineDrawingName;
};

const VALUES: readonly Value[] = [
  {
    title: "Field-tested, not theoretical",
    body: "Built from 30+ years of field-tested practice on real rollouts, then refined into ready-to-use templates.",
    drawing: "tested",
  },
  {
    title: "Experience you can borrow",
    body: "Grounded in Prosci certification and 30+ years of practice.",
    drawing: "borrow",
  },
  {
    title: "Yours to adapt",
    body: "Edit by hand or feed it to AI. You keep what you build.",
    drawing: "adapt",
  },
  {
    title: "Built for any sector",
    body: "Used from private companies to the public service.",
    drawing: "sector",
  },
];

/**
 * `#values`: on paper. The label and the statement (one sentence to a line) stand over four
 * values, two by two from 40em and 112px apart from 68em, one column below. Each value is a line
 * drawing, a hairline under it, then the title and its sentence; neither breaks inside a
 * hyphenated word.
 */
export function ValuesSection() {
  return (
    <Band id="values" surface="paper">
      <Eyebrow>Why Advanta365</Eyebrow>
      <h2 className={cx("type-page", styles.valuesTitle)}>
        <Sentences text={"Field-tested change.\nAI-ready content."} />
      </h2>
      <ul className={styles.valuesList}>
        {VALUES.map(({ title, body, drawing }) => (
          <li key={title} className={styles.value}>
            <LineDrawing name={drawing} className={styles.valueDrawing} />
            <div className={styles.valueText}>
              <h3 className="type-item">
                <KeepCompounds text={title} />
              </h3>
              <p className={cx("type-copy", styles.valueBody)}>
                <KeepCompounds text={body} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Band>
  );
}
