import type { Metadata } from "next";
import { CartContents, type CartItem } from "@/components/cart/cart-contents";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Split } from "@/components/ui/split";
import { getBundles, getTemplates } from "@/lib/catalog/repository";

export const metadata: Metadata = { title: "Cart" };

/**
 * The cart. The title block opens the page; the contents fill the content columns of a paper band
 * under it, with the margin left empty: the lines as a ledger, the summary as a receipt.
 */
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
    <>
      <TitleBlock title="Your cart" />
      <Band as="div" surface="paper" pad="tight">
        <Split>
          <CartContents items={items} />
        </Split>
      </Band>
    </>
  );
}
