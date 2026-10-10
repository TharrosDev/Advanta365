import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles, getTemplates } from "@/lib/catalog/repository";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Buy a single template or a bundle for a whole phase or rollout.",
};

// Provisional beta copy: answers are placeholders until the commercial terms are set.
const FAQ = [
  {
    question: "What file formats do I get?",
    answer:
      "Templates are editable Word, PowerPoint and Excel files, with a few print-ready PDFs. The format is shown on every template page.",
  },
  {
    question: "Can my whole organization use what I buy?",
    answer:
      "The intent is one purchase per organization, for internal use on your own projects. Final licence terms will be published before launch.",
  },
  {
    question: "Can I change the templates?",
    answer:
      "Yes. They are meant to be tailored: add your branding, change the wording and remove what does not apply.",
  },
  {
    question: "Do I get updates?",
    answer:
      "The plan is for buyers to receive updated versions of what they bought. Details will be confirmed before launch.",
  },
  {
    question: "Can public-sector organizations buy by purchase order?",
    answer:
      "Purchase orders and invoicing for government buyers are planned. Contact us and we will tell you what is available.",
  },
];

export default async function PricingPage() {
  const [templates, bundles] = await Promise.all([getTemplates(), getBundles()]);
  const prices = templates.map((t) => t.priceCents);
  const bundleRows = await Promise.all(
    bundles.map(async (bundle) => {
      const contents = await getBundleTemplates(bundle);
      return { bundle, count: contents.length, savings: bundleSavingsCents(bundle, contents) };
    }),
  );

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-4xl font-semibold">Pricing</h1>
      <p className="text-muted mt-3 max-w-2xl">
        Buy the one template you need today, or take a bundle that covers a whole phase. Every
        purchase is a one-time payment for files you can edit.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card as="section">
          <h2 className="text-2xl font-semibold">Single templates</h2>
          <p className="font-display mt-4 text-4xl font-semibold tabular-nums">
            {formatPrice(Math.min(...prices))} – {formatPrice(Math.max(...prices))}
          </p>
          <p className="text-muted mt-3">
            Priced by depth: a one-page handout costs less than a full strategy document or a
            training deck.
          </p>
          <div className="mt-6">
            <Button href="/catalog">Browse the catalog</Button>
          </div>
        </Card>
        <Card as="section">
          <h2 className="text-2xl font-semibold">Bundles</h2>
          <p className="font-display mt-4 text-4xl font-semibold tabular-nums">
            {formatPrice(Math.min(...bundles.map((b) => b.priceCents)))} –{" "}
            {formatPrice(Math.max(...bundles.map((b) => b.priceCents)))}
          </p>
          <p className="text-muted mt-3">
            Curated sets for a phase or a full rollout, priced well below the same templates bought
            one at a time.
          </p>
          <div className="mt-6">
            <Button href="/bundles" variant="secondary">
              See bundles
            </Button>
          </div>
        </Card>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Bundle prices</h2>
        <div className="border-rule bg-surface mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-rule text-muted border-b">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Bundle
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Templates
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Price
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  You save
                </th>
              </tr>
            </thead>
            <tbody className="divide-rule divide-y">
              {bundleRows.map(({ bundle, count, savings }) => (
                <tr key={bundle.slug}>
                  <th scope="row" className="px-5 py-3 font-medium">
                    <Link
                      href={`/bundles/${bundle.slug}`}
                      className="text-accent underline underline-offset-4"
                    >
                      {bundle.title}
                    </Link>
                  </th>
                  <td className="px-5 py-3 text-right tabular-nums">{count}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatPrice(bundle.priceCents)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatPrice(savings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl font-semibold">Questions</h2>
        <p className="text-muted mt-2 text-sm">
          Beta note: these answers are provisional and will be confirmed before launch.
        </p>
        <dl className="divide-rule border-rule mt-6 divide-y border-y">
          {FAQ.map((item) => (
            <div key={item.question} className="py-5">
              <dt className="font-semibold">{item.question}</dt>
              <dd className="text-muted mt-2">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Container>
  );
}
