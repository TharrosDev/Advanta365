import type { Metadata } from "next";
import { BuyerList } from "@/components/company/buyer-list";
import type { Buyer } from "@/components/company/buyer-list";
import { ComparisonTable } from "@/components/company/comparison-table";
import type { ComparisonRow } from "@/components/company/comparison-table";
import { StatementSection } from "@/components/company/statement-section";
import { MetallicSwirl } from "@/components/graphics/metallic-swirl/metallic-swirl";
import { INNER_SWIRL_PARAMS } from "@/components/graphics/metallic-swirl/params";
import { PageTitle } from "@/components/layout/page-title";
import { Reveal, RevealWords } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { ActionRow } from "@/components/ui/action-row";
import { DetailCard } from "@/components/ui/detail-card";
import { FactList } from "@/components/ui/fact-list";
import { PageShell } from "@/components/ui/page-shell";
import { SectionIntro } from "@/components/ui/section-intro";
import { SectionLabel } from "@/components/ui/section-label";
import { SectionShell } from "@/components/ui/section-shell";
import { cx } from "@/lib/cx";
import { coarseIndexAfter, countWords } from "@/lib/motion/words";
import { SITE, TOOLKIT } from "@/lib/site";
import styles from "./page.module.css";

// The short mission: the page's h1 and the description a search result shows.
const MISSION_SHORT = "Proven change content, so your M365 rollout gets used, not just launched.";

export const metadata: Metadata = {
  title: "About",
  description: MISSION_SHORT,
};

const LEAD = `Advanta365, an EchoFive product, sells field-tested change management and user adoption content for Microsoft 365 and SharePoint Online. It’s built from ${TOOLKIT.experience} of client delivery and gets an organization 90% of the way there before AI or a practitioner takes it the rest of the way.`;

// The statement is the opening of the mission; the first paragraph is the mission in full, word for
// word. The whole sentence is too long for the statement size: it runs to thirteen lines at 360px and
// at 1024px and ends on a single word.
const MISSION_STATEMENT =
  "Help every organization moving to Microsoft 365 get real adoption, not just a launch.";

const MISSION_COPY = [
  "Help every organization moving to Microsoft 365 get real adoption, not just a launch, by giving its people the proven change management and training content that experienced practitioners have used to make rollouts stick.",
  "“Launched” versus “used” is the gap every sponsor and CIO has felt. The goal is users who want the change, not users who were told to comply.",
];

// A line break between the two sentences of a statement: StatementSection sets each one as its own
// block (here and in AI_STATEMENT).
const WHY_STATEMENT =
  "Organizations keep paying to reinvent the same change management work for every M365 rollout.\nAdvanta365 exists so they can stop.";

const WHY_COPY = [
  "Every SharePoint Online rollout needs the same core pieces: a business case, a CM strategy, a stakeholder map, a comms plan, kickoff emails, champion networks, training, a cutover playbook, hypercare and sustainment. Most teams build these from scratch under deadline pressure. Some hire a consultant for six figures. More and more just ask AI, and get something that looks right but has never met a real user, sponsor or skeptical records manager.",
  `Advanta365 is the content that has met them. It was built, delivered, revised and re-delivered with real clients over ${TOOLKIT.experience}, by a Prosci-certified practitioner who has lived through the resistance, the slipped cutovers and the empty champion meetings. What’s left in the toolkit is what worked.`,
];

const AI_STATEMENT = "The judgment is already built in.\nAI handles the finishing.";

const AI_COPY = [
  "We know AI can draft a comms plan. What it can’t do is know which comms plan survived contact with 10,000 employees. Advanta365 gives AI the right starting material. Buy the content, feed it to your AI tools, and let them tailor it to your organization, your tone and your timeline.",
];

const DIFFERENT_STATEMENT = "Proven experience at a template price.";

