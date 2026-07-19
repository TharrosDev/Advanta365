// ADVANTA365 content library — single source of truth for site copy.
// Voice: precise, declarative, systems language. No em-dashes, no filler.

export const siteTitle = "ADVANTA365";
export const siteTagline = "Enterprise Microsoft 365 Adoption, Governance & Rollout";

/* ---------------------------------------------------------------- hero */

export const hero = {
  kicker: "Enterprise Microsoft 365 framework",
  // Rendered as three stacked display lines with a split-word reveal.
  titleLines: ["Microsoft 365,", "governed and", "adopted at scale."],
  lede:
    "One operating model for governance, adoption, and rollout across SharePoint, Teams, and OneDrive. Built for large, complex, regulated organizations.",
  cta1: "Book a call",
  cta2: "See the framework",
  meta: [
    { key: "Framework", value: "ADVANTA365" },
    { key: "Scope", value: "SharePoint · Teams · OneDrive" },
    { key: "Model", value: "6 stages · 5 modules · 4 tracks" },
    { key: "Status", value: "Accepting engagements" },
  ],
};

/* ------------------------------------------------------------- marquee */

export const marqueeWords = ["Governance", "Adoption", "Rollout", "Sustainment"];

/* ------------------------------------------------------- 01 · problem */

export const problem = {
  index: "01",
  kicker: "The failure state",
  heading: "Deployment is not adoption.",
  lede:
    "Most Microsoft 365 programs stall the day the licenses arrive. The platform is live. The organization never moves in.",
  incidents: [
    {
      code: "SPRWL-01",
      title: "Teams sprawl",
      body: "Hundreds of unmanaged teams and sites. No owner, no lifecycle, no way back.",
    },
    {
      code: "ADOPT-02",
      title: "Adoption flatline",
      body: "Users stay on email and shared drives while the new platforms sit idle.",
    },
    {
      code: "GOVRN-03",
      title: "Paper governance",
      body: "Policies live in a document nobody opens and never reach daily work.",
    },
  ],
  statement:
    "Software does not change how an organization works. An operating model does.",
};

/* ------------------------------------------------------ 02 · framework */

export const framework = {
  index: "02",
  kicker: "The framework",
  heading: "One operating model. Not another deployment.",
  lede:
    "ADVANTA365 combines governance, change management, structured rollout, and long-term sustainment in one repeatable operating model for the modern digital workplace.",
  principles: [
    {
      title: "Governance by design",
      body: "Embedded in provisioning, templates, and onboarding. Not a policy binder.",
    },
    {
      title: "Business-led ownership",
      body: "Business areas own their content and adoption, with central enablement.",
    },
    {
      title: "Role-based enablement",
      body: "Site owners, IM leads, end users, and executives each get a tailored journey.",
    },
    {
      title: "Sustainment built in",
      body: "Communities of practice and learning continue long after rollout ends.",
    },
  ],
};

/* ------------------------------------------------------- 03 · delivery */

export const delivery = {
  index: "03",
  kicker: "Delivery",
  heading: "Six stages. Governance in every one.",
  lede:
    "A structured path from first intent to a living platform. Each stage has defined outcomes, owners, and readiness criteria before the next begins.",
  note: "Governance is embedded at every stage. By design, not as an afterthought.",
  stages: [
    {
      num: "01",
      name: "Vision",
      body: "Define what good looks like: outcomes, ownership, and the case for change.",
    },
    {
      num: "02",
      name: "Strategy",
      body: "Turn vision into an operating model: governance, information architecture, adoption strategy.",
    },
    {
      num: "03",
      name: "Planning",
      body: "Sequence the rollout: waves, roles, templates, and readiness criteria.",
    },
    {
      num: "04",
      name: "Enablement",
      body: "Prepare the organization: role-based onboarding, champions, and training paths.",
    },
    {
      num: "05",
      name: "Rollout",
      body: "Launch wave by wave with governed provisioning and hands-on support.",
    },
    {
      num: "06",
      name: "Sustainment",
      body: "Keep it alive: communities of practice, measurement, and continuous improvement.",
    },
  ],
};

/* -------------------------------------------------------- 04 · modules */

export const registry = {
  index: "04",
  kicker: "The registry",
  heading: "Five modules. One governed system.",
  lede:
    "Working software and operating patterns that make the framework real inside your tenant.",
  modules: [
    {
      code: "MOD-01",
      tag: "Requests",
      title: "Workspaces",
      body: "Governed provisioning of Teams and SharePoint sites from approved templates.",
    },
    {
      code: "MOD-02",
      tag: "Requests",
      title: "Repositories",
      body: "Libraries, metadata, and structures aligned to information management standards.",
    },
    {
      code: "MOD-03",
      tag: "Catalog",
      title: "Blueprint",
      body: "A controlled inventory of approved templates, patterns, and configurations.",
    },
    {
      code: "MOD-04",
      tag: "Information",
      title: "Classify",
      body: "Taxonomy and content types that keep enterprise information findable.",
    },
    {
      code: "MOD-05",
      tag: "People",
      title: "Engage",
      body: "Change, adoption, learning, and sustainment. The human side of the system.",
    },
  ],
};

