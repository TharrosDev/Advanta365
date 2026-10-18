import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Icon } from "@/components/ui/icon";
import { PageShift } from "@/components/ui/page-shift";
import { RowLink } from "@/components/ui/row-link";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./contact-section.module.css";

const TITLE = "Contact";

const LEAD =
  "One address for everything: a question before you buy, an order, a licence, a privacy request, or something on this site that does not work for you.";

/** What happens next, and nothing the site cannot keep: no reply time, no other channel. */
const EXPECT =
  "The address opens your own email program, and there is no form to fill in. Replies come by email, to the address you write from.";

const TOPICS_TITLE = "What to write about";

const TOPICS_NOTE = "Each line starts an email with its subject filled in.";

/**
 * What people write to us about. A row is the same address with a subject line, so a message
 * arrives already sorted; `subject` is what the email program is handed.
 */
const TOPICS: readonly { label: string; caption: string; subject: string }[] = [
  {
    label: "A question before you buy",
    caption: "What the toolkit holds, who it is for, or whether it fits your rollout.",
    subject: "A question before buying",
  },
  {
    label: "Purchase orders and invoices",
    caption:
      "Buying by purchase order, or needing an invoice: tell us what your organization asks for.",
    subject: "Purchase order or invoice",
  },
  {
    label: "Your order, downloads or a refund",
    caption:
      "A link or a file that does not work, or a refund: give your order reference, which starts with A365.",
    subject: "Order, download or refund",
  },
  {
    label: "Licence questions",
    caption: "Who may use the toolkit, and where, once it is bought.",
    subject: "Licence question",
  },
  {
    label: "Privacy requests",
    caption:
      "A copy of what we hold about you, a correction, or a deletion. We may ask you to confirm who you are.",
    subject: "Privacy request",
  },
  {
    label: "Accessibility feedback",
    caption:
      "A page or a file that is hard to read or to operate: say where, and what you were using.",
    subject: "Accessibility feedback",
  },
];

/** An address may break after its "@" instead of running out of a narrow column. */
function addressParts(address: string): [string, string] {
  const at = address.indexOf("@");
  return at === -1 ? [address, ""] : [address.slice(0, at + 1), address.slice(at + 1)];
}

/**
 * The whole Contact page: one section on paper, and the footer after it. It holds the page's only
 * `<h1>`, the one address of the site and what to write to it about.
 *
 * From 68em the twelve columns: the h1 "Contact" stands in the margin (columns 1 to 3) as on an
 * index page, and beside it, on the title's baseline, the lead, then the address, then a sentence
 * on what to expect. The address is the thing to act on: a `mailto:` link set as large as a
 * statement with the arrow after it. On hover and keyboard focus the highlighter fills in behind
 * the address (the words stay ink) and the arrow moves 6px. Under them, in the same columns, the
 * `<h2>` and a ledger of six rows, each the same address with a subject line. Below 68em it is one
 * column in the same order.
 *
 * Every link is a plain `mailto:`, so the page needs no script and sends nothing anywhere itself.
 * The title and what stands beside it are the block that changes with the route (`PageShift`).
 */
export function ContactSection() {
  const [local, domain] = addressParts(SITE.contactEmail);
  const mailto = `mailto:${SITE.contactEmail}`;

  return (
    <Band surface="paper" pad="none" className={styles.band} aria-labelledby="contact-title">
      <div className={styles.grid}>
        <PageShift>
          <div className={styles.top}>
            <div className={styles.margin}>
              <h1 id="contact-title" className={cx("type-banner", styles.title)}>
                {TITLE}
              </h1>
            </div>
            <div className={styles.intro}>
              <div className={styles.titleLine}>
                <Appear as="p" when="load" className={cx("type-lead", styles.lead)}>
                  {LEAD}
                </Appear>
              </div>
              <Appear when="load" order={1} className={styles.row}>
                <a href={mailto} className={cx("type-statement", styles.link)}>
                  <span className={styles.address}>
                    {local}
                    <wbr />
                    {domain}
                  </span>
                  <Icon name="arrow" size={32} className={styles.arrow} />
                </a>
              </Appear>
              <Appear as="p" when="load" order={2} className={cx("type-copy", styles.expect)}>
                {EXPECT}
              </Appear>
            </div>
          </div>
        </PageShift>

        <div className={styles.topics}>
          <h2 id="contact-topics" className={cx("type-section", styles.topicsTitle)}>
            {TOPICS_TITLE}
          </h2>
          <p className={cx("type-copy", styles.topicsNote)}>{TOPICS_NOTE}</p>
          <BandedList aria-labelledby="contact-topics" className={styles.list}>
            {TOPICS.map((topic) => (
              <BandedRow key={topic.subject}>
                <RowLink
                  href={`${mailto}?subject=${encodeURIComponent(topic.subject)}`}
                  label={topic.label}
                  caption={topic.caption}
                  trailing="Email"
                />
              </BandedRow>
            ))}
          </BandedList>
        </div>
      </div>
    </Band>
  );
}
