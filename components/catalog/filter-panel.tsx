"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useRef, useTransition } from "react";
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
import type { CatalogCriteria, CatalogResult, FacetKey } from "@/lib/catalog/query";
import { serializeCatalogParams } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./filter-panel.module.css";

type Option = { value: string; label: string };
type Group = { key: FacetKey; title: string; options: Option[] };

const options = <T extends string>(values: readonly T[], labels: Record<T, string>): Option[] =>
  values.map((value) => ({ value, label: labels[value] }));

type FilterPanelProps = {
  criteria: CatalogCriteria;
  facets: CatalogResult["facets"];
  phases: { slug: string; name: string }[];
};

export function FilterPanel({ criteria: committed, facets, phases }: FilterPanelProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  // Tick the box immediately; the results follow when the server responds.
  const [criteria, setOptimisticCriteria] = useOptimistic(committed);

  const groups: Group[] = [
    {
      key: "phase",
      title: "Phase",
      options: phases.map((p) => ({ value: p.slug, label: p.name })),
    },
    {
      key: "type",
      title: "Deliverable type",
      options: options(DELIVERABLE_TYPES, DELIVERABLE_TYPE_LABELS),
    },
    { key: "app", title: "Microsoft 365 app", options: options(APPS, APP_LABELS) },
    { key: "audience", title: "Audience", options: options(AUDIENCES, AUDIENCE_LABELS) },
    { key: "format", title: "File format", options: options(FORMATS, FORMAT_LABELS) },
  ];

  const selectedCount = groups.reduce((sum, group) => sum + criteria[group.key].length, 0);

  function toggle(key: FacetKey, value: string, checked: boolean) {
    const current = criteria[key] as string[];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    // Any filter change returns to the first page.
    const nextCriteria = { ...criteria, [key]: next, page: 1 };
    const query = serializeCatalogParams(nextCriteria);
    startTransition(() => {
      setOptimisticCriteria(nextCriteria);
      router.replace(query ? `/catalog?${query}` : "/catalog", { scroll: false });
    });
  }

  const fields = (
    <div className={cx(styles.fields, isPending && styles.pending)} aria-busy={isPending}>
      {groups.map((group) => (
        <fieldset key={group.key} className={styles.group}>
          <legend className={cx("t-label-large", styles.legend)}>{group.title}</legend>
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
          href={criteria.q ? `/catalog?q=${encodeURIComponent(criteria.q)}` : "/catalog"}
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
          <div className={cx(styles.band, styles.bar)}>
            <h2 className="t-headline-small">Filters</h2>
            <Button variant="text" onClick={() => dialogRef.current?.close()}>
              Close
            </Button>
          </div>
          <div className={cx(styles.band, styles.body)}>{fields}</div>
          <div className={cx(styles.band, styles.footer)}>
            <Button variant="slab" size="lg" fullWidth onClick={() => dialogRef.current?.close()}>
              Show results
            </Button>
          </div>
        </dialog>
      </div>
    </>
  );
}
