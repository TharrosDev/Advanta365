import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const planTheTrainingTemplates = sample("plan-the-training", [
  {
    slug: "training-needs-analysis",
    title: "Training Needs Analysis",
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
    slug: "site-owner-training-curriculum",
    title: "SharePoint Site Owner Training Curriculum",
    deliverableType: "training",
    apps: ["sharepoint"],
    audiences: ["site-owner"],
    format: "docx",
    adkar: ["knowledge", "ability"],
    pageCount: 24,
    summary: "A four-module curriculum for the people who will own and manage sites.",
    description:
      "Covers permissions, structure, content lifecycle and the governance rules owners must follow. Each module has objectives, an outline and an assessment.",
    includes: ["Four module outlines", "Learning objectives", "End-of-module assessments"],
  },
]);
