import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { TemplateCard } from "@/components/catalog/template-card";
import { TemplateCover } from "@/components/catalog/template-cover";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TitleBlock } from "@/components/layout/title-block";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { FactList } from "@/components/ui/fact-list";
import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { RowLink } from "@/components/ui/row-link";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
import { TextLink } from "@/components/ui/text-link";
import {
  APP_LABELS,
  AUDIENCE_LABELS,
  DELIVERABLE_TYPE_LABELS,
  FORMAT_LABELS,
} from "@/content/taxonomy";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import {
  getBundleTemplates,
  getBundlesContaining,
  getPhase,
  getPhases,
  getRelatedTemplates,
  getTemplate,
  getTemplates,
} from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./page.module.css";

type TemplatePageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getTemplates()).map((template) => ({ slug: template.slug }));
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  const template = await getTemplate((await params).slug);
  return template ? { title: template.title, description: template.summary } : {};
}

/**
 * One template, on the light table. Under the title block the page has three zones from 68em: the
 * cover, large and lit, on its stack in columns 1 to 4; the details in columns 5 to 9 (the facts
 * and what is included as ledgers); and the purchase panel, a sheet, in columns 10 to 12. The cover
 * and the panel stay in view. The panel comes before the details in the document, so below 68em
 * the order is cover, panel, details (the cover and the panel side by side from 40em). A last band,
 * on paper, lists the bundles that hold the template as ledger rows and shows three related
 * templates as sheets, each under a heading in the margin.
 *
 * The cover shares its place with the same template's row on the page before, so on a page change
 * the sheet travels; it is the only cover on the page that carries its name.
 */
export default async function TemplatePage({ params }: TemplatePageProps) {
  const template = await getTemplate((await params).slug);
  if (!template) notFound();

  const [phase, phases, related, bundles] = await Promise.all([
    getPhase(template.phase),
    getPhases(),
    getRelatedTemplates(template.slug, 3),
    getBundlesContaining(template.slug),
  ]);
  const step = phase?.steps.find((s) => s.slug === template.step);
  const phaseNumber = phase ? phases.findIndex((p) => p.slug === phase.slug) + 1 : 0;
  const bundleRows = await Promise.all(
    bundles.map(async (bundle) => {
      const contents = await getBundleTemplates(bundle);
      return { bundle, count: contents.length, savings: bundleSavingsCents(bundle, contents) };
    }),
  );

  const facts = [
    ...(phase
      ? [
          {
            label: "Phase",
            value: (
              <TextLink href={`/phases/${phase.slug}`} className={styles.reach}>
                {phase.name}
              </TextLink>
            ),
          },
        ]
      : []),
    ...(phase && step
      ? [
          {
            label: "Step",
            value: (
              <TextLink href={`/phases/${phase.slug}#${step.slug}`} className={styles.reach}>
                {step.name}
              </TextLink>
            ),
          },
        ]
      : []),
    { label: "Type", value: DELIVERABLE_TYPE_LABELS[template.deliverableType] },
    { label: "Format", value: FORMAT_LABELS[template.format] },
    ...(template.pageCount
      ? [
          {
            label: "Length",
            value: `${template.pageCount} ${template.pageCount === 1 ? "page" : "pages"}`,
          },
        ]
      : []),
    { label: "Works with", value: template.apps.map((app) => APP_LABELS[app]).join(", ") },
    { label: "Written for", value: template.audiences.map((a) => AUDIENCE_LABELS[a]).join(", ") },
  ];

  return (
    <>
      <TitleBlock
        form="document"
        title={template.title}
        lead={template.summary}
        crumbs={
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              ...(phase ? [{ href: `/phases/${phase.slug}`, label: phase.name }] : []),
              { label: template.title },
            ]}
          />
        }
      />

      <Band as="div" surface="desk" innerClassName={styles.zones}>
        <div className={styles.cover}>
          <TemplateCover
            type={template.deliverableType}
            format={template.format}
            size="lg"
            lit
            slug={template.slug}
            title={template.title}
            summary={template.summary}
            phaseOrder={phase ? phaseNumber : undefined}
          />
        </div>

        <PurchasePanel
          priceCents={template.priceCents}
          note="One-time purchase, editable file"
          className={styles.panel}
        >
          <AddToCart
            line={{ kind: "template", slug: template.slug }}
            bundles={bundles.map(({ slug, title }) => ({ slug, title }))}
          />
        </PurchasePanel>

        <div className={styles.details}>
          <p className={cx("type-copy", styles.description)}>{template.description}</p>

          <FactList items={facts} />

          <section className={styles.section}>
            <h2 className="type-section">What’s included</h2>
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

          {phase && step && (
            <section className={styles.section}>
              <h2 className="type-section">Where it fits</h2>
              <Tally
                total={phases.length}
                filled={phaseNumber - 1}
                marked={phaseNumber}
                size="sm"
                className={styles.tally}
              />
              <p className={cx("type-copy", styles.fits)}>
                Use this in the{" "}
                <TextLink href={`/phases/${phase.slug}#${step.slug}`}>
                  {phase.name} phase, at the “{step.name}” step
                </TextLink>
                . {step.summary}
              </p>
            </section>
          )}
        </div>
      </Band>

      {bundleRows.length > 0 || related.length > 0 ? (
        <Band as="div" surface="paper" innerClassName={styles.more}>
          {bundleRows.length > 0 && (
            <Split margin={<h2 className="type-section">Included in these bundles</h2>}>
              <BandedList>
                {bundleRows.map(({ bundle, count, savings }) => (
                  <BandedRow key={bundle.slug}>
                    <RowLink
                      href={`/bundles/${bundle.slug}`}
                      label={<KeepCompounds text={bundle.title} />}
                      caption={`${count} templates${savings > 0 ? ` · Save ${formatPrice(savings)}` : ""}`}
                      trailing={formatPrice(bundle.priceCents)}
                    />
                  </BandedRow>
                ))}
              </BandedList>
            </Split>
          )}

          {related.length > 0 && (
            <Split margin={<h2 className="type-section">Related templates</h2>}>
              <ul className={styles.cards}>
                {related.map((item, position) => (
                  <li key={item.slug}>
                    <TemplateCard
                      template={item}
                      phaseName={phase?.name}
                      phaseOrder={phase ? phaseNumber : undefined}
                      layout="sheet"
                      index={position + 1}
                    />
                  </li>
                ))}
              </ul>
            </Split>
          )}
        </Band>
      ) : null}
    </>
  );
}
