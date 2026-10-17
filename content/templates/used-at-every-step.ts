import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const usedAtEveryStepTemplates = sample("used-at-every-step", [
  {
    slug: "change-risk-and-resistance-register",
    title: "Change Risk and Resistance Register",
    deliverableType: "resistance",
    apps: ["m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["desire"],
    summary: "Log people-side risks and likely sources of resistance before they surface.",
    description:
      "A risk register tuned for adoption risks rather than technical ones. Each risk has a likely root cause and a planned response.",
    includes: ["Risk and resistance register", "Common root causes list", "Response options"],
  },
  {
    slug: "sponsor-adoption-status-report",
    title: "Sponsor Adoption Status Report",
    deliverableType: "sponsor",
    apps: ["m365-general"],
    audiences: ["sponsor"],
    format: "pptx",
    adkar: ["reinforcement"],
    pageCount: 6,
    summary: "A six-slide monthly report that tells the sponsor where adoption stands.",
    description:
      "Shows progress against targets, the main obstacles, and the specific actions asked of the sponsor. Built to be read in five minutes.",
    includes: ["Six-slide report", "Sponsor action list", "Example completed report"],
  },
  {
    slug: "lessons-learned-workshop-kit",
    title: "Lessons Learned Workshop Kit",
    deliverableType: "assessment",
    apps: ["m365-general"],
    audiences: ["change-lead"],
    format: "pptx",
    adkar: ["reinforcement"],
    pageCount: 14,
    summary: "Run a structured review of what worked and what to change next time.",
    description:
      "A two-hour workshop with activities for gathering honest feedback from the project team and the business. Ends with a short list of actions for future rollouts.",
    includes: ["14-slide workshop deck", "Pre-workshop survey", "Actions summary"],
  },
]);
