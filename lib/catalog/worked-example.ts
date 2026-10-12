import { DEFAULT_CRITERIA } from "./query";
import type { Phase, Template } from "./schema";
import { catalogHref } from "./search-params";

/** Where a section of the worked example points in the catalog: one template, or a phase or step. */
export type ContentsTarget = { template: string } | { phase: string; step?: string };

/** One section of the worked example's table of contents, as the content file lists it. */
export type ContentsEntry = { title: string; see: ContentsTarget };

/**
 * The place in the catalog a section names, with what kind of place it is ("Template", "Step",
 * "Phase"). Without an `href` it is a locked template: named, in plain text, and not a link.
 */
export type ContentsLink = { kind: "Template" | "Step" | "Phase"; label: string; href?: string };

/** A section ready to print: its title, and its place when the catalog has the one it names. */
export type ContentsRow = { title: string; link?: ContentsLink };

/**
 * Resolves each section's target against the catalog: a free sample links to the catalog with
 * `view` set to it, under its own title (it opens in the pop-up there); a locked template is named
 * by its title without a link, since the catalog has nothing to open for it; a step links to its
 * anchor on the phase page under the step's name, a phase to its page. A target the catalog does
 * not hold leaves the section without a place, so a renamed slug never prints a dead one.
 */
export function contentsRows(
  entries: readonly ContentsEntry[],
  templates: readonly Pick<Template, "slug" | "title" | "free">[],
  phases: readonly Pick<Phase, "slug" | "name" | "steps">[],
): ContentsRow[] {
  return entries.map(({ title, see }) => {
    const link = resolve(see, templates, phases);
    return link ? { title, link } : { title };
  });
}

function resolve(
  see: ContentsTarget,
  templates: readonly Pick<Template, "slug" | "title" | "free">[],
  phases: readonly Pick<Phase, "slug" | "name" | "steps">[],
): ContentsLink | undefined {
  if ("template" in see) {
    const template = templates.find((candidate) => candidate.slug === see.template);
    if (!template) return undefined;
    return template.free
      ? {
          kind: "Template",
          label: template.title,
          href: catalogHref(DEFAULT_CRITERIA, template.slug),
        }
      : { kind: "Template", label: template.title };
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
