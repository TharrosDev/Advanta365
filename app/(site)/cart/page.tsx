import type { Metadata } from "next";
import { CartContents, type CartItem } from "@/components/cart/cart-contents";
import { PageTitle } from "@/components/layout/page-title";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { getBundles, getTemplates } from "@/lib/catalog/repository";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [templates, bundles] = await Promise.all([getTemplates(), getBundles()]);
  // The cart lives in the browser, so the page sends the titles and prices it may need.
  const items: CartItem[] = [
    ...templates.map((t) => ({
      kind: "template" as const,
      slug: t.slug,
      title: t.title,
      priceCents: t.priceCents,
      href: `/templates/${t.slug}`,
    })),
    ...bundles.map((b) => ({
      kind: "bundle" as const,
      slug: b.slug,
      title: b.title,
      priceCents: b.priceCents,
      href: `/bundles/${b.slug}`,
    })),
  ];

  return (
    <PageShell>
      <PageTitle title="Your cart" />
      <Container className={styles.block}>
        <CartContents items={items} />
      </Container>
    </PageShell>
  );
}
