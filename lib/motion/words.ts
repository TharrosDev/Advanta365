export type WordToken = { kind: "word" | "space"; text: string };

/** Splits a sentence into word and whitespace tokens. Joining the tokens gives the input back. */
export function splitWords(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (part === "") continue;
    tokens.push({ kind: /^\s+$/.test(part) ? "space" : "word", text: part });
  }
  return tokens;
}

export function countWords(text: string): number {
  let count = 0;
  for (const token of splitWords(text)) {
    if (token.kind === "word") count += 1;
  }
  return count;
}

/**
 * Converts "next free fine index" (50ms steps) into the coarse index (100ms steps) that starts
 * after the last word of a heading has begun to rise.
 */
export function coarseIndexAfter(nextFineIndex: number): number {
  return Math.ceil(nextFineIndex / 2) + 1;
}
