/**
 * A quick look at one ink plate before the long render: the plate at a few moments, at the
 * engine's low quality, as JPEGs.
 *
 *   node --no-warnings video/preview-plate.mjs flood 0.5,2.5,6 /tmp/preview [low|medium|high]
 */
import { chromium } from "@playwright/test";
import { serve } from "./serve.mjs";
const [, , name, times, out, q = "low"] = process.argv;
const s = await serve();
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto(`${s.base}/video/plates.html?plate=${name}&q=${q}`);
console.log(name, await p.evaluate(() => window.plateReady));
let now = 0;
for (const t of times.split(",").map(Number)) {
  while (now < t - 1e-9) {
    now = Math.min(t, now + 0.2);
    await p.evaluate((tt) => window.plateTo(tt), now);
  }
  await p.screenshot({
    timeout: 300000,
    path: `${out}/${name}-${t}.jpg`,
    type: "jpeg",
    quality: 70,
  });
}
await b.close();
await s.close();
