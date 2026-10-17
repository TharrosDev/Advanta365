# The toolkit's real folders as the site's phases

Approved in chat on 2026-10-17.

## Why

The catalog was organized by seven invented phases, each split into two invented sub-steps. The
toolkit a buyer downloads is organized by 13 folders. The site should use the same structure, so
the phase numbers on the site match the folder numbers a buyer sees after purchase.

## The sections

Thirteen sections replace the seven phases, in folder order. Only 01 to 11 are numbered phases.
`00 Start Here` is orientation and `12 Through Every Step` holds tools used throughout, so neither
gets a number.

| Folder                              | Slug                  | Short label (line)  | Plain name (lists, catalog) |
| ----------------------------------- | --------------------- | ------------------- | --------------------------- |
| 00 Start Here                       | `start-here`          | Start here          | Start here                  |
| 01 Define the Change                | `define-the-change`   | Define              | Define the change           |
| 02 Analyze Audiences and Impacts    | `assess-the-impact`   | Assess              | Assess the impact           |
| 03 Build the Change Strategy        | `set-the-strategy`    | Strategize          | Set the strategy            |
| 04 Engage Sponsors and Stakeholders | `engage-leaders`      | Engage              | Engage leaders              |
| 05 Plan Comms and Awareness         | `plan-communications` | Communicate         | Plan communications         |
| 06 Design Platform and Governance   | `design-the-platform` | Design              | Design the platform         |
| 07 Plan the Training                | `plan-the-training`   | Plan training       | Plan the training           |
| 08 Build the Courseware             | `build-the-training`  | Build training      | Build the training          |
| 09 Deliver Training and Onboard     | `deliver-training`    | Train               | Deliver training            |
| 10 Cut Over and Support             | `go-live-and-support` | Go live             | Go live and support         |
| 11 Sustain and Improve              | `make-it-stick`       | Sustain             | Make it stick               |
| 12 Through Every Step               | `used-at-every-step`  | Every step          | Used at every step          |

The sub-steps are removed. A section is one list of templates.

## Data

- `content/phases.ts` lists the 13 sections. Each has `slug`, `name` (plain), `label` (short),
  `summary`, `order` (the folder number, 0 to 12) and, for 01 to 11 only, `number`.
- Templates lose `step`. The 67 sample templates are re-filed by best fit, one content file per
  section. The six free samples stay the same six templates.
- The code keeps the type name `Phase`, and everything a visitor reads says "phase". The folder names
  Start here and Used at every step keep their words.

## Navigation and pages

- No strip or rail stands under the bar. The bar's row, from 68em, is Catalog, a "Phases"
  drop-down and Why Advanta; its underline sits under Phases on a phase page.
- The drop-down (`StepMenu`) lists the plain names, numbered 1 to 11, with Start here first and
  Used at every step last. It is a disclosure of links, so it works without script, and it closes
  on Escape, a click outside, a link or a change of page. Below 68em the catalog has its own copy,
  "Jump to a phase", which names the phase the catalog is filtered on. The drawer lists the 13
  under "Phases".
- Section pages stay at `/phases/{slug}`. The seven old addresses redirect permanently to the
  nearest new section; any other unknown slug is a 404.
- A section page shows "Phase N of 11", the numeral and an 11-block tally. Start here says "Before
  phase 1" and Used at every step "Alongside phases 1 to 11", with no numeral or tally. The page
  lists its templates in one band.
- The index cards (`PhaseTabs`) stay only where a page offers every section: the home page and the
  catalog's empty search ("Browse by phase").
- Why Advanta shows the eleven phases with their short labels under an 11-block tally, where the
  line is 72rem wide, then "Plus Start here and Used at every step".
- Numerals on template covers, tiles and the pager use `number`, so unnumbered sections show none.
- Copy that counted "seven phases" counts eleven phases.

## Testing

Unit tests cover the schema, validation (numbers run 1 to 11 in order), query order and coverage.
The end-to-end specs for the bar's Phases drop-down, the drawer, the catalog filter and its drop-down, the
phase pages and redirects are updated to the new names and addresses.
