import type { Metadata } from "next";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { ResultList } from "@/components/catalog/result-list";
import { SearchBox } from "@/components/catalog/search-box";
import { SortSelect } from "@/components/catalog/sort-select";
import { Container } from "@/components/layout/container";
import { queryTemplates } from "@/lib/catalog/query";
import { getPhases, getTemplates } from "@/lib/catalog/repository";
import { parseCatalogParams } from "@/lib/catalog/search-params";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Search and filter every change management template by phase, type, app and audience.",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const [params, phases, templates] = await Promise.all([searchParams, getPhases(), getTemplates()]);
  const parsed = parseCatalogParams(
    params,
    phases.map((phase) => phase.slug),
  );
  const result = queryTemplates(templates, parsed);
  // Use the clamped page so links and controls never carry an out-of-range value.
  const criteria = { ...parsed, page: result.page };
  const phaseOptions = phases.map(({ slug, name }) => ({ slug, name }));

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-4xl font-semibold">Template catalog</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every template, organized by where it fits in your rollout. Search by name or narrow by
        phase, deliverable type, app and audience.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox criteria={criteria} />
        <SortSelect criteria={criteria} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <FilterPanel criteria={criteria} facets={result.facets} phases={phaseOptions} />
        <section aria-labelledby="results-heading">
          <p id="results-heading" role="status" className="mb-4 text-sm text-muted">
            {result.total} {result.total === 1 ? "template" : "templates"}
            {criteria.q && (
              <>
                {" "}
                for <span className="text-ink">“{criteria.q}”</span>
              </>
            )}
          </p>
          <ResultList result={result} criteria={criteria} phases={phaseOptions} />
        </section>
      </div>
    </Container>
  );
}
