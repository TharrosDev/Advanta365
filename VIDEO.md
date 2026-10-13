# Video

How Advanta365 videos are made. A fresh session should be able to plan, build, check and deliver a
new video from this file alone. The launch video, "Blank Prompt" (45 seconds), was made this way.
Its code is in `video/`. Its designs are in `docs/superpowers/specs/`: v1
(`2026-10-13-launch-video-design.md`) and the rebuilt v2 (`2026-10-13-launch-video-v2-design.md`),
which is the current one.

## How it works

The video is built in code, not in an editor. Every scene is HTML and CSS, drawn as a pure function
of time. Chromium screenshots each frame and ffmpeg encodes the frames into an MP4. The ink is the
site's own fluid engine, rendered frame by frame into image plates. The music and sound effects are
synthesized in Node, one sample at a time, from the same timeline.

| File                   | Job                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `video/timeline.mjs`   | The only source of every time and every fact on screen: tempo, scenes in bars and beats, facts, plate timings. Picture, plates and sound all import it. |
| `video/launch.html`    | The scenes. `window.renderAt(t)` sets every element's state for second `t` and resolves when its images are decoded. No CSS animations, no clocks.      |
| `video/plate-defs.mjs` | The choreography of each ink plate: which site ink scene it starts from, anchors, pre-roll and its own drops.                                           |
| `video/plates.html`    | Loads the ink engine from `lib/ink/` and steps it by hand (`window.plateTo(t)`).                                                                        |
| `video/plates.mjs`     | Renders the plates to `video/out/plates/<name>/0000.jpg…` at 30 fps, cached per plate by a hash of its timing, its definition and the engine.           |
| `video/sound.mjs`      | Synthesizes music (pad, bass, arpeggio, kick with sidechain duck, hats, a build) and the effects to a WAV.                                              |
| `video/render.mjs`     | Brings the plates up to date, screenshots every frame, encodes, normalizes the sound to -16 LUFS in two loudnorm passes, muxes.                         |
| `video/serve.mjs`      | The local static server. It strips TypeScript types on request, so the browser can import `lib/ink/engine` with no bundler.                             |
| `video/out/`           | Output and plate cache. Ignored by git. The MP4 is never committed.                                                                                     |

Nothing in `video/` is served by the site. Next.js serves only `app/` and `public/`.

## Setup

1. Install dependencies: `pnpm install`. If corepack fails to download pnpm (it did in the cloud
   container), run `npm i -g pnpm@10` first.
2. ffmpeg must be on the PATH (`which ffmpeg`).
3. Chromium: Playwright's own browser is used by default. In the cloud container the Playwright
   version does not match the preinstalled browser, so set
   `CHROMIUM_PATH=/opt/pw-browsers/chromium`. Never run `playwright install` there.
4. Node 22.13 or later: `serve.mjs` uses `stripTypeScriptTypes` from `node:module`. Run the
   scripts with `node --no-warnings` to hide its experimental warning.
5. Network: the page loads Besley and Atkinson Hyperlegible Next from Google Fonts. Without network
   access the type falls back to Georgia and system sans, and the video will look wrong.

## Commands

| Command                                    | What it does                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `node video/render.mjs --stills 4,12.5,30` | Single frames at those seconds to `video/out/stills/`. Missing plates render blank. |
| `node video/plates.mjs`                    | Renders the ink plates that are out of date (about 30 minutes for all four)         |
| `node video/plates.mjs --only flood`       | One plate (`--force` renders even if it is up to date)                              |
| `node video/render.mjs`                    | The full video to `video/out/advanta365-launch.mp4`, plus a copy under 30 MB        |
| `node video/render.mjs --sound`            | The sound only, muxed onto the last rendered picture (seconds, not minutes)         |
| `node video/sound.mjs`                     | Writes only the raw sound to `video/out/sound.wav`                                  |

Timings in the cloud container (4 cores, no GPU): the ink engine runs on SwiftShader at about
3.3 seconds a frame, so plates are the slow part. The full picture, 2,700 frames at 60 fps, takes
about 20 minutes. Don't run stills or tests while plates render: on 4 cores they slow the plates
down by five times or more.

## The process

### 1. Intake

Before building, ask the user, one question at a time:

1. **Concept.** Offer three to five different concepts with a recommendation. Tie the recommended one
   to the site's own story (the tagline, the home page) where possible.
