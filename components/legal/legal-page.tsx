import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { RowLink } from "@/components/ui/row-link";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import {
  LEGAL,
  LEGAL_DOCUMENTS,
  formatLegalDate,
  type LegalBlock,
  type LegalDocument,
  type Rich,
} from "@/lib/legal";
import { CONTACT_LINK, LEGAL_LINKS, SITE } from "@/lib/site";
import styles from "./legal-page.module.css";

/** Running text with its links, in reading order. */
function Text({ text }: { text: Rich }) {
  if (typeof text === "string") return text;
  return text.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <TextLink key={index} href={part.href}>
        {part.text}
      </TextLink>
    ),
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="type-copy">
          <Text text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul className={cx("type-copy", styles.list)}>
          {block.items.map((item, index) => (
            <li key={index}>
              <Text text={item} />
            </li>
          ))}
        </ul>
      );
    case "terms":
      return (
        <dl className={styles.terms}>
          {block.rows.map((row) => (
            <div key={row.term} className={styles.term}>
              <dt className={cx("type-ui", styles.name)}>{row.term}</dt>
              <dd className={cx("type-copy", styles.said)}>
                <Text text={row.text} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "heading":
      return (
        <h3 id={block.id} className={cx("type-item", styles.sub)}>
          {block.title}
        </h3>
      );
  }
}

/** The short name of a page, as the footer lists it ("Privacy"), or its title where it has none. */
function shortName(page: LegalDocument): string {
  return LEGAL_LINKS.find((entry) => entry.href === page.href)?.label ?? page.title;
}

/**
 * One of the four legal pages (`/privacy`, `/terms`, `/refunds`, `/accessibility`), drawn from a
 * `LegalDocument` in `lib/legal`. All four share this layout, so they read as one set.
 *
 * Top to bottom: the title block in its `document` form (the date the page last changed in the
 * margin, the page's one `<h1>` and its summary beside it), then one paper band under an ink rule
 * that holds three things in DOM order: the table of contents (`nav`, "On this page"), the article
 * and the list of the four policies with the contact address (`aside`).
 *
 * The article opens with the page in a few points on the wash ("In short"), then the numbered
 * sections: each a `<section id>` with its `<h2>`, whose number is a small ruled tile that takes
 * the highlighter while the section is the target of the address. A subsection is an `<h3 id>`.
 * Words keep to a measure of 40rem (about 68 characters of the copy size).
 *
 * From 68em it is the twelve-column grid: the contents in the margin (columns 1 to 3) and the
 * policies in columns 10 to 12, both held under the bar while the article (columns 4 to 9) scrolls.
 * Below that the contents are a ledger across the top (two columns from 40em), and the policies
 * stand beside the article where both fit (about 46rem of room) and under it where they do not.
 * Nothing here is a client component: the contents are plain anchors.
 */
export function LegalPage({ document: page }: { document: LegalDocument }) {
  const updated = (
    <div className={styles.dateline}>
      <Eyebrow>Last updated</Eyebrow>
      <p className={cx("type-ui", styles.date)}>
        <time dateTime={LEGAL.effectiveDate}>{formatLegalDate(LEGAL.effectiveDate)}</time>
      </p>
    </div>
  );

  return (
    <>
      <TitleBlock form="document" title={page.title} lead={page.summary} meta={updated} />
      <Band as="div" surface="paper" pad="none" className={styles.body}>
        <div className={styles.layout} data-legal="">
          <nav aria-labelledby="legal-contents" className={styles.toc} data-legal-toc="">
            <Eyebrow id="legal-contents" marker={false} className={styles.label}>
              On this page
            </Eyebrow>
            <ol className={styles.entries}>
              {page.sections.map((section, index) => (
                <li key={section.id} className={styles.entry}>
                  <a href={`#${section.id}`} className={styles.jump}>
                    <span className={cx("tabular", styles.count)}>{index + 1}</span>
                    <span className={styles.heading}>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className={styles.prose}>
            <div className={styles.brief}>
              <Eyebrow className={styles.label}>In short</Eyebrow>
              <ul className={cx("type-copy", styles.points)}>
                {page.points.map((point) => (
                  <li key={point} className={styles.point}>
                    <Icon name="tick" className={styles.tick} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {page.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className={styles.section}
                data-legal-section=""
              >
                <h2 id={`${section.id}-title`} className={cx("type-section", styles.title)}>
                  <span className={cx("tabular", styles.number)}>{index + 1}</span>
                  <span>{section.title}</span>
                </h2>
                <div className={styles.blocks}>
                  {section.blocks.map((block, at) => (
                    <Block key={at} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </article>

          <aside aria-labelledby="legal-policies" className={styles.record}>
            <Eyebrow id="legal-policies" marker={false} className={styles.label}>
              Policies
            </Eyebrow>
            <BandedList>
              {LEGAL_DOCUMENTS.map((entry) => (
                <BandedRow key={entry.href}>
                  <RowLink
                    href={entry.href}
                    label={shortName(entry)}
                    aria-current={entry.href === page.href ? "page" : undefined}
                  />
                </BandedRow>
              ))}
            </BandedList>
            <p className={cx("type-note", styles.ask)}>
              Questions about this page? Write to{" "}
              <TextLink href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</TextLink> or see
              the <TextLink href={CONTACT_LINK.href}>{CONTACT_LINK.label} page</TextLink>.
            </p>
          </aside>
        </div>
      </Band>
    </>
  );
}
