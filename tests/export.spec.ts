import { expect, test } from "@playwright/test";

test("export video", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await page.getByRole("button", { name: "Preview with demo files" }).click();

  await page.getByRole("button", { name: "Export Video" }).click();

  await page.getByRole("button", { name: "Start export" }).click();

  await page.getByRole("button", { name: "Cancel" }).isEnabled();

  await page.getByRole("button", { name: "Done" }).isEnabled();
  expect(page.locator("video[aria-label='Exported video']")).toHaveJSProperty("paused", false);
});
