type TextPart = { kind: "text" | "compound"; text: string };

/** A run without whitespace that has a hyphen inside it, with a character on each side of the hyphen. */
const COMPOUND = /(\S*[^\s-]-[^\s-]\S*)/;

/**
 * Splits a title into plain text and hyphenated compounds ("ready-to-use", "End-User", "Go/No-Go"):
 * the words a browser may break in two after a hyphen. Punctuation stays attached to its compound.
 * Joining the parts gives the input back.
 */
export function splitCompounds(text: string): TextPart[] {
  const parts: TextPart[] = [];
  // split() with one capture group alternates plain text (even) and compounds (odd).
  text.split(COMPOUND).forEach((part, index) => {
    if (part === "") return;
    parts.push({ kind: index % 2 === 1 ? "compound" : "text", text: part });
  });
  return parts;
}
