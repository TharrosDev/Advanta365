import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageTitle } from "@/components/layout/page-title";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ActionRow } from "@/components/ui/action-row";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
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

export default async function BundlePage({ params }: BundlePageProps) {
  const bundle = await getBundle((await params).slug);
  if (!bundle) notFound();

  const [templates, phases] = await Promise.all([getBundleTemplates(bundle), getPhases()]);
  const value = bundleValueCents(templates);
  const savings = bundleSavingsCents(bundle, templates);
  const groups = phases
    .map((phase) => ({ phase, templates: templates.filter((t) => t.phase === phase.slug) }))
    .filter((group) => group.templates.length > 0);

  const stats = [
    { label: "Templates", value: String(templates.length) },
    { label: "Total value", value: formatPrice(value) },
    { label: "Bundle price", value: formatPrice(bundle.priceCents) },
    ...(savings > 0 ? [{ label: "You save", value: formatPrice(savings) }] : []),
  ];

  return (
    <PageShell>
      <PageTitle
        title={bundle.title}
        lead={bundle.summary}
        eyebrow={
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/bundles", label: "Bundles" },
              { label: bundle.title },
            ]}
          />
        }
      />

      <Container className={styles.layout}>
        <PurchasePanel
          priceCents={bundle.priceCents}
          note="One-time purchase, editable files"
          className={styles.panel}
        >
          <AddToCart line={{ kind: "bundle", slug: bundle.slug }} label="Add bundle to cart" />
        </PurchasePanel>

        <div className={styles.details}>
          <p className={cx("t-body-large", "c-fg-80", styles.description)}>{bundle.description}</p>

          <StatGrid items={stats} />

          {groups.map(({ phase, templates: inPhase }) => (
            <section key={phase.slug} className={styles.section}>
              <h2 className="t-headline-large">{`${phase.name} · ${inPhase.length}`}</h2>
              <ul className={styles.rows}>
                {inPhase.map((template, index) => (
                  <li key={template.slug}>
                    <ActionRow
                      fill
                      arrow="right"
                      href={`/templates/${template.slug}`}
                      label={template.title}
                      caption={`${DELIVERABLE_TYPE_LABELS[template.deliverableType]} · ${FORMAT_LABELS[template.format]}`}
                      trailing={formatPrice(template.priceCents)}
                      rule={index === inPhase.length - 1 ? "both" : "top"}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
