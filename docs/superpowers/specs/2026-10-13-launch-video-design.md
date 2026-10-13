# Launch video: "Blank Prompt"

Approved in session on 2026-10-13.

## Goal

A 45 second product launch video for Advanta365 that tells the site's own story: a generic AI reply,
then the tagline, then finished documents, then what the toolkit holds, the price and where to see the
free samples.

## Format

- 1920 by 1080, 30 frames a second, 45.0 seconds (1,350 frames), H.264 MP4 with AAC audio.
- Silent-safe: every point is carried by on-screen text. The sound is synthetic sound design only
  (keystrokes, a hum, a swell, paper drops, ticks, a rising tone, a chime). No voice, no music.

## Storyboard

| Time      | Scene              | On screen                                                                                   |
| --------- | ------------------ | ------------------------------------------------------------------------------------------- |
| 0:00–0:07 | The prompt         | An empty AI prompt; "Write a change management plan for our SharePoint rollout." is typed |
| 0:07–0:13 | The reply          | A generic reply streams in, then "Plausible. Unproven."                                     |
| 0:13–0:18 | Ink                | The spill still pushes in over the reply; "Don't start from a blank prompt."              |
| 0:18–0:28 | Finished documents | The six free samples drop onto the desk, one per phase, with phase and format               |
| 0:28–0:36 | What's inside      | 59 playbooks, 130 templates, 4 field guides, 58 job aids, training for 3 audiences; 30+ years |
| 0:36–0:41 | 90/10              | A bar fills to 90%; the last 10% in the highlighter blue: "You, or your AI"                 |
| 0:41–0:45 | End card           | The mark draws in, Advanta365, $1,499.99 CAD, advanta365.com, a product of EchoFive         |

## Facts used

Every claim comes from `lib/site.ts`, `content/` and `PRODUCT.md`: the counts in `TOOLKIT`, the
tagline, the price in `OFFER`, the six free samples and their formats, the 90 percent promise and
30+ years. The domain `advanta365.com` is assumed from `SITE.contactEmail`. The sample titles are the
catalog's current placeholder content; they live in one list in `video/timeline.mjs`.

## Build

- `video/timeline.mjs`: the single source of every scene's times and every fact on screen. Both the
  picture and the sound read it, so they cannot drift apart.
- `video/launch.html`: every scene drawn as a pure function of time, `renderAt(t)`, so any frame
  renders the same way every time. Colours and type follow `DESIGN.md`; the mark comes from the
  paths in `lib/brand/mark.ts`; the ink is the stills in `public/ink/`.
- `video/sound.mjs`: synthesizes the sound track sample by sample to a WAV file.
- `video/render.mjs`: serves the repository, screenshots each frame in Chromium with Playwright,
  pipes the frames to ffmpeg and muxes the sound.
- No runtime dependency is added; Playwright is already a dev dependency.

## Checks

A contact sheet of key frames, a duration of exactly 45.0 seconds, and audio peaks under 0 dBFS after encoding.
