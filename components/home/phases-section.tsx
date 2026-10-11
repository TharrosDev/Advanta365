import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import type { Phase } from "@/lib/catalog/schema";
import styles from "./home.module.css";

/**
 * `#phases`: a label strip, a sticky intro on the left (from 1024px) and the three phases as ruled
 * cards on the right. Each card's title is the one link to `/phases/{slug}` and its accessible name
 * is exactly the phase name.
 *
 * Reveal order: label 0 (its own group); intro words 1..4 on the fine step and the body on coarse 4;
 * cards 0..n-1 in a group of their own.
 */
export function PhasesSection({ phases }: { phases: Phase[] }) {
  return (
    <SectionShell id="phases" height="full" innerClassName={styles.phases}>
      <RevealGroup>
        <Reveal as="div" effect="fade" index={0}>
          <SectionLabel>Catalog</SectionLabel>
        </Reveal>
      </RevealGroup>
      <RevealGroup className={styles.phasesIntro}>
        <SectionIntro
          title="Templates for every phase"
          body="Templates are organized by the three phases of a rollout, so you can find what you need now and see what comes next."
          wordOffset={1}
        />
      </RevealGroup>
      <div className={styles.phasesGrid}>
        <RevealGroup as="ul" className={styles.phasesList}>
          {phases.map((phase, index) => (
            <Reveal key={phase.slug} as="li" effect="fade-up" index={index}>
              <DetailCard title={phase.name} href={`/phases/${phase.slug}`} body={phase.summary} />
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </SectionShell>
  );
}
