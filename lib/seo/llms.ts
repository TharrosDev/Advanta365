import {
  APP_LABELS,
  AUDIENCE_LABELS,
  DELIVERABLE_TYPE_LABELS,
  FORMAT_LABELS,
} from "@/content/taxonomy";
import { numberedPhases } from "@/lib/catalog/coverage";
import { getFreeTemplates, getPhases, getTemplates } from "@/lib/catalog/repository";
import type { Phase, Template } from "@/lib/catalog/schema";
import { phaseHref } from "@/lib/catalog/search-params";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { countWord, formatPrice } from "@/lib/format";
import { LEGAL_DOCUMENTS, plain, type LegalBlock, type LegalDocument } from "@/lib/legal";
import { CONTACT_LINK, OFFER, PURCHASE_LINK, SITE, TOOLKIT } from "@/lib/site";
import { absoluteUrl } from "./origin";

/**
 * The site as plain Markdown for AI tools, after the llms.txt proposal (llmstxt.org): `/llms.txt`
 * is the short guide, a summary and the links that matter, and `/llms-full.txt` is everything a tool
 * needs to answer a question about the toolkit without reading the pages: the facts, common
 * questions, every phase with its listings, and the legal pages in full.
 *
 * Both are built from the same sources as the pages (`lib/site.ts`, `content/`, `lib/legal`), so they
 * say what the pages say and change when the pages do. The brand's rules hold here too: the
 * certification describes the practitioner, no client is named, there is no bilingual claim, and the
 * catalog is called sample content wherever its listings appear.
 */

const PRICE = formatPrice(OFFER.priceCents, OFFER.currency);

const link = (text: string, path: string) => `[${text}](${absoluteUrl(path)})`;

/** A free sample opens in the catalog's pop-up. */
const sampleHref = (template: Template) => `/catalog?view=${template.slug}`;

/** The sentence that opens both files. */
const SUMMARY = `${SITE.name}, a product of ${SITE.parent}, sells field-tested change management and user adoption content for Microsoft 365 and SharePoint Online: ${TOOLKIT.playbooks} playbooks, ${TOOLKIT.templates} templates, ${TOOLKIT.fieldGuides} field guides and full training for ${TOOLKIT.trainingAudiences} audiences (end users, Site Owners and IM Representatives) with ${TOOLKIT.jobAids} job aids, sold as one complete toolkit for ${PRICE}.`;

/**
 * The non-affiliation notice, as the footer words it. Each sentence that names the certifying body
 * stays whole on its own line, as the design gate asks.
 */
const NOTICE = [
  `${SITE.name} and ${SITE.parent} are independent and are not affiliated with or endorsed by Prosci Inc. or Microsoft Corporation.`,
  "Prosci is a registered trademark of Prosci Inc.",
  "Microsoft 365, SharePoint and Copilot are trademarks of the Microsoft group of companies.",
];

/** What the site is today, said plainly so no tool repeats more than is true. */
const STATUS = [
  "The catalog on the site lists sample content: placeholder listings organized like the toolkit's folders. It does not list the full toolkit, whose counts are the ones given above.",
  `No payment provider is connected yet. The checkout takes an order as far as the payment step, then offers to send it by email to ${SITE.contactEmail} so it can be invoiced. Nothing is paid for on the site, and there are no accounts.`,
  "The worked example's file cannot be downloaded yet; its page shows its table of contents.",
];

const KEY_FACTS = [
  `Tagline: “${SITE.tagline}” A rollout stalls in front of an empty prompt, page, project, document, plan or design; the toolkit fills all of them.`,
  `Price: ${PRICE} for the complete toolkit, one purchase. The price is set in Canadian dollars. Templates are not sold one at a time and there are no bundles.`,
  `Free samples: ${countWord(FREE_SAMPLE_COUNT)} templates, each from a different phase, can be opened on the site for free.`,
  `Files: editable Word, PowerPoint and Excel files, with a few print-ready PDFs. Buyers edit them by hand or feed them to their AI tools.`,
  `Microsoft 365 apps covered: SharePoint, Teams, OneDrive, Outlook and Copilot. The change management core applies to almost any technology rollout.`,
  `Who built it: built by a Prosci-certified practitioner and refined across client rollouts over ${TOOLKIT.experience}.`,
  "The promise: the toolkit gets an organization 90 percent of the way there; AI or a practitioner finishes the last 10 percent. It is starting material for AI, not a competitor to it.",
  "Also inside: a worked example (a full change management strategy for the fictional Meridian Group, about 10,000 employees) and Copilot readiness material.",
  "Language: English only.",
  `Contact: ${SITE.contactEmail}.`,
];

const BUYERS = [
  ["Change management leads and practitioners", "Saving time, looking credible"],
  ["IT and M365 project managers", "Hitting cutover dates, avoiding a rollout no one uses"],
  ["IM and records leads", "Governance, metadata, avoiding a mess of duplicate sites"],
  ["CIOs and sponsors", "Return on the M365 investment, risk"],
  [
    "Public sector and Crown corporations",
    "Governance, accountability; proven in Canadian public-sector environments",
  ],
] as const;

