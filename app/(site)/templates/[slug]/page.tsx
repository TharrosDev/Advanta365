import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { TemplateCard } from "@/components/catalog/template-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageTitle } from "@/components/layout/page-title";
import { TransitionLink } from "@/components/motion/transition-link";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ActionRow } from "@/components/ui/action-row";
import { Container } from "@/components/ui/container";
import { FactList } from "@/components/ui/fact-list";
import { PageShell } from "@/components/ui/page-shell";
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

export default async function TemplatePage({ params }: TemplatePageProps) {
  const template = await getTemplate((await params).slug);
  if (!template) notFound();

  const [phase, related, bundles] = await Promise.all([
    getPhase(template.phase),
    getRelatedTemplates(template.slug, 3),
    getBundlesContaining(template.slug),
  ]);
  const step = phase?.steps.find((s) => s.slug === template.step);
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
              <TransitionLink href={`/phases/${phase.slug}`} className={styles.link}>
                {phase.name}
              </TransitionLink>
            ),
          },
        ]
      : []),
    ...(phase && step
      ? [
          {
            label: "Step",
            value: (
              <TransitionLink href={`/phases/${phase.slug}#${step.slug}`} className={styles.link}>
                {step.name}
              </TransitionLink>
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
    <PageShell>
      <PageTitle
        title={template.title}
        lead={template.summary}
        eyebrow={
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              ...(phase ? [{ href: `/phases/${phase.slug}`, label: phase.name }] : []),
              { label: template.title },
            ]}
          />
        }
      />

      <Container className={styles.layout}>
        <PurchasePanel
          priceCents={template.priceCents}
          note="One-time purchase, editable file"
          className={styles.panel}
        >
          <AddToCart line={{ kind: "template", slug: template.slug }} />
        </PurchasePanel>

        <div className={styles.details}>
          <p className={cx("t-body-large", "c-fg-80", styles.description)}>
            {template.description}
          </p>

          <FactList items={facts} />

          <section className={styles.section}>
            <h2 className="t-headline-large">What’s included</h2>
            <ul className={styles.includes}>
              {template.includes.map((item) => (
                <li key={item} className="ruled t-body-large">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {phase && step && (
            <section className={styles.section}>
              <h2 className="t-headline-large">Where it fits</h2>
              <p className={cx("t-body-large", "c-fg-60", styles.fits)}>
                Use this in the{" "}
                <TransitionLink href={`/phases/${phase.slug}#${step.slug}`} className={styles.link}>
                  {phase.name} phase, at the “{step.name}” step
                </TransitionLink>
                . {step.summary}
              </p>
            </section>
          )}
        </div>
      </Container>

      {bundleRows.length > 0 && (
        <Container as="section" className={styles.block}>
          <h2 className="t-headline-large">Included in these bundles</h2>
          <ul className={styles.rows}>
            {bundleRows.map(({ bundle, count, savings }, index) => (
              <li key={bundle.slug}>
                <ActionRow
                  fill
                  arrow="right"
                  href={`/bundles/${bundle.slug}`}
                  label={bundle.title}
                  caption={`${count} templates${savings > 0 ? ` · Save ${formatPrice(savings)}` : ""}`}
                  trailing={formatPrice(bundle.priceCents)}
                  rule={index === bundleRows.length - 1 ? "both" : "top"}
                />
              </li>
            ))}
          </ul>
        </Container>
      )}

      {related.length > 0 && (
        <Container as="section" className={styles.block}>
          <h2 className="t-headline-large">Related templates</h2>
          <ul className={styles.cardGrid}>
            {related.map((item) => (
              <li key={item.slug}>
                <TemplateCard template={item} phaseName={phase?.name} />
              </li>
            ))}
          </ul>
        </Container>
      )}
    </PageShell>
  );
}
