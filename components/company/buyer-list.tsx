import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { cx } from "@/lib/cx";
import styles from "./buyer-list.module.css";

export type Buyer = { name: string; caresAbout: string; line: string };

/**
 * The buyers as a banded list: who they are (the row's `<h3>`), what they care about, and the one
 * line for them, set in quotation marks. Stacked on a phone; from 40em the name runs across the top
 * with the two details under it, side by side; from 68em all three parts share one row and one
 * first baseline.
 */
export function BuyerList({
  buyers,
  caresLabel,
  className,
}: {
  buyers: readonly Buyer[];
  /** The caption over each "cares about" value. */
  caresLabel: string;
  className?: string;
}) {
  return (
    <BandedList className={className}>
      {buyers.map((buyer) => (
        <BandedRow key={buyer.name} className={styles.row}>
          <h3 className={cx("type-item", styles.name)}>{buyer.name}</h3>
          <dl className={styles.cares}>
            <dt className={cx("type-eyebrow", styles.label)}>{caresLabel}</dt>
            <dd className={cx("type-copy", styles.value)}>{buyer.caresAbout}</dd>
          </dl>
          <p className={styles.line}>{`“${buyer.line}”`}</p>
        </BandedRow>
      ))}
    </BandedList>
  );
}
