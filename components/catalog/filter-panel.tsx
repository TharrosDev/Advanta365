"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
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

export function FilterPanel({ criteria, facets, phases }: FilterPanelProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const groups: Group[] = [
    { key: "phase", title: "Phase", options: phases.map((p) => ({ value: p.slug, label: p.name })) },
    { key: "type", title: "Deliverable type", options: options(DELIVERABLE_TYPES, DELIVERABLE_TYPE_LABELS) },
    { key: "app", title: "Microsoft 365 app", options: options(APPS, APP_LABELS) },
    { key: "audience", title: "Audience", options: options(AUDIENCES, AUDIENCE_LABELS) },
    { key: "format", title: "File format", options: options(FORMATS, FORMAT_LABELS) },
  ];

  const selectedCount = groups.reduce((sum, group) => sum + criteria[group.key].length, 0);

  function toggle(key: FacetKey, value: string, checked: boolean) {
    const current = criteria[key] as string[];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    // Any filter change returns to the first page.
    const query = serializeCatalogParams({ ...criteria, [key]: next, page: 1 });
    startTransition(() => router.replace(query ? `/catalog?${query}` : "/catalog", { scroll: false }));
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
        <Link href={criteria.q ? `/catalog?q=${encodeURIComponent(criteria.q)}` : "/catalog"} className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4">
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
          className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,100vw)] max-w-none bg-surface p-0 text-ink backdrop:bg-ink/40"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-rule px-5 py-3">
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
            <div className="border-t border-rule p-4">
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
