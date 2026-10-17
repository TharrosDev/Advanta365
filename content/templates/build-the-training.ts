import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const buildTheTrainingTemplates = sample("build-the-training", [
  {
    slug: "sharepoint-end-user-training-deck",
    title: "SharePoint End-User Training Deck",
    deliverableType: "training",
    apps: ["sharepoint"],
    audiences: ["end-user"],
    format: "pptx",
    adkar: ["knowledge", "ability"],
    pageCount: 42,
    free: true,
    summary:
      "A 60-minute instructor-led session on finding, sharing and co-authoring in SharePoint.",
    description:
      "Covers the everyday tasks staff need on day one, with hands-on exercises after each topic. Screens are generic so you can replace them with your own environment.",
    includes: [
      "42-slide training deck",
      "Instructor notes",
      "Five hands-on exercises",
      "Participant handout",
    ],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "training-deck",
        name: "SharePoint End-User Training Deck.pptx",
        key: "prepare/sharepoint-end-user-training-deck/sharepoint-end-user-training-deck.pptx",
        bytes: 64,
        sha256: "af3bbd7f000d458a160dcdc6249f0f5b87b60d0ff39fb7f393e58370ee56bd10",
      },
    ],
  },
  {
    slug: "im-representative-training-kit",
    title: "IM Representative Training Kit",
    deliverableType: "training",
    apps: ["sharepoint"],
    audiences: ["im-rep"],
    format: "docx",
    adkar: ["knowledge", "ability"],
    summary: "Training for IM Representatives on governance, metadata and keeping sites in order.",
    description:
      "Covers what IM Representatives need to know and do in SharePoint, and the governance rules they help others follow. Comes with a facilitator guide, a learning guide and job aids.",
    includes: ["Facilitator guide", "Learning guide", "Job aids"],
  },
  {
    slug: "teams-quick-reference-guides",
    title: "Teams Quick Reference Guides",
    deliverableType: "training",
    apps: ["teams"],
    audiences: ["end-user"],
    format: "pdf",
    adkar: ["knowledge", "ability"],
    pageCount: 10,
    summary: "Ten one-page guides for the most common Teams tasks.",
    description:
      "Step-by-step guides for chat, meetings, channels and files. Each fits on a single page and can be shared as a link or printed.",
    includes: ["Ten one-page guides", "Editable source files", "Index page"],
  },
  {
    slug: "onedrive-file-migration-guide",
    title: "OneDrive File Migration Guide for Staff",
    deliverableType: "training",
    apps: ["onedrive"],
    audiences: ["end-user"],
    format: "pdf",
    adkar: ["knowledge", "ability"],
    pageCount: 6,
    summary: "Shows staff how to move from a personal network drive to OneDrive.",
    description:
      "Explains what to move, what to leave, and how sync works. Written for people who have only ever used a network drive.",
    includes: ["Six-page guide", "What-goes-where chart", "Sync troubleshooting tips"],
  },
  {
    slug: "copilot-prompting-starter-workshop",
    title: "Copilot Prompting Starter Workshop",
    deliverableType: "training",
    apps: ["copilot"],
    audiences: ["end-user", "manager"],
    format: "pptx",
    adkar: ["desire", "knowledge", "ability"],
    pageCount: 30,
    summary: "A 90-minute workshop that gets staff writing useful Copilot prompts.",
    description:
      "Introduces a simple prompt structure and has participants practice on their own work. Includes a section on responsible use and checking results.",
    includes: [
      "30-slide workshop deck",
      "Prompt practice sheets",
      "Responsible use guide",
      "Follow-up exercises",
    ],
  },
]);
