import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const setTheStrategyTemplates = sample("set-the-strategy", [
  {
    slug: "change-management-strategy",
    title: "Change Management Strategy",
    deliverableType: "plan",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead", "sponsor"],
    format: "docx",
    adkar: ["awareness", "desire", "knowledge", "ability", "reinforcement"],
    pageCount: 22,
    free: true,
    summary: "The master strategy document for a Microsoft 365 rollout, ready to tailor.",
    description:
      "Covers the nature of the change, the groups affected, the sponsorship model, and the approach to communication, training and resistance. Every section includes guidance and example wording.",
    includes: [
      "22-page strategy document",
      "Section-by-section guidance",
      "Example wording",
      "Executive summary slide",
    ],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "strategy",
        name: "Change Management Strategy.docx",
        key: "plan/change-management-strategy/change-management-strategy.docx",
        bytes: 57,
        sha256: "05de3d26cc85a0df9b37305ca5199733735fe6224f33ff8cd2e68b0403586bd7",
      },
    ],
  },
  {
    slug: "change-team-raci-matrix",
    title: "Change Team RACI Matrix",
    deliverableType: "governance",
    apps: ["m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["awareness"],
    summary: "Who is responsible, accountable, consulted and informed for every change activity.",
    description:
      "A pre-filled RACI covering the change activities of a typical rollout. Adjust the roles to match your project team.",
    includes: ["Pre-filled RACI matrix", "Role descriptions", "Gap check sheet"],
  },
  {
    slug: "resistance-management-plan",
    title: "Resistance Management Plan",
    deliverableType: "resistance",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead", "manager"],
    format: "docx",
    adkar: ["desire"],
    pageCount: 10,
    summary: "A plan for anticipating resistance and responding to it at the right level.",
    description:
      "Sets out expected objections by group, who is best placed to respond, and when to escalate. Treats resistance as information rather than a problem to suppress.",
    includes: ["Ten-page plan", "Objection and response table", "Escalation path"],
  },
  {
    slug: "copilot-rollout-playbook",
    title: "Copilot Rollout Playbook",
    deliverableType: "plan",
    apps: ["copilot"],
    audiences: ["change-lead", "sponsor"],
    format: "docx",
    adkar: ["awareness", "desire", "knowledge", "ability"],
    summary: "A staged approach to rolling out Microsoft 365 Copilot, from pilot to wider release.",
    description:
      "Sets out how to choose a pilot group, what to communicate and train at each stage, and how to decide when to widen the release. Written for the change lead running the rollout.",
    includes: ["Rollout playbook", "Pilot group selection guide", "Stage checklist"],
  },
]);
