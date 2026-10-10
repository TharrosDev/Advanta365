import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import type { CatalogCriteria, CatalogResult } from "@/lib/catalog/query";
import { serializeCatalogParams } from "@/lib/catalog/search-params";
import { TemplateCard } from "./template-card";

type ResultListProps = {
  result: CatalogResult;
  criteria: CatalogCriteria;
  phases: { slug: string; name: string }[];
};

export function ResultList({ result, criteria, phases }: ResultListProps) {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));

  if (result.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/25 px-6 py-16 text-center">
        <h2 className="text-xl font-semibold">No templates match these filters.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Try a different search term or remove a filter.
        </p>
        <div className="mt-6">
          <Button href="/catalog" variant="secondary">
            Clear filters
          </Button>
        </div>
      </div>
    );
  }

  const hrefFor = (page: number) => {
    const query = serializeCatalogParams({ ...criteria, page });
    return query ? `/catalog?${query}` : "/catalog";
  };

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {result.items.map((template) => (
          <li key={template.slug}>
            <TemplateCard template={template} phaseName={phaseNames.get(template.phase)} />
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
