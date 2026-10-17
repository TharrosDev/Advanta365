import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const deliverTrainingTemplates = sample("deliver-training", [
  {
    slug: "train-the-trainer-kit",
    title: "Train-the-Trainer Facilitation Kit",
    deliverableType: "training",
    apps: ["m365-general"],
    audiences: ["change-lead", "manager"],
    format: "docx",
    adkar: ["knowledge", "ability"],
    pageCount: 18,
    summary: "Prepare internal trainers and champions to deliver sessions with confidence.",
    description:
      "A facilitator guide covering preparation, delivery and handling difficult questions. Includes a rehearsal checklist and an observation form.",
    includes: ["18-page facilitator guide", "Rehearsal checklist", "Observation form"],
  },
]);
