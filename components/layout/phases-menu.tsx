"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { currentPhase, singleCatalogPhase, type PhaseLink } from "@/components/layout/nav-links";
import { StepMenu } from "@/components/ui/step-menu";

type PhasesMenuProps = { phases: readonly PhaseLink[]; buttonClassName?: string };

/**
 * "Phases" in the bar's row, from 68em: the drop-down of the toolkit's thirteen sections. The
 * section being shown is marked in its list: `aria-current="page"` on the section's own page, and
 * `aria-current="true"` on the catalog while it is filtered on that section alone.
 *
 * Reading the search needs a Suspense boundary on a page rendered ahead of time; until it resolves
 * the menu is drawn from the pathname alone, which is all such a page needs.
 */
export function PhasesMenu(props: PhasesMenuProps) {
  return (
    <Suspense fallback={<Menu {...props} />}>
      <MenuWithSearch {...props} />
    </Suspense>
  );
}

function MenuWithSearch(props: PhasesMenuProps) {
  const search = useSearchParams();
  const catalogPhase = singleCatalogPhase(
    search.getAll("phase"),
    props.phases.map((phase) => phase.slug),
  );
  return <Menu {...props} catalogPhase={catalogPhase} />;
}

function Menu({
  phases,
  buttonClassName,
  catalogPhase,
}: PhasesMenuProps & { catalogPhase?: string }) {
  const pathname = usePathname();
  const current = currentPhase(pathname, catalogPhase);
  return (
    <StepMenu
      phases={phases}
      current={current?.slug}
      currentKind={current?.kind}
      label="Phases"
      variant="bar"
      buttonClassName={buttonClassName}
    />
  );
}
