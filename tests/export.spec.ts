import { expect, test } from "@playwright/test";

test("export video", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await page.getByRole("button", { name: "Try with demo files" }).click();

  expect(page.getByLabel("camera-view-front")).toHaveJSProperty("paused", false);

  await page.getByRole("button", { name: "Export current event" }).click();

  await page.getByLabel("Cameras").selectOption("all");
  await page.getByLabel("Trim Start").fill("1");
  await page.getByLabel("Trim End").fill("2");

  await page.getByRole("button", { name: "Start" }).click();

  await page.getByRole("button", { name: "Cancel" }).isEnabled();

  await page.getByRole("button", { name: "Done" }).isEnabled();
  expect(page.locator("video[aria-label='Exported video']")).toHaveJSProperty("paused", false);
});
