import { test, expect } from "../../framework/fixtures";
import { buildUser } from "../../framework/data/factory";

test.describe("authentication", () => {
  test("signs in with valid credentials", async ({
    authPage,
    navBar,
    page,
    testUser,
  }) => {
    await authPage.gotoLogin();
    await authPage.login(testUser.email, testUser.password);

    await expect(page).toHaveURL("/");
    await expect(navBar.profile(testUser.username)).toBeVisible();
    await expect(navBar.signIn).toBeHidden();
  });

  test("shows an error for a wrong password", async ({
    authPage,
    page,
    testUser,
  }) => {
    await authPage.gotoLogin();
    await authPage.login(testUser.email, "definitely-wrong-password");

    await expect(authPage.errors.first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("keeps the submit button disabled until the form is valid", async ({
    authPage,
  }) => {
    await authPage.gotoLogin();
    await expect(authPage.submit).toBeDisabled();

    await authPage.email.fill("someone@example.com");
    await authPage.password.fill("secret");
    await expect(authPage.submit).toBeEnabled();
  });

  test("registers a new user", async ({ authPage, navBar, page }) => {
    // The API has no delete-user endpoint, so this leaves one account behind.
    const user = buildUser();

    await authPage.gotoRegister();
    await authPage.register(user.username, user.email, user.password);

    await expect(page).toHaveURL("/");
    await expect(navBar.profile(user.username)).toBeVisible();
  });

  test("signed-in user sees the authenticated navigation", async ({
    authedPage,
    homePage,
    navBar,
    testUser,
  }) => {
    await homePage.goto();

    await expect(navBar.newArticle).toBeVisible();
    await expect(navBar.settings).toBeVisible();
    await expect(navBar.profile(testUser.username)).toBeVisible();
    await expect(authedPage.getByText("Your Feed")).toBeVisible();
  });
});
