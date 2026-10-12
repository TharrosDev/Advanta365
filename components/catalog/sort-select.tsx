"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { Select } from "@/components/ui/select";
import type { CatalogCriteria, SortKey } from "@/lib/catalog/query";
import { cx } from "@/lib/cx";
import { serializeCatalogParams } from "@/lib/catalog/search-params";
import styles from "./sort-select.module.css";

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "samples", label: "Free samples first" },
  { value: "phase", label: "Phase order" },
  { value: "title", label: "Title A–Z" },
];

/**
 * The sort order of the catalog: a small label over a native select. A change goes straight to the
 * URL and returns to the first page; the select shows the new order at once, as the filters tick
 * their boxes, and not only when the server has answered.
 */
export function SortSelect({ criteria }: { criteria: CatalogCriteria }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sort, setOptimisticSort] = useOptimistic(criteria.sort);

  return (
    <label className={styles.row}>
      <span className={cx("type-eyebrow", styles.label)}>Sort by</span>
      <Select
        value={sort}
        aria-busy={isPending}
        onChange={(event) => {
          const next = event.target.value as SortKey;
          const query = serializeCatalogParams({ ...criteria, sort: next, page: 1 });
          startTransition(() => {
            setOptimisticSort(next);
            router.replace(query ? `/catalog?${query}` : "/catalog", { scroll: false });
          });
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
