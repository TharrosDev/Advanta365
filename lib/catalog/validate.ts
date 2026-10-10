import type { z } from "zod";
import { BundleSchema, PhaseSchema, TemplateSchema, type Catalog } from "./schema";

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
export function validateCatalog(input: {
  phases: unknown[];
  templates: unknown[];
  bundles: unknown[];
}): Catalog {
  const phases = parseAll("phase", PhaseSchema, input.phases)
    .map((phase) => ({ ...phase, steps: [...phase.steps].sort(byOrder) }))
    .sort(byOrder);
  const templates = parseAll("template", TemplateSchema, input.templates);
  const bundles = parseAll("bundle", BundleSchema, input.bundles);

  assertUniqueSlugs("phase", phases);
  assertUniqueSlugs("template", templates);
  assertUniqueSlugs("bundle", bundles);
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

  const templateSlugs = new Set(templates.map((t) => t.slug));
  for (const bundle of bundles) {
    for (const templateSlug of bundle.templateSlugs) {
      if (!templateSlugs.has(templateSlug)) {
        throw new CatalogError(
          `Bundle "${bundle.slug}" references missing template "${templateSlug}"`,
        );
      }
    }
  }

  return { phases, templates, bundles };
}
