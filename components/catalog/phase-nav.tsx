import Link from "next/link";
import type { Phase } from "@/lib/catalog/schema";

/** The three rollout phases as numbered entry points, in order. */
export function PhaseNav({ phases }: { phases: Phase[] }) {
  return (
    <ol className="border-rule bg-rule grid gap-px overflow-hidden rounded-lg border md:grid-cols-3">
      {phases.map((phase, index) => (
        <li
          key={phase.slug}
          className="group bg-surface hover:bg-accent-soft relative p-6 transition-colors sm:p-8"
        >
          <p className="font-display text-accent text-5xl font-semibold tabular-nums">
            {index + 1}
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            <Link href={`/phases/${phase.slug}`} className="after:absolute after:inset-0">
              {phase.name}
            </Link>
          </h3>
          <p className="text-muted mt-2 text-sm">{phase.summary}</p>
          <ul className="border-rule mt-5 space-y-1.5 border-t pt-4 text-sm">
            {phase.steps.map((step) => (
              <li key={step.slug}>{step.name}</li>
            ))}
          </ul>
          <p className="text-accent mt-5 text-sm font-medium underline-offset-4 group-hover:underline">
            Browse {phase.name} templates
          </p>
        </li>
      ))}
    </ol>
  );
}
