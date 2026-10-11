import { ENTRY_SCRIPT_SOURCE } from "./entry-script-source";

/**
 * Inline pre-hydration script, rendered by the root layout as the first child of <body>.
 * It decides, before the first paint, whether this load plays the entry sequence
 * (see entry-script-source.ts for the logic and the rules that text must obey).
 */
export function EntryScript() {
  return <script dangerouslySetInnerHTML={{ __html: ENTRY_SCRIPT_SOURCE }} />;
}
