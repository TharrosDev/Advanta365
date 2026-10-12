import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { Pagination } from "@/components/ui/pagination";
import type { CatalogCriteria, CatalogResult } from "@/lib/catalog/query";
import { catalogHref } from "@/lib/catalog/search-params";
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
 * field, the message and a link back to the unfiltered catalog.
 */
export function ResultList({ result, criteria, phases, denied }: ResultListProps) {
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
