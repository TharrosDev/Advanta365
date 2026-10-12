import { PaperSheet } from "@/components/ui/paper-sheet";
import { cx } from "@/lib/cx";
import { formatPriceParts } from "@/lib/format";
import { OFFER } from "@/lib/site";
import styles from "./price-tag.module.css";

/**
 * The price of the one thing the site sells, on a paper tag: the amount and its currency code
 * ("$1,499.99" over "CAD", read from `OFFER`, the only place they are written) and the words "one purchase", under an eyelet that a loop of string
 * runs through. The string is tied through a second eyelet, the point the tag hangs from: the
 * box's top centre, which a caller puts on the corner of the object the tag belongs to. The tag is turned about that point by `--tag-turn`
 * (6 degrees unless the caller sets it), and its measures follow the nearest size container, so
 * it keeps its proportion to the folder it hangs from.
 *
 * The tag is the price as text, for everyone; only the string is decoration. It is deaf to the
 * pointer, so whatever lies under it is what is hovered. Hook: `data-price-tag`, on which
 * app/motion.css hangs the swing: the box swings once when the tag is first seen (which is why it
 * is watched), and what hangs in it swings again, a little, when the folder before it comes under
 * the pointer. Without motion it hangs still.
 */
export function PriceTag({ className }: { className?: string }) {
  const price = formatPriceParts(OFFER.priceCents, OFFER.currency);

  return (
    <div data-price-tag="" data-watch="" className={cx(styles.root, className)}>
      <div className={styles.hang}>
        <span aria-hidden="true" className={styles.anchor} />
        <PaperSheet size="md" depth={2} className={styles.tag}>
          <span aria-hidden="true" className={styles.eyelet} />
          <p className={styles.price}>
            {price.amount}{" "}
            <span className={cx("type-note", styles.currency)}>{price.currency}</span>
          </p>
          <p className={cx("type-note", styles.terms)}>one purchase</p>
        </PaperSheet>
        <svg
          className={styles.string}
          viewBox="0 0 24 60"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 0C6.5 18 8.5 44 12 60" />
          <path d="M12 0C17 16 16 42 12 60" />
        </svg>
      </div>
    </div>
  );
}
