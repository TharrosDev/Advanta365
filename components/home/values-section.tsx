import type { ComponentType } from "react";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionShell } from "@/components/ui/section-shell";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";
import { BuildingsIcon, PencilIcon, ProvenIcon, StepsIcon } from "./value-icons";

type Value = {
  title: string;
  body: string;
  Icon: ComponentType<{ className?: string }>;
};

const VALUES: readonly Value[] = [
  {
    title: "Field-tested, not theoretical",
    body: "Built from 30+ years of field-tested practice on real rollouts, then refined into ready-to-use templates.",
    Icon: ProvenIcon,
  },
  {
    title: "Experience you can borrow",
    body: "Grounded in Prosci certification and 30+ years of practice.",
    Icon: StepsIcon,
  },
  {
    title: "Yours to adapt",
    body: "Edit by hand or feed it to AI. You keep what you build.",
    Icon: PencilIcon,
  },
  {
    title: "Built for any sector",
    body: "Used from private companies to the public service.",
    Icon: BuildingsIcon,
  },
];

/** The cells sit two to a row from 768px. */
const COLUMNS = 2;

/**
 * `#values`: always dark (it does not follow the page theme), a bold label and the statement, then
 * four cells, each a solid glyph over a ruled card: one column on a phone, two by two from 768px.
 * Four across would leave a cell 216px wide at 1024px, too narrow for the longest body.
 *
 * Reveal order: label 0 and title words 1..4 in one group (the title breaks between its two
 * sentences, see `.sentenceLines`, and is sized so each sentence fits on a phone, see
 * `.valuesTitle`); per cell the glyph is index c and the card c + 1, where c is the cell's column, so
 * each row ripples left to right.
 */
export function ValuesSection() {
  return (
    <SectionShell id="values" theme="dark" height="full" innerClassName={styles.values}>
      <RevealGroup>
        <SectionIntro
          label="Why Advanta365"
          labelBold
          title={"Field-tested change.\nAI-ready content."}
          titleClassName={cx("t-display-fluid", styles.sentenceLines, styles.valuesTitle)}
        />
      </RevealGroup>
      <ul className={styles.valuesGrid}>
        {VALUES.map(({ title, body, Icon }, index) => {
          const column = index % COLUMNS;
          return (
            <li key={title}>
              <RevealGroup className={styles.valuesCellContent}>
                <Reveal as="div" effect="fade-up" index={column} className={styles.valuesIconFrame}>
                  <Icon className={styles.valuesIcon} />
                </Reveal>
                <Reveal as="div" effect="fade-up" index={column + 1}>
                  <DetailCard title={title} body={body} bodyClassName={styles.cardBody} />
                </Reveal>
              </RevealGroup>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}
