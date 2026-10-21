import type { Metadata } from "next";
import { ActiveFilters } from "@/components/catalog/active-filters";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { ResultList } from "@/components/catalog/result-list";
import { SearchBox } from "@/components/catalog/search-box";
import { SortSelect } from "@/components/catalog/sort-select";
import { TemplateDetail } from "@/components/catalog/template-detail";
import { TemplateDialog } from "@/components/catalog/template-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { singleCatalogPhase } from "@/components/layout/nav-links";
import { Band } from "@/components/ui/band";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Split } from "@/components/ui/split";
import { StepMenu } from "@/components/ui/step-menu";
import { TextLink } from "@/components/ui/text-link";
import { queryTemplates } from "@/lib/catalog/query";
import { getPhases, getTemplate, getTemplates } from "@/lib/catalog/repository";
import { catalogHref, parseCatalogParams, parseView } from "@/lib/catalog/search-params";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { cx } from "@/lib/cx";
import { getFileStore } from "@/lib/files/store";
import { countWord } from "@/lib/format";
import { hasLicence } from "@/lib/licence/session";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, phaseList, templateList, webPage } from "@/lib/seo/structured-data";
import { PURCHASE_LINK, SITE } from "@/lib/site";
import styles from "./page.module.css";

// The description writes the phase count out ("eleven"): change it here if the toolkit gains or
// loses a phase. The listings are sample content (placeholders), so it does not say how much the catalog
// holds or presents them as pieces of the toolkit. Every address of the catalog (a search, a filter,
// a page of results, a template in `view`) names the plain catalog as its canonical one.
const TITLE = "Catalog of change management templates";
const DESCRIPTION =
  "Browse change management and user adoption templates for Microsoft 365 and SharePoint Online by rollout phase, type, app and audience. Six free samples.";

export const metadata: Metadata = pageMetadata({
  path: "/catalog",
  title: TITLE,
  description: DESCRIPTION,
  ownCard: true,
});

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** The id of the heading that names the pop-up. */
const DIALOG_TITLE = "template-dialog-title";

/**
 * The catalog. The page opens straight into the catalogue, with no title block: its one `h1` is
 * read out and not shown (from 68em the bar's current link says where the visitor is). On paper,
 * 42px under the bar: a rail with the search, the sort order
 * and the filters (grid columns 1 to 3, staying under the bar from 68em) and the results beside it
 * (columns 4 to 12): the chips of the filters that are on, the count, a line that says the listings
 * are sample content and what the locks mean (the page has no lead of its own to say the first),
 * then a grid of tiles, one per template. Below 68em the rail is a block above the grid and the
 * filters open as a sheet, and the rail opens with the "Jump to a phase" drop-down (the way in that
 * the bar's Roadmap gives from 68em). Below 40em the search shares a row with the Filters button, and the
 * sort order moves into the sheet.
 *
 * A browser holding a licence (`hasLicence`, the cookie of the licence link) sees every tile open and
 * any template in the pop-up, with its files to download; the line under the count says so. After a
 * licence link that failed (`link=invalid`), a line above the results says so and how to get help.
 *
 * `view` in the address names one template. A free sample is shown in the pop-up over the page,
 * which closes to the same address without `view`; a locked template opens nothing, and its tile,
 * if it is on this page of the results, is rendered saying no; where it is not, one line above the
 * results gives the tile's answer with the template's title. Anything else is ignored.
 */
export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const [params, phases, templates, licensed] = await Promise.all([
    searchParams,
    getPhases(),
    getTemplates(),
    hasLicence(),
  ]);
  const parsed = parseCatalogParams(
    params,
    phases.map((phase) => phase.slug),
  );
  const result = queryTemplates(templates, parsed, phases);
  // Use the clamped page so links and controls never carry an out-of-range value.
  const criteria = { ...parsed, page: result.page };
  const phaseOptions = phases.map(({ slug, name, number }) => ({ slug, name, number }));
  // Named on the drop-down, as on the rail, when the catalog is filtered on exactly one section.
  const litPhase = singleCatalogPhase(
    criteria.phase,
    phaseOptions.map((phase) => phase.slug),
  );
  const sort = <SortSelect criteria={criteria} />;

  const view = parseView(params);
  const viewed = view ? await getTemplate(view) : undefined;
  const opened = viewed && (viewed.free || licensed) ? viewed : undefined;
  const denied = viewed && !opened ? viewed : undefined;
  const linkFailed = !licensed && params.link === "invalid";
  const deniedOffPage =
    denied && !result.items.some((item) => item.slug === denied.slug) ? denied : undefined;

  return (
    <>
      {/* Read out, not shown: the page opens on the catalogue. */}
      <h1 className={cx("type-banner", "visually-hidden")}>Catalog</h1>
      <Band as="div" surface="paper" pad="tight">
        <Split
          sticky
          marginClassName={styles.rail}
          margin={
            <>
              <StepMenu
                phases={phaseOptions}
                current={litPhase}
                currentKind="true"
                className={styles.phases}
              />
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
            {linkFailed ? (
              <p role="status" data-link-failed="" className={cx("type-note", styles.included)}>
                <span className={styles.strong}>That link did not work.</span> Write to{" "}
                <TextLink href={`mailto:${SITE.contactEmail}`} className={styles.way}>
                  {SITE.contactEmail}
                </TextLink>{" "}
                with your order code.
              </p>
            ) : null}
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
                The listings shown are sample content.{" "}
                {licensed ? (
                  "Your toolkit is unlocked in this browser."
                ) : (
                  <>
                    {countWord(FREE_SAMPLE_COUNT, "capital")} templates are free samples. Locked
                    templates are included with the toolkit.{" "}
                    <TextLink href={PURCHASE_LINK.href} className={styles.way}>
                      {PURCHASE_LINK.label}
                    </TextLink>
                  </>
                )}
              </p>
            ) : null}
            <ResultList
              result={result}
              criteria={criteria}
              phases={phaseOptions}
              denied={denied?.slug}
              unlocked={licensed}
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
            licensed={licensed}
            downloadable={getFileStore() !== null && opened.files.length > 0}
          />
        </TemplateDialog>
      ) : null}
      <JsonLd
        data={graph(
          ...webPage({
            path: "/catalog",
            name: TITLE,
            description: DESCRIPTION,
            type: "CollectionPage",
            trail: [{ name: "Catalog", path: "/catalog" }],
            extra: {
              mainEntity: phaseList(phases),
              hasPart: templateList(
                "Free samples",
                templates.filter((template) => template.free),
                phases,
              ),
            },
          }),
        )}
      />
    </>
  );
}
