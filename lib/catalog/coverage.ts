import type { Bundle, Phase, Template } from "./schema";

/** One rollout phase and whether a set of templates reaches it. */
export type PhaseCoverage = { order: number; slug: string; name: string; covered: boolean };

/**
 * Which phases a set of templates (a bundle's, usually) covers: one entry per phase, in rollout
 * order. A phase is covered when at least one of the templates belongs to it. `order` is the phase's
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

/**
 * The covered phases as words: "Covers phase 4", "Covers phases 3–4", "Covers phases 1–2, 5" (runs
 * of neighbouring phases are joined with an en dash). An empty string when nothing is covered.
 */
export function coverageLabel(coverage: readonly PhaseCoverage[]): string {
  const orders = coverage
    .filter((phase) => phase.covered)
    .map((phase) => phase.order)
    .sort((a, b) => a - b);
  if (orders.length === 0) return "";

  const runs: [number, number][] = [];
  for (const order of orders) {
    const last = runs.at(-1);
    if (last && order === last[1] + 1) last[1] = order;
    else runs.push([order, order]);
  }
  const parts = runs.map(([from, to]) => (from === to ? String(from) : `${from}–${to}`));
  return `Covers ${orders.length === 1 ? "phase" : "phases"} ${parts.join(", ")}`;
}

/** A bundle that holds templates of one phase, with how many of them and how many in all. */
export type PhaseOffer<B> = { bundle: B; inPhase: number; total: number };

/**
 * The bundles that hold at least one template of a phase, the most focused first: by the share of
 * the bundle that belongs to the phase, then by how many of the phase's templates it holds, then by
 * price. A kit for the phase comes before a whole-rollout bundle that also reaches it.
 */
export function bundlesForPhase<B extends Pick<Bundle, "templateSlugs" | "priceCents">>(
  phaseSlug: string,
  bundles: readonly B[],
  templates: readonly Pick<Template, "slug" | "phase">[],
): PhaseOffer<B>[] {
  const phaseOf = new Map(templates.map((template) => [template.slug, template.phase]));
  return bundles
    .map((bundle) => ({
      bundle,
      inPhase: bundle.templateSlugs.filter((slug) => phaseOf.get(slug) === phaseSlug).length,
      total: bundle.templateSlugs.length,
    }))
    .filter((offer) => offer.inPhase > 0)
    .sort(
      (a, b) =>
        b.inPhase / b.total - a.inPhase / a.total ||
        b.inPhase - a.inPhase ||
        a.bundle.priceCents - b.bundle.priceCents,
    );
}

/** The phases before and after one, in rollout order; either is undefined at an end. */
export function adjacentPhases<P extends Pick<Phase, "slug" | "order">>(
  phases: readonly P[],
  slug: string,
): { previous?: P; next?: P } {
  const ordered = [...phases].sort((a, b) => a.order - b.order);
  const at = ordered.findIndex((phase) => phase.slug === slug);
  if (at === -1) return {};
  return { previous: ordered[at - 1], next: ordered[at + 1] };
}
