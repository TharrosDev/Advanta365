import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const engageLeadersTemplates = sample("engage-leaders", [
  {
    slug: "executive-sponsor-kickoff-deck",
    title: "Executive Sponsor Kickoff Deck",
    deliverableType: "sponsor",
    apps: ["sharepoint"],
    audiences: ["sponsor"],
    format: "pptx",
    adkar: ["awareness", "desire"],
    pageCount: 16,
    free: true,
    summary: "The deck a sponsor presents to launch a SharePoint rollout with authority.",
    description:
      "Gives the executive sponsor a clear story: why now, what changes, and what they are asking of leaders. Speaker notes are written in plain language so it can be delivered with little preparation.",
    includes: [
      "16-slide kickoff deck",
      "Speaker notes",
      "One-page leave-behind",
      "Customization checklist",
    ],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "deck",
        name: "Executive Sponsor Kickoff Deck.pptx",
        key: "make-the-case/executive-sponsor-kickoff-deck/executive-sponsor-kickoff-deck.pptx",
        bytes: 61,
        sha256: "8f411c3d7b2973b96950ae019b197f9148be2be5752c109a8fba4e6e903de303",
      },
    ],
  },
  {
    slug: "sponsor-roles-brief",
    title: "Sponsor Roles and Responsibilities Brief",
    deliverableType: "sponsor",
    apps: ["m365-general"],
    audiences: ["sponsor"],
    format: "pdf",
    adkar: ["awareness"],
    pageCount: 4,
    summary: "What an active and visible sponsor is expected to do, phase by phase.",
    description:
      "A briefing document for a newly named sponsor. Lists the specific actions expected of them and the time each one takes.",
    includes: ["Four-page brief", "Sponsor action checklist", "Suggested meeting cadence"],
  },
  {
    slug: "sponsorship-roadmap",
    title: "Sponsorship Roadmap",
    deliverableType: "sponsor",
    apps: ["sharepoint", "m365-general"],
    audiences: ["sponsor", "change-lead"],
    format: "xlsx",
    adkar: ["awareness", "desire"],
    summary: "A dated plan of what the sponsor says and does through the whole rollout.",
    description:
      "Schedules sponsor activities week by week: messages, meetings and visible appearances. Keeps sponsorship active after kickoff, when it most often fades.",
    includes: ["Sponsor activity roadmap", "Message calendar", "Status tracker"],
  },
  {
    slug: "sponsor-message-scripts",
    title: "Sponsor Message Scripts",
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
  {
    slug: "champion-network-playbook",
    title: "Champion Network Playbook",
    deliverableType: "stakeholder",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead"],
    format: "docx",
    adkar: ["desire", "ability"],
    summary: "How to recruit, brief and run a champion network through a SharePoint rollout.",
    description:
      "Sets out how to choose champions, what to ask of them at each stage, and how to keep their meetings worth attending. Includes meeting agendas and a simple activity tracker.",
    includes: ["Champion network playbook", "Meeting agendas", "Champion activity tracker"],
  },
  {
    slug: "teams-champion-network-charter",
    title: "Teams Champion Network Charter",
    deliverableType: "stakeholder",
    apps: ["teams"],
    audiences: ["change-lead", "manager"],
    format: "docx",
    adkar: ["desire", "ability"],
    pageCount: 7,
    summary: "Set up a champion network with a clear purpose, time commitment and recognition.",
    description:
      "Defines what champions do, how they are chosen and what they get in return. Includes the nomination email and a manager approval note.",
    includes: ["Seven-page charter", "Nomination email", "Manager approval note"],
  },
]);
