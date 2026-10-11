import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Sentences } from "@/components/ui/sentences";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";
import { ValueTile, type ValueTileName } from "./value-tiles";

type Value = {
  title: string;
  body: string;
  tile: ValueTileName;
};

const VALUES: readonly Value[] = [
  {
    title: "Field-tested, not theoretical",
    body: "Built from 30+ years of field-tested practice on real rollouts, then refined into ready-to-use templates.",
    tile: "tested",
  },
  {
    title: "Experience you can borrow",
    body: "Grounded in Prosci certification and 30+ years of practice.",
    tile: "borrow",
  },
  {
    title: "Yours to adapt",
    body: "Edit by hand or feed it to AI. You keep what you build.",
    tile: "adapt",
  },
  {
    title: "Built for any sector",
    body: "Used from private companies to the public service.",
    tile: "sector",
  },
];

/**
 * `#values`: on paper. The label and the statement (one sentence to a line) sit over a two by two
 * list from 40em, one column below. Each value is a line-drawing tile at the left and, 21px to its
 * right, the title and the sentence under it; neither breaks inside a hyphenated word.
 */
export function ValuesSection() {
  return (
    <Band id="values" surface="paper">
      <Eyebrow>Why Advanta365</Eyebrow>
      <h2 className={cx("type-page", styles.valuesTitle)}>
        <Sentences text={"Field-tested change.\nAI-ready content."} />
      </h2>
      <ul className={styles.valuesList}>
        {VALUES.map(({ title, body, tile }) => (
          <li key={title} className={styles.value}>
            <ValueTile name={tile} />
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
