import { communicateTemplates } from "./communicate";
import { designTemplates } from "./design";
import { executeTemplates } from "./execute";
import { makeTheCaseTemplates } from "./make-the-case";
import { planTemplates } from "./plan";
import { prepareTemplates } from "./prepare";
import { sustainTemplates } from "./sustain";

// Listed in phase order: the home page shows the first featured entries it finds.
export const templates = [
  ...makeTheCaseTemplates,
  ...planTemplates,
  ...designTemplates,
  ...prepareTemplates,
  ...communicateTemplates,
  ...executeTemplates,
  ...sustainTemplates,
];