/** Where a section stands among the phases. */
function phasePlace(phase: Phase, phases: readonly Phase[]): string {
  const steps = numberedPhases(phases);
  if (phase.number !== undefined) return `Phase ${phase.number} of ${steps.length}`;
  return phase.order < (steps[0]?.order ?? 0)
    ? "Before phase 1"
    : `Alongside phases 1 to ${steps.length}`;
}

function phaseLine(phase: Phase, phases: readonly Phase[]): string {
  return `- ${link(phase.name, phaseHref(phase.slug))} (${phasePlace(phase, phases)}): ${phase.summary}`;
}

function sampleLine(template: Template, phases: readonly Phase[]): string {
  const phase = phases.find((candidate) => candidate.slug === template.phase);
  const facts = [phase?.name, FORMAT_LABELS[template.format]].filter(Boolean).join(", ");
  return `- ${link(template.title, sampleHref(template))} (${facts}): ${template.summary}`;
}

/** `/llms.txt`: the summary, the key facts and the links that matter. */
export async function llmsIndex(): Promise<string> {
  const [phases, samples] = await Promise.all([getPhases(), getFreeTemplates()]);
  return [
    `# ${SITE.name}`,
    "",
    `> ${SUMMARY}`,
    "",
    ...KEY_FACTS.map((fact) => `- ${fact}`),
    "",
    "Where the site stands today:",
    "",
    ...STATUS.map((line) => `- ${line}`),
    "",
    "## Pages",
    "",
    `- ${link("Home", "/")}: what the toolkit is, the six free samples and what is inside.`,
    `- ${link("Purchase", PURCHASE_LINK.href)}: the complete toolkit, its contents and its price (${PRICE}), and the checkout.`,
    `- ${link("Catalog", "/catalog")}: the listings by phase, deliverable type, app, audience and format, with search. Sample content.`,
    `- ${link("Why Advanta", "/why-advanta")}: the 90 percent promise, how the toolkit was made, who it is for, and how it compares with building it with AI or hiring a consultant.`,
    `- ${link("Worked example", "/sample")}: a full change management strategy for a fictional 10,000-person organization.`,
    `- ${link("Contact", CONTACT_LINK.href)}: write to ${SITE.contactEmail} about buying, purchase orders and invoices, the licence or accessibility.`,
    "",
    "## Rollout phases",
    "",
    "The toolkit's folders, in rollout order. A phase number on the site is the folder number a buyer sees after purchase.",
    "",
    ...phases.map((phase) => phaseLine(phase, phases)),
    "",
    "## Free samples",
    "",
    ...samples.map((template) => sampleLine(template, phases)),
    "",
    "## Policies",
    "",
    ...LEGAL_DOCUMENTS.map(
      (document) => `- ${link(document.title, document.href)}: ${document.description}`,
    ),
    "",
    "## Optional",
    "",
    `- ${link("The site in full, for AI tools", "/llms-full.txt")}: the facts, common questions, every phase with its listings and the legal pages in full.`,
    `- ${link("Sitemap", "/sitemap.xml")}`,
    "",
    ...NOTICE,
    "",
  ].join("\n");
}

/** The questions buyers ask, answered from what the site says. */
function questions(): [string, string][] {
  return [
    [`What is ${SITE.name}?`, SUMMARY],
    [
      "Who is it for?",
      "People responsible for a Microsoft 365 or SharePoint Online rollout: change management leads and practitioners, IT and M365 project managers, IM and records leads, CIOs and sponsors, and the public sector and Crown corporations. Inside the toolkit, training is written for end users, Site Owners and IM Representatives.",
    ],
    [
      "How much does it cost?",
      `${PRICE} for the complete toolkit, as one purchase. Tax is calculated at payment. Templates are not sold one at a time, and there are no bundles.`,
    ],
    [
      "Can I try it before buying?",
      `Yes. ${countWord(FREE_SAMPLE_COUNT, "capital")} templates, one from each of six phases, are free samples that open on the site. The worked example's table of contents is on ${absoluteUrl("/sample")}.`,
    ],
    [
      "What file formats are the templates?",
      "Editable Word, PowerPoint and Excel files, with a few print-ready PDFs.",
    ],
    [
      "Can I use it with ChatGPT, Copilot, Claude or other AI tools?",
      "Yes, it is built to be fed into AI tools. The judgment is already in the material; AI or a practitioner does the tailoring to your organization, your tone and your timeline.",
    ],
    [
      "How is it different from asking AI to write it, or hiring a consultant?",
      "AI output is plausible but unproven, and you build it yourself. A consultant's playbook is proven, but you rent it for each rollout. The toolkit is field-tested content you buy once, keep and adapt across every wave.",
    ],
    [
      "Who made it?",
      `It was built by a Prosci-certified practitioner and refined across client rollouts over ${TOOLKIT.experience}: built, delivered with real clients in front of real users, sponsors and skeptical records managers, revised, and re-delivered.`,
    ],
    [
      "How do I buy it?",
      `From ${absoluteUrl(PURCHASE_LINK.href)}: the checkout asks for your details (with an optional purchase order number), then a review, then payment. No payment provider is connected yet, so the last step offers to send the order by email to ${SITE.contactEmail} so it can be invoiced. For purchase orders and invoices, write to the same address.`,
    ],
    [
      "What may I do with the files?",
      "Use and adapt them inside your organization for as long as you like. Do not resell, share or publish them outside your organization. The terms below say it in full.",
    ],
    ["Is it endorsed by Microsoft?", `No. ${NOTICE[0]}`],
    ["Is it available in French?", "No. The content is in English only."],
    ["How do I get in touch?", `Write to ${SITE.contactEmail}.`],
  ];
}

