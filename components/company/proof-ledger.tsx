import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { cx } from "@/lib/cx";
import styles from "./proof-ledger.module.css";

export type Proof = { key: string; title: string; body: string };

/**
 * The proof points as a ledger in two columns from 40em: each row is a title (the row's `<h3>`)
 * and the sentence that backs it, with a hairline above it and none beside it. One column on a
 * phone.
 */
export function ProofLedger({ items, className }: { items: readonly Proof[]; className?: string }) {
  return (
    <BandedList className={cx(styles.root, className)}>
      {items.map((item) => (
        <BandedRow key={item.key} className={styles.item}>
          <h3 className={cx("type-section", styles.title)}>{item.title}</h3>
          <p className={cx("type-copy", styles.body)}>{item.body}</p>
        </BandedRow>
      ))}
    </BandedList>
  );
}
