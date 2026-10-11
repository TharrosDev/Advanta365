import type { Metadata } from "next";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
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

/** An address may break after its "@" instead of running out of a narrow sheet. */
function addressParts(address: string): [string, string] {
  const at = address.indexOf("@");
  return at === -1 ? [address, ""] : [address.slice(0, at + 1), address.slice(at + 1)];
}

/**
 * `/contact`: one statement and the one address, in an ink-edged sheet under it. The address is a
 * single `mailto:` link that fills the sheet: underlined, set in the section size, with the arrow
 * after it. On hover and keyboard focus the sheet takes the wash and the ring stands outside it.
 */
export default function ContactPage() {
  const [local, domain] = addressParts(SITE.contactEmail);

  return (
    <>
      <TitleBlock form="index" title="Contact" lead={LEAD} />

      <Band surface="paper">
        <Split>
          <h2 className={cx("type-page", styles.statement)}>
            Send an email and you will get a reply from a person.
          </h2>
          <Sheet edge="ink" pad="none" className={styles.sheet}>
            <a href={`mailto:${SITE.contactEmail}`} className={cx("type-section", styles.link)}>
              <span className={styles.address}>
                {local}
                <wbr />
                {domain}
              </span>
              <Icon name="arrow" size={24} className={styles.arrow} />
            </a>
          </Sheet>
        </Split>
      </Band>
    </>
  );
}
