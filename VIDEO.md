# Video

How Advanta365 videos are made. A fresh session should be able to plan, build, check and deliver a
new video from this file alone. The first video, "Blank Prompt" (45 seconds, 2026-10-13), was made
this way. Its code is in `video/` and its design in
`docs/superpowers/specs/2026-10-13-launch-video-design.md`.

## How it works

The video is built in code, not in an editor. Every scene is HTML and CSS, drawn as a pure function
of time. Chromium screenshots each frame and ffmpeg encodes the frames into an MP4. The sound is
synthesized in Node, one sample at a time, from the same timeline.

| File                 | Job                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `video/timeline.mjs` | The only source of every time and every fact on screen. The picture and the sound both import it, so they cannot drift apart.                           |
| `video/launch.html`  | The scenes. `window.renderAt(t)` sets every element's state for second `t`. No CSS animations, no clocks, so any frame renders the same way every time. |
| `video/sound.mjs`    | Synthesizes the sound track to a WAV: keystrokes, hum, thuds, swell, paper drops, ticks, swishes, rising tone, chime.                                   |
| `video/render.mjs`   | Serves the repository on a local port, opens the page in Playwright's Chromium, screenshots every frame, pipes the frames to ffmpeg, muxes the sound.   |
| `video/out/`         | Output. Ignored by git. The MP4 is never committed.                                                                                                     |

Nothing in `video/` is served by the site. Next.js serves only `app/` and `public/`.

## Setup

1. Install dependencies: `pnpm install`. If corepack fails to download pnpm (it did in the cloud
   container), run `npm i -g pnpm@10` first.
2. ffmpeg must be on the PATH (`which ffmpeg`).
3. Chromium: Playwright's own browser is used by default. In the cloud container the Playwright
   version does not match the preinstalled browser, so set
   `CHROMIUM_PATH=/opt/pw-browsers/chromium`. Never run `playwright install` there.
4. Network: the page loads Besley and Atkinson Hyperlegible Next from Google Fonts. Without network
   access the type falls back to Georgia and system sans, and the video will look wrong.

## Commands

| Command                                    | What it does                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `node video/render.mjs --stills 4,12.5,30` | Renders single frames at those seconds to `video/out/stills/` (seconds)     |
| `node video/render.mjs`                    | Renders the full video to `video/out/advanta365-launch.mp4` (about 3.5 min) |
| `node video/sound.mjs`                     | Writes only the sound to `video/out/sound.wav`                              |

To change only the sound, skip the full render. `render.mjs` leaves the silent picture at
`video/out/picture.mp4`; re-mux it:

```sh
node video/sound.mjs
ffmpeg -y -i video/out/picture.mp4 -i video/out/sound.wav -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart video/out/advanta365-launch.mp4
```

## The process

### 1. Intake

Before building, ask the user, one question at a time:

1. **Concept.** Offer three to five different concepts with a recommendation. Tie the recommended one
   to the site's own story (the tagline, the home page) where possible.
2. **Format.** 16:9 (1920x1080) for the site, YouTube and decks; 1:1 or 9:16 for social. Other ratios
   mean re-composing every scene, not cropping.
3. **Audio.** Claude cannot record a voice or source licensed music. Options: silent and text-led,
   a voiceover script for the user to record, a user-supplied track, or synthesized sound design
   (what "Blank Prompt" used).
4. **Length.** Default 45 seconds.

Then present a storyboard table (time, scene, on screen, sound) and wait for approval.

### 2. Facts

Every claim on screen comes from the repository. Never invent a statistic, a quote or a customer.

| Fact                                           | Source                                       |
| ---------------------------------------------- | -------------------------------------------- |
| Counts (playbooks, templates, and so on)       | `TOOLKIT` in `lib/site.ts`                   |
| Tagline, contact email                         | `SITE` in `lib/site.ts`                      |
| Price (always with "CAD")                      | `OFFER` in `lib/site.ts`                     |
| The six free samples and their formats         | `free: true` entries in `content/templates/` |
| Phase names and order                          | `content/phases.ts`                          |
| Positioning, the 90 percent promise, 30+ years | `PRODUCT.md`                                 |

Copy facts into `timeline.mjs`; it cannot import TypeScript. When `lib/site.ts` changes, check the
timeline.

Known caveats to raise with the user each time:

- The catalog is sample content and labelled a beta. Template titles shown in a video may change.
- No payment provider is connected. A "Buy now" call to action promises something the site cannot
  do; "See the free samples" is accurate.
- The domain `advanta365.com` was assumed from the contact email and not confirmed.

### 3. Build

For a new video, copy `launch.html` and `timeline.mjs` to new names and point `render.mjs` at them.
`render.mjs` currently hard-codes `launch.html` and the output name `advanta365-launch.mp4`; make
those arguments if a second video is built.

Rules that keep frames deterministic:

