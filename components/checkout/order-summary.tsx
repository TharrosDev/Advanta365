import { Icon } from "@/components/ui/icon";
import { includedLines, orderAmounts, TAX_LINE } from "@/lib/checkout/order";
import { cx } from "@/lib/cx";
import { OFFER } from "@/lib/site";
import styles from "./order-summary.module.css";

/**
 * What is being bought, always in view beside the steps of the checkout: the offer by name, what it
 * holds (the counts of `TOOLKIT`), the price, a tax line that says the truth (the site does not
 * work tax out; it is calculated at payment) and the total before it. It is written on the binder,
 * white on black with the highlighter for its ticks, so it reads as one object apart from the form.
 *
 * `panel` is the column beside the form from 68em. `disclosure` is the same content for narrower
 * windows: a native `<details>` that shows the offer and its price and opens to the rest, so a
 * phone's first screen is the form. The page renders both and its stylesheet shows one.
 */
export function OrderSummary({ variant }: { variant: "panel" | "disclosure" }) {
  const amounts = orderAmounts();

  const lines = (
    <>
      <ul className={styles.included}>
        {includedLines().map((line) => (
          <li key={line} className={cx("type-ui", styles.line)}>
            <Icon name="tick" size={16} className={styles.tick} />
            {line}
          </li>
        ))}
      </ul>
      <dl className={styles.amounts}>
        <div className={styles.amount}>
          <dt className="type-ui">Price</dt>
          <dd className={cx("type-ui", "tabular")}>{amounts.price}</dd>
        </div>
        <div className={styles.amount}>
          <dt className="type-ui">Tax</dt>
          <dd className="type-ui">{TAX_LINE}</dd>
        </div>
        <div className={cx(styles.amount, styles.total)}>
          <dt className="type-ui">Total before tax</dt>
          <dd className={cx("type-amount", styles.figure)}>{amounts.totalBeforeTax}</dd>
        </div>
      </dl>
      <p className={cx("type-note", styles.fine)}>
        One purchase, in Canadian dollars. Tax depends on where you are and is added at payment.
      </p>
    </>
  );

  if (variant === "disclosure") {
    return (
      <details data-order-summary="disclosure" className={cx(styles.root, styles.disclosure)}>
        <summary className={styles.toggle}>
          <span className={styles.toggleWords}>
            <span className={cx("type-eyebrow", styles.eyebrow)}>Order summary</span>
            <span className={cx("type-ui", styles.toggleName)}>{OFFER.name}</span>
          </span>
          <span className={cx("type-ui", "tabular", styles.togglePrice)}>{amounts.price}</span>
          <Icon name="chevron" className={styles.chevron} />
        </summary>
        <div className={styles.more}>{lines}</div>
      </details>
    );
  }

  return (
    <section
      data-order-summary="panel"
      aria-labelledby="order-summary-title"
      className={cx(styles.root, styles.panel)}
    >
      <h3 id="order-summary-title" className={cx("type-eyebrow", styles.eyebrow)}>
        Order summary
      </h3>
      <p className={cx("type-section", styles.name)}>{OFFER.name}</p>
      {lines}
    </section>
  );
}
