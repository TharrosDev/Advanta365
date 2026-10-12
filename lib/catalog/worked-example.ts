import type { Phase, Template } from "./schema";

/** Where a section of the worked example points in the catalog: one template, or a phase or step. */
export type ContentsTarget = { template: string } | { phase: string; step?: string };

/** One section of the worked example's table of contents, as the content file lists it. */
export type ContentsEntry = { title: string; see: ContentsTarget };

/** The catalog page a section links to, with what kind of page it is ("Template", "Step", "Phase"). */
export type ContentsLink = { kind: "Template" | "Step" | "Phase"; label: string; href: string };

/** A section ready to print: its title, and its link when the catalog has the page it names. */
export type ContentsRow = { title: string; link?: ContentsLink };

/**
 * Resolves each section's target against the catalog: a template links to its page under its own
 * title, a step to its anchor on the phase page under the step's name, a phase to its page. A
 * target the catalog does not hold leaves the section without a link, so a renamed slug never
 * prints a dead one.
 */
export function contentsRows(
  entries: readonly ContentsEntry[],
  templates: readonly Pick<Template, "slug" | "title">[],
  phases: readonly Pick<Phase, "slug" | "name" | "steps">[],
): ContentsRow[] {
  return entries.map(({ title, see }) => {
    const link = resolve(see, templates, phases);
    return link ? { title, link } : { title };
  });
}

function resolve(
  see: ContentsTarget,
  templates: readonly Pick<Template, "slug" | "title">[],
  phases: readonly Pick<Phase, "slug" | "name" | "steps">[],
): ContentsLink | undefined {
  if ("template" in see) {
    const template = templates.find((candidate) => candidate.slug === see.template);
    return template
      ? { kind: "Template", label: template.title, href: `/templates/${template.slug}` }
      : undefined;
  }
  const phase = phases.find((candidate) => candidate.slug === see.phase);
  if (!phase) return undefined;
  if (see.step === undefined) {
    return { kind: "Phase", label: phase.name, href: `/phases/${phase.slug}` };
  }
  const step = phase.steps.find((candidate) => candidate.slug === see.step);
  return step
    ? { kind: "Step", label: step.name, href: `/phases/${phase.slug}#${step.slug}` }
    : undefined;
}
