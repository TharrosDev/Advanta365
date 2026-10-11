import type { Metadata } from "next";
import { FaqList } from "@/components/company/faq-list";
import type { FaqItem } from "@/components/company/faq-list";
import { PageTitle } from "@/components/layout/page-title";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { TransitionLink } from "@/components/motion/transition-link";
import { ActionRow } from "@/components/ui/action-row";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles, getTemplates } from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Buy a single template or a bundle for a whole phase or rollout.",
};

// Provisional beta copy: answers are placeholders until the commercial terms are set.
const FAQ: readonly FaqItem[] = [
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

const PRICES_TITLE = "Bundle prices";

/** "$19 – $79": the cheapest and the dearest of a list of prices, computed from the data. */
function priceRange(cents: readonly number[]): string {
  if (cents.length === 0) return "—";
  const low = Math.min(...cents);
  const high = Math.max(...cents);
  return low === high ? formatPrice(low) : `${formatPrice(low)} – ${formatPrice(high)}`;
}

export default async function PricingPage() {
  const [templates, bundles] = await Promise.all([getTemplates(), getBundles()]);
  const bundleRows = await Promise.all(
    bundles.map(async (bundle) => {
      const contents = await getBundleTemplates(bundle);
      return { bundle, count: contents.length, savings: bundleSavingsCents(bundle, contents) };
    }),
  );

  const ways = [
    {
      number: "01",
      title: "Single templates",
      range: priceRange(templates.map((template) => template.priceCents)),
      body: "Priced by depth: a one-page handout costs less than a full strategy document or a training deck.",
      href: "/catalog",
      action: "Browse the catalog",
    },
    {
      number: "02",
      title: "Bundles",
      range: priceRange(bundles.map((bundle) => bundle.priceCents)),
      body: "Curated sets for a phase or a full rollout, priced well below the same templates bought one at a time.",
      href: "/bundles",
      action: "See bundles",
    },
  ];

  // The table fades up on the first coarse step after the title words (the label is index 0, the
  // words start at 1).
  const tableIndex = coarseIndexAfter(1 + countWords(PRICES_TITLE));

  return (
    <PageShell>
      <PageTitle
        title="Pricing"
        lead="Buy the one template you need today, or take a bundle that covers a whole phase. Every purchase is a one-time payment for files you can edit."
      />

      <SectionShell innerClassName={styles.ways}>
        <RevealGroup>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>Two ways to buy</SectionLabel>
          </Reveal>
        </RevealGroup>
        <RevealGroup as="ul" className={styles.waysGrid}>
          {ways.map((way, index) => (
            <Reveal
              key={way.number}
              as="li"
              effect="fade-up"
              index={index}
              className={cx("ruled", styles.way)}
            >
              <span className="t-label-medium">{way.number}</span>
              <h2 className="t-headline-large">{way.title}</h2>
              <p className="t-display-medium tabular">{way.range}</p>
              <p className={cx("t-body-large", "c-fg-60", styles.wayBody)}>{way.body}</p>
              <WipeButton href={way.href}>{way.action}</WipeButton>
            </Reveal>
          ))}
        </RevealGroup>
      </SectionShell>

      <SectionShell>
        <RevealGroup className={styles.pricesGroup}>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>{PRICES_TITLE}</SectionLabel>
          </Reveal>
          <div className={styles.pricesBody}>
            <SectionIntro title={PRICES_TITLE} wordOffset={1} />
            <Reveal as="div" effect="fade-up" index={tableIndex}>
              {/* The table scrolls inside its own box on a narrow screen; the page never does. */}
              <div
                className={styles.tableScroll}
                role="region"
                aria-labelledby="bundle-prices-caption"
                tabIndex={0}
              >
                <table className={styles.table}>
                  <caption id="bundle-prices-caption" className="visually-hidden">
                    {PRICES_TITLE}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className={cx("t-label-medium", "c-fg-50", styles.head)}>
                        Bundle
                      </th>
                      <th
                        scope="col"
                        className={cx("t-label-medium", "c-fg-50", styles.head, styles.number)}
                      >
                        Templates
                      </th>
                      <th
                        scope="col"
                        className={cx("t-label-medium", "c-fg-50", styles.head, styles.number)}
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className={cx("t-label-medium", "c-fg-50", styles.head, styles.number)}
                      >
                        You save
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundleRows.map(({ bundle, count, savings }) => (
                      <tr key={bundle.slug} className={styles.row}>
                        <th scope="row" className={cx("t-body-large", styles.name)}>
                          <TransitionLink href={`/bundles/${bundle.slug}`} className={styles.link}>
                            {bundle.title}
                          </TransitionLink>
                        </th>
                        <td className={cx("t-body-large", "tabular", styles.number)}>{count}</td>
                        <td className={cx("t-body-large", "tabular", styles.number)}>
                          {formatPrice(bundle.priceCents)}
                        </td>
                        <td className={cx("t-body-large", "tabular", styles.number)}>
                          {formatPrice(savings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </RevealGroup>
      </SectionShell>

      <SectionShell innerClassName={styles.faq}>
        <RevealGroup>
          <SectionIntro
            center
            label="Questions"
            title="Questions"
            body="Beta note: these answers are provisional and will be confirmed before launch."
          />
        </RevealGroup>
        <FaqList items={FAQ} className={styles.faqList} />
      </SectionShell>

      <Container className={styles.cta}>
        <RevealGroup>
          <Reveal as="div" effect="fade-up" index={0}>
            <ActionRow
              fill
              padded
              rule="both"
              href="/contact"
              label="Contact us about purchasing"
              arrow="right"
            />
          </Reveal>
        </RevealGroup>
      </Container>
    </PageShell>
  );
}
