import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BundleCard } from "@/components/catalog/bundle-card";
import { PhasePager } from "@/components/catalog/phase-pager";
import { StepNav } from "@/components/catalog/step-nav";
import { TemplateCard } from "@/components/catalog/template-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
import { adjacentPhases, bundlesForPhase, phaseCoverage } from "@/lib/catalog/coverage";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import {
  getBundleTemplates,
  getBundles,
  getPhase,
  getPhases,
  getTemplates,
} from "@/lib/catalog/repository";
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
 * step name and its templates as index rows beside them; every row is of this phase, so a row names
 * only its type. The bundles that hold templates of the phase follow, the most focused first, each
 * saying how many of the phase's templates it holds. The page ends with a link to the phase in the
 * catalog and the links to the phases before and after it.
 */
export default async function PhasePage({ params }: PhasePageProps) {
  const [phase, phases, templates, bundles] = await Promise.all([
    getPhase((await params).phase),
    getPhases(),
    getTemplates(),
    getBundles(),
  ]);
  if (!phase) notFound();

  const number = phases.findIndex((p) => p.slug === phase.slug) + 1;
  const inPhase = templates.filter((t) => t.phase === phase.slug);
  const { previous, next } = adjacentPhases(phases, phase.slug);
  const offers = await Promise.all(
    bundlesForPhase(phase.slug, bundles, templates).map(async ({ bundle, inPhase: held }) => {
      const contents = await getBundleTemplates(bundle);
      return {
        bundle,
        held,
        count: contents.length,
        savings: bundleSavingsCents(bundle, contents),
        coverage: phaseCoverage(phases, contents),
      };
    }),
  );
  // The bands after the steps carry on the alternation of desk and paper.
  const surfaceAt = (position: number) => (position % 2 === 0 ? "desk" : "paper");
  const afterSteps = phase.steps.length;

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

      {phase.steps.map((step, index) => {
        const inStep = inPhase.filter((t) => t.step === step.slug);
        return (
          <Band
            key={step.slug}
            id={step.slug}
            surface={surfaceAt(index)}
            innerClassName={styles.step}
          >
            <p className={styles.stepNumber}>
              {number}.{index + 1}
            </p>
            <h2 className={cx("type-page", styles.stepTitle)}>{step.name}</h2>
            <p className={cx("type-ui", styles.stepSummary)}>{step.summary}</p>
            <ul className={styles.rows}>
              {inStep.map((template) => (
                <li key={template.slug}>
                  <TemplateCard template={template} phaseOrder={number} />
                </li>
              ))}
            </ul>
          </Band>
        );
      })}

      {offers.length > 0 ? (
        <Band surface={surfaceAt(afterSteps)} aria-labelledby="phase-bundles">
          <Split
            margin={
              <div className={styles.offerHead}>
                <h2 id="phase-bundles" className="type-section">
                  {offers.length === 1 ? "Bundle with this phase" : "Bundles with this phase"}
                </h2>
                <p className={cx("type-copy", styles.offerBody)}>
                  {`${phase.name} templates, priced below the same pieces bought one at a time.`}
                </p>
              </div>
            }
          >
            <ul className={styles.offers}>
              {offers.map(({ bundle, held, count, savings, coverage }) => (
                <li key={bundle.slug}>
                  <BundleCard
                    bundle={bundle}
                    templateCount={count}
                    savingsCents={savings}
                    coverage={coverage}
                    detail={
                      held === inPhase.length
                        ? `Holds all ${inPhase.length} ${phase.name} templates.`
                        : `Holds ${held} of the ${inPhase.length} ${phase.name} templates.`
                    }
                  />
                </li>
              ))}
            </ul>
          </Split>
        </Band>
      ) : null}

      <Band as="div" surface={surfaceAt(afterSteps + (offers.length > 0 ? 1 : 0))} pad="tight">
        <Split contentClassName={styles.foot}>
          <Button variant="outline" arrow href={`/catalog?phase=${phase.slug}`}>
            {`View all ${phase.name} templates`}
          </Button>
          <PhasePager previous={previous} next={next} className={styles.pager} />
        </Split>
      </Band>
    </>
  );
}
