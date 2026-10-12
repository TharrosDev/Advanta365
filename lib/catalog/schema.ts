import { z } from "zod";
import { ADKAR, APPS, AUDIENCES, DELIVERABLE_TYPES, FORMATS } from "@/content/taxonomy";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be lower-case kebab");
const text = z.string().trim().min(1);

export const StepSchema = z.object({
  slug,
  name: text,
  summary: text,
  order: z.number().int(),
});

export const PhaseSchema = z.object({
  slug,
  name: text,
  summary: text,
  order: z.number().int(),
  steps: z.array(StepSchema).min(1),
});

export const TemplateSchema = z.object({
  slug,
  title: text,
  summary: text,
  description: text,
  phase: slug,
  step: slug,
  deliverableType: z.enum(DELIVERABLE_TYPES),
  apps: z.array(z.enum(APPS)).min(1),
  audiences: z.array(z.enum(AUDIENCES)).min(1),
  format: z.enum(FORMATS),
  adkar: z.array(z.enum(ADKAR)),
  pageCount: z.number().int().positive().optional(),
  includes: z.array(text).min(1),
  /** One of the six samples given away; every other template is part of the toolkit. */
  free: z.boolean(),
  isSample: z.boolean(),
});

export type Step = z.infer<typeof StepSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type DeliverableType = Template["deliverableType"];
export type App = Template["apps"][number];
export type Audience = Template["audiences"][number];
export type Format = Template["format"];

export type Catalog = {
  phases: Phase[];
  templates: Template[];
};
