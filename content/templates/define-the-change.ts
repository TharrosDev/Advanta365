import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const defineTheChangeTemplates = sample("define-the-change", [
  {
    slug: "adoption-business-case-one-pager",
    title: "Adoption Business Case One-Pager",
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
]);
