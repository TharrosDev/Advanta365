import { sample } from "./sample";

// SAMPLE CONTENT — placeholder entries for the beta, not real products.
export const planTemplates = sample("plan", [
  // Assess impact and readiness
  {
    slug: "sharepoint-migration-impact-assessment",
    title: "SharePoint Migration Impact Assessment",
    step: "assess-impact-and-readiness",
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
    step: "assess-impact-and-readiness",
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
    step: "assess-impact-and-readiness",
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
    step: "assess-impact-and-readiness",
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
    step: "assess-impact-and-readiness",
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
    slug: "change-risk-and-resistance-register",
    title: "Change Risk and Resistance Register",
    step: "assess-impact-and-readiness",
    deliverableType: "resistance",
    apps: ["m365-general"],
    audiences: ["change-lead"],
    format: "xlsx",
    adkar: ["desire"],
    summary: "Log people-side risks and likely sources of resistance before they surface.",
    description:
      "A risk register tuned for adoption risks rather than technical ones. Each risk has a likely root cause and a planned response.",
    includes: ["Risk and resistance register", "Common root causes list", "Response options"],
  },
  {
    slug: "copilot-readiness-assessment",
    title: "Copilot Readiness Assessment",
    step: "assess-impact-and-readiness",
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
    step: "assess-impact-and-readiness",
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

  // Set the change strategy
  {
    slug: "change-management-strategy",
    title: "Change Management Strategy",
    step: "set-the-change-strategy",
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
    slug: "meridian-group-worked-example",
    title: "Meridian Group Worked Example",
    step: "set-the-change-strategy",
    deliverableType: "plan",
    apps: ["sharepoint", "m365-general"],
    audiences: ["change-lead", "sponsor"],
    format: "docx",
    adkar: ["awareness", "desire", "knowledge", "ability", "reinforcement"],
    summary:
      "A full change management strategy, worked through for the fictional Meridian Group of about 10,000 employees.",
    description:
      "Shows a complete strategy filled in for one organization, so you can see how the pieces fit together before writing your own. Meridian Group is fictional and was created for this example.",
    includes: ["Fully worked change management strategy"],
  },
  {
    slug: "change-team-raci-matrix",
    title: "Change Team RACI Matrix",
    step: "set-the-change-strategy",
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
    step: "set-the-change-strategy",
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
]);
