import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateCard } from "@/components/catalog/template-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getPhase, getPhases, getTemplates } from "@/lib/catalog/repository";

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
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: phase.name }]} />

      <header className="mt-8 max-w-3xl">
        <p className="text-accent text-sm font-medium">
          Phase {number} of {phases.length}
        </p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{phase.name}</h1>
        <p className="text-muted mt-4 text-lg">{phase.summary}</p>
      </header>

      <nav aria-label="Steps in this phase" className="mt-8 flex flex-wrap gap-2">
        {phase.steps.map((step, index) => (
          <a
            key={step.slug}
            href={`#${step.slug}`}
            className="border-rule bg-surface hover:border-accent inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium"
          >
            <span className="text-accent tabular-nums">
              {number}.{index + 1}
            </span>
            {step.name}
          </a>
        ))}
      </nav>

      {phase.steps.map((step, index) => {
        const inStep = inPhase.filter((t) => t.step === step.slug);
        return (
          <section
            key={step.slug}
            id={step.slug}
            className="border-rule mt-14 scroll-mt-6 border-t pt-10"
          >
            <p className="font-display text-accent text-xl tabular-nums">
              {number}.{index + 1}
            </p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{step.name}</h2>
            <p className="text-muted mt-2 max-w-2xl">{step.summary}</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inStep.map((template) => (
                <li key={template.slug}>
                  <TemplateCard template={template} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <div className="border-rule mt-14 border-t pt-10">
        <Button href={`/catalog?phase=${phase.slug}`} variant="secondary">
          View all {phase.name} templates
        </Button>
      </div>
    </Container>
  );
}
