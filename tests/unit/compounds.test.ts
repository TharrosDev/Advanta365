import { describe, expect, test } from "vitest";
import { splitCompounds } from "@/lib/compounds";

describe("splitCompounds", () => {
  test("separates a hyphenated compound from the words around it", () => {
    expect(splitCompounds("SharePoint End-User Training Deck")).toEqual([
      { kind: "text", text: "SharePoint " },
      { kind: "compound", text: "End-User" },
      { kind: "text", text: " Training Deck" },
    ]);
  });

  test("keeps a compound of several hyphens whole", () => {
    expect(splitCompounds("130 ready-to-use templates")).toEqual([
      { kind: "text", text: "130 " },
      { kind: "compound", text: "ready-to-use" },
      { kind: "text", text: " templates" },
    ]);
  });

  test("finds a compound at either end and more than one in a title", () => {
    expect(splitCompounds("90-Day Adoption Scorecard")[0]).toEqual({
      kind: "compound",
      text: "90-Day",
    });
    expect(
      splitCompounds("Post-Launch Review One-Pager")
        .filter((part) => part.kind === "compound")
        .map((part) => part.text),
    ).toEqual(["Post-Launch", "One-Pager"]);
  });

  test("the whole run between two spaces is the compound, punctuation included", () => {
    expect(splitCompounds("Go/No-Go Decision Checklist")[0]).toEqual({
      kind: "compound",
      text: "Go/No-Go",
    });
    expect(splitCompounds("the (End-User) deck, one-page.").map((part) => part.text)).toEqual([
      "the ",
      "(End-User)",
      " deck, ",
      "one-page.",
    ]);
  });

  test("a title without a compound is one text part", () => {
    expect(splitCompounds("Change Management Strategy")).toEqual([
      { kind: "text", text: "Change Management Strategy" },
    ]);
    expect(splitCompounds("")).toEqual([]);
  });

  test("a hyphen that does not join two characters is not a compound", () => {
    for (const title of ["Plans - drafts", "Draft -", "- Draft", "A -- B"]) {
      expect(splitCompounds(title)).toEqual([{ kind: "text", text: title }]);
    }
  });

  test("joining the parts gives the title back (textContent stays plain)", () => {
    for (const title of [
      "SharePoint End-User Training Deck",
      "What’s Changing for Me One-Pager",
      "Train-the-Trainer Facilitation Kit",
      "  odd   spacing\nand a line-break ",
      "single",
    ]) {
      expect(
        splitCompounds(title)
          .map((part) => part.text)
          .join(""),
      ).toBe(title);
    }
  });
});
