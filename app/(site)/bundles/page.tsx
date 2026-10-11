import type { Metadata } from "next";
import { BundleCard } from "@/components/catalog/bundle-card";
import { PageTitle } from "@/components/layout/page-title";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles } from "@/lib/catalog/repository";
import styles from "./page.module.css";

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
    <PageShell>
      <PageTitle
        title="Bundles"
        lead="Curated sets for a whole phase or a whole rollout. Each bundle costs less than its templates bought one at a time."
      />
      <Container className={styles.block}>
        <RevealGroup as="ul" className={styles.grid}>
          {cards.map(({ bundle, count, savings }, index) => (
            <Reveal key={bundle.slug} as="li" effect="fade-up" index={index % 2}>
              <BundleCard
                bundle={bundle}
                templateCount={count}
                savingsCents={savings}
                headingLevel="h2"
              />
            </Reveal>
          ))}
        </RevealGroup>
      </Container>
    </PageShell>
  );
}