function listingLine(template: Template): string {
  const facts = [
    DELIVERABLE_TYPE_LABELS[template.deliverableType],
    FORMAT_LABELS[template.format],
    `for ${template.audiences.map((audience) => AUDIENCE_LABELS[audience]).join(", ")}`,
    template.apps.map((app) => APP_LABELS[app]).join(", "),
  ].join("; ");
  const name = template.free
    ? `${link(template.title, sampleHref(template))} (free sample)`
    : `${template.title} (included with the toolkit)`;
  return `- ${name}. ${facts}. ${template.summary}`;
}

function blockText(block: LegalBlock): string {
  switch (block.kind) {
    case "p":
      return plain(block.text);
    case "list":
      return block.items.map((item) => `- ${plain(item)}`).join("\n");
    case "terms":
      return block.rows.map((row) => `- ${row.term}: ${plain(row.text)}`).join("\n");
    case "heading":
      return `#### ${block.title}`;
  }
}

function legalText(document: LegalDocument): string {
  return [
    `### ${document.title}`,
    "",
    `${absoluteUrl(document.href)}`,
    "",
    document.summary,
    "",
    ...document.points.map((point) => `- ${point}`),
    "",
    ...document.sections.flatMap((section) => [
      `#### ${section.title}`,
      "",
      ...section.blocks.flatMap((block) => [blockText(block), ""]),
    ]),
  ].join("\n");
}

/** `/llms-full.txt`: everything, in one file. */
export async function llmsFull(): Promise<string> {
  const [phases, templates] = await Promise.all([getPhases(), getTemplates()]);
  return [
    `# ${SITE.name}`,
    "",
    `> ${SUMMARY}`,
    "",
    `Site: ${absoluteUrl("/")}. Short guide: ${absoluteUrl("/llms.txt")}.`,
    "",
    "## Key facts",
    "",
    ...KEY_FACTS.map((fact) => `- ${fact}`),
    "",
    "## Where the site stands today",
    "",
    ...STATUS.map((line) => `- ${line}`),
    "",
    "## What is inside the complete toolkit",
    "",
    `- ${TOOLKIT.playbooks} playbooks covering all eleven phases of a rollout, from defining the change to making it stick.`,
    `- ${TOOLKIT.templates} ready-to-use templates: emails, plans, checklists, worksheets, workshop kits.`,
    `- ${TOOLKIT.fieldGuides} field guides.`,
    `- Training for ${TOOLKIT.trainingAudiences} audiences (end users, Site Owners and IM Representatives), with ${TOOLKIT.jobAids} job aids.`,
    "- A worked example: a full change management strategy for the fictional Meridian Group, about 10,000 employees.",
    "- Copilot readiness material.",
    "",
    "## Who buys it, and what each cares about",
    "",
    ...BUYERS.map(([buyer, cares]) => `- ${buyer}: ${cares}.`),
    "",
    "## How it was made",
    "",
    `Built by a Prosci-certified practitioner. Refined across ${TOOLKIT.experience} of client rollouts: the toolkit is what was built, delivered, revised and re-delivered with real clients.`,
    "",
    "- Built: written from the work every Microsoft 365 or SharePoint Online rollout needs: the business case, the strategy, the stakeholder map, the comms plan, the champion network, the training and the cutover playbook.",
    "- Delivered: used with real clients on real rollouts, in front of real users, sponsors and skeptical records managers.",
    "- Revised: changed wherever a rollout showed that it needed changing.",
    "- Re-delivered: taken into the next rollout, and the next.",
    "",
    "## Common questions",
    "",
    ...questions().flatMap(([question, answer]) => [`### ${question}`, "", answer, ""]),
    "## The phases and their listings",
    "",
    "The catalog follows the toolkit's own folders: Start here, then eleven phases in rollout order, then Used at every step. The listings under each phase are sample content (placeholders), not the full toolkit; the free samples can be opened on the site, and every other listing is included with the toolkit.",
    "",
    ...phases.flatMap((phase) => {
      const listed = templates.filter((template) => template.phase === phase.slug);
      return [
        `### ${phase.number === undefined ? phase.name : `Phase ${phase.number}: ${phase.name}`}`,
        "",
        `${absoluteUrl(phaseHref(phase.slug))} (${phasePlace(phase, phases)})`,
        "",
        phase.summary,
        "",
        ...listed.map(listingLine),
        "",
      ];
    }),
    "## Policies",
    "",
    ...LEGAL_DOCUMENTS.flatMap((document) => [legalText(document), ""]),
    "## Notice",
    "",
    ...NOTICE,
    "",
  ].join("\n");
}
