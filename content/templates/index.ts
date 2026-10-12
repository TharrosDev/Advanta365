import { communicateTemplates } from "./communicate";
import { designTemplates } from "./design";
import { executeTemplates } from "./execute";
import { makeTheCaseTemplates } from "./make-the-case";
import { planTemplates } from "./plan";
import { prepareTemplates } from "./prepare";
import { sustainTemplates } from "./sustain";

// Listed in phase order: the free samples come out of this list in that order.
export const templates = [
  ...makeTheCaseTemplates,
  ...planTemplates,
  ...designTemplates,
  ...prepareTemplates,
  ...communicateTemplates,
  ...executeTemplates,
  ...sustainTemplates,
];
