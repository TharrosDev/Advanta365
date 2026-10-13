import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const designTemplates = sample("design", [
  // Design governance
  {
    slug: "sharepoint-governance-framework",
    title: "SharePoint Governance Framework",
    step: "design-governance",
    deliverableType: "governance",
    apps: ["sharepoint"],
    audiences: ["it-admin", "im-rep", "site-owner"],
    format: "docx",
    adkar: ["knowledge"],
    pageCount: 28,
    free: true,
    summary: "A complete governance framework for sites, permissions, naming and content.",
    description:
      "Defines who can create what, how sites are named and reviewed, and who decides when rules need to change. Written so that non-technical site owners can follow it.",
    includes: [
      "28-page framework",
      "Decision rights table",
      "Naming convention examples",
      "Policy summary for site owners",
    ],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "framework",
        name: "SharePoint Governance Framework.docx",
        key: "design/sharepoint-governance-framework/sharepoint-governance-framework.docx",
        bytes: 62,
        sha256: "bf1a91a890e5daf64db43694f2d6d66b800b4cd9ac9162627c2fa18dfbf6d415",
      },
    ],
  },
  {
    slug: "site-lifecycle-and-retention-policy",
    title: "Site Lifecycle and Retention Policy",
    step: "design-governance",
    deliverableType: "governance",
    apps: ["sharepoint"],
    audiences: ["it-admin", "im-rep"],
    format: "docx",
    adkar: ["knowledge"],
    pageCount: 15,
    summary: "How sites are created, reviewed, archived and deleted over time.",
    description:
      "A policy document covering the full life of a site and the content in it. Includes the notices sent to site owners at each stage.",
    includes: ["15-page policy", "Owner notice wording", "Review schedule"],
  },
  {
    slug: "m365-governance-committee-charter",
    title: "M365 Governance Committee Charter",
    step: "design-governance",
    deliverableType: "governance",
    apps: ["m365-general"],
    audiences: ["sponsor", "it-admin"],
    format: "docx",
    adkar: ["reinforcement"],
    pageCount: 6,
    summary:
      "Set up the group that makes decisions about the platform, during the rollout and after.",
    description:
      "Defines membership, decision rights, meeting rhythm and how requests reach the committee. Keeps business leaders involved once the project closes.",
    includes: ["Six-page charter", "Standing agenda", "Decision log"],
  },

  // Design the adoption approach
  {
    slug: "user-persona-impact-profiles",
    title: "User Persona Impact Profiles",
    step: "design-the-adoption-approach",
    deliverableType: "stakeholder",
    apps: ["sharepoint", "teams", "onedrive"],
    audiences: ["change-lead"],
    format: "pptx",
    adkar: ["awareness", "knowledge"],
    pageCount: 12,
    summary: "Six editable personas that describe a day of work before and after the rollout.",
    description:
      "Persona slides for common roles such as frontline staff, knowledge workers and executives. Each shows what changes in their day and what they will need.",
    includes: ["Six persona slides", "Blank persona layout", "Before-and-after day outline"],
  },
  {
    slug: "training-needs-analysis",
    title: "Training Needs Analysis",
    step: "design-the-adoption-approach",
    deliverableType: "training",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["knowledge"],
    summary: "Work out who needs to learn what, by role, before building any training.",
    description:
      "Maps roles to the tasks they will perform and the skills each task requires. Produces a prioritized list of training to build.",
    includes: ["Role and task matrix", "Skill gap sheet", "Training priority list"],
  },
  {
    slug: "copilot-rollout-playbook",
    title: "Copilot Rollout Playbook",
    step: "design-the-adoption-approach",
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
