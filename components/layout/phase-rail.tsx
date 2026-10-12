"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { currentPhase, singleCatalogPhase, type PhaseLink } from "@/components/layout/nav-links";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { Wrap } from "@/components/ui/wrap";
import styles from "./phase-rail.module.css";

type PhaseRailProps = { phases: readonly PhaseLink[] };

/**
 * The strip of seven numbered tabs under the bar, from 68em only. The rail is a strip of the desk
 * and the tabs are sheets of paper on it, standing on its bottom edge. The rail is not sticky: it
 * scrolls away.
 *
 * The tab of the phase being shown is current: `aria-current="page"` on the phase's own page, and
 * `aria-current="true"` on the catalog while it is filtered on that phase alone. A client
 * component because it reads the pathname and the search.
 *
 * Reading the search needs a Suspense boundary on a page rendered ahead of time; until it resolves
 * the rail is drawn from the pathname alone, which is all such a page needs.
 */
export function PhaseRail(props: PhaseRailProps) {
  return (
    <Suspense fallback={<Rail {...props} />}>
      <RailWithSearch {...props} />
    </Suspense>
  );
}

function RailWithSearch(props: PhaseRailProps) {
  const search = useSearchParams();
  const catalogPhase = singleCatalogPhase(
    search.getAll("phase"),
    props.phases.map((phase) => phase.slug),
  );
  return <Rail {...props} catalogPhase={catalogPhase} />;
}

function Rail({ phases, catalogPhase }: PhaseRailProps & { catalogPhase?: string }) {
  const pathname = usePathname();
  const current = currentPhase(pathname, catalogPhase);

  return (
    <nav aria-label="Phases" data-phase-rail="" className={styles.root}>
      <Wrap className={styles.inner}>
        <PhaseTabs
          phases={phases}
          current={current?.slug}
          currentKind={current?.kind}
          size="rail"
          className={styles.tabs}
        />
      </Wrap>
    </nav>
  );
}
