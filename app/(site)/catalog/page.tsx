import type { Metadata } from "next";
import { ActiveFilters } from "@/components/catalog/active-filters";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { ResultList } from "@/components/catalog/result-list";
import { SearchBox } from "@/components/catalog/search-box";
import { SortSelect } from "@/components/catalog/sort-select";
import { singleCatalogPhase } from "@/components/layout/nav-links";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { Split } from "@/components/ui/split";
import { queryTemplates } from "@/lib/catalog/query";
import { getPhases, getTemplates } from "@/lib/catalog/repository";
import { parseCatalogParams } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./page.module.css";

// Both sentences write the phase count out ("seven"): change it here if the catalog gains or loses a
// phase. The listings are sample content (placeholders), so neither sentence says how much the
// catalog holds or presents them as pieces of the toolkit.
export const metadata: Metadata = {
  title: "Catalog",
  description:
    "The catalog is organized by the seven phases of a rollout. The listings shown are sample content, searchable by phase, type, app and audience.",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The catalog, an index of documents. Under the title, 42px below its lead: a rail with the search, the sort order and
 * the filters (grid columns 1 to 3, staying under the bar from 68em) and the index beside it
 * (columns 4 to 12): the chips of the filters that are on, the count, then one row per template.
 * Below 68em the rail is a block above the index and the filters open as a sheet. Below 40em the
 * rail opens with the seven phases as a strip of index cards (the way in the phase rail gives from
 * 68em), the search shares a row with the Filters button, and the sort order moves into the sheet.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const [params, phases, templates] = await Promise.all([
    searchParams,
    getPhases(),
    getTemplates(),
  ]);
  const parsed = parseCatalogParams(
    params,
    phases.map((phase) => phase.slug),
  );
  const result = queryTemplates(templates, parsed, phases);
  // Use the clamped page so links and controls never carry an out-of-range value.
  const criteria = { ...parsed, page: result.page };
  const phaseOptions = phases.map(({ slug, name }) => ({ slug, name }));
  const sort = <SortSelect criteria={criteria} />;

  return (
    <>
      <TitleBlock
        flush
        title="Catalog"
        lead="Organized by the seven phases of a rollout. The listings shown are sample content. Search by name or narrow by phase, deliverable type, app and audience."
      />
      <Band as="div" surface="paper" pad="tight">
        <Split
          sticky
          marginClassName={styles.rail}
          margin={
            <>
              {/* Lit like the rail's tab when the catalog is filtered on exactly one phase. */}
              <nav aria-label="Start from a phase" className={styles.phases}>
                <PhaseTabs
                  phases={phaseOptions}
                  size="large"
                  current={singleCatalogPhase(
                    criteria.phase,
                    phaseOptions.map((phase) => phase.slug),
                  )}
                  currentKind="true"
                  className={styles.strip}
                />
              </nav>
              <div className={styles.search}>
                <SearchBox criteria={criteria} />
              </div>
              <div className={styles.sort}>{sort}</div>
              <div className={styles.filters}>
                <FilterPanel
                  criteria={criteria}
                  facets={result.facets}
                  phases={phaseOptions}
                  sort={sort}
                />
              </div>
            </>
          }
        >
          <section aria-labelledby="results-heading">
            <ActiveFilters
              criteria={criteria}
              phases={phaseOptions}
              fallbackFocusId="results-heading"
            />
            {/* Focusable from script only: it takes focus when the last filter chip goes. */}
            <p
              id="results-heading"
              role="status"
              tabIndex={-1}
              className={cx("type-ui", styles.count)}
            >
              <span className={cx("tabular", styles.strong)}>{result.total}</span>{" "}
              {result.total === 1 ? "template" : "templates"}
              {criteria.q && (
                <>
                  {" "}
                  for <span className={styles.strong}>“{criteria.q}”</span>
                </>
              )}
            </p>
            <ResultList result={result} criteria={criteria} phases={phaseOptions} />
          </section>
        </Split>
      </Band>
    </>
  );
}
