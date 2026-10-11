import { Reveal } from "@/components/motion/reveal";
import { Pagination } from "@/components/ui/pagination";
import { WipeButton } from "@/components/ui/wipe-button";
import type { CatalogCriteria, CatalogResult } from "@/lib/catalog/query";
import { serializeCatalogParams } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./result-list.module.css";
import { TemplateCard } from "./template-card";

type ResultListProps = {
  result: CatalogResult;
  criteria: CatalogCriteria;
  phases: { slug: string; name: string }[];
};

/** Only the first row of the grid animates; the rest is static so 24 cards never play at once. */
const REVEALED_CARDS = 3;

export function ResultList({ result, criteria, phases }: ResultListProps) {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));

  if (result.total === 0) {
    return (
      <div className={cx("ruled", styles.empty)}>
        <h2 className="t-headline-large">No templates match these filters.</h2>
        <p className={cx("t-body-large", "c-fg-60", styles.emptyBody)}>
          Try a different search term or remove a filter.
        </p>
        <WipeButton href="/catalog">Clear filters</WipeButton>
      </div>
    );
  }

  const hrefFor = (page: number) => {
    const query = serializeCatalogParams({ ...criteria, page });
    return query ? `/catalog?${query}` : "/catalog";
  };

  return (
    <div className={styles.root}>
      <ul className={styles.grid}>
        {result.items.map((template, index) => {
          const card = (
            <TemplateCard template={template} phaseName={phaseNames.get(template.phase)} />
          );
          return index < REVEALED_CARDS ? (
            <Reveal key={template.slug} as="li" effect="wipe" index={index + 1}>
              {card}
            </Reveal>
          ) : (
            <li key={template.slug}>{card}</li>
          );
        })}
      </ul>
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