const PROOF_POINTS = [
  {
    title: "Experience, not guesswork",
    body: `${TOOLKIT.experience} of client delivery and Prosci certification sit behind every template.`,
  },
  {
    title: "Complete, not a sampler",
    body: "It covers the whole rollout lifecycle, from making the case through sustainment, plus training for end users, Site Owners and IM Reps.",
  },
  {
    title: "Shown, not just told",
    body: "A fully worked sample CM strategy (the fictional Meridian Group, about 10,000 employees) shows how the pieces fit together.",
  },
  {
    title: "Current",
    body: "It includes Copilot readiness, a Copilot rollout playbook and a Copilot change impact assessment, not just 2019-era SharePoint.",
  },
];

// The line break sits between the two sentences; `.compareTitle` shows it from 1024px.
const COMPARE_TITLE = "Three real alternatives.\nEach one misses something.";

const COMPARE_COLUMNS = ["Build it yourself with AI", "Hire a CM consultant", SITE.name];

// One cell per column, in the order of COMPARE_COLUMNS. The toolkit counts are read from TOOLKIT.
const COMPARE_ROWS: readonly ComparisonRow[] = [
  {
    label: "Starting point",
    cells: [
      "Blank prompt",
      "Consultant’s own playbook",
      `${TOOLKIT.playbooks} playbooks, ${TOOLKIT.templates} templates, ${TOOLKIT.fieldGuides} field guides, training for ${TOOLKIT.trainingAudiences} audiences`,
    ],
  },
  {
    label: "Field-tested?",
    cells: [
      "No. Plausible but unproven",
      "Yes, but you rent it",
      "Yes, refined across real rollouts",
    ],
  },
  {
    label: "Cost",
    cells: [
      "Low in dollars, high in staff time (8 to 14 person-months to build internally)",
      "$150K to $400K per rollout",
      "One licence, reused across waves",
    ],
  },
  {
    label: "Who owns the result",
    cells: ["You", "Often the consultant’s IP", "You keep and adapt the copies"],
  },
  {
    label: "Works with AI",
    cells: ["It is AI", "Rarely", "Built to be fed into AI tools"],
  },
  {
    label: "Speed to first deliverable",
    cells: ["Days to draft, weeks to validate", "Weeks to onboard", "Same day"],
  },
];

const WHO_STATEMENT =
  "Advanta365 works for any organization rolling out M365, from private companies to federal departments and Crown corporations.";

const BUYERS: readonly Buyer[] = [
  {
    name: "Change management leads and practitioners",
    caresAbout: "Saving time, looking credible",
    line: "Skip the blank page. Start with what’s worked.",
  },
  {
    name: "IT and M365 project managers",
    caresAbout: "Hitting cutover dates, avoiding a rollout no one uses",
    line: "The people-side plan your technical plan is missing.",
  },
  {
    name: "IM and records leads",
    caresAbout: "Governance, metadata, avoiding a mess of duplicate sites",
    line: "Governance your Site Owners will actually follow.",
  },
  {
    name: "CIOs and sponsors",
    caresAbout: "Return on the M365 investment, risk",
    line: "Adoption is how you get value from the licences you already pay for.",
  },
  {
    name: "Public sector and Crown corporations",
    caresAbout: "Governance, accountability",
    line: "Built and proven inside government environments.",
  },
];

const BEYOND_SHAREPOINT =
  "SharePoint-first out of the box. The change management core (structured planning, resistance management, sponsor coaching, Go/No-Go decisions and sustainment) applies to almost any technology rollout.";

const NEXT = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/sample", label: "See a sample" },
  { href: "/contact", label: "Get in touch" },
];

