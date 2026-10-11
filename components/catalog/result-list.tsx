import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { Pagination } from "@/components/ui/pagination";
import { FACET_KEYS, type CatalogCriteria, type CatalogResult } from "@/lib/catalog/query";
import { catalogHref } from "@/lib/catalog/search-params";
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
 * layout="row"`), and the page navigation under it.
 * Nothing in the list animates in, so a change of filter, sort or search only swaps the rows. With
 * no match it is a blank sheet with an empty field, the message and a link back to the unfiltered
 * catalog. When only a search found nothing, the message quotes the search, the link clears it, and
 * the seven phases follow as index cards, a way in that needs no right word.
 */
export function ResultList({ result, criteria, phases }: ResultListProps) {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  const phaseOrders = new Map(phases.map((phase, position) => [phase.slug, position + 1]));

  if (result.total === 0) {
    const filtered = FACET_KEYS.some((key) => criteria[key].length > 0);
    const searchOnly = !filtered && criteria.q !== "";
    const clearLabel = !filtered
      ? "Clear search"
      : criteria.q
        ? "Clear search and filters"
        : "Clear filters";
    return (
      <PaperSheet size="md" className={styles.empty}>
        <Blank caret="steady" className={styles.blank} />
        <h2 className={cx("type-section", styles.emptyTitle)}>
          {searchOnly ? `No templates match “${criteria.q}”.` : "No templates match these filters."}
        </h2>
        <p className={cx("type-copy", styles.emptyBody)}>
          {searchOnly
            ? "Try a shorter or different word, or start from the phase your rollout is in."
            : "Try a different search term or remove a filter."}
        </p>
        <Button
          variant="outline"
          href={searchOnly ? catalogHref({ ...criteria, q: "", page: 1 }) : "/catalog"}
          className={styles.emptyAction}
        >
          {clearLabel}
        </Button>
        {searchOnly && phases.length > 0 && (
          <nav aria-labelledby="empty-phases" className={styles.pivot}>
            <h3 id="empty-phases" className={cx("type-ui", styles.pivotTitle)}>
              Browse by phase
            </h3>
            <PhaseTabs phases={phases} size="large" />
          </nav>
        )}
      </PaperSheet>
    );
  }

  const hrefFor = (page: number) => catalogHref({ ...criteria, page });

  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {result.items.map((template) => (
          <li key={template.slug}>
            <TemplateCard
              template={template}
              phaseName={phaseNames.get(template.phase)}
              phaseOrder={phaseOrders.get(template.phase)}
            />
          </li>
        ))}
      </ul>
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
