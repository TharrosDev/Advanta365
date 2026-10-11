import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Sheet } from "@/components/ui/sheet";
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

/**
 * One page of catalog results: the cards in a grid (three across from 68em, two from 40em, rows
 * below) and the page navigation under it. With no match it is a sheet with an empty field, the
 * message and a link back to the unfiltered catalog.
 */
export function ResultList({ result, criteria, phases }: ResultListProps) {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));

  if (result.total === 0) {
    return (
      <Sheet pad="roomy" className={styles.empty}>
        <Blank caret="steady" className={styles.blank} />
        <h2 className={cx("type-section", styles.emptyTitle)}>No templates match these filters.</h2>
        <p className={cx("type-copy", styles.emptyBody)}>
          Try a different search term or remove a filter.
        </p>
        <Button variant="outline" href="/catalog" className={styles.emptyAction}>
          Clear filters
        </Button>
      </Sheet>
    );
  }

  const hrefFor = (page: number) => {
    const query = serializeCatalogParams({ ...criteria, page });
    return query ? `/catalog?${query}` : "/catalog";
  };

  return (
    <div className={styles.root}>
      <ul className={styles.grid}>
        {result.items.map((template) => (
          <li key={template.slug}>
            <TemplateCard template={template} phaseName={phaseNames.get(template.phase)} />
          </li>
        ))}
      </ul>
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
