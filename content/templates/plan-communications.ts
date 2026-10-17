import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const planCommunicationsTemplates = sample("plan-communications", [
  {
    slug: "master-communications-plan",
    title: "Master Communications Plan",
    deliverableType: "communication",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["awareness", "desire"],
    free: true,
    summary: "Every message, audience, sender, channel and date for the rollout in one plan.",
    description:
      "A communications calendar organized by audience, with the preferred sender for each message. Pre-filled with the messages a typical SharePoint rollout needs, from first announcement to post-launch follow-up.",
    includes: [
      "Communications calendar",
      "Audience and sender matrix",
      "Pre-filled message list",
      "Status tracker",
    ],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "plan",
        name: "Master Communications Plan.xlsx",
        key: "communicate/master-communications-plan/master-communications-plan.xlsx",
        bytes: 57,
        sha256: "6a02b86c2c95c89b00445bdfc32c92245e8bbce54b9e549e90b0927f355897eb",
      },
    ],
  },
  {
    slug: "launch-announcement-email-series",
    title: "Launch Announcement Email Series",
    deliverableType: "communication",
    apps: ["sharepoint", "outlook"],
    audiences: ["end-user"],
    format: "docx",
    adkar: ["awareness", "desire"],
    pageCount: 9,
    summary: "Five ready-to-send emails that take staff from first notice to launch day.",
    description:
      "A sequence of short emails: coming soon, why it matters, what to expect, launch day, and where to get help. Each has a subject line and a suggested sender.",
    includes: ["Five email drafts", "Subject line options", "Send schedule"],
  },
  {
    slug: "intranet-news-post-kit",
    title: "Intranet News Post Kit",
    deliverableType: "communication",
    apps: ["sharepoint"],
    audiences: ["end-user"],
    format: "docx",
    adkar: ["awareness"],
    pageCount: 8,
    summary: "Six news post drafts for the intranet, with headline and image suggestions.",
    description:
      "News articles that build interest in the weeks before launch. Each draft is under 300 words and ends with a clear next step.",
    includes: ["Six news post drafts", "Headline options", "Image guidance"],
  },
  {
    slug: "rollout-faq-builder",
    title: "Rollout FAQ Builder",
    deliverableType: "communication",
    apps: ["sharepoint", "m365-general"],
    audiences: ["end-user", "manager"],
    format: "docx",
    adkar: ["awareness", "knowledge"],
    pageCount: 5,
    summary: "Forty common rollout questions with draft answers to adapt.",
    description:
      "Questions grouped by theme: why, when, my files, my access and getting help. Remove what does not apply and publish the rest.",
    includes: ["40 questions with draft answers", "Theme groupings", "Review checklist"],
  },
  {
    slug: "whats-changing-for-me-one-pager",
    title: "What’s Changing for Me One-Pager",
    deliverableType: "communication",
    apps: ["onedrive", "sharepoint"],
    audiences: ["end-user"],
    format: "pdf",
    adkar: ["awareness", "knowledge"],
    pageCount: 1,
    summary: "A single page that shows staff what stays the same and what changes.",
    description:
      "A before-and-after layout for file storage and sharing. Designed to be printed or posted where people work.",
    includes: ["One-page layout", "Editable source file", "Three role variants"],
  },
  {
    slug: "shared-mailbox-transition-notice-pack",
    title: "Shared Mailbox Transition Notice Pack",
    deliverableType: "communication",
    apps: ["outlook"],
    audiences: ["end-user", "manager"],
    format: "docx",
    adkar: ["awareness", "knowledge"],
    pageCount: 5,
    summary: "Notices for teams whose shared mailboxes are moving or changing.",
    description:
      "Three notices timed for two weeks before, the day before and the day after the move. Each explains exactly what the team needs to do.",
    includes: ["Three timed notices", "Action checklist for mailbox owners", "Help contact block"],
  },
]);
