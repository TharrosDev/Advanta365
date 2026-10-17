import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhasePager } from "@/components/catalog/phase-pager";
import { TemplateTile, TileGrid } from "@/components/catalog/template-tile";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
import { adjacentPhases, numberedPhases } from "@/lib/catalog/coverage";
import { DEFAULT_CRITERIA } from "@/lib/catalog/query";
import { getPhase, getPhases, getTemplates } from "@/lib/catalog/repository";
import { catalogHref } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import { hasLicence } from "@/lib/licence/session";
import styles from "./page.module.css";

type PhasePageProps = { params: Promise<{ phase: string }> };

export async function generateStaticParams() {
  return (await getPhases()).map((phase) => ({ phase: phase.slug }));
}

export async function generateMetadata({ params }: PhasePageProps): Promise<Metadata> {
  const phase = await getPhase((await params).phase);
  return phase ? { title: phase.name, description: phase.summary } : {};
}

/**
 * One section of the toolkit: one of its folders. The title block carries the trail and the
 * summary, over the ink; beside them a numbered phase has its numeral, its place among the phases
 * and a tally, and Start here and Used at every step, which are not steps, have a line that says
 * where they stand instead. The templates follow as tiles on one band: a free sample links to the
 * catalog, where it opens in the pop-up, and every other tile is locked, unless the browser holds a
 * licence (`hasLicence`, which makes the page render on every request): then every tile opens.
 * Every tile is of this section, so a tile names only its type. The page ends with a link to the
 * section in the catalog and the links to the sections before and after it.
 */
export default async function PhasePage({ params }: PhasePageProps) {
  const [phase, phases, templates, licensed] = await Promise.all([
    getPhase((await params).phase),
    getPhases(),
    getTemplates(),
    hasLicence(),
  ]);
  if (!phase) notFound();

  const steps = numberedPhases(phases);
  const inPhase = templates.filter((t) => t.phase === phase.slug);
  const { previous, next } = adjacentPhases(phases, phase.slug);
  const isFirst = phase.order < (steps[0]?.order ?? 0);

  return (
    <>
      <TitleBlock
        form="document"
        title={phase.name}
        lead={phase.summary}
        crumbs={<Breadcrumbs items={[{ href: "/", label: "Home" }, { label: phase.name }]} />}
        aside={
          phase.number === undefined ? (
            <p className={cx("type-note", styles.apart)}>
              {isFirst ? "Before phase 1" : `Alongside phases 1 to ${steps.length}`}
            </p>
          ) : (
            <div className={styles.place}>
              <p className={cx("type-poster", styles.numeral)} aria-hidden="true">
                {phase.number}
              </p>
              <div className={styles.count}>
                <p className="type-note">
                  Phase {phase.number} of {steps.length}
                </p>
                <Tally
                  total={steps.length}
                  filled={phase.number - 1}
                  marked={phase.number}
                  size="sm"
                  className={styles.tally}
                />
              </div>
            </div>
          )
        }
      />

      <Band surface="desk">
        <h2 className="visually-hidden">Templates</h2>
        <TileGrid>
          {inPhase.map((template) => (
            <li key={template.slug}>
              <TemplateTile
                template={template}
                phaseNumber={phase.number}
                href={catalogHref(DEFAULT_CRITERIA, template.slug)}
                unlocked={licensed}
              />
            </li>
          ))}
        </TileGrid>
      </Band>

      <Band as="div" surface="paper" pad="tight">
        <Split contentClassName={styles.foot}>
          <Button
            variant="outline"
            arrow
            href={catalogHref({ ...DEFAULT_CRITERIA, phase: [phase.slug] })}
          >
            {`View all ${phase.name} templates`}
          </Button>
          <PhasePager previous={previous} next={next} className={styles.pager} />
        </Split>
      </Band>
    </>
  );
}
