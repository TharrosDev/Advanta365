"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useOptimistic,
  useRef,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  APPS,
  APP_LABELS,
  AUDIENCES,
  AUDIENCE_LABELS,
  DELIVERABLE_TYPES,
  DELIVERABLE_TYPE_LABELS,
  FORMATS,
  FORMAT_LABELS,
} from "@/content/taxonomy";
import {
  DEFAULT_CRITERIA,
  type CatalogCriteria,
  type CatalogResult,
  type FacetKey,
} from "@/lib/catalog/query";
import {
  FACET_TITLES,
  FREE_FILTER_LABEL,
  catalogHref,
  clearFiltersHref,
} from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./filter-panel.module.css";

/** From this width the filters stand in the rail and the sheet's button is not displayed. */
const RAIL = "(min-width: 68em)";

type Option = { value: string; label: string };
type Group = { key: FacetKey; title: string; options: Option[] };

const options = <T extends string>(values: readonly T[], labels: Record<T, string>): Option[] =>
  values.map((value) => ({ value, label: labels[value] }));

type FilterPanelProps = {
  criteria: CatalogCriteria;
  facets: CatalogResult["facets"];
  phases: { slug: string; name: string }[];
  /** Shown at the top of the sheet below 40em, where the rail leaves the sort order out. */
  sort?: ReactNode;
};

/**
 * The catalog filters: "Free samples only", then five groups of check rows with their counts, and a
 * link that clears them.
 * Every change goes to the URL at once; the box ticks before the server answers. Clearing them
 * replaces the entry in place too, and hands focus to the first row, since the link leaves.
 *
 * From 68em the groups stand in the rail as an `aside`. Below that they sit behind a "Filters"
 * button, in a native dialog that comes up from the bottom edge as a sheet: a bar with the title and
 * Close, the groups in a scrolling body, and "Show results" at the foot. Below 40em the body opens
 * with `sort`, so a phone keeps one control above the results instead of two.
 */
export function FilterPanel({ criteria: committed, facets, phases, sort }: FilterPanelProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  // Tick the box immediately; the results follow when the server responds.
  const [criteria, setOptimisticCriteria] = useOptimistic(committed);

  // A window that grows to the rail loses the button, and the sheet with it: its box is no longer
  // drawn. A sheet still open then would leave the page inert and its scrolling locked behind
  // nothing, so it closes when the rail takes over.
  useEffect(() => {
    const rail = window.matchMedia(RAIL);
    const onChange = () => {
      if (rail.matches) dialogRef.current?.close();
    };
    rail.addEventListener("change", onChange);
    return () => rail.removeEventListener("change", onChange);
  }, []);

  const groups: Group[] = [
    {
      key: "phase",
      title: FACET_TITLES.phase,
      options: phases.map((p) => ({ value: p.slug, label: p.name })),
    },
    {
      key: "type",
      title: FACET_TITLES.type,
      options: options(DELIVERABLE_TYPES, DELIVERABLE_TYPE_LABELS),
    },
    { key: "app", title: FACET_TITLES.app, options: options(APPS, APP_LABELS) },
    { key: "audience", title: FACET_TITLES.audience, options: options(AUDIENCES, AUDIENCE_LABELS) },
    { key: "format", title: FACET_TITLES.format, options: options(FORMATS, FORMAT_LABELS) },
  ];

  const selectedCount =
    groups.reduce((sum, group) => sum + criteria[group.key].length, 0) + Number(criteria.free);

  // Any filter change returns to the first page.
  function apply(nextCriteria: CatalogCriteria) {
    startTransition(() => {
      setOptimisticCriteria(nextCriteria);
      router.replace(catalogHref(nextCriteria), { scroll: false });
    });
  }

  function toggle(key: FacetKey, value: string, checked: boolean) {
    const current = criteria[key] as string[];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    apply({ ...criteria, [key]: next, page: 1 });
  }

  // The link works before the script loads. With the script it clears in place, like every other
  // change: the entry is replaced and the page stays where it is. The link is gone once no filter
  // is left, so focus moves first, to the top row of the list of filters it ends.
  function clearAll(event: MouseEvent<HTMLElement>) {
    // A click that asks for a new tab or window keeps the browser's own behaviour.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    event.currentTarget.parentElement?.querySelector<HTMLInputElement>("input")?.focus();
    apply({ ...DEFAULT_CRITERIA, q: criteria.q });
  }

  const fields = (
    <div className={styles.fields} aria-busy={isPending}>
      <Checkbox
        label={FREE_FILTER_LABEL}
        checked={criteria.free}
        onChange={(event) => apply({ ...criteria, free: event.target.checked, page: 1 })}
      />
      {groups.map((group) => (
        <fieldset key={group.key} className={styles.group}>
          <legend className={cx("type-eyebrow", styles.legend)}>{group.title}</legend>
          <div className={styles.options}>
            {group.options.map((option) => {
              const checked = (criteria[group.key] as string[]).includes(option.value);
              const count = facets[group.key][option.value] ?? 0;
              return (
                <Checkbox
                  key={option.value}
                  label={option.label}
                  count={count}
                  checked={checked}
                  disabled={count === 0 && !checked}
                  onChange={(event) => toggle(group.key, option.value, event.target.checked)}
                />
              );
            })}
          </div>
        </fieldset>
      ))}
      {selectedCount > 0 && (
        <Button
          variant="text"
          href={clearFiltersHref(criteria)}
          onClick={clearAll}
          className={styles.clear}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <aside aria-label="Filters" className={styles.desktop}>
        <h2 className="visually-hidden">Filters</h2>
        {fields}
      </aside>

      <div className={styles.mobile}>
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={() => dialogRef.current?.showModal()}
        >
          {`Filters${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
        </Button>
        <dialog ref={dialogRef} aria-label="Filters" className={styles.sheet}>
          <div className={styles.bar}>
            <h2 className="type-section">Filters</h2>
            <Button variant="outline" size="sm" onClick={() => dialogRef.current?.close()}>
              Close
            </Button>
          </div>
          <div className={styles.body}>
            {sort ? <div className={styles.sort}>{sort}</div> : null}
            {fields}
          </div>
          <div className={styles.foot}>
            <Button variant="mark" size="lg" fullWidth onClick={() => dialogRef.current?.close()}>
              Show results
            </Button>
          </div>
        </dialog>
      </div>
    </>
  );
}
