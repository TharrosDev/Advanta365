import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Button } from "@/components/ui/button";
import { FactList } from "@/components/ui/fact-list";
import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Tag } from "@/components/ui/tag";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import type { Phase, Template } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { formatLength } from "@/lib/format";
import { PURCHASE_LINK } from "@/lib/site";
import { FileDownloads } from "./file-downloads";
import { TemplateCover } from "./template-cover";
import styles from "./template-detail.module.css";

/**
 * One free sample, as the pop-up of the catalog shows it (`TemplateDialog`). Two zones from 40em:
 * the cover, large and lit, on its stack, on a desk of its own at the left, which stays in view
 * while the words scroll; and the words at the right: the "Free sample" tag, the title (an `h2`
 * with the id `titleId`, which names the dialog), the summary, the description, the facts (phase,
 * step, type, format and length) as a ledger, what is included, its files to download when the
 * server can serve them (`downloadable`), and the one button, which leads to the purchase page.
 * Below 40em the cover stands above the words.
 */
export function TemplateDetail({
  template,
  phase,
  titleId,
  downloadable = false,
}: {
  template: Template;
  phase?: Phase;
  titleId: string;
  /** The server has a file store and the template has files: its downloads are shown. */
  downloadable?: boolean;
}) {
  const step = phase?.steps.find((candidate) => candidate.slug === template.step);

  const facts = [
    ...(phase ? [{ label: "Phase", value: phase.name }] : []),
    ...(step ? [{ label: "Step", value: step.name }] : []),
    { label: "Type", value: DELIVERABLE_TYPE_LABELS[template.deliverableType] },
    { label: "Format", value: FORMAT_LABELS[template.format] },
    ...(template.pageCount
      ? [
          {
            label: "Length",
            value: formatLength(template.pageCount, template.format),
          },
        ]
      : []),
  ];

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        {/*
          The cover's box is the lit sheet's scope: it stands where the sheet rests, so a sheet that
          has lifted does not drop and lift again under a pointer at its lower edge.
        */}
        <div className={styles.cover} data-format={template.format} data-lit-scope="">
          <TemplateCover
            type={template.deliverableType}
            format={template.format}
            size="lg"
            lit
            title={template.title}
            summary={template.summary}
            phaseOrder={phase?.order}
          />
        </div>
      </div>

      <div className={styles.words}>
        <div className={styles.head}>
          <p className={styles.kind}>
            <Tag variant="saving">Free sample</Tag>
          </p>
          <h2 id={titleId} className={cx("type-page", styles.title)}>
            <KeepCompounds text={template.title} />
          </h2>
          <p className={cx("type-lead", styles.summary)}>{template.summary}</p>
        </div>

        <p className={cx("type-copy", styles.description)}>{template.description}</p>

        <FactList items={facts} />

        <section className={styles.section}>
          <h3 className="type-section">What’s included</h3>
          <BandedList>
            {template.includes.map((item) => (
              <BandedRow key={item} className={styles.included}>
                <span className={styles.tick} aria-hidden="true">
                  <Icon name="tick" size={20} />
                </span>
                <span className="type-copy">{item}</span>
              </BandedRow>
            ))}
          </BandedList>
        </section>

        {downloadable ? (
          <section className={styles.section} aria-labelledby={`${titleId}-download`}>
            <h3 id={`${titleId}-download`} className="type-section">
              Download
            </h3>
            <FileDownloads
              files={template.files}
              hrefFor={(file) => `/api/samples/${template.slug}/${file.id}`}
            />
          </section>
        ) : null}

        <div className={styles.action}>
          <Button variant="mark" size="lg" href={PURCHASE_LINK.href} arrow>
            Purchase the toolkit
          </Button>
        </div>
      </div>
    </div>
  );
}
