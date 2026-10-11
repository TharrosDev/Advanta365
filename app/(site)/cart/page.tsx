import type { Metadata } from "next";
import { CartContents, type CartItem } from "@/components/cart/cart-contents";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Split } from "@/components/ui/split";
import { getBundles, getTemplates } from "@/lib/catalog/repository";

export const metadata: Metadata = { title: "Cart" };

/**
 * The cart. The title stands in the content columns, at the head of what it names, and the contents
 * fill the same columns of a paper band 42px under it, with the margin left empty: the lines as a
 * ledger, the summary as a receipt.
 */
export default async function CartPage() {
  const [templates, bundles] = await Promise.all([getTemplates(), getBundles()]);
  // The cart lives in the browser, so the page sends the titles and prices it may need, and what
  // each bundle holds so a template already in a bundle in the cart is not charged twice.
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
      templateSlugs: b.templateSlugs,
    })),
  ];

  return (
    <>
      <TitleBlock form="document" flush title="Your cart" />
      <Band as="div" surface="paper" pad="tight">
        <Split>
          <CartContents items={items} />
        </Split>
      </Band>
    </>
  );
}
