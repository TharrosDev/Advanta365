import { z } from "zod";
import { ADKAR, APPS, AUDIENCES, DELIVERABLE_TYPES, FORMATS } from "@/content/taxonomy";
import { extensionOf } from "@/lib/files/types";

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

/**
 * One file a template is delivered as. `key` is where the file store keeps it and is never shown;
 * `name` is the file name the buyer saves; `id` names the file in its download address.
 */
export const TemplateFileSchema = z.object({
  id: slug,
  name: z
    .string()
    .max(120)
    .regex(/^[A-Za-z0-9][A-Za-z0-9 ._()-]*$/, "must be letters, digits, spaces and . _ ( ) -")
    .refine((name) => extensionOf(name) !== undefined, "must end in an allowed extension"),
  key: z
    .string()
    .regex(/^[a-z0-9._-]+(\/[a-z0-9._-]+)*$/, "must be lower-case segments joined by /")
    .refine(
      (key) => key.split("/").every((segment) => segment !== "." && segment !== ".."),
      "must not contain . or .. segments",
    ),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/, "must be 64 lower-case hex characters"),
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
  /** The files a buyer downloads. A real record has at least one; a sample may have none. */
  files: z.array(TemplateFileSchema).default([]),
});

export type Step = z.infer<typeof StepSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type TemplateFile = z.infer<typeof TemplateFileSchema>;
export type DeliverableType = Template["deliverableType"];
export type App = Template["apps"][number];
export type Audience = Template["audiences"][number];
export type Format = Template["format"];

export type Catalog = {
  phases: Phase[];
  templates: Template[];
};
