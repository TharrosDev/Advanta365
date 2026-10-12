import { DETAIL_FIELDS, EMPTY_DETAILS, ORDER_CODE, type DetailsDraft } from "./schema";

/**
 * The order while it is being written. There is no backend: the draft lives in this tab's session
 * storage and nowhere else, so a refresh, or a visit to the Terms, does not lose it, and closing the
 * tab forgets it. It is never sent anywhere and never written into an address.
 */
export type Draft = {
  details: DetailsDraft;
  /** The buyer ticked "I agree" on the review. */
  agreed: boolean;
  /** The order's code and the moment it was given, once the review has been confirmed. */
  reference: string | null;
  createdAt: string | null;
};

export const EMPTY_DRAFT: Draft = {
  details: EMPTY_DETAILS,
  agreed: false,
  reference: null,
  createdAt: null,
};

/** The key of the draft in session storage. */
export const DRAFT_KEY = "advanta365:checkout";

/** No stored value is longer than this; anything longer is not something the form wrote. */
const MAX_VALUE = 2000;

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/**
 * Reads a stored draft. Whatever is missing, of the wrong type or too long becomes its empty value,
 * so a draft from an older version of the form, or text that is not a draft at all, is never an
 * error: the worst it can be is an empty form.
 */
export function readDraft(raw: string | null | undefined): Draft {
  if (!raw) return EMPTY_DRAFT;
  let stored: Record<string, unknown>;
  try {
    stored = record(JSON.parse(raw));
  } catch {
    return EMPTY_DRAFT;
  }

  const typed = record(stored.details);
  const details = { ...EMPTY_DETAILS };
  for (const field of DETAIL_FIELDS) {
    const value = typed[field];
    if (typeof value === "string" && value.length <= MAX_VALUE) details[field] = value;
  }

  const reference =
    typeof stored.reference === "string" && ORDER_CODE.test(stored.reference)
      ? stored.reference
      : null;
  const createdAt =
    reference !== null &&
    typeof stored.createdAt === "string" &&
    !Number.isNaN(Date.parse(stored.createdAt))
      ? stored.createdAt
      : null;

  return {
    details,
    agreed: stored.agreed === true,
    reference: createdAt === null ? null : reference,
    createdAt,
  };
}

/** A draft as it is stored. */
export function writeDraft(draft: Draft): string {
  return JSON.stringify(draft);
}

const listeners = new Set<() => void>();

/** The draft of a tab whose storage is blocked: kept for as long as the page lives. */
let held = "";

function stored(): string {
  try {
    return window.sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return held;
  }
}

function store(value: string): void {
  held = value;
  try {
    if (value) window.sessionStorage.setItem(DRAFT_KEY, value);
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage is blocked or full: the draft lasts as long as this page does.
  }
  for (const listener of listeners) listener();
}

/**
 * The stored draft as something a component can read while it renders (`useSyncExternalStore`). The
 * snapshot is the stored text, so it is equal whenever the draft is; on the server, and for the
 * first render over the server's page, it is `null`: not yet known, which is not the same as empty.
 */
export const draftStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: stored,
  getServerSnapshot: (): string | null => null,
  save(draft: Draft): void {
    store(writeDraft(draft));
  },
  /** Forgets the order: on "Start over", and once a payment has been confirmed. */
  clear(): void {
    store("");
  },
};
