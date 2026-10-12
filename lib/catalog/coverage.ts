import type { Phase, Template } from "./schema";

/** One rollout phase and whether a set of templates reaches it. */
export type PhaseCoverage = { order: number; slug: string; name: string; covered: boolean };

/**
 * Which phases a set of templates (the whole catalog's, for the portfolio) covers: one entry per
 * phase, in rollout order. A phase is covered when at least one of the templates belongs to it. `order` is the phase's
 * own 1-based position, so the covered orders can be handed to a seven-block tally as they are.
 */
export function phaseCoverage(
  phases: readonly Phase[],
  templates: readonly Template[],
): PhaseCoverage[] {
  const reached = new Set(templates.map((template) => template.phase));
  return [...phases]
    .sort((a, b) => a.order - b.order)
    .map((phase) => ({
      order: phase.order,
      slug: phase.slug,
      name: phase.name,
      covered: reached.has(phase.slug),
    }));
}
