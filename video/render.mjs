/**
 * Renders the launch video: serves the repository, screenshots each frame of `launch.html` in
 * Chromium and pipes the frames to ffmpeg, then muxes the sound from `sound.mjs`.
 *
 *   node video/render.mjs                    the full video, to video/out/advanta365-launch.mp4
 *   node video/render.mjs --stills 3,12,20   single frames at those seconds, to video/out/stills/
 *
 * Set CHROMIUM_PATH to use a Chromium other than Playwright's own.
 */
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { FPS, WIDTH, HEIGHT, DURATION } from "./timeline.mjs";
import { writeSound } from "./sound.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const out = join(root, "video", "out");
const TYPES = {
  ".html": "text/html",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".png": "image/png",
};

function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    const file = join(root, path);
    if (!file.startsWith(root)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

function run(cmd, args, input) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: [input ? "pipe" : "ignore", "inherit", "inherit"] });
    p.on("error", fail);
    p.on("close", (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`))));
    if (input) input(p.stdin);
  });
}

async function main() {
  const stillsArg = process.argv.indexOf("--stills");
  const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(",").map(Number) : null;

  await mkdir(join(out, "stills"), { recursive: true });
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/video/launch.html`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(url);
  await page.evaluate(() => window.videoReady);

  const frameAt = async (t) => {
    await page.evaluate((s) => window.renderAt(s), t);
    return page.screenshot({ type: "png" });
  };

  try {
    if (stills) {
      for (const t of stills) {
        const png = await frameAt(t);
        const { writeFile } = await import("node:fs/promises");
        await writeFile(join(out, "stills", `t${String(t).padStart(5, "0")}.png`), png);
        console.log(`still at ${t}s`);
      }
      return;
    }

    const silent = join(out, "picture.mp4");
    const frames = Math.round(DURATION * FPS);
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
        "-movflags",
        "+faststart",
        silent,
      ],
      async (stdin) => {
        for (let i = 0; i < frames; i++) {
          const png = await frameAt(i / FPS);
          if (!stdin.write(png)) await new Promise((ok) => stdin.once("drain", ok));
          if (i % FPS === 0) process.stdout.write(`\rframe ${i}/${frames}`);
        }
        stdin.end();
        process.stdout.write(`\rframe ${frames}/${frames}\n`);
      },
    );

    const wav = join(out, "sound.wav");
    await writeSound(wav);
    const final = join(out, "advanta365-launch.mp4");
    await run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      silent,
      "-i",
      wav,
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      "-movflags",
      "+faststart",
      final,
    ]);
    console.log(`wrote ${final}`);
  } finally {
    await browser.close();
    server.close();
  }
}

await main();
