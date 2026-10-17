import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const assessTheImpactTemplates = sample("assess-the-impact", [
  {
    slug: "sharepoint-migration-impact-assessment",
    title: "SharePoint Migration Impact Assessment",
    deliverableType: "assessment",
    apps: ["sharepoint"],
    audiences: ["change-lead", "it-admin"],
    format: "xlsx",
    adkar: ["awareness"],
    summary:
      "Score how a SharePoint migration affects each group across ten aspects of their work.",
    description:
      "Rates the degree of change for every impacted group across process, tools, roles and behaviors. Produces a heatmap that shows where to concentrate communication and training.",
    includes: [
      "Impact scoring workbook",
      "Auto-generated heatmap",
      "Interview question set",
      "Summary slide",
    ],
    // Test fixture files (tests/fixtures/files), not real downloads.
    files: [
      {
        id: "workbook",
        name: "Impact Scoring Workbook.xlsx",
        key: "plan/sharepoint-migration-impact-assessment/impact-scoring-workbook.xlsx",
        bytes: 54,
        sha256: "9d09c48bd1463082babd6e17641d27daa1c667e30026c30d4f2a720d688002c3",
      },
      {
        id: "summary-slide",
        name: "Impact Assessment Summary Slide.pptx",
        key: "plan/sharepoint-migration-impact-assessment/summary-slide.pptx",
        bytes: 62,
        sha256: "4735f34b54537a203a3da4008e89aba6a813752358d128f37bc20d1eee17620b",
      },
    ],
  },
  {
    slug: "current-state-site-audit",
    title: "Current-State Content and Site Audit",
    deliverableType: "assessment",
    apps: ["sharepoint"],
    audiences: ["it-admin", "change-lead"],
    format: "xlsx",
    adkar: ["awareness"],
    summary: "Inventory existing sites, owners and content so nothing is missed in the move.",
    description:
      "A site-by-site inventory with ownership, activity and disposition columns. Flags the sites whose owners need early, direct engagement.",
    includes: ["Site inventory workbook", "Disposition decision guide", "Owner outreach tracker"],
  },
  {
    slug: "stakeholder-map-and-analysis",
    title: "Stakeholder Map and Analysis",
    deliverableType: "stakeholder",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["awareness", "desire"],
    summary: "Identify every stakeholder group, their influence and their current position.",
    description:
      "A structured register for stakeholders with an influence and support grid. Each entry carries an engagement action and an owner.",
    includes: ["Stakeholder register", "Influence and support grid", "Engagement action log"],
  },
  {
    slug: "change-readiness-survey",
    title: "Organizational Change Readiness Survey",
    deliverableType: "assessment",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead", "manager"],
    format: "docx",
    adkar: ["awareness", "desire"],
    pageCount: 6,
    summary: "A 20-question survey that shows how ready each group is for the change.",
    description:
      "Measures awareness, willingness and confidence before launch. Comes with a scoring guide and wording for the invitation email.",
    includes: ["20-question survey", "Scoring guide", "Invitation email wording"],
  },
  {
    slug: "change-saturation-heatmap",
    title: "Change Saturation Heatmap",
    deliverableType: "assessment",
    apps: ["m365-general"],
    audiences: ["change-lead", "sponsor"],
    format: "xlsx",
    adkar: ["desire"],
    summary: "See which teams are already absorbing too many changes at once.",
    description:
      "Plots every in-flight initiative against the groups it touches by month. Highlights collisions so launch dates can be adjusted.",
    includes: ["Saturation heatmap workbook", "Initiative inventory sheet", "Reading guide"],
  },
  {
    slug: "copilot-readiness-assessment",
    title: "Copilot Readiness Assessment",
    deliverableType: "assessment",
    apps: ["copilot"],
    audiences: ["change-lead", "it-admin"],
    format: "xlsx",
    adkar: ["awareness"],
    summary: "Check whether people, content and governance are ready for Microsoft 365 Copilot.",
    description:
      "Rates readiness across sponsorship, content and permissions, skills and support. Shows where to act before licences are assigned.",
    includes: ["Readiness assessment workbook", "Scoring guide", "Summary slide"],
  },
  {
    slug: "copilot-change-impact-assessment",
    title: "Copilot Change Impact Assessment",
    deliverableType: "assessment",
    apps: ["copilot"],
    audiences: ["change-lead", "manager"],
    format: "xlsx",
    adkar: ["awareness", "desire"],
    summary: "Score how Microsoft 365 Copilot changes the work of each group, role by role.",
    description:
      "Rates the degree of change for each impacted group across tasks, skills and ways of working. Shows which groups need the most communication and training before Copilot reaches them.",
    includes: ["Impact scoring workbook", "Role-by-role impact summary", "Interview question set"],
  },
  {
    slug: "user-persona-impact-profiles",
    title: "User Persona Impact Profiles",
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
]);
