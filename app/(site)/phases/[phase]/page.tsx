import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StepNav } from "@/components/catalog/step-nav";
import { TemplateCard } from "@/components/catalog/template-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageTitle } from "@/components/layout/page-title";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { SectionShell } from "@/components/ui/section-shell";
import { WipeButton } from "@/components/ui/wipe-button";
import { getPhase, getPhases, getTemplates } from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./page.module.css";

type PhasePageProps = { params: Promise<{ phase: string }> };

export async function generateStaticParams() {
  return (await getPhases()).map((phase) => ({ phase: phase.slug }));
}

export async function generateMetadata({ params }: PhasePageProps): Promise<Metadata> {
  const phase = await getPhase((await params).phase);
  return phase ? { title: phase.name, description: phase.summary } : {};
}

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
    <PageShell>
      <PageTitle
        title={phase.name}
        lead={phase.summary}
        eyebrow={
          <>
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: phase.name }]} />
            <p className="t-label-medium c-fg-50">
              Phase {number} of {phases.length}
            </p>
          </>
        }
      />
      <Container>
        <StepNav steps={phase.steps} />
      </Container>

      {phase.steps.map((step, index) => {
        const inStep = inPhase.filter((t) => t.step === step.slug);
        return (
          <SectionShell key={step.slug} id={step.slug} innerClassName={styles.step}>
            <RevealGroup className={cx("ruled", styles.stepHeader)}>
              <Reveal as="p" effect="fade" index={0} className="t-headline-large">
                {number}.{index + 1}
              </Reveal>
              <h2 className={cx("t-display-fluid", styles.stepTitle)}>
                <RevealWords text={step.name} offset={1} />
              </h2>
              <p className={cx("t-body-large", "c-fg-60", styles.stepBody)}>
                <Reveal effect="fade" index={coarseIndexAfter(1 + countWords(step.name))}>
                  {step.summary}
                </Reveal>
              </p>
            </RevealGroup>
            <ul className={styles.grid}>
              {inStep.map((template) => (
                <li key={template.slug}>
                  <TemplateCard template={template} />
                </li>
              ))}
            </ul>
          </SectionShell>
        );
      })}

      <Container>
        <div className={cx("ruled", styles.footerAction)}>
          <WipeButton href={`/catalog?phase=${phase.slug}`} arrow="right">
            {`View all ${phase.name} templates`}
          </WipeButton>
        </div>
      </Container>
    </PageShell>
  );
}
