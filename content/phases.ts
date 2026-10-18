// The toolkit's sections, one for each of its folders and in the folders' order, so the step
// numbers on the site match the folder numbers a buyer sees after purchase. Only folders 01 to 11
// are numbered phases: Start here is orientation and Used at every step holds the tools used
// throughout. `label` is a short name (no page shows it today), `name` the plain one menus, lists
// and the catalog use. The summaries are working copy: edit them here.
export const phases = [
  {
    slug: "start-here",
    name: "Start here",
    label: "Start here",
    summary:
      "Get your bearings: how the toolkit is organized, how to use it and a worked example of a whole rollout.",
    order: 0,
  },
  {
    slug: "define-the-change",
    name: "Define the change",
    label: "Define",
    summary:
      "Say what is changing and why, agree what success looks like and how its benefits will be measured.",
    order: 1,
    number: 1,
  },
  {
    slug: "assess-the-impact",
    name: "Assess the impact",
    label: "Assess",
    summary: "Map the audiences affected, how much changes for each and how ready they are for it.",
    order: 2,
    number: 2,
  },
  {
    slug: "set-the-strategy",
    name: "Set the strategy",
    label: "Strategize",
    summary:
      "Set the approach the rest of the rollout follows: the team, the plan and how resistance will be handled.",
    order: 3,
    number: 3,
  },
  {
    slug: "engage-leaders",
    name: "Engage leaders",
    label: "Engage",
    summary:
      "Bring sponsors, managers and champions on board, and give them what they need to lead the change.",
    order: 4,
    number: 4,
  },
  {
    slug: "plan-communications",
    name: "Plan communications",
    label: "Communicate",
    summary:
      "Tell each audience what is changing, why and what it means for them, from first notice to launch day.",
    order: 5,
    number: 5,
  },
  {
    slug: "design-the-platform",
    name: "Design the platform",
    label: "Design",
    summary:
      "Agree who can create what, how content is kept in order and who decides when the rules change.",
    order: 6,
    number: 6,
  },
  {
    slug: "plan-the-training",
    name: "Plan the training",
    label: "Plan training",
    summary: "Work out what each role needs to learn and how and when they will learn it.",
    order: 7,
    number: 7,
  },
  {
    slug: "build-the-training",
    name: "Build the training",
    label: "Build training",
    summary: "Build the decks, guides and exercises each audience needs on day one.",
    order: 8,
    number: 8,
  },
  {
    slug: "deliver-training",
    name: "Deliver training",
    label: "Train",
    summary: "Run the sessions, prepare the trainers and bring each audience on board.",
    order: 9,
    number: 9,
  },
  {
    slug: "go-live-and-support",
    name: "Go live and support",
    label: "Go live",
    summary:
      "Make the Go/No-Go decision, run cutover and launch day, then support people through the first weeks.",
    order: 10,
    number: 10,
  },
  {
    slug: "make-it-stick",
    name: "Make it stick",
    label: "Sustain",
    summary:
      "Measure real adoption, reinforce the new ways of working and hand ownership to the business.",
    order: 11,
    number: 11,
  },
  {
    slug: "used-at-every-step",
    name: "Used at every step",
    label: "Every step",
    summary: "The registers, reports and reviews you keep up from the first step to the last.",
    order: 12,
  },
];
