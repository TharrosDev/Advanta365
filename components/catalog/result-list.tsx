import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, type CatalogCriteria, type CatalogResult } from "@/lib/catalog/query";
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
 * One page of catalog results as an index: a list whose items are rows (`TemplateCard
 * layout="row"`), each with its position in the whole result, and the page navigation under it.
 * Nothing in the list animates in, so a change of filter, sort or search only swaps the rows. With
 * no match it is a blank sheet with an empty field, the message and a link back to the unfiltered
 * catalog.
 */
export function ResultList({ result, criteria, phases }: ResultListProps) {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  const phaseOrders = new Map(phases.map((phase, position) => [phase.slug, position + 1]));

  if (result.total === 0) {
    return (
      <PaperSheet size="md" className={styles.empty}>
        <Blank caret="steady" className={styles.blank} />
        <h2 className={cx("type-section", styles.emptyTitle)}>No templates match these filters.</h2>
        <p className={cx("type-copy", styles.emptyBody)}>
          Try a different search term or remove a filter.
        </p>
        <Button variant="outline" href="/catalog" className={styles.emptyAction}>
          Clear filters
        </Button>
      </PaperSheet>
    );
  }

  const hrefFor = (page: number) => {
    const query = serializeCatalogParams({ ...criteria, page });
    return query ? `/catalog?${query}` : "/catalog";
  };
  const first = (result.page - 1) * PAGE_SIZE;

  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {result.items.map((template, position) => (
          <li key={template.slug}>
            <TemplateCard
              template={template}
              phaseName={phaseNames.get(template.phase)}
              phaseOrder={phaseOrders.get(template.phase)}
              index={first + position + 1}
            />
          </li>
        ))}
      </ul>
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
