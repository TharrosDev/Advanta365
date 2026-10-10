import { manageTemplates } from "./manage";
import { prepareTemplates } from "./prepare";
import { sustainTemplates } from "./sustain";

export const templates = [...prepareTemplates, ...manageTemplates, ...sustainTemplates];
