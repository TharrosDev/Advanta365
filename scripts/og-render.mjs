import { chromium } from "@playwright/test";
import { pathToFileURL } from "url";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(pathToFileURL("scripts/og-card.html").href, {
  waitUntil: "networkidle",
});
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.waitForTimeout(500);
await page.screenshot({ path: "public/og.png" });
await browser.close();
console.log("og.png written");
