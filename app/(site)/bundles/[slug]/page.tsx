import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { CoverageTally } from "@/components/catalog/coverage-tally";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TitleBlock } from "@/components/layout/title-block";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Folder } from "@/components/ui/folder";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { RowLink } from "@/components/ui/row-link";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { bundleSavingsCents, bundleValueCents } from "@/lib/catalog/pricing";
import { getBundle, getBundleTemplates, getBundles, getPhases } from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./page.module.css";

type BundlePageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getBundles()).map((bundle) => ({ slug: bundle.slug }));
}

export async function generateMetadata({ params }: BundlePageProps): Promise<Metadata> {
  const bundle = await getBundle((await params).slug);
  return bundle ? { title: bundle.title, description: bundle.summary } : {};
}

/**
 * One bundle. The title block carries the trail and the phases the bundle reaches, in words over a
 * seven-block tally. Under it, on paper, the page has three zones from 68em: the bundle as a large folder in
 * columns 1 to 3, the details in columns 4 to 9 (description, the four figures as a ledger row, then
 * the templates grouped by phase as ledger rows) and the purchase panel in columns 10 to 12. The
 * document order is panel, folder, details; the folder and the panel stay in view.
 *
 * The folder shares its place with the same bundle's card on the page before, so on a page change
 * it travels; it is the only folder on the page that carries its name.
 */
export default async function BundlePage({ params }: BundlePageProps) {
  const bundle = await getBundle((await params).slug);
  if (!bundle) notFound();

  const [templates, phases] = await Promise.all([getBundleTemplates(bundle), getPhases()]);
  const value = bundleValueCents(templates);
  const savings = bundleSavingsCents(bundle, templates);
  const coverage = phaseCoverage(phases, templates);
  const groups = phases
    .map((phase, index) => ({
      phase,
      number: index + 1,
      templates: templates.filter((t) => t.phase === phase.slug),
    }))
    .filter((group) => group.templates.length > 0);

  const figures = [
    { label: "Templates", value: String(templates.length) },
    { label: "Total value", value: formatPrice(value) },
    { label: "Bundle price", value: formatPrice(bundle.priceCents) },
    ...(savings > 0 ? [{ label: "You save", value: formatPrice(savings), marked: true }] : []),
  ];

  return (
    <>
      <TitleBlock
        form="document"
        title={bundle.title}
        lead={bundle.summary}
        crumbs={
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/bundles", label: "Bundles" },
              { label: bundle.title },
            ]}
          />
        }
        meta={<CoverageTally coverage={coverage} className={styles.coverage} />}
      />

      <Band as="div" surface="paper" innerClassName={styles.zones}>
        <PurchasePanel
          priceCents={bundle.priceCents}
          note="One-time purchase, editable files"
          className={styles.panel}
        >
          <AddToCart line={{ kind: "bundle", slug: bundle.slug }} label="Add bundle to cart" />
        </PurchasePanel>

        <div className={styles.shelf}>
          <Folder
            tab={`${templates.length} ${templates.length === 1 ? "template" : "templates"}`}
            slug={bundle.slug}
            className={styles.folder}
            frontClassName={styles.front}
          />
        </div>

        <div className={styles.details}>
          <p className={cx("type-copy", styles.description)}>{bundle.description}</p>

          <BandedList as="div">
            <BandedRow as="div">
              <dl className={styles.figures}>
                {figures.map((figure) => (
                  <div key={figure.label} className={styles.figure}>
                    <dt className={cx("type-eyebrow", styles.figureLabel)}>{figure.label}</dt>
                    <dd className={cx("tabular", styles.figureValue)}>
                      {figure.marked ? (
                        <span className={styles.marked}>{figure.value}</span>
                      ) : (
                        figure.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </BandedRow>
          </BandedList>

          {groups.map(({ phase, number, templates: inPhase }) => (
            <section key={phase.slug} className={styles.group}>
              <div className={styles.groupHead}>
                <span className={styles.tile} aria-hidden="true">
                  {number}
                </span>
                <h2 className="type-section">
                  {`${phase.name}, ${inPhase.length} ${inPhase.length === 1 ? "template" : "templates"}`}
                </h2>
              </div>
              <BandedList>
                {inPhase.map((template) => (
                  <BandedRow key={template.slug}>
                    <RowLink
                      href={`/templates/${template.slug}`}
                      label={<KeepCompounds text={template.title} />}
                      caption={`${DELIVERABLE_TYPE_LABELS[template.deliverableType]} · ${FORMAT_LABELS[template.format]}`}
                      trailing={formatPrice(template.priceCents)}
                    />
                  </BandedRow>
                ))}
              </BandedList>
            </section>
          ))}
        </div>
      </Band>
    </>
  );
}
