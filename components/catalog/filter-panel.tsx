"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useRef, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
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
    <div className={`space-y-6 ${isPending ? "opacity-60" : ""}`} aria-busy={isPending}>
      {groups.map((group) => (
        <fieldset key={group.key}>
          <legend className="text-sm font-semibold">{group.title}</legend>
          <div className="mt-2">
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
        <Link
          href={criteria.q ? `/catalog?q=${encodeURIComponent(criteria.q)}` : "/catalog"}
          className="text-accent inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );

  return (
    <>
      <aside aria-label="Filters" className="hidden lg:block">
        <h2 className="sr-only">Filters</h2>
        {fields}
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          className={buttonClass("secondary", "md", "w-full")}
          onClick={() => dialogRef.current?.showModal()}
        >
          Filters{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>
        <dialog
          ref={dialogRef}
          aria-label="Filters"
          className="bg-surface text-ink backdrop:bg-ink/40 m-0 ml-auto h-dvh max-h-none w-[min(22rem,100vw)] max-w-none p-0"
        >
          <div className="flex h-full flex-col">
            <div className="border-rule flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                type="button"
                className={buttonClass("ghost", "md")}
                onClick={() => dialogRef.current?.close()}
              >
                Close
              </button>
            </div>
            <div className="grow overflow-y-auto px-5 py-5">{fields}</div>
            <div className="border-rule border-t p-4">
              <button
                type="button"
                className={buttonClass("primary", "md", "w-full")}
                onClick={() => dialogRef.current?.close()}
              >
                Show results
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}
