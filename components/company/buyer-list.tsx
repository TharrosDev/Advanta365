import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { cx } from "@/lib/cx";
import styles from "./buyer-list.module.css";

export type Buyer = { name: string; caresAbout: string; line: string };

/**
 * The buyers as a ruled list: who they are (the row's `<h3>`), what they care about and the one line
 * for them, which the list sets in quotation marks. Stacked on a phone. From 768px the name sits
 * beside the details, one third to two thirds with the gap of a `FactList`, so a fact list under the
 * rows lines up with them. From 1024px the two details sit side by side.
 *
 * Its own reveal group: the rows fade up in turn.
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
    <RevealGroup as="ul" className={cx(styles.list, className)}>
      {buyers.map((buyer, index) => (
        <Reveal key={buyer.name} as="li" effect="fade-up" index={index} className={styles.row}>
          <h3 className="t-headline-small">{buyer.name}</h3>
          <div className={styles.detail}>
            <dl className={styles.cares}>
              <dt className="t-label-medium c-fg-60">{caresLabel}</dt>
              <dd className="t-body-large c-fg-80">{buyer.caresAbout}</dd>
            </dl>
            <p className={cx("t-title-large", styles.line)}>{`“${buyer.line}”`}</p>
          </div>
        </Reveal>
      ))}
    </RevealGroup>
  );
}
