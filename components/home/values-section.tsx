import type { ComponentType } from "react";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { DetailCard } from "@/components/ui/detail-card";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionShell } from "@/components/ui/section-shell";
import styles from "./home.module.css";
import { BuildingsIcon, LayersIcon, StepsIcon } from "./value-icons";

type Value = {
  title: string;
  body: string;
  Icon: ComponentType<{ className?: string }>;
};

const VALUES: readonly Value[] = [
  {
    title: "SharePoint-first",
    body: "With coverage across Teams, OneDrive, Outlook and Copilot.",
    Icon: LayersIcon,
  },
  {
    title: "Every step",
    body: "Of a rollout, from the first sponsor meeting to handover.",
    Icon: StepsIcon,
  },
  {
    title: "Private and public",
    body: "Sector organizations, from municipal to federal.",
    Icon: BuildingsIcon,
  },
];

/**
 * `#values`: always dark (it does not follow the page theme), a bold label and the statement, then
 * three cells whose content sits on the bottom edge: a solid glyph and a ruled card each.
 *
 * Reveal order: label 0 and title words 1..10 in one group; per cell the glyph is index i and the
 * card i + 1, so the cells ripple left to right.
 */
export function ValuesSection() {
  return (
    <SectionShell id="values" theme="dark" height="full" innerClassName={styles.values}>
      <RevealGroup>
        <SectionIntro
          label="Why Advanta365"
          labelBold
          title="Spend your time on the people, not on the paperwork."
        />
      </RevealGroup>
      <ul className={styles.valuesGrid}>
        {VALUES.map(({ title, body, Icon }, index) => (
          <li key={title} className={styles.valuesCell}>
            <RevealGroup className={styles.valuesCellContent}>
              <Reveal as="div" effect="fade-up" index={index} className={styles.valuesIconFrame}>
                <Icon className={styles.valuesIcon} />
              </Reveal>
              <Reveal as="div" effect="fade-up" index={index + 1}>
                <DetailCard title={title} body={body} />
              </Reveal>
            </RevealGroup>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
