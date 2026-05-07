import { expect, test } from "@playwright/test";

test("loads the Pages build and applies a simulated wall scan", async ({ page }) => {
  await page.goto("/physical-kanban-sync/");

  await expect(page.getByRole("heading", { name: "Wall to Web" })).toBeVisible();
  await expect(page.getByTestId("commit")).toContainText("commit");
  await expect(page.getByRole("link", { name: /Star repo/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/physical-kanban-sync",
  );
  await expect(page.getByRole("link", { name: /PayPal/i })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita",
  );

  await page.getByTestId("simulate-scan").click();
  await expect(page.getByText("8 tags")).toBeVisible();
  await expect(page.getByTestId("kanban-board")).toBeVisible();
});
