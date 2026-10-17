import type { ReactNode } from "react";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Tag } from "@/components/ui/tag";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import { SectionHead } from "./section-head";
import styles from "./site-state.module.css";

const INTRO = "This site is a beta, and this is where it stands today.";

type Item = { name: string; status: string; body: ReactNode };

/**
 * What is and is not built, in the plain words of PRODUCT.md. It does the job the banner used to
 * do: the catalog is sample content, an order can be started but payment is not connected, and the
 * worked example cannot be downloaded yet.
 */
const ITEMS: readonly Item[] = [
  {
    name: "The catalog",
    status: "Sample content",
    body: (
      <>
        Its phases follow the toolkit’s folders. Its templates are placeholders, and it does not
        list the full toolkit. The six free samples open in a pop-up; every other template is
        locked. <TextLink href="/catalog">Browse the sample catalog</TextLink>.
      </>
    ),
  },
  {
    name: "Checkout",
    status: "No payment yet",
    body: (
      <>
        An order can be started on the Purchase page, but taking payment online is not connected
        yet, so nothing can be paid for on this site. There are no accounts, and locked templates
        stay locked for every visitor. <TextLink href="/purchase">See the Purchase page</TextLink>.
      </>
    ),
  },
  {
    name: "The worked example",
    status: "No file yet",
    body: (
      <>
        Its file cannot be downloaded yet. The Sample page describes it and lists its table of
        contents, whose sections are placeholders.{" "}
        <TextLink href="/sample">See the Sample page</TextLink>.
      </>
    ),
  },
];

/**
 * `#state`: the one wash band of the page, a plain note on where the site stands. A ledger on the
 * wash with a row for each thing that is not finished: its name in the document's face, a plain tag
 * with its status, and a sentence. Stacked below 68em; from 68em on the twelve columns, with the
 * name and tag in columns 1 to 4 and the sentence in columns 6 to 12.
 */
export function SiteState() {
  return (
    <Band id="state" surface="wash" aria-labelledby="state-title">
      <SectionHead
        id="state-title"
        label="State of the site"
        title="A beta, said plainly."
        size="page"
      >
        <p>{INTRO}</p>
      </SectionHead>

      <BandedList className={styles.ledger}>
        {ITEMS.map((item) => (
          <BandedRow key={item.name} className={styles.row}>
            <div className={styles.what}>
              <h3 className={cx("type-item", styles.name)}>{item.name}</h3>
              <Tag variant="plain" className={styles.status}>
                {item.status}
              </Tag>
            </div>
            <Appear as="p" className={cx("type-copy", styles.body)}>
              {item.body}
            </Appear>
          </BandedRow>
        ))}
      </BandedList>
    </Band>
  );
}
