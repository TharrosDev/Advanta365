import type { Metadata } from "next";
import { AiStatement } from "@/components/company/ai-statement";
import { BuyerList } from "@/components/company/buyer-list";
import type { Buyer } from "@/components/company/buyer-list";
import { ComparisonTable } from "@/components/company/comparison-table";
import type { ComparisonRow } from "@/components/company/comparison-table";
import { NextSteps } from "@/components/company/next-steps";
import { ProofLedger } from "@/components/company/proof-ledger";
import { StatementSection } from "@/components/company/statement-section";
import { TitleBlock } from "@/components/layout/title-block";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FactList } from "@/components/ui/fact-list";
import { Sentences } from "@/components/ui/sentences";
import { catalogPriceSpan, type PriceSpan } from "@/lib/catalog/pricing";
import { getBundles, getPhases, getTemplates, hasSampleContent } from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
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
// word. The whole sentence is too long to set as a statement.
const MISSION_STATEMENT =
  "Help every organization moving to Microsoft 365 get real adoption, not just a launch.";

const MISSION_COPY = [
  "Help every organization moving to Microsoft 365 get real adoption, not just a launch, by giving its people the proven change management and training content that experienced practitioners have used to make rollouts stick.",
  "“Launched” versus “used” is the gap every sponsor and CIO has felt. The goal is users who want the change, not users who were told to comply.",
];

// A line break between the two sentences of a statement: it is set one sentence per block (here and
// in AI_STATEMENT and COMPARE_TITLE).
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
    key: "experience",
    title: "Experience, not guesswork",
    body: `Built by a Prosci-certified practitioner with ${TOOLKIT.experience} of client delivery.`,
  },
  {
    key: "complete",
    title: "Complete, not a sampler",
    body: "It covers the whole rollout lifecycle, from making the case through sustainment, plus training for end users, Site Owners and IM Reps.",
  },
  {
    key: "shown",
    title: "Shown, not just told",
    body: "A fully worked sample CM strategy (the fictional Meridian Group, about 10,000 employees) shows how the pieces fit together.",
  },
  {
    key: "current",
    title: "Current",
    body: "It includes Copilot readiness, a Copilot rollout playbook and a Copilot change impact assessment, not just 2019-era SharePoint.",
  },
];

const COMPARE_TITLE = "Three real alternatives.\nEach one misses something.";

const COMPARE_COLUMNS = ["Build it yourself with AI", "Hire a CM consultant", SITE.name];

const REUSE = "One licence, reused across waves";

/**
 * The toolkit's cost cell: what the catalog asks, from its cheapest template to its full-rollout
 * bundle, then the licence. The figures are read from the catalog, so they follow its prices.
 */
function costCell(span: PriceSpan | undefined): string {
  if (!span) return REUSE;
  const from = formatPrice(span.fromCents);
  if (span.toCents === undefined) return `From ${from} for a template. ${REUSE}`;
  return `${from} for a template to ${formatPrice(span.toCents)} for a full rollout. ${REUSE}`;
}

/**
 * The line under the table: the alternatives' costs are our estimates, and the toolkit's prices are
 * placeholders while the catalog is a sample.
 */
function compareNote(sample: boolean): string {
  const estimates = "Cost figures for the alternatives are our estimates, not market data.";
  return sample
    ? `${estimates} ${SITE.name} prices are placeholders from the sample catalog.`
    : estimates;
}

// One cell per column, in the order of COMPARE_COLUMNS. The toolkit counts are read from TOOLKIT
// and its cost from the catalog.
function compareRows(span: PriceSpan | undefined): readonly ComparisonRow[] {
  return [
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
        costCell(span),
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
}

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

/**
 * `/about`: the mission, why the product exists, what AI does and does not do, what sets it apart,
 * the three alternatives side by side, who it is for, and where to go next.
 *
 * Layout: the title block with ink, then bands that alternate desk and paper: the mission, why it
 * exists, the one black band (AI, stated plainly, static), the wash band with the four proof points
 * as a ledger, the comparison on a sheet of paper with the buyer's column raised, the buyers as a
 * ledger, and a closing paper band. Each statement section has its label in the margin; the
 * comparison runs across the whole grid under its own statement. `#compare` is linked from the
 * home page and from the top of `/pricing`.
 */
export default async function AboutPage() {
  const [templates, bundles, phases, sample] = await Promise.all([
    getTemplates(),
    getBundles(),
    getPhases(),
    hasSampleContent(),
  ]);
  const span = catalogPriceSpan(
    templates,
    bundles,
    phases.map((phase) => phase.slug),
  );

  return (
    <>
      <TitleBlock form="wide" ink title={MISSION_SHORT} lead={LEAD} />

      <StatementSection
        surface="desk"
        label="Mission"
        statement={MISSION_STATEMENT}
        copy={MISSION_COPY}
      />

      <StatementSection
        surface="paper"
        label="Why it exists"
        statement={WHY_STATEMENT}
        copy={WHY_COPY}
      />

      {/* The one black band of the company pages: static, no ink moves behind it. */}
      <AiStatement label="AI, stated plainly" statement={AI_STATEMENT} copy={AI_COPY} />

      <StatementSection surface="wash" label="Why it’s different" statement={DIFFERENT_STATEMENT}>
        <ProofLedger items={PROOF_POINTS} />
      </StatementSection>

      <Band id="compare" surface="desk">
        <Eyebrow>Your alternatives</Eyebrow>
        <h2 className={cx("type-statement", styles.compareTitle)}>
          <Sentences text={COMPARE_TITLE} move />
        </h2>
        <ComparisonTable
          id="compare-table"
          className={styles.compareTable}
          caption={`${SITE.name} compared with the alternatives`}
          columns={COMPARE_COLUMNS}
          rows={compareRows(span)}
          emphasized={COMPARE_COLUMNS.indexOf(SITE.name)}
          note={compareNote(sample)}
        />
      </Band>

      {/* Under the statement: the buyers with the public-sector line, then the note on what the
          toolkit covers beyond SharePoint, as a fact row lined up with the list. */}
      <StatementSection surface="paper" label="Who it’s for" statement={WHO_STATEMENT}>
        <div className={styles.buyers}>
          <BuyerList buyers={BUYERS} caresLabel="What they care about" />
          <Appear as="p" className={cx("type-copy", styles.proven)}>
            Proven in Canadian <span className={styles.compound}>public-sector</span> environments.
          </Appear>
        </div>
        <FactList
          className={styles.beyond}
          items={[{ label: "Beyond SharePoint", value: BEYOND_SHAREPOINT }]}
        />
      </StatementSection>

      <NextSteps title="Find the piece for the phase you are on" links={NEXT}>
        <p className={cx("type-note", styles.parent)}>
          {`${SITE.name} is a product of ${SITE.parent}.`}
        </p>
      </NextSteps>
    </>
  );
}