/* ------------------------------------------------------ 05 · platforms */

export const platforms = {
  index: "05",
  kicker: "The surface",
  heading: "Three platforms. One system of record.",
  lede:
    "Each platform has a defined role and a governed hand-off, so information always has one authoritative home.",
  items: [
    {
      name: "SharePoint Online",
      role: "The enterprise content platform and corporate knowledge repository.",
      themes: [
        "Metadata-driven structure",
        "Governance-enabled self-service",
        "Search-first experiences",
      ],
    },
    {
      name: "Microsoft Teams",
      role: "The collaboration layer: conversations, meetings, tasks, and files.",
      themes: [
        "Structured information management",
        "Governed team lifecycle",
        "Integrated with SharePoint",
      ],
    },
    {
      name: "OneDrive",
      role: "Personal work, drafts, and individual productivity.",
      themes: [
        "Personal and draft work",
        "Clear hand-off to SharePoint",
        "SharePoint stays authoritative",
      ],
    },
  ],
};

/* ------------------------------------------------------- 06 · adoption */

export const adoption = {
  index: "06",
  kicker: "The human layer",
  heading: "Adoption is engineered, not hoped for.",
  lede:
    "Every role in the organization gets a defined track: what to learn, what to own, and where to get help when the program moves on.",
  stats: [
    { value: 6, label: "Delivery stages" },
    { value: 5, label: "Working modules" },
    { value: 4, label: "Role-based tracks" },
  ],
  tracks: [
    {
      num: "01",
      title: "Site owners",
      body: "Operational ownership of sites, content, and permissions.",
    },
    {
      num: "02",
      title: "IM leads",
      body: "Information management, metadata, and classification standards.",
    },
    {
      num: "03",
      title: "End users",
      body: "Day-to-day work in Teams, SharePoint, and OneDrive.",
    },
    {
      num: "04",
      title: "Executives",
      body: "Sponsorship, visible support, and program direction.",
    },
  ],
  factors: [
    "Users understand what is in it for them",
    "Leadership visibly supports the initiative",
    "Onboarding is guided, and learning continues",
    "Governance feels practical, not bureaucratic",
  ],
};

/* ------------------------------------------------------------ 07 · why */

export const why = {
  index: "07",
  kicker: "Why ADVANTA365",
  heading: "Governance and adoption. Inseparable.",
  statement:
    "Most solutions pick one: lock the platform down, or let a thousand teams bloom. We treat control and adoption as the same problem.",
  reasons: [
    {
      num: "01",
      title: "Governance + adoption together",
      body: "Most solutions pick one. We treat them as inseparable.",
    },
    {
      num: "02",
      title: "Business-led model",
      body: "Owned by the business with central enablement. Not IT alone.",
    },
    {
      num: "03",
      title: "Role-based onboarding",
      body: "Site owners, IM leads, end users, and executives each get tailored journeys.",
    },
    {
      num: "04",
      title: "Sustainment built in",
      body: "Communities of practice and learning continue long after rollout.",
    },
  ],
};

/* -------------------------------------------------------- 08 · contact */

export const contactSection = {
  index: "08",
  kicker: "Start the program",
  heading: "Bring order to the digital workplace.",
  lede:
    "Tell us where your Microsoft 365 program is today and where you want it to be. We read and reply to every message.",
  emailLabel: "Write to us",
  bookLabel: "Book a call",
  meta: [
    { key: "Response", value: "Within 2 business days" },
    { key: "Engagements", value: "Enterprise and public sector" },
    { key: "Delivery", value: "Remote and on-site" },
  ],
};

export const contact = {
  email: "mark.abdelnour@gmail.com",
  // PLACEHOLDER — replace with the real booking link before launch.
  bookingUrl: "https://cal.com/advanta365",
};

/* ----------------------------------------------------------- site nav */

export const navItems = [
  { label: "Problem", href: "/#problem", index: "01" },
  { label: "Framework", href: "/#framework", index: "02" },
  { label: "Delivery", href: "/#delivery", index: "03" },
  { label: "Modules", href: "/#modules", index: "04" },
  { label: "Adoption", href: "/#adoption", index: "06" },
  { label: "Contact", href: "/#contact", index: "08" },
];

/* -------------------------------------------------------------- footer */

export const footer = {
  blurb:
    "Enterprise Microsoft 365 adoption, governance, and enablement framework for large, complex, regulated organizations.",
  parent: {
    label: "An Echofive Solutions framework",
    url: "https://echo-five.ca",
  },
};
