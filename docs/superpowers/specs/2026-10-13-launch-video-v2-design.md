# Launch video v2: "Blank Prompt", rebuilt

Approved in session on 2026-10-13. Replaces the picture and sound of v1
(`2026-10-13-launch-video-design.md`); the concept and the facts stay.

## Why

A review of v1 at two frames a second found a weak first three seconds, the brand first seen at
0:41, no plain statement of what the product is or who it is for, six phases shown for "all
seven", flat slideshow scenes with long static holds, type too small for a phone, placeholder grey
documents, still ink, two muddy transitions, no music, a quiet mix (about -25 dB) and steppy 30 fps
motion.

## Format

1920 by 1080, 60 frames a second, 45.0 seconds. Music at 96 beats a minute: a beat is 0.625 s, a
bar 2.5 s, and 45 s is exactly 18 bars. Every cut lands on a beat. Loudness -16 LUFS, true peak
-1.5 dBTP.

## Storyboard

| Time      | Beat           | On screen                                                                                                   |
| --------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| 0:00–2.5  | Hook           | A blank page and a giant blinking cursor; the camera pulls back to "Ask anything"                           |
| 2.5–5.0   | Typing         | The prompt typed at 120px; the camera follows the caret                                                    |
| 5.0–7.5   | Reply          | A wall of generic advice streams in and scrolls                                                             |
| 7.5–10.0  | Verdict        | "Plausible." and "Unproven." slam in on beats 1 and 3; the highlighter sweeps "Unproven."                  |
| 10.0–12.5 | Ink            | Live ink drops on the downbeat and floods the reply, then turns to mist                                     |
| 12.5–17.5 | Turn           | "Don't start from a blank prompt."; "Introducing" and the mark drawn stroke by stroke with Advanta365      |
| 17.5–20.0 | What it is     | A fresh sheet slides up: "The change management and user adoption toolkit for Microsoft 365 and SharePoint rollouts."; five app chips |
| 20.0–27.5 | Rollout        | The camera snaps along the seven phases, a document rising at each: slide, page or workbook                 |
| 27.5–30.0 | Folder         | The camera pulls back; the seven documents fly into the toolkit folder, which closes with the price         |
| 30.0–34.4 | Scale          | 59, 130, 4, 58, 3 slam in on the beats over a wall of 130 template tiles; the field-tested line             |
| 34.4–35.4 | Wipe           | Live black ink floods the frame to the binder                                                               |
| 35.4–37.5 | Ninety         | "We get you 90% of the way."; the bar fills; the last tenth turns blue and blue ink falls from it           |
| 37.5–40.0 | Who            | "Built for" change leads, IT project managers, records leads, CIOs and sponsors, one a beat                |
| 40.0–45.0 | End            | Live blue ink rising; the mark; $1,499.99 CAD; See the free samples at advanta365.com; A product of EchoFive |

The camera drifts in every scene, so no frame stands still. Nothing that must be read is under
34px.

## Facts used

As v1, plus: the product description (`SITE.description` in `lib/site.ts`), the five Microsoft 365
apps and the buyers (`PRODUCT.md`), and "90-Day Adoption Scorecard" for Sustain, a template in
`content/templates/sustain.ts`. Sustain has no free sample, so the video does not call the seven
documents free samples. All titles are the catalog's placeholder content.

## Build

- `video/timeline.mjs`: tempo, every scene time in bars and beats, every fact, the ink plates.
- `video/plates.html` and `video/plates.mjs`: the site's own ink engine (`lib/ink/engine`), loaded
  with its types stripped, stepped frame by frame in headless Chromium (WebGL2 through SwiftShader,
  about 3.4 s a frame) and saved as JPEG plates at 30 fps. Plates are cached by a hash of their
  definition, the plate page and the engine.
- `video/launch.html`: the scenes as a pure function of time; plates are blended two frames at a
  time for 60 fps and laid in with multiply where ink must cover the page.
- `video/sound.mjs`: pad, bass, arpeggio, kick with sidechain ducking, hats, a build, the effects,
  a small Schroeder reverb. `render.mjs` normalizes it in two loudnorm passes.
- `video/serve.mjs`: the static server, which strips TypeScript types on request.
- No dependency is added.

## Checks

Contact sheets at key frames and transitions, duration and frame count, integrated loudness and
true peak after encoding, `pnpm lint` and `pnpm test`.
