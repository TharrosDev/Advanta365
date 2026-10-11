// Rollout phases, labeled in plain language and listed in the order a rollout moves through
// them, from making the case to sustaining the change. Names and steps are working labels:
// edit them here.
export const phases = [
  {
    slug: "make-the-case",
    name: "Make the case",
    summary:
      "Show why adoption needs its own plan, agree what success looks like and get a sponsor who will stand behind it.",
    order: 1,
    steps: [
      {
        slug: "build-the-business-case",
        name: "Build the business case",
        summary:
          "Set out the reason for the change, the outcomes expected and how benefits will be measured.",
        order: 1,
      },
      {
        slug: "secure-sponsorship",
        name: "Secure sponsorship",
        summary:
          "Name the sponsor, agree what is asked of them and start the rollout in their voice.",
        order: 2,
      },
    ],
  },
  {
    slug: "plan",
    name: "Plan",
    summary:
      "Understand who is affected and how ready they are, then set the strategy the rest of the rollout follows.",
    order: 2,
    steps: [
      {
        slug: "assess-impact-and-readiness",
        name: "Assess impact and readiness",
        summary: "Map the groups affected, how ready they are and where resistance is likely.",
        order: 1,
      },
      {
        slug: "set-the-change-strategy",
        name: "Set the change strategy",
        summary: "Set the approach, the team and how resistance will be handled.",
        order: 2,
      },
    ],
  },
  {
    slug: "design",
    name: "Design",
    summary:
      "Decide the rules people will work within and how each group will be reached, trained and supported.",
    order: 3,
    steps: [
      {
        slug: "design-governance",
        name: "Design governance",
        summary:
          "Agree who can create what, how content is kept in order and who decides when the rules change.",
        order: 1,
      },
      {
        slug: "design-the-adoption-approach",
        name: "Design the adoption approach",
        summary: "Work out what each role needs and how the rollout will reach them.",
        order: 2,
      },
    ],
  },
  {
    slug: "prepare",
    name: "Prepare",
    summary:
      "Get people ready before launch: build a network of champions and train each audience for the way they actually work.",
    order: 4,
    steps: [
      {
        slug: "build-the-champion-network",
        name: "Build the champion network",
        summary: "Recruit champions and trainers, and give them what they need to help colleagues.",
        order: 1,
      },
      {
        slug: "train-each-audience",
        name: "Train each audience",
        summary: "Build the knowledge and skills each audience needs on day one.",
        order: 2,
      },
    ],
  },
  {
    slug: "communicate",
    name: "Communicate",
    summary:
      "Tell each audience what is changing, why, and what it means for them, through the people they listen to.",
    order: 5,
    steps: [
      {
        slug: "announce-the-change",
        name: "Announce the change",
        summary: "Take staff from first notice to launch day with clear, timely messages.",
        order: 1,
      },
      {
        slug: "equip-sponsors-and-managers",
        name: "Equip sponsors and managers",
        summary: "Give sponsors and people managers the words to lead the change with their teams.",
        order: 2,
      },
    ],
  },
  {
    slug: "execute",
    name: "Execute",
    summary:
      "Go live with a plan, on-the-ground help and a way to hear feedback, then support people through the first weeks.",
    order: 6,
    steps: [
      {
        slug: "go-live",
        name: "Go live",
        summary: "Make the Go/No-Go decision, then run cutover and launch day in order.",
        order: 1,
      },
      {
        slug: "run-hypercare",
        name: "Run hypercare",
        summary: "Give extra support after launch, act on feedback and agree when it ends.",
        order: 2,
      },
    ],
  },
  {
    slug: "sustain",
    name: "Sustain",
    summary:
      "Make the change stick: measure real adoption, reinforce the new ways of working and hand ownership to the business.",
    order: 7,
    steps: [
      {
        slug: "measure-adoption",
        name: "Measure adoption",
        summary: "Track usage, proficiency and benefits against the targets you set.",
        order: 1,
      },
      {
        slug: "reinforce-and-hand-over",
        name: "Reinforce and hand over",
        summary:
          "Recognize progress, correct gaps and move from project to operations with clear owners.",
        order: 2,
      },
    ],
  },
];
