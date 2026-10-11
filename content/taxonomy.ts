export const DELIVERABLE_TYPES = [
  "communication",
  "training",
  "assessment",
  "plan",
  "stakeholder",
  "sponsor",
  "resistance",
  "measurement",
  "governance",
] as const;

export const APPS = [
  "sharepoint",
  "teams",
  "onedrive",
  "outlook",
  "copilot",
  "m365-general",
] as const;

export const AUDIENCES = [
  "sponsor",
  "change-lead",
  "manager",
  "end-user",
  "site-owner",
  "im-rep",
  "it-admin",
] as const;

export const FORMATS = ["docx", "pptx", "xlsx", "pdf"] as const;

export const ADKAR = ["awareness", "desire", "knowledge", "ability", "reinforcement"] as const;

export const DELIVERABLE_TYPE_LABELS: Record<(typeof DELIVERABLE_TYPES)[number], string> = {
  communication: "Communications",
  training: "Training",
  assessment: "Assessments",
  plan: "Plans",
  stakeholder: "Stakeholder tools",
  sponsor: "Sponsor tools",
  resistance: "Resistance management",
  measurement: "Measurement",
  governance: "Governance",
};

export const APP_LABELS: Record<(typeof APPS)[number], string> = {
  sharepoint: "SharePoint",
  teams: "Teams",
  onedrive: "OneDrive",
  outlook: "Outlook",
  copilot: "Copilot",
  "m365-general": "Microsoft 365 (general)",
};

export const AUDIENCE_LABELS: Record<(typeof AUDIENCES)[number], string> = {
  sponsor: "Sponsors",
  "change-lead": "Change leads",
  manager: "People managers",
  "end-user": "End users",
  "site-owner": "Site Owners",
  "im-rep": "IM Representatives",
  "it-admin": "IT admins",
};

export const FORMAT_LABELS: Record<(typeof FORMATS)[number], string> = {
  docx: "Word",
  pptx: "PowerPoint",
  xlsx: "Excel",
  pdf: "PDF",
};
