import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Eyebrow } from "@/components/ui/eyebrow";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Sentences } from "@/components/ui/sentences";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

type Value = { title: string; body: string };

const VALUES: readonly Value[] = [
  {
    title: "Field-tested, not theoretical",
    body: "Built from 30+ years of field-tested practice on real rollouts, then refined into ready-to-use templates.",
  },
  {
    title: "Experience you can borrow",
    body: "Built by a Prosci-certified practitioner with 30+ years of practice.",
  },
  {
    title: "Yours to adapt",
    body: "Edit by hand or feed it to AI. You keep what you build.",
  },
  {
    title: "Built for any sector",
    body: "Used from private companies to the public service.",
  },
];

/**
 * `#values`: on paper. The label and the statement (one sentence to a line) stand over the four
 * values as a ledger: one row each on a hairline, the title and its sentence stacked on a phone,
 * side by side from 40em (from 68em the title in columns 1 to 5 and the sentence in 6 to 12, on
 * the title's first baseline). No drawings: the line drawings belong to
 * the manifest, so the page has one set of them. Neither a title nor a sentence breaks inside a
 * hyphenated word.
 */
export function ValuesSection() {
  return (
    <Band id="values" surface="paper">
      <Eyebrow>Why Advanta365</Eyebrow>
      <h2 className={cx("type-page", styles.valuesTitle)}>
        <Sentences text={"Field-tested change.\nAI-ready content."} />
      </h2>
      <BandedList className={styles.valuesList}>
        {VALUES.map(({ title, body }) => (
          <BandedRow key={title} className={styles.value}>
            <h3 className={cx("type-section", styles.valueTitle)}>
              <KeepCompounds text={title} />
            </h3>
            <p className={cx("type-copy", styles.valueBody)}>
              <KeepCompounds text={body} />
            </p>
          </BandedRow>
        ))}
      </BandedList>
    </Band>
  );
}
