import { test, expect } from "@playwright/test";

test("home page shows the banner and global feed", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "conduit" })).toBeVisible();
  await expect(page.getByText("Global Feed")).toBeVisible();
  await expect(page.getByText("Popular Tags")).toBeVisible();
});

test("sign in link opens the login form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
});
