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

test("sign in with unknown credentials is rejected with an error", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();

  await page.getByPlaceholder("Email").fill("smoke.user@example.com");
  await page.getByPlaceholder("Password").fill("SomePassword123");

  await expect(page.getByPlaceholder("Email")).toHaveValue(
    "smoke.user@example.com",
  );
  await expect(page.getByPlaceholder("Password")).toHaveValue(
    "SomePassword123",
  );
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();

  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/users/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in" }).click();

  // The request carried exactly what was typed.
  const response = await loginResponse;
  expect(response.request().postDataJSON()).toEqual({
    user: { email: "smoke.user@example.com", password: "SomePassword123" },
  });

  // The API rejected it...
  console.log(`API answered ${response.status()}`);
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({
    errors: { "email or password": ["is invalid"] },
  });

  // ...and the page shows the error and stays on the login form.
  await expect(page.locator(".error-messages")).toHaveText(
    "email or password is invalid",
  );
  await expect(page).toHaveURL(/\/login$/);
});
