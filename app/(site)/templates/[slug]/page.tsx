import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { BundleCard } from "@/components/catalog/bundle-card";
import { TemplateCard } from "@/components/catalog/template-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
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
import { formatPrice } from "@/lib/format";

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
  const bundleCards = await Promise.all(
    bundles.map(async (bundle) => {
      const contents = await getBundleTemplates(bundle);
      return { bundle, count: contents.length, savings: bundleSavingsCents(bundle, contents) };
    }),
  );

  const facts = [
    { label: "Format", value: FORMAT_LABELS[template.format] },
    ...(template.pageCount
      ? [{ label: "Length", value: `${template.pageCount} ${template.pageCount === 1 ? "page" : "pages"}` }]
      : []),
    { label: "Works with", value: template.apps.map((app) => APP_LABELS[app]).join(", ") },
    { label: "Written for", value: template.audiences.map((a) => AUDIENCE_LABELS[a]).join(", ") },
  ];

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          ...(phase ? [{ href: `/phases/${phase.slug}`, label: phase.name }] : []),
          { label: template.title },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {phase && <Badge tone="accent">{phase.name}</Badge>}
            <Badge>{DELIVERABLE_TYPE_LABELS[template.deliverableType]}</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-semibold break-words sm:text-5xl">{template.title}</h1>
          <p className="mt-4 text-xl text-muted">{template.summary}</p>
          <p className="mt-6 max-w-2xl">{template.description}</p>

          <h2 className="mt-10 text-2xl font-semibold">What’s included</h2>
          <ul className="mt-4 max-w-2xl divide-y divide-rule border-y border-rule">
            {template.includes.map((item) => (
              <li key={item} className="py-3">
                {item}
              </li>
            ))}
          </ul>

          {phase && step && (
            <>
              <h2 className="mt-10 text-2xl font-semibold">Where it fits</h2>
              <p className="mt-3 max-w-2xl">
                Use this in the{" "}
                <Link
                  href={`/phases/${phase.slug}#${step.slug}`}
                  className="font-medium text-accent underline underline-offset-4"
                >
                  {phase.name} phase, at the “{step.name}” step
                </Link>
                . {step.summary}
              </p>
            </>
          )}
        </div>

        <aside aria-label="Purchase" className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-rule bg-surface p-6">
            <p className="font-display text-4xl font-semibold tabular-nums">
              {formatPrice(template.priceCents)}
            </p>
            <p className="mt-1 text-sm text-muted">One-time purchase, editable file</p>
            <div className="mt-5">
              <AddToCart line={{ kind: "template", slug: template.slug }} />
            </div>
            <dl className="mt-6 space-y-3 border-t border-rule pt-5 text-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted">{fact.label}</dt>
                  <dd className="text-right">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {bundleCards.length > 0 && (
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-2xl font-semibold">Included in these bundles</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bundleCards.map(({ bundle, count, savings }) => (
              <li key={bundle.slug}>
                <BundleCard bundle={bundle} templateCount={count} savingsCents={savings} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-2xl font-semibold">Related templates</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <TemplateCard template={item} phaseName={phase?.name} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
