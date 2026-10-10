"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { CatalogCriteria, SortKey } from "@/lib/catalog/query";
import { serializeCatalogParams } from "@/lib/catalog/search-params";

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "title", label: "Title A–Z" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
];

export function SortSelect({ criteria }: { criteria: CatalogCriteria }) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="shrink-0">Sort by</span>
      <Select
        value={criteria.sort}
        onChange={(event) => {
          const sort = event.target.value as SortKey;
          const query = serializeCatalogParams({ ...criteria, sort, page: 1 });
          router.replace(query ? `/catalog?${query}` : "/catalog", { scroll: false });
        }}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
