import type { Metadata } from "next";
import { CheckoutDialog } from "@/components/checkout/checkout-dialog";
import { OrderSummary } from "@/components/checkout/order-summary";
import { ContentsLeaf } from "@/components/purchase/contents-leaf";
import { Portfolio } from "@/components/purchase/portfolio";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { getFreeTemplates, getPhases, getTemplates } from "@/lib/catalog/repository";
import { CHECKOUT_PARAM, parseCheckoutStep } from "@/lib/checkout/steps";
import { PURCHASE_LINK, TOOLKIT } from "@/lib/site";
import styles from "./page.module.css";

// Every address of the page (the checkout open on a step in `checkout`) names the plain page as its
// canonical one.
export const metadata: Metadata = {
  title: "Purchase",
  description: `One toolkit, one price: ${TOOLKIT.playbooks} playbooks, ${TOOLKIT.templates} templates, ${TOOLKIT.fieldGuides} field guides and training for ${TOOLKIT.trainingAudiences} audiences, in a single purchase.`,
  alternates: { canonical: PURCHASE_LINK.href },
};

type PurchasePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * `/purchase`: the one place a sale starts. The bundles, pricing and cart addresses redirect here.
 *
 * The page has no title block (and so, like the catalog, no block that changes with the route): it
 * opens on its stage, one band of paper, 42px under the bar (56px from 68em). On the stage, from 68em, the folder
 * stands at the left (columns 1 to 6, with the price on the tag that hangs from it and the tally of
 * the phases it reaches under it) and the contents leaf at the right (columns 8 to 12, centred on
 * the folder; column 7 is the room the tag hangs into). The heading on the folder's front, "Seven
 * phases in one folder.", is the page's one `h1`. The leaf holds the `h2` "What is inside", the
 * ledger of counts read from `TOOLKIT`, the Checkout button, the way to write to us (for a
 * purchase order, or a question) and the note that the catalog is sample content. On a large
 * monitor the pair is drawn larger with the column (see the stylesheet); from about 1010px of
 * window to 68em the two stand side by side, the tag lying on the folder, and below that it is one
 * column, the folder first. The price is printed once, on the tag.
 *
 * `checkout` in the address names a step of the checkout (`details`, `review`, `payment`), which
 * is then shown in a pop-up over the page, as a free sample is over the catalog; it closes to the
 * page without the parameter. Any other value opens nothing. The order summary is rendered here,
 * on the server, in its two forms, and handed to the dialog.
 */
export default async function PurchasePage({ searchParams }: PurchasePageProps) {
  const [params, phases, templates, samples] = await Promise.all([
    searchParams,
    getPhases(),
    getTemplates(),
    getFreeTemplates(),
  ]);
  const checkout = parseCheckoutStep(params[CHECKOUT_PARAM]);

  return (
    <>
      <Band surface="paper" className={styles.stage} innerClassName={styles.grid}>
        <Appear move="settle" when="load" className={styles.folder}>
          <Portfolio
            size="page"
            covers={samples}
            phases={phaseCoverage(phases, templates)}
            className={styles.portfolio}
          />
        </Appear>
        <Appear move="settle" when="load" order={1} className={styles.leaf}>
          <ContentsLeaf />
        </Appear>
      </Band>
      {checkout ? (
        <CheckoutDialog
          panel={<OrderSummary variant="panel" />}
          disclosure={<OrderSummary variant="disclosure" />}
        />
      ) : null}
    </>
  );
}
