import type { z } from "zod";
import { PhaseSchema, TemplateSchema, type Catalog } from "./schema";

/** How many templates are given away as samples. */
export const FREE_SAMPLE_COUNT = 6;

export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogError";
  }
}

function parseAll<T>(kind: string, schema: z.ZodType<T>, records: unknown[]): T[] {
  return records.map((record, index) => {
    const result = schema.safeParse(record);
    if (result.success) return result.data;
    const slug =
      typeof record === "object" && record !== null && "slug" in record
        ? String(record.slug)
        : `#${index}`;
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(record)"}: ${issue.message}`)
      .join("; ");
    throw new CatalogError(`Invalid ${kind} "${slug}" — ${issues}`);
  });
}

function assertUniqueSlugs(kind: string, records: { slug: string }[]) {
  const seen = new Set<string>();
  for (const { slug } of records) {
    if (seen.has(slug)) throw new CatalogError(`Duplicate ${kind} slug "${slug}"`);
    seen.add(slug);
  }
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/** Parses raw catalog content and checks cross-references. Throws CatalogError naming the record at fault. */
export function validateCatalog(input: { phases: unknown[]; templates: unknown[] }): Catalog {
  const phases = parseAll("phase", PhaseSchema, input.phases)
    .map((phase) => ({ ...phase, steps: [...phase.steps].sort(byOrder) }))
    .sort(byOrder);
  const templates = parseAll("template", TemplateSchema, input.templates);

  assertUniqueSlugs("phase", phases);
  assertUniqueSlugs("template", templates);
  for (const phase of phases) assertUniqueSlugs(`step in phase "${phase.slug}"`, phase.steps);

  const stepsByPhase = new Map(phases.map((p) => [p.slug, new Set(p.steps.map((s) => s.slug))]));
  for (const template of templates) {
    const steps = stepsByPhase.get(template.phase);
    if (!steps) {
      throw new CatalogError(`Template "${template.slug}" has unknown phase "${template.phase}"`);
    }
    if (!steps.has(template.step)) {
      throw new CatalogError(
        `Template "${template.slug}" has step "${template.step}" which is not in phase "${template.phase}"`,
      );
    }
  }

  const keys = new Set<string>();
  for (const template of templates) {
    if (!template.isSample && template.files.length === 0) {
      throw new CatalogError(`Template "${template.slug}" is not a sample and has no files`);
    }
    const ids = new Set<string>();
    for (const file of template.files) {
      if (ids.has(file.id)) {
        throw new CatalogError(`Duplicate file id "${file.id}" in template "${template.slug}"`);
      }
      ids.add(file.id);
      if (keys.has(file.key)) throw new CatalogError(`Duplicate file key "${file.key}"`);
      keys.add(file.key);
    }
  }

  const freeCount = templates.filter((template) => template.free).length;
  if (freeCount !== FREE_SAMPLE_COUNT) {
    throw new CatalogError(
      `Expected exactly ${FREE_SAMPLE_COUNT} free templates, found ${freeCount}`,
    );
  }

  return { phases, templates };
}
