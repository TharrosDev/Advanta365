/**
 * Minimal, dependency-free text splitter for kinetic reveals.
 *
 * Wraps each word in a two-element structure:
 *   <span class="split-line">   (overflow:hidden mask)
 *     <span class="split-word"> (the animated target)
 *
 * Words are the safe unit to split on — characters break screen readers and
 * line-splitting needs re-measurement on resize. Word masks give the classic
 * "lines rise out of a clip" reveal without those costs. The full text stays
 * available to assistive tech in a visually hidden span; the visual fragments
 * are aria-hidden.
 */

export type SplitResult = {
  /** The animatable word spans, in document order. */
  words: HTMLElement[];
  /** Restore the element to its original markup. */
  revert: () => void;
};

export function splitWords(el: HTMLElement): SplitResult {
  const original = el.innerHTML;
  const text = el.textContent ?? "";
  const tokens = text.split(/(\s+)/); // keep whitespace tokens

  el.innerHTML = "";
  const words: HTMLElement[] = [];

  const sr = document.createElement("span");
  sr.className = "u-sr";
  sr.textContent = text;
  el.appendChild(sr);

  for (const token of tokens) {
    if (token.trim() === "") {
      el.appendChild(document.createTextNode(token));
      continue;
    }
    const mask = document.createElement("span");
    mask.className = "split-line";
    mask.setAttribute("aria-hidden", "true");
    const word = document.createElement("span");
    word.className = "split-word";
    word.textContent = token;
    mask.appendChild(word);
    el.appendChild(mask);
    words.push(word);
  }

  return {
    words,
    revert: () => {
      el.innerHTML = original;
    },
  };
}
