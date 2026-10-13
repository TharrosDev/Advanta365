/**
 * Renders the launch video: brings the ink plates up to date (`plates.mjs`), screenshots each frame
 * of `launch.html` in Chromium, pipes the frames to ffmpeg, synthesizes the sound (`sound.mjs`),
 * normalizes its loudness and muxes the two.
 *
 *   node video/render.mjs                    the full video, to video/out/advanta365-launch.mp4, and a
 *                                            copy under 30 MB to advanta365-launch-share.mp4
 *   node video/render.mjs --stills 3,12,20   single frames at those seconds, to video/out/stills/
 *   node video/render.mjs --sound            the sound only, muxed onto the last picture
 *
 * Set CHROMIUM_PATH to use a Chromium other than Playwright's own.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { FPS, WIDTH, HEIGHT, DURATION } from "./timeline.mjs";
import { renderPlates } from "./plates.mjs";
import { serve, root } from "./serve.mjs";

const out = join(root, "video", "out");

/** Loudness the finished sound is normalized to, in LUFS, and its true-peak ceiling in dBTP. */
const LOUDNESS = -16;
const TRUE_PEAK = -1.5;

function run(cmd, args, { input, capture = false } = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, {
      stdio: [input ? "pipe" : "ignore", "inherit", capture ? "pipe" : "inherit"],
    });
    let err = "";
    if (capture) p.stderr.on("data", (d) => (err += d));
    p.on("error", fail);
    p.on("close", (code) =>
      code === 0 ? ok(err) : fail(new Error(`${cmd} exited ${code}\n${err}`)),
    );
    if (input) input(p.stdin);
  });
}

async function openPage() {
  const server = await serve();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`${server.base}/video/launch.html`);
  await page.evaluate(() => window.videoReady);
  const frameAt = async (t, type = "png") => {
    await page.evaluate((s) => window.renderAt(s), t);
    return page.screenshot({ type, timeout: 120000 });
  };
  const close = async () => {
    await browser.close();
    await server.close();
  };
  return { frameAt, close };
}

async function renderPicture(path) {
  const { frameAt, close } = await openPage();
  const frames = Math.round(DURATION * FPS);
  try {
    await run(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-f",
        "image2pipe",
        "-framerate",
        String(FPS),
        "-c:v",
        "png",
        "-i",
        "-",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "16",
        "-pix_fmt",
        "yuv420p",
        "-color_primaries",
        "bt709",
        "-color_trc",
        "bt709",
        "-colorspace",
        "bt709",
        "-movflags",
        "+faststart",
        path,
      ],
      {
        input: async (stdin) => {
          for (let i = 0; i < frames; i++) {
            const png = await frameAt(i / FPS);
            if (!stdin.write(png)) await new Promise((ok) => stdin.once("drain", ok));
            if (i % FPS === 0) process.stdout.write(`\rframe ${i}/${frames}`);
          }
          stdin.end();
          process.stdout.write(`\rframe ${frames}/${frames}\n`);
        },
      },
    );
  } finally {
    await close();
  }
}

/** Two-pass loudness normalization of the WAV to an AAC track. */
async function renderSound(path) {
  const wav = join(out, "sound.wav");
  const { writeSound } = await import("./sound.mjs");
  await writeSound(wav);
  const target = `I=${LOUDNESS}:TP=${TRUE_PEAK}:LRA=11`;
  const log = await run(
    "ffmpeg",
    ["-hide_banner", "-i", wav, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"],
    { capture: true },
  );
  const m = JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));
  const second = `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    wav,
    "-af",
    second,
    "-ar",
    "48000",
    "-c:a",
    "aac",
    "-b:a",
    "256k",
    path,
  ]);
}

async function main() {
  await mkdir(join(out, "stills"), { recursive: true });
  const stillsArg = process.argv.indexOf("--stills");
  if (stillsArg > 0) {
    const { frameAt, close } = await openPage();
    try {
      for (const t of process.argv[stillsArg + 1].split(",").map(Number)) {
        await writeFile(
          join(out, "stills", `t${t.toFixed(2).padStart(6, "0")}.png`),
          await frameAt(t),
        );
        console.log(`still at ${t}s`);
      }
    } finally {
      await close();
    }
    return;
  }

  const picture = join(out, "picture.mp4");
  if (!process.argv.includes("--sound")) {
    await renderPlates();
    await renderPicture(picture);
  }
  const sound = join(out, "sound.m4a");
  await renderSound(sound);
  const final = join(out, "advanta365-launch.mp4");
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    picture,
    "-i",
    sound,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-c",
    "copy",
    "-shortest",
    "-movflags",
    "+faststart",
    final,
  ]);
  console.log(`wrote ${final}`);
  await shareCopy(final, join(out, "advanta365-launch-share.mp4"));
}

/**
 * A copy under 30 MB, the most a file sent in a Claude chat may weigh: two-pass H.264 at a fixed
 * bitrate, with the sound copied over.
 */
async function shareCopy(from, to) {
  const rate = "4300k";
  const log = join(out, "share-pass");
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    from,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-b:v",
    rate,
    "-pass",
    "1",
    "-passlogfile",
    log,
    "-an",
    "-f",
    "null",
    "/dev/null",
  ]);
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    from,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-b:v",
    rate,
    "-pass",
    "2",
    "-passlogfile",
    log,
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "copy",
    "-movflags",
    "+faststart",
    to,
  ]);
  console.log(`wrote ${to}`);
}

await main();
