"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { CatalogCriteria } from "@/lib/catalog/query";
import { activeFilters, clearFiltersHref } from "@/lib/catalog/search-params";
import styles from "./active-filters.module.css";

type ActiveFiltersProps = {
  criteria: CatalogCriteria;
  phases: { slug: string; name: string; number?: number }[];
  /** The element that takes focus when the last filter goes: the result count. */
  fallbackFocusId: string;
};

/**
 * The selected filters as a row of chips above the results, each a link that removes its value, and
 * "Clear all" at the end of the row. It says which filters are on in every width, so the phone's
 * "Filters (2)" button has its answer on the page. Nothing renders while no filter is set.
 *
 * Each chip is a real link to the catalog without that value, so the row works before the script
 * loads; with the script, a click replaces the URL in place (as the filters do) and keeps the
 * scroll. The chip that held focus goes away, so focus moves to the chip that takes its place (the
 * one before it when it was the last), or to the result count once no chip is left.
 */
export function ActiveFilters({ criteria, phases, fallbackFocusId }: ActiveFiltersProps) {
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const [isPending, startTransition] = useTransition();
  const filters = activeFilters(criteria, phases);
  const signature = filters.map(({ key, value }) => `${key}:${value}`).join(",");
  // Where focus goes once the removal has landed: the position of the removed chip, and the row
  // as it was before, so the move waits for the new row.
  const pendingFocus = useRef<{ index: number; from: string } | null>(null);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || pending.from === signature) return;
    pendingFocus.current = null;
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>(
      `a.${CSS.escape(styles.chip ?? "")}`,
    );
    const next = links?.[Math.min(pending.index, links.length - 1)];
    (next ?? document.getElementById(fallbackFocusId))?.focus();
  }, [signature, fallbackFocusId]);

  if (filters.length === 0) return null;

  function go(event: MouseEvent<HTMLElement>, href: string, index: number) {
    // A click that asks for a new tab or window keeps the browser's own behaviour.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    pendingFocus.current = { index, from: signature };
    startTransition(() => router.replace(href, { scroll: false }));
  }

  return (
    <ul ref={listRef} aria-label="Active filters" aria-busy={isPending} className={styles.root}>
      {filters.map((filter, index) => (
        <li key={`${filter.key}:${filter.value}`}>
          <Button
            variant="outline"
            size="sm"
            href={filter.removeHref}
            aria-label={filter.removeLabel}
            className={styles.chip}
            onClick={(event) => go(event, filter.removeHref, index)}
          >
            {filter.label}
            <Icon name="close" size={16} />
          </Button>
        </li>
      ))}
      <li>
        <Button
          variant="text"
          href={clearFiltersHref(criteria)}
          onClick={(event) => go(event, clearFiltersHref(criteria), filters.length)}
        >
          Clear all
        </Button>
      </li>
    </ul>
  );
}
