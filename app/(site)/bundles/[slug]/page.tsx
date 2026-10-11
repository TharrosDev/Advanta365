import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TitleBlock } from "@/components/layout/title-block";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { FigureStrip } from "@/components/ui/figure-strip";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { RowLink } from "@/components/ui/row-link";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
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
 * One bundle. The title block carries the trail and a seven-block tally of the phases the bundle
 * reaches. Under it the page has the zones of a template page with an empty margin: the details in
 * the middle (description, the four figures, then the templates grouped by phase as rows) and the
 * purchase panel at the right, which comes first in the document.
 */
export default async function BundlePage({ params }: BundlePageProps) {
  const bundle = await getBundle((await params).slug);
  if (!bundle) notFound();

  const [templates, phases] = await Promise.all([getBundleTemplates(bundle), getPhases()]);
  const value = bundleValueCents(templates);
  const savings = bundleSavingsCents(bundle, templates);
  const coverage = phaseCoverage(phases, templates);
  const covered = coverage.filter((phase) => phase.covered);
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
        meta={
          <Tally
            total={coverage.length}
            filled={covered.map((phase) => phase.order)}
            size="md"
            numerals
            label={`Phases: ${covered.map((phase) => phase.name).join(", ")}`}
            className={styles.coverage}
          />
        }
      />

      <Band as="div" surface="paper" pad="tight">
        <Split contentClassName={styles.zones}>
          <PurchasePanel
            priceCents={bundle.priceCents}
            note="One-time purchase, editable files"
            className={styles.panel}
          >
            <AddToCart line={{ kind: "bundle", slug: bundle.slug }} label="Add bundle to cart" />
          </PurchasePanel>

          <div className={styles.details}>
            <p className={cx("type-copy", styles.description)}>{bundle.description}</p>

            <FigureStrip items={figures} />

            {groups.map(({ phase, number, templates: inPhase }) => (
              <section key={phase.slug} className={styles.group}>
                <div className={styles.groupHead}>
                  <span className={styles.tile} aria-hidden="true">
                    {number}
                  </span>
                  <h2 className="type-section">{`${phase.name} · ${inPhase.length}`}</h2>
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
        </Split>
      </Band>
    </>
  );
}
