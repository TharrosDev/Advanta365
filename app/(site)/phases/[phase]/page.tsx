import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StepNav } from "@/components/catalog/step-nav";
import { TemplateCard } from "@/components/catalog/template-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TitleBlock } from "@/components/layout/title-block";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Split } from "@/components/ui/split";
import { Tally } from "@/components/ui/tally";
import { getPhase, getPhases, getTemplates } from "@/lib/catalog/repository";
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
 * One rollout phase. The title block carries the trail, the phase numeral with its place among the
 * phases, and links to the steps. Each step is then a band of its own, paper and desk in turn: the
 * step number and summary in the margin, the step name and its templates beside them. The page ends
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
        title={phase.name}
        lead={phase.summary}
        crumbs={<Breadcrumbs items={[{ href: "/", label: "Home" }, { label: phase.name }]} />}
        meta={
          <div className={styles.place}>
            <p className={cx("type-figure", styles.numeral)} aria-hidden="true">
              {number}
            </p>
            <div className={styles.count}>
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
            surface={index % 2 === 0 ? "paper" : "desk"}
            innerClassName={styles.step}
          >
            <p className={styles.stepNumber}>
              {number}.{index + 1}
            </p>
            <h2 className={cx("type-section", styles.stepTitle)}>{step.name}</h2>
            <p className={cx("type-ui", styles.stepSummary)}>{step.summary}</p>
            <ul className={styles.cards}>
              {inStep.map((template) => (
                <li key={template.slug}>
                  <TemplateCard template={template} />
                </li>
              ))}
            </ul>
          </Band>
        );
      })}

      <Band as="div" surface={phase.steps.length % 2 === 0 ? "paper" : "desk"} pad="tight">
        <Split>
          <Button variant="outline" arrow href={`/catalog?phase=${phase.slug}`}>
            {`View all ${phase.name} templates`}
          </Button>
        </Split>
      </Band>
    </>
  );
}