2. **Format.** 16:9 (1920x1080) for the site, YouTube and decks; 1:1 or 9:16 for social. Other ratios
   mean re-composing every scene, not cropping.
3. **Audio.** Claude cannot record a voice or source licensed music. Options: synthesized music and
   effects (what v2 uses), a user-supplied track to cut to, a voiceover script for the user to
   record, or silent and text-led.
4. **Site footage.** Real screens of the site, or designed scenes only. The catalog is beta sample
   content, so real footage dates quickly. v2 uses designed scenes.
5. **Length and versions.** Default 45 seconds, 16:9 master.

Then present a storyboard table (time, beat, on screen) and wait for approval.

### 2. Facts

Every claim on screen comes from the repository. Never invent a statistic, a quote or a customer.

| Fact                                                 | Source                                       |
| ---------------------------------------------------- | -------------------------------------------- |
| Counts (playbooks, templates, and so on)             | `TOOLKIT` in `lib/site.ts`                   |
| Tagline, description, contact email                  | `SITE` in `lib/site.ts`                      |
| Price (always with "CAD")                            | `OFFER` in `lib/site.ts`                     |
| The six free samples and their formats               | `free: true` entries in `content/templates/` |
| Other templates (Sustain has no free sample)         | `content/templates/<phase>.ts`               |
| Phase names and order                                | `content/phases.ts`                          |
| Positioning, buyers, apps, the 90 percent, 30+ years | `PRODUCT.md`                                 |

Copy facts into `timeline.mjs`; it cannot import TypeScript. When `lib/site.ts` changes, check the
timeline.

Known caveats to raise with the user each time:

- The catalog is sample content and labelled a beta. Template titles shown in a video may change.
- No payment provider is connected. A "Buy now" call to action promises something the site cannot
  do; "See the free samples" is accurate.
- The domain `advanta365.com` was assumed from the contact email and not confirmed.

### 3. Build

For a new video, copy `launch.html` and `timeline.mjs` to new names and point `render.mjs` at them.
`render.mjs` hard-codes `launch.html` and the output name; make those arguments if a second video
is built.

Rules that keep frames deterministic and on the beat:

- Write times in bars and beats with `at(bar, beat)`. At 96 BPM a beat is 0.625 s and 45 s is 18
  bars. Cuts and slams go on beats; a dotted quarter (1.5 beats) gives a syncopated rhythm for a
  series of items.
- All motion goes through `renderAt(t)`. Helpers in `launch.html`: `prog(t, start, dur)` for 0 to 1
  progress, `easeOut`, `easeOut5`, `easeIn`, `easeInOut`, `backOut`, `mix`, `rise(el, t, at)` for text
  that rises and sharpens, `pop` for words, `knock(t, t0, amp)` for a camera shake on a hit,
  `drift(t)` so no frame stands still, and `cam(el, {scale, x, y, ox, oy})` for a scene's camera.
- Each scene is a full-frame `<section class="scene">`, shown only while it is on screen.
- A plate is shown with `plateAt(name, t)`, which blends its two nearest 30 fps frames for 60 fps.
  Lay ink over the page with `mix-blend-mode: multiply` (white is transparent), under text as a
  background. To keep a plate's ink away from text, mask the plate (`mask-image` with a
  `linear-gradient`); the paper behind it is the same white, so the mask leaves no edge.
- `window.videoReady` waits for fonts and lays out the documents before the first frame.
- Sounds are placed at times taken from the timeline, never typed in by hand.

### 4. Ink plates

The engine (`lib/ink/engine`) is deterministic: fixed 1/60 s steps and one seeded random source.
A plate starts from one of the site's scenes (`lib/ink/scenes.ts`: intro, prompt, title, ninety,
bloom, wisps, spill) with `preset(name, { anchors })`, then adds its own `drop`, `fire` and `clear`
events. Paper scenes and binder scenes come from the scene's look (`ninety` and `wisps` are dark).

- Do not use `setCalmZone` for video. It switches on with a hard rectangular edge. Keep text clear
  by where the drops fall, or by `clear({ duration })`, which turns the ink to mist.
- A plate that has to be well under way when it appears takes a `preroll` in seconds.
- Preview a plate cheaply with `node --no-warnings video/preview-plate.mjs <plate> 1,2.5,4 <dir>` at low quality before the
  long render.

