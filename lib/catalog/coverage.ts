import type { Phase, Template } from "./schema";

/** One numbered phase of the rollout and whether a set of templates reaches it. */
export type PhaseCoverage = { number: number; slug: string; name: string; covered: boolean };

/**
 * Which numbered phases a set of templates (the whole catalog's, for the portfolio) covers: one
 * entry per step, in rollout order. A step is covered when at least one of the templates belongs
 * to it. `number` is the step's own number, from 1, so the covered numbers can be handed to a tally
 * of the steps as they are. The unnumbered sections (Start here, Used at every step) are not steps
 * of the rollout and are left out.
 */
export function phaseCoverage(
  phases: readonly Phase[],
  templates: readonly Template[],
): PhaseCoverage[] {
  const reached = new Set(templates.map((template) => template.phase));
  return numberedPhases(phases).map((phase) => ({
    number: phase.number,
    slug: phase.slug,
    name: phase.name,
    covered: reached.has(phase.slug),
  }));
}

/** The numbered phases, in order: every section but Start here and Used at every step. */
export function numberedPhases<P extends Pick<Phase, "number">>(
  phases: readonly P[],
): (P & { number: number })[] {
  return phases
    .filter((phase): phase is P & { number: number } => phase.number !== undefined)
    .sort((a, b) => a.number - b.number);
}

/** The sections before and after one, in folder order; either is undefined at an end. */
export function adjacentPhases<P extends Pick<Phase, "slug" | "order">>(
  phases: readonly P[],
  slug: string,
): { previous?: P; next?: P } {
  const ordered = [...phases].sort((a, b) => a.order - b.order);
  const at = ordered.findIndex((phase) => phase.slug === slug);
  if (at === -1) return {};
  return { previous: ordered[at - 1], next: ordered[at + 1] };
}
