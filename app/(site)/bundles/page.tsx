import type { Metadata } from "next";
import { BundleCard } from "@/components/catalog/bundle-card";
import { Container } from "@/components/layout/container";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Bundles",
  description: "Curated sets of templates for a whole phase or a whole rollout.",
};

export default async function BundlesPage() {
  const bundles = await getBundles();
  const cards = await Promise.all(
    [...bundles]
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .map(async (bundle) => {
        const contents = await getBundleTemplates(bundle);
        return { bundle, count: contents.length, savings: bundleSavingsCents(bundle, contents) };
      }),
  );

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-4xl font-semibold">Bundles</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Curated sets for a whole phase or a whole rollout. Each bundle costs less than its templates
        bought one at a time.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ bundle, count, savings }) => (
          <li key={bundle.slug}>
            <BundleCard bundle={bundle} templateCount={count} savingsCents={savings} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
