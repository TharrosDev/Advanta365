import { describe, expect, test } from "vitest";
import { contentsRows } from "@/lib/catalog/worked-example";

const templates = [{ slug: "kickoff-deck", title: "Sponsor Kickoff Deck" }];
const phases = [
  {
    slug: "prepare",
    name: "Prepare",
    steps: [{ slug: "train", name: "Train", summary: "Train people.", order: 1 }],
  },
];

describe("contentsRows", () => {
  test("a template section links to the template in the catalog under the template's title", () => {
    expect(
      contentsRows([{ title: "Kickoff", see: { template: "kickoff-deck" } }], templates, phases),
    ).toEqual([
      {
        title: "Kickoff",
        link: {
          kind: "Template",
          label: "Sponsor Kickoff Deck",
          href: "/catalog?view=kickoff-deck",
        },
      },
    ]);
  });

  test("a step section links to the step's anchor on its phase page", () => {
    expect(
      contentsRows(
        [{ title: "Training", see: { phase: "prepare", step: "train" } }],
        templates,
        phases,
      )[0]?.link,
    ).toEqual({ kind: "Step", label: "Train", href: "/phases/prepare#train" });
  });

  test("a phase section links to the phase page", () => {
    expect(
      contentsRows([{ title: "Readiness", see: { phase: "prepare" } }], templates, phases)[0]?.link,
    ).toEqual({ kind: "Phase", label: "Prepare", href: "/phases/prepare" });
  });

  test("a target the catalog does not hold leaves the section without a link", () => {
    const rows = contentsRows(
      [
        { title: "A", see: { template: "gone" } },
        { title: "B", see: { phase: "gone" } },
        { title: "C", see: { phase: "prepare", step: "gone" } },
      ],
      templates,
      phases,
    );
    expect(rows).toEqual([{ title: "A" }, { title: "B" }, { title: "C" }]);
  });

  test("keeps the order of the entries", () => {
    const rows = contentsRows(
      [
        { title: "Second", see: { phase: "prepare" } },
        { title: "First", see: { template: "kickoff-deck" } },
      ],
      templates,
      phases,
    );
    expect(rows.map((row) => row.title)).toEqual(["Second", "First"]);
  });
});
