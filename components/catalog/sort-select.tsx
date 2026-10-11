"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { CatalogCriteria, SortKey } from "@/lib/catalog/query";
import { cx } from "@/lib/cx";
import { serializeCatalogParams } from "@/lib/catalog/search-params";
import styles from "./sort-select.module.css";

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "title", label: "Title A–Z" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
];

/**
 * The sort order of the catalog: a small label over a native select. A change goes straight to the
 * URL and returns to the first page.
 */
export function SortSelect({ criteria }: { criteria: CatalogCriteria }) {
  const router = useRouter();

  return (
    <label className={styles.row}>
      <span className={cx("type-eyebrow", styles.label)}>Sort by</span>
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
