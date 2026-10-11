"use client";

import { usePathname } from "next/navigation";
import { currentPhase, type PhaseLink, type TemplatePhases } from "@/components/layout/nav-links";
import { PhaseTabs } from "@/components/ui/phase-tabs";
import { Wrap } from "@/components/ui/wrap";
import styles from "./phase-rail.module.css";

/**
 * The strip of seven numbered tabs under the bar, from 68em only. The rail is paper like the bar
 * and the tabs are the colour of the page, so they read as pieces of the page reaching up into the
 * header. They stand on the rail's bottom edge. The rail is not sticky: it scrolls away.
 *
 * The tab of the phase being shown is current: `aria-current="page"` on the phase's own page,
 * `aria-current="true"` on the page of a template in that phase. A client component only because
 * it reads the pathname.
 */
export function PhaseRail({
  phases,
  templatePhases,
}: {
  phases: readonly PhaseLink[];
  templatePhases: TemplatePhases;
}) {
  const pathname = usePathname();
  const current = currentPhase(pathname, templatePhases);

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
