import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const goLiveAndSupportTemplates = sample("go-live-and-support", [
  {
    slug: "go-live-readiness-checklist",
    title: "Go/No-Go Decision Checklist",
    deliverableType: "plan",
    apps: ["sharepoint", "teams"],
    audiences: ["change-lead", "it-admin"],
    format: "xlsx",
    adkar: ["ability"],
    free: true,
    summary: "Confirm people, communication, training and support are ready before you launch.",
    description:
      "A Go/No-Go checklist that covers the people side as well as the technical side. Each item has an owner and evidence required.",
    includes: ["Readiness checklist", "Go/No-Go decision summary", "Evidence log"],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "checklist",
        name: "Go-No-Go Decision Checklist.xlsx",
        key: "execute/go-live-readiness-checklist/go-live-readiness-checklist.xlsx",
        bytes: 58,
        sha256: "f04da623d76f6c8e25f0cad127cf5cf2c4e53ab2f42b02d914e89190c9fcf390",
      },
    ],
  },
  {
    slug: "sharepoint-cutover-playbook",
    title: "SharePoint Cutover Playbook",
    deliverableType: "plan",
    apps: ["sharepoint"],
    audiences: ["change-lead", "it-admin"],
    format: "docx",
    adkar: ["ability"],
    summary: "The people side of cutover: who is told what, when, and who is on hand to help.",
    description:
      "Covers the days around cutover, from the content freeze notice through the cutover weekend to the first morning on the new platform. Sits alongside the technical migration plan rather than replacing it.",
    includes: [
      "Cutover playbook",
      "Cutover weekend sequence",
      "Content freeze notice wording",
      "First-morning checklist",
    ],
  },
  {
    slug: "launch-day-run-sheet",
    title: "Launch Day Run Sheet",
    deliverableType: "plan",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["ability"],
    summary: "An hour-by-hour plan for launch day, with owners and contact details.",
    description:
      "Lists every launch-day activity in order, from the first message to the end-of-day review. Includes a contact sheet and an issues log.",
    includes: ["Hour-by-hour run sheet", "Contact sheet", "Issues log"],
  },
  {
    slug: "hypercare-support-plan",
    title: "Hypercare Support Plan",
    deliverableType: "plan",
    apps: ["sharepoint", "m365-general"],
    audiences: ["it-admin", "change-lead"],
    format: "docx",
    adkar: ["ability"],
    pageCount: 9,
    summary: "Define the extra support in place after launch and when it ends.",
    description:
      "Sets support hours, channels, response targets and exit criteria for the hypercare period. Agreed in advance so support does not end abruptly.",
    includes: ["Nine-page plan", "Support model table", "Exit criteria checklist"],
  },
  {
    slug: "floor-walker-support-playbook",
    title: "Floor-Walker Support Playbook",
    deliverableType: "training",
    apps: ["m365-general"],
    audiences: ["change-lead", "manager"],
    format: "docx",
    adkar: ["ability"],
    pageCount: 11,
    summary: "Organize in-person and virtual helpers for the first two weeks.",
    description:
      "Explains how to recruit, brief and schedule floor-walkers. Includes a briefing pack and a log for the questions they hear.",
    includes: ["11-page playbook", "Helper briefing pack", "Schedule and question log"],
  },
  {
    slug: "user-feedback-intake-log",
    title: "User Feedback Intake and Triage Log",
    deliverableType: "measurement",
    apps: ["sharepoint"],
    audiences: ["change-lead", "it-admin"],
    format: "xlsx",
    adkar: ["ability", "reinforcement"],
    summary: "Capture feedback from every channel in one place and decide what to act on.",
    description:
      "A log with categories, severity and owner. A summary tab shows the top themes each week.",
    includes: ["Feedback log", "Triage categories", "Weekly themes summary"],
  },
]);
