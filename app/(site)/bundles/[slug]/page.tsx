import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { TemplateCard } from "@/components/catalog/template-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { bundleSavingsCents, bundleValueCents } from "@/lib/catalog/pricing";
import { getBundle, getBundleTemplates, getBundles, getPhases } from "@/lib/catalog/repository";
import { formatPrice } from "@/lib/format";

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

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        items={[{ href: "/", label: "Home" }, { href: "/bundles", label: "Bundles" }, { label: bundle.title }]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">Bundle</Badge>
            <Badge>{templates.length} templates</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-semibold break-words sm:text-5xl">{bundle.title}</h1>
          <p className="mt-4 text-xl text-muted">{bundle.summary}</p>
          <p className="mt-6 max-w-2xl">{bundle.description}</p>
        </div>

        <aside aria-label="Purchase" className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-rule bg-surface p-6">
            <p className="font-display text-4xl font-semibold tabular-nums">
              {formatPrice(bundle.priceCents)}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Total value</dt>
                <dd className="tabular-nums">{formatPrice(value)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Bundle price</dt>
                <dd className="tabular-nums">{formatPrice(bundle.priceCents)}</dd>
              </div>
              {savings > 0 && (
                <div className="flex justify-between gap-4 border-t border-rule pt-2 font-semibold text-accent">
                  <dt>You save</dt>
                  <dd className="tabular-nums">{formatPrice(savings)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5">
              <AddToCart line={{ kind: "bundle", slug: bundle.slug }} label="Add bundle to cart" />
            </div>
          </div>
        </aside>
      </div>

      {groups.map(({ phase, templates: inPhase }) => (
        <section key={phase.slug} className="mt-14 border-t border-rule pt-10">
          <h2 className="text-2xl font-semibold">
            {phase.name} <span className="text-muted">· {inPhase.length}</span>
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inPhase.map((template) => (
              <li key={template.slug}>
                <TemplateCard template={template} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Container>
  );
}
