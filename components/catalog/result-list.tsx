import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { Pagination } from "@/components/ui/pagination";
import type { CatalogCriteria, CatalogResult } from "@/lib/catalog/query";
import { catalogHref, hasFilters } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./result-list.module.css";
import { TemplateTile, TileGrid } from "./template-tile";

type ResultListProps = {
  result: CatalogResult;
  criteria: CatalogCriteria;
  phases: { slug: string; name: string }[];
  /** The slug of a locked template a link named: its tile is rendered already denied. */
  denied?: string;
};

/**
 * One page of catalog results as a grid of tiles (`TemplateTile`), and the page navigation under
 * it. A free sample's tile links to the same catalog address with `view` set to its slug, which
 * opens it in the pop-up without moving the page. Nothing in the grid animates in, so a change of
 * filter, sort or search only swaps the tiles. With no match it is a blank sheet with an empty
 * field, the message and a link back to the unfiltered catalog. When only a search found nothing,
 * the message quotes the search, the link clears it, and the seven phases follow as index cards, a
 * way in that needs no right word.
 */
export function ResultList({ result, criteria, phases, denied }: ResultListProps) {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  const phaseOrders = new Map(phases.map((phase, position) => [phase.slug, position + 1]));

  if (result.total === 0) {
    const filtered = hasFilters(criteria);
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
      <TileGrid>
        {result.items.map((template) => (
          <li key={template.slug}>
            <TemplateTile
              template={template}
              phaseName={phaseNames.get(template.phase)}
              phaseOrder={phaseOrders.get(template.phase)}
              href={catalogHref(criteria, template.slug)}
              headingLevel="h2"
              scroll={false}
              denied={template.slug === denied}
            />
          </li>
        ))}
      </TileGrid>
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
