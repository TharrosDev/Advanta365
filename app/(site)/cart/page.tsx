import type { Metadata } from "next";
import { CartContents, type CartItem } from "@/components/cart/cart-contents";
import { Container } from "@/components/layout/container";
import { getBundles, getTemplates } from "@/lib/catalog/repository";

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
    <Container className="py-10 sm:py-14">
      <h1 className="text-4xl font-semibold">Your cart</h1>
      <CartContents items={items} />
    </Container>
  );
}
