import type { Metadata } from "next";
import { ActiveFilters } from "@/components/catalog/active-filters";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { PhaseStrip } from "@/components/catalog/phase-strip";
import { ResultList } from "@/components/catalog/result-list";
import { SearchBox } from "@/components/catalog/search-box";
import { SortSelect } from "@/components/catalog/sort-select";
import { TemplateDetail } from "@/components/catalog/template-detail";
import { TemplateDialog } from "@/components/catalog/template-dialog";
import { singleCatalogPhase } from "@/components/layout/nav-links";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { Split } from "@/components/ui/split";
import { TextLink } from "@/components/ui/text-link";
import { queryTemplates } from "@/lib/catalog/query";
import { getPhases, getTemplate, getTemplates } from "@/lib/catalog/repository";
import { catalogHref, parseCatalogParams, parseView } from "@/lib/catalog/search-params";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { cx } from "@/lib/cx";
import { countWord } from "@/lib/format";
import { PURCHASE_LINK } from "@/lib/site";
import styles from "./page.module.css";

// Both sentences write the phase count out ("seven"): change it here if the catalog gains or loses a
// phase. The listings are sample content (placeholders), so neither sentence says how much the
// catalog holds or presents them as pieces of the toolkit. Every address of the catalog (a search,
// a filter, a page of results, a template in `view`) names the plain catalog as its canonical one.
export const metadata: Metadata = {
  title: "Catalog",
  description:
    "The catalog is organized by the seven phases of a rollout. The listings shown are sample content, searchable by phase, type, app and audience.",
  alternates: { canonical: "/catalog" },
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** The id of the heading that names the pop-up. */
const DIALOG_TITLE = "template-dialog-title";

/**
 * The catalog. Under the title, 42px below its lead: a rail with the search, the sort order and
 * the filters (grid columns 1 to 3, staying under the bar from 68em) and the results beside it
 * (columns 4 to 12): the chips of the filters that are on, the count, a line that says what the
 * locks mean, then a grid of tiles, one per template. Below 68em the rail is a block above the grid
 * and the filters open as a sheet. Below 40em the rail opens with the seven phases as a strip of
 * index cards (the way in the phase rail gives from 68em), the search shares a row with the Filters
 * button, and the sort order moves into the sheet.
 *
 * `view` in the address names one template. A free sample is shown in the pop-up over the page,
 * which closes to the same address without `view`; a locked template opens nothing, and its tile,
 * if it is on this page of the results, is rendered saying no; where it is not, one line above the
 * results gives the tile's answer with the template's title. Anything else is ignored.
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
  // Lit like the rail's tab when the catalog is filtered on exactly one phase.
  const litPhase = singleCatalogPhase(
    criteria.phase,
    phaseOptions.map((phase) => phase.slug),
  );
  const sort = <SortSelect criteria={criteria} />;

  const view = parseView(params);
  const viewed = view ? await getTemplate(view) : undefined;
  const opened = viewed?.free ? viewed : undefined;
  const denied = viewed && !viewed.free ? viewed : undefined;
  const deniedOffPage =
    denied && !result.items.some((item) => item.slug === denied.slug) ? denied : undefined;

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
              <PhaseStrip label="Start from a phase" current={litPhase} className={styles.phases}>
                <PhaseTabs
                  phases={phaseOptions}
                  size="large"
                  current={litPhase}
                  currentKind="true"
                  className={styles.strip}
                />
              </PhaseStrip>
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
            {deniedOffPage ? (
              <p role="status" data-included="" className={cx("type-note", styles.included)}>
                <span className={styles.strong}>
                  <KeepCompounds text={deniedOffPage.title} />
                </span>{" "}
                is included with the toolkit.{" "}
                <TextLink href={PURCHASE_LINK.href} className={styles.way}>
                  {PURCHASE_LINK.label}
                </TextLink>
              </p>
            ) : null}
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
            {result.total > 0 ? (
              <p className={cx("type-note", styles.key)}>
                {countWord(FREE_SAMPLE_COUNT, "capital")} templates are free samples. Locked
                templates are included with the toolkit.{" "}
                <TextLink href={PURCHASE_LINK.href} className={styles.way}>
                  {PURCHASE_LINK.label}
                </TextLink>
              </p>
            ) : null}
            <ResultList
              result={result}
              criteria={criteria}
              phases={phaseOptions}
              denied={denied?.slug}
            />
          </section>
        </Split>
      </Band>
      {opened ? (
        <TemplateDialog closeHref={catalogHref(criteria)} labelledBy={DIALOG_TITLE}>
          <TemplateDetail
            template={opened}
            phase={phases.find((phase) => phase.slug === opened.phase)}
            titleId={DIALOG_TITLE}
          />
        </TemplateDialog>
      ) : null}
    </>
  );
}
