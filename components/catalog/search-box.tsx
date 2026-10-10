import { buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogCriteria } from "@/lib/catalog/query";
import { serializeCatalogParams } from "@/lib/catalog/search-params";

/** A plain GET form, so search works without JavaScript and keeps the active filters. */
export function SearchBox({ criteria }: { criteria: CatalogCriteria }) {
  const kept = new URLSearchParams(serializeCatalogParams({ ...criteria, q: "", page: 1 }));

  return (
    <form action="/catalog" method="get" role="search" className="flex grow gap-2">
      {[...kept].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="catalog-search" className="sr-only">
        Search templates
      </label>
      <Input
        id="catalog-search"
        type="search"
        name="q"
        defaultValue={criteria.q}
        maxLength={200}
        placeholder="Search templates, e.g. sponsor kickoff"
      />
      <button type="submit" className={buttonClass("primary", "md")}>
        Search
      </button>
    </form>
  );
}
