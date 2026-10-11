import type { Metadata } from "next";
import { BundlePriceTable } from "@/components/company/bundle-price-table";
import { FaqList } from "@/components/company/faq-list";
import type { FaqItem } from "@/components/company/faq-list";
import { WaysToBuy } from "@/components/company/ways-to-buy";
import type { Way } from "@/components/company/ways-to-buy";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { RowLink } from "@/components/ui/row-link";
import { Split } from "@/components/ui/split";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles, getTemplates } from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Buy a single piece or a bundle for a whole phase or rollout: one licence, reused across every wave.",
};

// Provisional beta copy. The answers on adapting the content, AI tools, SharePoint and language state
// what the toolkit is today; the commercial ones (licence terms, updates, purchase orders) describe
// the intent and stay placeholders until the terms are set.
const FAQ: readonly FaqItem[] = [
  {
    question: "What file formats do I get?",
    answer:
      "Templates are editable Word, PowerPoint and Excel files, with a few print-ready PDFs. The format is shown on every template page.",
  },
  {
    question: "Can my whole organization use what I buy?",
    answer:
      "The intent is one licence per organization, reused across every wave of your rollout. Final licence terms will be published before launch.",
  },
  {
    question: "Can I change the content?",
    answer:
      "Yes. It is meant to be adapted: edit it by hand or feed it to your AI tools, add your branding and remove what does not apply. You keep the copies you adapt.",
  },
  {
    question: "Does it work with AI tools?",
    answer:
      "Yes. The content is built to be fed into AI tools: give them the material and let them tailor it to your organization, your tone and your timeline.",
  },
  {
    question: "Is it only for SharePoint?",
    answer:
      "It is SharePoint-first out of the box. The change management core (structured planning, resistance management, sponsor coaching, Go/No-Go decisions and sustainment) applies to almost any technology rollout.",
  },
  {
    question: "Are the job aids available in French?",
    answer: "No. Today the job aids are English only.",
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

const PRICES_TITLE = "Bundle prices";

/** "$19 – $79": the cheapest and the dearest of a list of prices, computed from the data. */
function priceRange(cents: readonly number[]): string {
  if (cents.length === 0) return "—";
  const low = Math.min(...cents);
  const high = Math.max(...cents);
  return low === high ? formatPrice(low) : `${formatPrice(low)} – ${formatPrice(high)}`;
}

/**
 * `/pricing`: the two ways to buy, the bundle prices as a ledger, the questions people ask, and a
 * link to talk about purchasing.
 *
 * Layout: the title block with ink; a desk band where the singles lie on a stack of paper and the
 * bundles in a folder; the bundle prices on paper; the questions on the desk as a ledger of 84px
 * rows; and a closing paper band with the link to the contact page.
 */
export default async function PricingPage() {
  const [templates, bundles] = await Promise.all([getTemplates(), getBundles()]);
  const bundleRows = await Promise.all(
    bundles.map(async (bundle) => {
      const contents = await getBundleTemplates(bundle);
      return {
        slug: bundle.slug,
        title: bundle.title,
        count: contents.length,
        priceCents: bundle.priceCents,
        savingsCents: bundleSavingsCents(bundle, contents),
      };
    }),
  );

  const singles: Way = {
    title: "Single templates",
    range: priceRange(templates.map((template) => template.priceCents)),
    body: "Priced by depth: a one-page handout costs less than a full strategy document or a training deck.",
    href: "/catalog",
    action: "Browse the catalog",
  };
  const sets: Way = {
    title: "Bundles",
    range: priceRange(bundles.map((bundle) => bundle.priceCents)),
    body: "Curated sets for a phase or a full rollout, priced well below the same pieces bought one at a time.",
    href: "/bundles",
    action: "See bundles",
  };

  return (
    <>
      <TitleBlock
        form="index"
        ink
        title="Pricing"
        lead="Buy the one piece you need today, or take a bundle that covers a whole phase. Every purchase is a one-time payment for files you can edit by hand or with AI, reused across every wave of your rollout."
      />

      <Band surface="desk" pad="roomy">
        <WaysToBuy
          label="Two ways to buy"
          singles={singles}
          sets={sets}
          setsTab={`${bundles.length} bundles`}
        />
      </Band>

      <Band surface="paper">
        <Split margin={<h2 className="type-section">{PRICES_TITLE}</h2>}>
          <BundlePriceTable caption={PRICES_TITLE} rows={bundleRows} />
        </Split>
      </Band>

      <Band surface="desk">
        <Split
          margin={
            <>
              <h2 className="type-section">Questions</h2>
              <p className={cx("type-note", styles.beta)}>
                Beta note: these answers are provisional and will be confirmed before launch.
              </p>
            </>
          }
        >
          <FaqList items={FAQ} />
        </Split>
      </Band>

      <Band surface="paper" pad="tight">
        <Split>
          <BandedList>
            <BandedRow>
              <RowLink href="/contact" label="Contact us about purchasing" />
            </BandedRow>
          </BandedList>
        </Split>
      </Band>
    </>
  );
}