### 5. Brand

Follow `DESIGN.md`: white paper, near-black ink (`#0b0d12`), one light-blue highlighter (`#86c1ff`),
the binder (`#0d0f15`) for dark scenes. Besley for display (700 to 800 weight), Atkinson Hyperlegible
Next for text. The highlighter is a marker band sweeping behind a word, never a large fill. The
mark's paths are copied from `lib/brand/mark.ts`: the "A" in white on an ink tile, the tail and the
"365" in the highlighter, drawn stroke by stroke.

Type sizes for a phone screen: nothing that must be read under 34px, body text 44px or more,
headlines 90px or more.

### 6. Check

Before delivering:

1. Render stills (one per scene, plus each transition) and tile them into contact sheets:
   `ffmpeg -i a.png -i b.png ... -filter_complex "...xstack..." sheet.png`. Look at every one.
2. Render the full video and confirm the length and frame count:
   `ffprobe -v error -show_entries format=duration:stream=nb_frames -of compact out.mp4`.
3. Loudness after encoding: `ffmpeg -i out.mp4 -af ebur128=peak=true -f null -`. Expect about
   -16 LUFS integrated and a true peak under -1 dBTP.
4. Look at the waveform for the shape of the sections:
   `ffmpeg -i out.mp4 -filter_complex showwavespic=s=1800x300 -frames:v 1 wave.png`.
5. Run `pnpm lint` and `pnpm test` (the design gate fails if `package.json` dependencies change).

Claude cannot listen to the sound. Say so, and ask the user to play it.

### 7. Deliver

Send `video/out/advanta365-launch-share.mp4` to the user in the chat: a file sent there may weigh
at most 30 MB, and the 60 fps master is about 50 MB. `render.mjs` writes the share copy with
two-pass H.264 at 4.3 Mbit/s (about 26 MB). Commit only the code and the spec; `video/out/` is
ignored. A
video goes on the site only if the user asks, by committing it to `public/` or hosting it elsewhere
and embedding it.

## Lessons

From v1:

- **Numerals collide.** Large numerals need about 0.6em per digit. Give each counter a fixed
  column wide enough for its own number.
- **Long words overflow.** Size titles to the longest word, not the average.
- **A crossfade from white to the dark binder passes through grey.** Use an ink wipe or a cut.
- **Peak normalizing is driven by the spikiest sound.** Normalize loudness (LUFS) instead.
- **AAC overshoots** a WAV's peak; keep a true-peak ceiling of -1.5 dBTP.

From v2:

- **A review at two frames a second finds most problems.** Tile the frames with timestamps and
  read them in order.
- **Brand early.** A launch video that names the product only in its last seconds loses everyone
  who leaves early.
- **Calm zones cut hard edges** into the ink. Choreograph the drops instead.
- **Ink drifting under text** needs the drops kept on the far side of the frame and a velocity
  that carries them away from the words.
- **A plate cache keyed on the whole plate page** re-renders every plate when one changes. Key each
  plate on its own definition.
- **CPU contention.** Plate rendering on SwiftShader uses every core; anything else running beside
  it slows it many times over.
- **Rising ink reaches the words.** A plate with a long pre-roll climbed through the end card's
  price and call to action. Check the last seconds of every plate behind text, and mask it.
- **A line on screen for less than a second is not read.** Give every message at least a beat and
  a half before the next scene takes it away.
- **Waiting on a process by name.** `pgrep -f name` in a shell loop also matches the loop's own
  command line, so the loop never ends. Wait on a process id, or start the next step with
  `run_in_background` once the first has finished.
- **The chat's 30 MB limit.** The master did not fit; render the share copy every time.

## Checklist

- [ ] Concept, format, audio, footage, length agreed; storyboard approved
- [ ] Every fact traced to `lib/site.ts`, `content/` or `PRODUCT.md`; caveats raised
- [ ] Timeline in bars and beats; scenes drawn through `renderAt(t)`
- [ ] Plates previewed at low quality, then rendered
- [ ] Contact sheets of stills checked, including transitions
- [ ] Full render: length, frame count, loudness and waveform checked
- [ ] `pnpm lint` and `pnpm test` pass
- [ ] MP4 sent to the user; code and spec committed; MP4 not committed
