import { DEFAULT_CRITERIA } from "./query";
import type { Phase, Template } from "./schema";
import { catalogHref, phaseHref } from "./search-params";

/** Where a section of the worked example points in the catalog: one template, or a step. */
type ContentsTarget = { template: string } | { phase: string };

/** One section of the worked example's table of contents, as the content file lists it. */
export type ContentsEntry = { title: string; see: ContentsTarget };

/**
 * The place in the catalog a section names, with what kind of place it is ("Template", "Step").
 * Without an `href` it is a locked template: named, in plain text, and not a link.
 */
type ContentsLink = { kind: "Template" | "Phase"; label: string; href?: string };

/** A section ready to print: its title, and its place when the catalog has the one it names. */
export type ContentsRow = { title: string; link?: ContentsLink };

/**
 * Resolves each section's target against the catalog: a free sample links to the catalog with
 * `view` set to it, under its own title (it opens in the pop-up there); a locked template is named
 * by its title without a link, since the catalog has nothing to open for it; a step links to its
 * page. A target the catalog does
 * not hold leaves the section without a place, so a renamed slug never prints a dead one.
 */
export function contentsRows(
  entries: readonly ContentsEntry[],
  templates: readonly Pick<Template, "slug" | "title" | "free">[],
  phases: readonly Pick<Phase, "slug" | "name">[],
): ContentsRow[] {
  return entries.map(({ title, see }) => {
    const link = resolve(see, templates, phases);
    return link ? { title, link } : { title };
  });
}

function resolve(
  see: ContentsTarget,
  templates: readonly Pick<Template, "slug" | "title" | "free">[],
  phases: readonly Pick<Phase, "slug" | "name">[],
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
  return phase ? { kind: "Phase", label: phase.name, href: phaseHref(phase.slug) } : undefined;
}