- All motion goes through `renderAt(t)`. Use the helpers in `launch.html`: `prog(t, start, dur)`
  for 0 to 1 progress, `easeOut`, `easeInOut`, `backOut`, `mix`, `rise(el, t, at)` for text that
  fades up, and `sceneAlpha` for crossfades.
- Each scene is a full-frame `<section class="scene">`. Neighbouring scenes overlap by `CROSSFADE`
  (0.4 s) in `SCENES`.
- `window.videoReady` waits for fonts and decoded images before the first frame.
- Sounds are placed at times computed from the timeline (for example, a paper drop at each card's
  landing time), never typed in by hand.

### 4. Brand

Follow `DESIGN.md`: white paper, near-black ink (`#0b0d12`), one light-blue highlighter (`#86c1ff`),
the binder (`#0d0f15`) for dark scenes. Besley for display (700 to 800 weight), Atkinson Hyperlegible
Next for text. The highlighter is used as a marker band sweeping behind a word, never as a fill
for large areas. The mark's paths are copied from `lib/brand/mark.ts`: the "A" in white on an ink
tile, the tail and the "365" in the highlighter, drawn stroke by stroke.

The live WebGL ink does not render in headless Chromium. Use the stills in `public/ink/`, with
slow scale and fade moves:

| Still              | Looks like                                               | Used for             |
| ------------------ | -------------------------------------------------------- | -------------------- |
| `spill-wide.webp`  | Black ink in the right half, white calm zone on the left | The tagline scene    |
| `ninety-wide.webp` | Blue and grey plumes on the dark binder                  | The 90 percent scene |
| `prompt-wide.webp` | Blue, black and grey plumes along the bottom             | The end card         |
| `bloom-wide.webp`  | Pale blue plumes along the top                           | Unused so far        |

Put text in the calm zone of a still. Check other stills by eye before using them.

### 5. Check

Before delivering:

1. Render 8 to 10 stills (one per scene, plus each crossfade) and tile them into one contact sheet:
   `ffmpeg -i a.png -i b.png ... -filter_complex "...xstack..." sheet.png`. Look at it.
2. Render the full video and confirm the length and frame count:
   `ffprobe -v error -show_entries format=duration:stream=nb_frames -of compact out.mp4`.
3. Audio peak, after encoding, must be under 0 dB:
   `ffmpeg -i out.mp4 -af volumedetect -vn -f null -`.
4. Look at the waveform for balance:
   `ffmpeg -i out.mp4 -filter_complex showwavespic=s=1600x240 -frames:v 1 wave.png`.
5. After any reformat (Prettier rewrites `launch.html`), compare a new still with the same frame of
   the last render. An SSIM of 0.99 or more means only compression differs:
   `ffmpeg -i still.png -i ref.png -lavfi ssim -f null -`.
6. Run `pnpm lint` and `pnpm test` (the design gate fails if `package.json` dependencies change).

Claude cannot listen to the sound. Say so, and ask the user to play it.

### 6. Deliver

Send the MP4 to the user directly. Commit only the code and the spec; `video/out/` is ignored. A
video goes on the site only if the user asks, by committing it to `public/` (about 10 MB for 45
seconds) or hosting it elsewhere and embedding it.

## Lessons from "Blank Prompt"

- **Numerals at 180px collided.** "130" ran into "4" in 360px columns. Large numerals need about
  0.6em per digit; 150px fitted.
- **Long words overflow cards.** "Communications" did not fit a 272px card at 29px. Size titles to
  the longest word, not the average.
- **Stills need placing by eye.** The end card's ink first sat below the frame. Render a still
  after every placement change.
- **A crossfade from white to the dark binder passes through grey.** It is brief at speed but looks
  muddy in a single frame. A cut or a darker fade would avoid it.
- **Peak normalizing is driven by the spikiest sound.** Raising the keystrokes made them the peak,
  and every other sound got quieter. Balance by relative gains: keystrokes about 0.5, thuds 0.4,
  rising tone 0.08, chime 0.1 (in `sound.mjs`).
- **AAC overshoots.** A WAV normalized to -1 dBFS encoded at 0.0 dB. Normalize to -2 dBFS.
- **Loudness.** The mix averaged about -25 dB, which is quiet for social video. Raise it if the
  user plans to post it with sound on.
- **Render time.** 1,350 frames took about 3.5 minutes. Use stills while iterating.

## Checklist

- [ ] Concept, format, audio and length agreed; storyboard approved
- [ ] Every fact traced to `lib/site.ts`, `content/` or `PRODUCT.md`; caveats raised
- [ ] Timeline written; scenes drawn through `renderAt(t)`
- [ ] Contact sheet of stills checked, including crossfades
- [ ] Full render: length, frame count, audio peak and waveform checked
- [ ] `pnpm lint` and `pnpm test` pass
- [ ] MP4 sent to the user; code and spec committed; MP4 not committed
