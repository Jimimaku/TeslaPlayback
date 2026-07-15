import { expect, test } from "@playwright/test";

test("export video", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await page.getByRole("button", { name: "Preview with demo files" }).click();

  await page.getByRole("button", { name: "Export Video" }).click();

  await page.getByRole("button", { name: "Start export" }).click();

  await page.getByRole("button", { name: "Cancel" }).isEnabled();

  await page.getByRole("button", { name: "Done" }).isEnabled();
  expect(page.locator("video[aria-label='Exported video']")).toHaveJSProperty("paused", false);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("2024-04-16_10-10-22.mp4");
});
