import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Icon } from "@/components/ui/icon";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./contact-section.module.css";

const LEAD = "Questions about the toolkit, or about how to buy it? Send an email.";

/** An address may break after its "@" instead of running out of a narrow column. */
function addressParts(address: string): [string, string] {
  const at = address.indexOf("@");
  return at === -1 ? [address, ""] : [address.slice(0, at + 1), address.slice(at + 1)];
}

/**
 * `#contact`: the one address of the site, on paper, where the old Contact page now lands. The
 * `<h2>` is "Contact", in the margin from 68em; the lead and the address stand beside it. The
 * address is the one `mailto:` link of the page, set as large as a statement with the arrow after
 * it: it is the thing to act on, not a third headline. On hover and keyboard focus the highlighter
 * fills in behind the address (the words stay ink) and the arrow moves 6px.
 */
export function ContactSection() {
  const [local, domain] = addressParts(SITE.contactEmail);

  return (
    <Band id="contact" surface="paper" pad="roomy" aria-labelledby="contact-title">
      <Split
        margin={
          <h2 id="contact-title" className={cx("type-page", styles.title)}>
            Contact
          </h2>
        }
      >
        <p className={cx("type-lead", styles.lead)}>{LEAD}</p>
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
  );
}