export default function AboutPage() {
  // The table fades up on the first coarse step after the title's last word (the label is index 0,
  // the words start at 1).
  const compareTable = coarseIndexAfter(1 + countWords(COMPARE_TITLE));

  return (
    <PageShell>
      <PageTitle title={MISSION_SHORT} lead={LEAD} />

      <StatementSection label="Mission" statement={MISSION_STATEMENT} copy={MISSION_COPY} />

      <StatementSection label="Why it exists" statement={WHY_STATEMENT} copy={WHY_COPY} />

      <StatementSection label="AI, stated plainly" statement={AI_STATEMENT} copy={AI_COPY} />

      {/* The dark band: label and statement on top, the four proof points on its bottom edge. The
          cards are a group of their own and fade up left to right (index 0 to 3). Their titles are
          one size under the card's default, so two words still share a line in a quarter column. */}
      <SectionShell
        theme="dark"
        height="full"
        backdrop={<MetallicSwirl params={INNER_SWIRL_PARAMS} className={styles.swirl} />}
        innerClassName={styles.different}
      >
        <RevealGroup className={styles.differentIntro}>
          <Reveal as="div" effect="fade" index={0}>
            <SectionLabel>Why it’s different</SectionLabel>
          </Reveal>
          <h2 className={cx("t-display-fluid", styles.differentStatement)}>
            <RevealWords text={DIFFERENT_STATEMENT} offset={1} />
          </h2>
        </RevealGroup>
        <RevealGroup as="ul" className={styles.proofGrid}>
          {PROOF_POINTS.map((point, index) => (
            <Reveal key={point.title} as="li" effect="fade-up" index={index}>
              <DetailCard
                title={point.title}
                titleClassName="t-headline-medium"
                body={point.body}
              />
            </Reveal>
          ))}
        </RevealGroup>
      </SectionShell>

      {/* #compare is linked from the home page. One group: label 0, title words from 1, then the
          table with its note. */}
      <SectionShell id="compare">
        <RevealGroup className={styles.compare}>
          <SectionIntro
            label="Your alternatives"
            title={COMPARE_TITLE}
            titleClassName={cx("t-display-fluid", styles.compareTitle)}
          />
          <Reveal as="div" effect="fade-up" index={compareTable}>
            <ComparisonTable
              id="compare-table"
              caption={`${SITE.name} compared with the alternatives`}
              columns={COMPARE_COLUMNS}
              rows={COMPARE_ROWS}
              emphasized={COMPARE_COLUMNS.indexOf(SITE.name)}
              note="Cost figures are our estimates, not market data."
            />
          </Reveal>
        </RevealGroup>
      </SectionShell>

      {/* Under the statement: the buyers (their own group) with the public-sector line, then the
          note on what the toolkit covers beyond SharePoint, as a fact row lined up with the list. */}
      <StatementSection label="Who it’s for" statement={WHO_STATEMENT}>
        <div className={styles.buyers}>
          <BuyerList buyers={BUYERS} caresLabel="What they care about" />
          <RevealGroup>
            <Reveal as="p" effect="fade" index={0} className="t-body-large c-fg-60">
              Proven in Canadian public-sector environments.
            </Reveal>
          </RevealGroup>
        </div>
        <RevealGroup>
          <Reveal as="div" effect="fade-up" index={0}>
            <FactList
              items={[
                {
                  label: "Beyond SharePoint",
                  value: <span className={styles.noteText}>{BEYOND_SHAREPOINT}</span>,
                },
              ]}
            />
          </Reveal>
        </RevealGroup>
      </StatementSection>

      {/* The rows fade up in turn; the line that names the parent company follows them. */}
      <SectionShell innerClassName={styles.closing}>
        <RevealGroup>
          <SectionIntro center label="Next" title="Find the piece for the phase you are on" />
        </RevealGroup>
        <RevealGroup className={styles.next}>
          <ul className={styles.nextRows}>
            {NEXT.map((row, index) => (
              <Reveal key={row.href} as="li" effect="fade-up" index={index}>
                <ActionRow
                  fill
                  padded
                  arrow="right"
                  rule={index === NEXT.length - 1 ? "both" : "top"}
                  href={row.href}
                  label={row.label}
                />
              </Reveal>
            ))}
          </ul>
          <Reveal
            as="p"
            effect="fade"
            index={NEXT.length}
            className={cx("t-label-medium", "c-fg-60", styles.parent)}
          >
            {`${SITE.name} is a product of ${SITE.parent}.`}
          </Reveal>
        </RevealGroup>
      </SectionShell>
    </PageShell>
  );
}
