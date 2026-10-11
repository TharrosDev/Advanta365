import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { cx } from "@/lib/cx";
import styles from "./ai-statement.module.css";

/**
 * The one black statement of the company pages, on the static `ink` band: no ink moves behind it.
 * The label stands over the statement, which is a `.type-statement` heading in columns 1 to 10 (one
 * sentence per block, each inking in as it arrives); the paragraphs follow in columns 7 to 12.
 * Below 68em everything is one column.
 */
export function AiStatement({
  label,
  statement,
  copy,
}: {
  label: string;
  statement: string;
  copy: readonly string[];
}) {
  return (
    <Band surface="ink" pad="roomy">
      <div className={styles.grid}>
        <Eyebrow className={styles.label}>{label}</Eyebrow>
        <h2 className={cx("type-statement", styles.statement)}>
          <Sentences text={statement} move />
        </h2>
        <div className={styles.copy}>
          {copy.map((paragraph) => (
            <Appear as="p" key={paragraph} className={cx("type-lead", styles.paragraph)}>
              {paragraph}
            </Appear>
          ))}
        </div>
      </div>
    </Band>
  );
}
