import { describe, expect, test } from "vitest";
import { contentsRows } from "@/lib/catalog/worked-example";

const templates = [
  { slug: "kickoff-deck", title: "Sponsor Kickoff Deck", free: true },
  { slug: "cutover-playbook", title: "Cutover Playbook", free: false },
];
const phases = [{ slug: "build-the-training", name: "Build the training" }];

describe("contentsRows", () => {
  test("a free sample's section links to the template in the catalog under the template's title", () => {
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

  test("a locked template's section names the template and links nowhere", () => {
    expect(
      contentsRows(
        [{ title: "Cutover", see: { template: "cutover-playbook" } }],
        templates,
        phases,
      ),
    ).toEqual([{ title: "Cutover", link: { kind: "Template", label: "Cutover Playbook" } }]);
  });

  test("a phase section links to the phase's page under its name", () => {
    expect(
      contentsRows(
        [{ title: "Training", see: { phase: "build-the-training" } }],
        templates,
        phases,
      )[0]?.link,
    ).toEqual({ kind: "Phase", label: "Build the training", href: "/phases/build-the-training" });
  });

  test("a target the catalog does not hold leaves the section without a link", () => {
    const rows = contentsRows(
      [
        { title: "A", see: { template: "gone" } },
        { title: "B", see: { phase: "gone" } },
      ],
      templates,
      phases,
    );
    expect(rows).toEqual([{ title: "A" }, { title: "B" }]);
  });

  test("keeps the order of the entries", () => {
    const rows = contentsRows(
      [
        { title: "Second", see: { phase: "build-the-training" } },
        { title: "First", see: { template: "kickoff-deck" } },
      ],
      templates,
      phases,
    );
    expect(rows.map((row) => row.title)).toEqual(["Second", "First"]);
  });
});
