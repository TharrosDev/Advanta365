import type { Metadata } from "next";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Split } from "@/components/ui/split";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { OFFER, SITE } from "@/lib/site";
import styles from "./page.module.css";

const LEAD = "One toolkit, one price. Checkout is not available yet.";

export const metadata: Metadata = {
  title: "Purchase",
  description: LEAD,
};

/**
 * `/purchase`: the one thing the site sells, its price, a Checkout button that is not yet built
 * (it is disabled and says so) and the address to write to until it is. The bundles, pricing and
 * cart addresses redirect here. A plain page for now: the title block, then one band.
 */
export default function PurchasePage() {
  return (
    <>
      <TitleBlock form="index" title="Purchase" lead={LEAD} />

      <Band surface="paper" pad="roomy">
        <Split>
          <h2 className={cx("type-page", styles.offer)}>{OFFER.name}</h2>
          <p className={cx("type-statement", styles.price)}>{formatPrice(OFFER.priceCents)}</p>
          <div className={styles.action}>
            <Button size="lg" disabled>
              Checkout coming soon
            </Button>
          </div>
          <p className={cx("type-copy", styles.contact)}>
            Questions, or want to buy by purchase order? Write to{" "}
            <TextLink href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</TextLink>.
          </p>
        </Split>
      </Band>
    </>
  );
}
