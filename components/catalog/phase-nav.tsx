import Link from "next/link";
import type { Phase } from "@/lib/catalog/schema";

/** The three rollout phases as numbered entry points, in order. */
export function PhaseNav({ phases }: { phases: Phase[] }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-3">
      {phases.map((phase, index) => (
        <li key={phase.slug} className="group relative bg-surface p-6 transition-colors hover:bg-accent-soft sm:p-8">
          <p className="font-display text-5xl font-semibold text-accent tabular-nums">{index + 1}</p>
          <h3 className="mt-4 text-2xl font-semibold">
            <Link href={`/phases/${phase.slug}`} className="after:absolute after:inset-0">
              {phase.name}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-muted">{phase.summary}</p>
          <ul className="mt-5 space-y-1.5 border-t border-rule pt-4 text-sm">
            {phase.steps.map((step) => (
              <li key={step.slug}>{step.name}</li>
            ))}
          </ul>
          <p className="mt-5 text-sm font-medium text-accent underline-offset-4 group-hover:underline">
            Browse {phase.name} templates
          </p>
        </li>
      ))}
    </ol>
  );
}
