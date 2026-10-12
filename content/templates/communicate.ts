import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const communicateTemplates = sample("communicate", [
  // Announce the change
  {
    slug: "master-communications-plan",
    title: "Master Communications Plan",
    step: "announce-the-change",
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
  },
  {
    slug: "launch-announcement-email-series",
    title: "Launch Announcement Email Series",
    step: "announce-the-change",
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
    step: "announce-the-change",
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
    step: "announce-the-change",
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
    step: "announce-the-change",
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

  // Equip sponsors and managers
  {
    slug: "sponsor-message-scripts",
    title: "Sponsor Message Scripts",
    step: "equip-sponsors-and-managers",
    deliverableType: "sponsor",
    apps: ["m365-general"],
    audiences: ["sponsor"],
    format: "docx",
    adkar: ["awareness", "desire"],
    pageCount: 7,
    summary: "Scripts for the sponsor’s key messages: town hall, video and all-staff email.",
    description:
      "Three scripts written to be spoken aloud, each under three minutes. They answer why the change is happening and what the sponsor expects.",
    includes: ["Town hall script", "Video script", "All-staff email"],
  },
  {
    slug: "manager-talking-points-pack",
    title: "Manager Talking Points Pack",
    step: "equip-sponsors-and-managers",
    deliverableType: "communication",
    apps: ["sharepoint", "teams"],
    audiences: ["manager"],
    format: "docx",
    adkar: ["awareness", "desire"],
    pageCount: 6,
    summary:
      "What people managers should say to their teams, and how to answer the hard questions.",
    description:
      "Gives managers a short script for team meetings plus answers to the questions staff are most likely to raise. Staff hear about personal impact best from their own manager.",
    includes: ["Team meeting script", "Hard questions and answers", "Follow-up checklist"],
  },
  {
    slug: "manager-coaching-guide-for-resistance",
    title: "Manager Coaching Guide for Resistance",
    step: "equip-sponsors-and-managers",
    deliverableType: "resistance",
    apps: ["m365-general"],
    audiences: ["manager"],
    format: "docx",
    adkar: ["desire", "ability"],
    pageCount: 12,
    summary: "Helps managers have one-to-one conversations with staff who are struggling.",
    description:
      "A practical guide to finding out why someone is not adopting the change and what would help. Includes conversation openers and a simple action plan.",
    includes: ["12-page coaching guide", "Conversation openers", "Individual action plan"],
  },
]);
