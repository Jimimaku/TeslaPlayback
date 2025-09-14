import { expect, test } from "@playwright/test";

const locate = (type: "button" | string) => (text: string) => `${type}:text("${text}")`;

test("export video", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await page.locator(locate(`span`)("Try with demo files")).click();

  expect(page.getByLabel(`camera-view-front`)).toHaveJSProperty("paused", false);

  await page.locator(locate(`span`)("Export current event")).click();

  await page.locator(locate(`span`)("Start")).click();

  await page.locator(locate(`span`)("Cancel")).isEnabled();

  await page.locator(locate(`span`)("Done")).click();
});
