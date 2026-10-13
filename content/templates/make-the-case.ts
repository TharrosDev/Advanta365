import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const makeTheCaseTemplates = sample("make-the-case", [
  // Build the business case
  {
    slug: "adoption-business-case-one-pager",
    title: "Adoption Business Case One-Pager",
    step: "build-the-business-case",
    deliverableType: "communication",
    apps: ["m365-general"],
    audiences: ["sponsor"],
    format: "docx",
    adkar: ["awareness"],
    pageCount: 2,
    summary: "A short case for investing in adoption alongside the technical deployment.",
    description:
      "Summarizes the cost of low adoption and the return on structured change management. Designed to be attached to a funding request.",
    includes: ["Two-page business case", "Fill-in cost and benefit table", "Example wording"],
  },
  {
    slug: "change-project-charter",
    title: "Change Project Charter",
    step: "build-the-business-case",
    deliverableType: "plan",
    apps: ["sharepoint", "m365-general"],
    audiences: ["sponsor", "change-lead"],
    format: "docx",
    adkar: ["awareness"],
    pageCount: 8,
    summary: "A charter that frames the rollout as a people change, not just a technology project.",
    description:
      "Sets out the reason for the change, the outcomes expected and who is accountable. Written to be signed by the sponsor before planning starts.",
    includes: [
      "Charter document with guidance notes",
      "Scope and out-of-scope table",
      "Sign-off page",
    ],
  },
  {
    slug: "change-vision-canvas",
    title: "Change Vision Statement Canvas",
    step: "build-the-business-case",
    deliverableType: "plan",
    apps: ["sharepoint"],
    audiences: ["change-lead", "sponsor"],
    format: "pptx",
    adkar: ["awareness", "desire"],
    pageCount: 3,
    summary: "A one-slide canvas for writing a vision people can repeat.",
    description:
      "Guides a small group to a single sentence describing the future state and what it means for staff. Includes three worked examples.",
    includes: ["Vision canvas slide", "Three worked examples", "Facilitation prompts"],
  },
  {
    slug: "success-metrics-workshop-deck",
    title: "Success Metrics Workshop Deck",
    step: "build-the-business-case",
    deliverableType: "measurement",
    apps: ["sharepoint", "teams"],
    audiences: ["sponsor", "change-lead"],
    format: "pptx",
    adkar: ["awareness", "desire"],
    pageCount: 18,
    summary: "A facilitated session to agree how adoption and benefits will be measured.",
    description:
      "Walks a leadership group from business goals to a short list of adoption measures with targets. Includes facilitator notes on every slide.",
    includes: ["18-slide workshop deck", "Facilitator notes", "Metric definition worksheet"],
  },
  {
    slug: "benefits-realization-register",
    title: "Benefits Realization Register",
    step: "build-the-business-case",
    deliverableType: "measurement",
    apps: ["m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["reinforcement"],
    summary: "A register that links each expected benefit to an owner, a measure and a date.",
    description:
      "Tracks benefits from baseline to realization. Feeds directly into post-launch reviews so results are reported against what was promised.",
    includes: ["Benefits register workbook", "Baseline capture sheet", "Summary chart"],
  },

  // Secure sponsorship
  {
    slug: "executive-sponsor-kickoff-deck",
    title: "Executive Sponsor Kickoff Deck",
    step: "secure-sponsorship",
    deliverableType: "sponsor",
    apps: ["sharepoint"],
    audiences: ["sponsor"],
    format: "pptx",
    adkar: ["awareness", "desire"],
    pageCount: 16,
    free: true,
    summary: "The deck a sponsor presents to launch a SharePoint rollout with authority.",
    description:
      "Gives the executive sponsor a clear story: why now, what changes, and what they are asking of leaders. Speaker notes are written in plain language so it can be delivered with little preparation.",
    includes: [
      "16-slide kickoff deck",
      "Speaker notes",
      "One-page leave-behind",
      "Customization checklist",
    ],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "deck",
        name: "Executive Sponsor Kickoff Deck.pptx",
        key: "make-the-case/executive-sponsor-kickoff-deck/executive-sponsor-kickoff-deck.pptx",
        bytes: 61,
        sha256: "8f411c3d7b2973b96950ae019b197f9148be2be5752c109a8fba4e6e903de303",
      },
    ],
  },
  {
    slug: "sponsor-roles-brief",
    title: "Sponsor Roles and Responsibilities Brief",
    step: "secure-sponsorship",
    deliverableType: "sponsor",
    apps: ["m365-general"],
    audiences: ["sponsor"],
    format: "pdf",
    adkar: ["awareness"],
    pageCount: 4,
    summary: "What an active and visible sponsor is expected to do, phase by phase.",
    description:
      "A briefing document for a newly named sponsor. Lists the specific actions expected of them and the time each one takes.",
    includes: ["Four-page brief", "Sponsor action checklist", "Suggested meeting cadence"],
  },
  {
    slug: "sponsorship-roadmap",
    title: "Sponsorship Roadmap",
    step: "secure-sponsorship",
    deliverableType: "sponsor",
    apps: ["sharepoint", "m365-general"],
    audiences: ["sponsor", "change-lead"],
    format: "xlsx",
    adkar: ["awareness", "desire"],
    summary: "A dated plan of what the sponsor says and does through the whole rollout.",
    description:
      "Schedules sponsor activities week by week: messages, meetings and visible appearances. Keeps sponsorship active after kickoff, when it most often fades.",
    includes: ["Sponsor activity roadmap", "Message calendar", "Status tracker"],
  },
]);
