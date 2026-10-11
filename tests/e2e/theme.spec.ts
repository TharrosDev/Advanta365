import { expect, test } from "@playwright/test";
import { INTRO_TEST_TIMEOUT, waitForIntroEnd } from "./helpers";

// The home page is light at the top, turns dark once #practice passes the middle of the viewport
// (ThemeScroll) and is light again at the top. The footer is a light scope of its own, so it stays
// white while the page around it is dark.

test("the home page turns dark at #practice and light again at the top; the footer stays white", async ({
  page,
}) => {
  test.setTimeout(INTRO_TEST_TIMEOUT);
  await page.goto("/");
  // The intro holds the page at the top and blocks scrolling until it has lifted.
  await waitForIntroEnd(page);

  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme");

  await page.locator("#practice").evaluate((section) => section.scrollIntoView({ block: "start" }));
  await expect(html).toHaveAttribute("data-theme", "dark");

  // The footer is a light scope of its own: white whatever the theme of the page around it is.
  const footer = page.getByRole("contentinfo");
  await footer.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(footer).toBeInViewport();
  await expect(footer).toHaveCSS("background-color", "rgb(255, 255, 255)");

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(html).not.toHaveAttribute("data-theme");
});
