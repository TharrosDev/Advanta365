import type { Metadata } from "next";
import { MetallicSwirl } from "@/components/graphics/metallic-swirl/metallic-swirl";
import { INNER_SWIRL_PARAMS } from "@/components/graphics/metallic-swirl/params";
import { PageTitle } from "@/components/layout/page-title";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { ActionRow } from "@/components/ui/action-row";
import { DetailCard } from "@/components/ui/detail-card";
import { PageShell } from "@/components/ui/page-shell";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Thirty years of change management and user adoption practice, packaged as templates.",
};

const BACKGROUND_STATEMENT =
  "The technology is delivered on schedule. The hard part turns out to be the people side.";

const BACKGROUND_COPY = [
  "Most of that work has been with Microsoft 365, and SharePoint above all: intranets, migrations, collaboration and governance. The same pattern shows up every time. The technology is delivered on schedule, and the hard part turns out to be the people side: sponsorship, communication, training and reinforcement.",
  "These templates exist so that the people side does not have to be invented from scratch on each project. They serve private companies and public bodies alike, from municipal departments to federal agencies.",
];

const PRINCIPLES_STATEMENT =
  "Built from real rollouts. Grounded in a proven methodology. Made to be tailored.";

const PRINCIPLES = [
  {
    title: "Built from real rollouts",
    body: "Every template started as a working document on a live project and was refined over many more. Nothing here is theoretical.",
  },
  {
    title: "Grounded in a proven methodology",
    body: "The collection is aligned with Prosci methodology, so each template has a clear place in a structured approach to change rather than standing alone.",
  },
  {
    title: "Made to be tailored",
    body: "You get editable files with guidance and example wording. Adapt them to your organization, your sponsor and your audience.",
  },
];

export default function AboutPage() {
  // The paragraphs fade in on the first coarse steps after the statement's last word (the label is
  // index 0, the words start at 1).
  const firstParagraph = coarseIndexAfter(1 + countWords(BACKGROUND_STATEMENT));

  return (
    <PageShell>
      <PageTitle
        title="Thirty years of change practice, ready to use"
        lead="Advanta365 is a library of the change management and user adoption materials built over a 30-year career helping organizations adopt new technology."
      />

      <SectionShell>
        <RevealGroup className={styles.background}>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>Background</SectionLabel>
          </Reveal>
          <div className={styles.columns}>
            <h2 className={styles.statement}>
              <RevealWords text={BACKGROUND_STATEMENT} offset={1} />
            </h2>
            <div className={styles.copy}>
              {BACKGROUND_COPY.map((paragraph, index) => (
                <Reveal
                  key={paragraph}
                  as="p"
                  effect="fade"
                  index={firstParagraph + index}
                  className="t-body-large c-fg-80"
                >
                  {paragraph}
                </Reveal>
              ))}
            </div>
          </div>
        </RevealGroup>
      </SectionShell>

      <SectionShell
        theme="dark"
        height="full"
        backdrop={<MetallicSwirl params={INNER_SWIRL_PARAMS} className={styles.swirl} />}
        innerClassName={styles.principles}
      >
        <RevealGroup className={styles.principlesIntro}>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>Principles</SectionLabel>
          </Reveal>
          <h2 className={cx("t-display-fluid", styles.principlesStatement)}>
            <RevealWords text={PRINCIPLES_STATEMENT} offset={1} />
          </h2>
        </RevealGroup>
        <RevealGroup as="ul" className={styles.principlesGrid}>
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.title} as="li" effect="fade-up" index={index}>
              <DetailCard title={principle.title} body={principle.body} />
            </Reveal>
          ))}
        </RevealGroup>
      </SectionShell>

      <SectionShell innerClassName={styles.closing}>
        <RevealGroup>
          <SectionIntro center label="Next" title="Find the template for the step you are on" />
        </RevealGroup>
        <RevealGroup as="ul" className={styles.next}>
          <Reveal as="li" effect="fade-up" index={0}>
            <ActionRow fill padded arrow="right" href="/catalog" label="Browse the catalog" />
          </Reveal>
          <Reveal as="li" effect="fade-up" index={1}>
            <ActionRow fill padded arrow="right" rule="both" href="/contact" label="Get in touch" />
          </Reveal>
        </RevealGroup>
      </SectionShell>
    </PageShell>
  );
}
