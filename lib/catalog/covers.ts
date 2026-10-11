import type { DeliverableType, Format, Phase, Template } from "./schema";

/** What a small `TemplateCover` needs to draw a template: its kind, its format and its phase's numeral. */
export type CoverSpec = {
  slug: string;
  type: DeliverableType;
  format: Format;
  /** The 1-based order of the template's phase; absent when the phase is unknown. */
  phaseOrder?: number;
};

/** How many sheets stand in a bundle's folder. */
export const FOLDER_SHEETS = 3;

/** The cover of one template, with the numeral of its phase when the phase is among `phases`. */
export function coverSpec(
  template: Pick<Template, "slug" | "deliverableType" | "format" | "phase">,
  phases: readonly Pick<Phase, "slug" | "order">[],
): CoverSpec {
  const phase = phases.find((p) => p.slug === template.phase);
  return {
    slug: template.slug,
    type: template.deliverableType,
    format: template.format,
    ...(phase ? { phaseOrder: phase.order } : {}),
  };
}

/**
 * The sheets that stand in a bundle's folder: the covers of its first `limit` templates (three by
 * default), in the bundle's own order, so the folder shows what the bundle opens with.
 */
export function folderCovers(
  templates: readonly Pick<Template, "slug" | "deliverableType" | "format" | "phase">[],
  phases: readonly Pick<Phase, "slug" | "order">[],
  limit: number = FOLDER_SHEETS,
): CoverSpec[] {
  return templates
    .slice(0, Math.max(0, Math.floor(limit)))
    .map((template) => coverSpec(template, phases));
}
