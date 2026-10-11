import type { Metadata } from "next";
import { TitleBlock } from "@/components/layout/title-block";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Icon } from "@/components/ui/icon";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./page.module.css";

// The page lead and the metadata description are the same sentence.
const LEAD =
  "Questions about the toolkit, licensing for your organization, or buying by purchase order?";

export const metadata: Metadata = {
  title: "Contact",
  description: LEAD,
};

/** An address may break after its "@" instead of running out of a narrow column. */
function addressParts(address: string): [string, string] {
  const at = address.indexOf("@");
  return at === -1 ? [address, ""] : [address.slice(0, at + 1), address.slice(at + 1)];
}

/**
 * `/contact`: one statement and the one address under it, set as large as a statement. The address
 * is a single `mailto:` link with the arrow after it; it is the one big link of the page. On hover
 * and keyboard focus the highlighter fills in behind the address (the words stay ink) and the arrow
 * moves 6px.
 */
export default function ContactPage() {
  const [local, domain] = addressParts(SITE.contactEmail);

  return (
    <>
      <TitleBlock form="index" ink title="Contact" lead={LEAD} />

      <Band surface="paper" pad="roomy">
        <Split>
          <h2 className={cx("type-banner", styles.statement)}>
            Send an email and you will get a reply from a person.
          </h2>
          <Appear className={styles.row}>
            <a href={`mailto:${SITE.contactEmail}`} className={cx("type-statement", styles.link)}>
              <span className={styles.address}>
                {local}
                <wbr />
                {domain}
              </span>
              <Icon name="arrow" size={32} className={styles.arrow} />
            </a>
          </Appear>
        </Split>
      </Band>
    </>
  );
}
