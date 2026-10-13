import { spawnSync } from "node:child_process";
import { defineConfig, devices, firefox } from "@playwright/test";

// Port 3100 keeps the test server clear of a dev server on 3000; `PW_PORT` moves it, for a second
// checkout that runs at the same time.
const PORT = Number(process.env.PW_PORT) || 3100;

/**
 * Whether the installed Firefox starts. It is the browser that really lacks view timelines, so it
 * exercises the observer path of the motion system. A copy that cannot start (a broken runtime on
 * the machine, a missing install) must not fail the whole run: the project is left out and the same
 * path is covered in Chromium with `CSS.supports` stubbed (motion.spec.ts). Set `PW_FIREFOX=1` to
 * require it anyway.
 */
function firefoxStarts(): boolean {
  if (process.env.PW_FIREFOX === "1") return true;
  try {
    const result = spawnSync(firefox.executablePath(), ["--version"], { timeout: 15_000 });
    return result.status === 0;
  } catch {
    return false;
  }
}

const withFirefox = firefoxStarts();
if (!withFirefox) {
  console.warn("[playwright] Firefox does not start here: the firefox project is not run.");
}

// A test that reads a paint time off the page's clock is tagged `@quiet`: that clock runs through
// every moment the browser waits for the processor, and beside seven other workers a paint takes
// two to four times as long.
const QUIET = /@quiet/;
// The projects whose tests run side by side; the ones after them wait for all of these.
const PARALLEL = ["chromium", "mobile", ...(withFirefox ? ["firefox"] : [])];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      grepInvert: QUIET,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      grepInvert: QUIET,
      use: { ...devices["Pixel 7"] },
    },
    // The `@quiet` tests, in the same two browsers, once the projects above have finished. Each
    // project from here down waits for the one before it, so one test runs at a time.
    {
      name: "quiet",
      grep: QUIET,
      fullyParallel: false,
      dependencies: PARALLEL,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "quiet-mobile",
      grep: QUIET,
      fullyParallel: false,
      dependencies: ["quiet"],
      use: { ...devices["Pixel 7"] },
    },
    ...(withFirefox
      ? [
          {
            name: "firefox",
            testMatch: /(browse|console|reduced-motion|motion)\.spec\.ts/,
            use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } },
          },
        ]
      : []),
  ],
  webServer: {
    // npm run works whichever package manager is on PATH.
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
