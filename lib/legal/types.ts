/** A link inside a sentence. */
export type LegalLink = { readonly href: string; readonly text: string };

/** Running text: a plain string, or strings and links in reading order. */
export type Rich = string | readonly (string | LegalLink)[];

export type LegalBlock =
  | { readonly kind: "p"; readonly text: Rich }
  | { readonly kind: "list"; readonly items: readonly Rich[] }
  /** Named things with what is said about each: a `dl`. */
  | { readonly kind: "terms"; readonly rows: readonly { term: string; text: Rich }[] }
  /** A subsection heading (`h3`) with an anchor of its own. */
  | { readonly kind: "heading"; readonly id: string; readonly title: string };

/** One numbered section of a document: an `h2` with an anchor, and what stands under it. */
export type LegalSection = {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  /** The page's address, one of `LEGAL_LINKS`. */
  readonly href: string;
  /** The page's title and its one `h1`. */
  readonly title: string;
  /** The description for search results and shared links. */
  readonly description: string;
  /** The summary under the title, one or two sentences. */
  readonly summary: string;
  /** The page in a few plain points, set before the first section. */
  readonly points: readonly string[];
  readonly sections: readonly LegalSection[];
};

export const link = (href: string, text: string): LegalLink => ({ href, text });

export const p = (...text: (string | LegalLink)[]): LegalBlock => ({
  kind: "p",
  text: text.length === 1 && typeof text[0] === "string" ? text[0] : text,
});

export const list = (...items: Rich[]): LegalBlock => ({ kind: "list", items });

export const terms = (...rows: [term: string, text: Rich][]): LegalBlock => ({
  kind: "terms",
  rows: rows.map(([term, text]) => ({ term, text })),
});

export const heading = (id: string, title: string): LegalBlock => ({ kind: "heading", id, title });

/** Running text as plain words, links included: what a test or a search reads. */
export function plain(text: Rich): string {
  if (typeof text === "string") return text;
  return text.map((part) => (typeof part === "string" ? part : part.text)).join("");
}
