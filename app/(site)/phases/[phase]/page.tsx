import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChainLockParts } from "@/components/catalog/chain-lock";
import { StepNav } from "@/components/catalog/step-nav";
import { TemplateTile, TileGrid } from "@/components/catalog/template-tile";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
import { DEFAULT_CRITERIA } from "@/lib/catalog/query";
import { getPhase, getPhases, getTemplates } from "@/lib/catalog/repository";
import { catalogHref } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
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
 * One rollout phase. The title block carries the trail and the links to the steps, over the ink,
 * with the phase numeral, its place among the phases and a tally standing beside them. Each step is
 * then a band of its own, desk and paper in turn: the step number and summary in the margin, the
 * step name and its templates as tiles beside them: a free sample links to the catalog, where it
 * opens in the pop-up, and every other tile is locked. The drawing the locks draw from
 * (`ChainLockParts`) is on the page once, ahead of the steps, for all their grids. The page ends
 * with a link to the phase in the catalog.
 */
export default async function PhasePage({ params }: PhasePageProps) {
  const [phase, phases, templates] = await Promise.all([
    getPhase((await params).phase),
    getPhases(),
    getTemplates(),
  ]);
  if (!phase) notFound();

  const number = phases.findIndex((p) => p.slug === phase.slug) + 1;
  const inPhase = templates.filter((t) => t.phase === phase.slug);

  return (
    <>
      <TitleBlock
        form="document"
        ink
        title={phase.name}
        lead={phase.summary}
        crumbs={<Breadcrumbs items={[{ href: "/", label: "Home" }, { label: phase.name }]} />}
        aside={
          <div className={styles.place}>
            <p
              className={cx("type-poster", styles.numeral)}
              aria-hidden="true"
              data-ink-calm="display"
            >
              {number}
            </p>
            <div className={styles.count} data-ink-calm="text">
              <p className="type-note">
                Phase {number} of {phases.length}
              </p>
              <Tally
                total={phases.length}
                filled={number - 1}
                marked={number}
                size="sm"
                className={styles.tally}
              />
            </div>
          </div>
        }
      >
        <StepNav steps={phase.steps} />
      </TitleBlock>

      {inPhase.some((template) => !template.free) ? <ChainLockParts /> : null}
      {phase.steps.map((step, index) => {
        const inStep = inPhase.filter((t) => t.step === step.slug);
        return (
          <Band
            key={step.slug}
            id={step.slug}
            surface={index % 2 === 0 ? "desk" : "paper"}
            innerClassName={styles.step}
          >
            <p className={styles.stepNumber}>
              {number}.{index + 1}
            </p>
            <h2 className={cx("type-page", styles.stepTitle)}>{step.name}</h2>
            <p className={cx("type-ui", styles.stepSummary)}>{step.summary}</p>
            <TileGrid className={styles.tiles} locks={false}>
              {inStep.map((template) => (
                <li key={template.slug}>
                  <TemplateTile
                    template={template}
                    phaseName={phase.name}
                    phaseOrder={number}
                    href={catalogHref(DEFAULT_CRITERIA, template.slug)}
                  />
                </li>
              ))}
            </TileGrid>
          </Band>
        );
      })}

      <Band as="div" surface="paper" pad="tight">
        <Split>
          <Button variant="outline" arrow href={`/catalog?phase=${phase.slug}`}>
            {`View all ${phase.name} templates`}
          </Button>
        </Split>
      </Band>
    </>
  );
}
