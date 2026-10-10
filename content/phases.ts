// Rollout phases, labeled in plain language and mapped to the three phases of
// Prosci's methodology. Names and steps are working labels: edit them here.
export const phases = [
  {
    slug: "prepare",
    name: "Prepare",
    prosciPhase: "Prepare Approach",
    summary:
      "Define what success looks like, understand who is affected and how, and build the strategy before anything is announced.",
    order: 1,
    steps: [
      {
        slug: "define-success",
        name: "Define success",
        summary: "Agree on the outcomes, the sponsor and how benefits will be measured.",
        order: 1,
      },
      {
        slug: "assess-impact",
        name: "Assess impact",
        summary: "Map the groups affected, how ready they are and where resistance is likely.",
        order: 2,
      },
      {
        slug: "build-the-strategy",
        name: "Build the strategy",
        summary: "Set the approach, the team, sponsorship and governance for the rollout.",
        order: 3,
      },
    ],
  },
  {
    slug: "manage",
    name: "Manage",
    prosciPhase: "Manage Change",
    summary:
      "Run the rollout: communicate clearly, train people for the way they actually work, and support them through launch.",
    order: 2,
    steps: [
      {
        slug: "plan-and-communicate",
        name: "Plan and communicate",
        summary: "Tell each audience what is changing, why, and what it means for them.",
        order: 1,
      },
      {
        slug: "train-and-enable",
        name: "Train and enable",
        summary: "Build the knowledge and skills people need on day one.",
        order: 2,
      },
      {
        slug: "launch-and-support",
        name: "Launch and support",
        summary: "Go live with a plan, on-the-ground help and a way to hear feedback.",
        order: 3,
      },
    ],
  },
  {
    slug: "sustain",
    name: "Sustain",
    prosciPhase: "Sustain Outcomes",
    summary:
      "Make the change stick: measure real adoption, reinforce the new ways of working and hand ownership to the business.",
    order: 3,
    steps: [
      {
        slug: "measure-adoption",
        name: "Measure adoption",
        summary: "Track usage, proficiency and benefits against the targets you set.",
        order: 1,
      },
      {
        slug: "reinforce",
        name: "Reinforce",
        summary: "Recognize progress, correct gaps and keep skills fresh.",
        order: 2,
      },
      {
        slug: "transfer-ownership",
        name: "Transfer ownership",
        summary: "Move from project to operations with clear owners and governance.",
        order: 3,
      },
    ],
  },
];
