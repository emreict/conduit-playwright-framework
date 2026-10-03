import { test, expect } from "../../framework/fixtures";
import {
  buildUser,
  invalidInput,
  uniqueId,
} from "../../framework/data/factory";

// Flat spec: every locator and step is inline on purpose (no page objects).
// It runs against the real backend; users are generated, never reused blindly.
// Fixtures are used for data only: testUser (shared per worker, never change
// its credentials), freshUser (new account for this test), signInAs, anonApi.

test.describe("registration", () => {
  test("@registration registers a new user and signs them in", async ({
    page,
  }) => {
    const user = buildUser();

    await page.goto("/register");
    await page.getByPlaceholder("Username").fill(user.username);
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("navigation").getByRole("link", { name: user.username }),
    ).toBeVisible();
    await expect(page.getByText("Your Feed")).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("jwtToken")),
    ).toBeTruthy();
  });

  test("@registration a registered user can log out and sign back in", async ({
    page,
  }) => {
    const user = buildUser();
    await page.goto("/register");
    await page.getByPlaceholder("Username").fill(user.username);
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("link", { name: "Settings" }).click();
    await page
      .getByRole("button", { name: "Or click here to logout." })
      .click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.getByRole("link", { name: "Sign in" }).click();
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("navigation").getByRole("link", { name: user.username }),
    ).toBeVisible();
  });

  test("@registration Sign up stays disabled until every field is filled", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(page.getByRole("button", { name: "Sign up" })).toBeDisabled();

    await page.getByPlaceholder("Username").fill("someone");
    await expect(page.getByRole("button", { name: "Sign up" })).toBeDisabled();

    await page.getByPlaceholder("Email").fill("someone@example.com");
    await expect(page.getByRole("button", { name: "Sign up" })).toBeDisabled();

    await page.getByPlaceholder("Password").fill("Passw0rd!123");
    await expect(page.getByRole("button", { name: "Sign up" })).toBeEnabled();

    await page.getByPlaceholder("Username").clear();
    await expect(page.getByRole("button", { name: "Sign up" })).toBeDisabled();
  });

  test("@registration links switch between the sign up and sign in forms", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();

    await page.getByRole("link", { name: "Have an account?" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    await page.getByRole("link", { name: "Need an account?" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();
  });

  test("@registration @negative rejects a duplicate email", async ({
    page,
    testUser,
  }) => {
    const user = buildUser();

    await page.goto("/register");
    await page.getByPlaceholder("Username").fill(user.username);
    await page.getByPlaceholder("Email").fill(testUser.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.locator(".error-messages li")).toHaveText(
      "email has already been taken",
    );
    await expect(page).toHaveURL(/\/register$/);
    expect(
      await page.evaluate(() => localStorage.getItem("jwtToken")),
    ).toBeNull();
  });

  test("@registration @negative rejects a duplicate username", async ({
    page,
    testUser,
  }) => {
    const user = buildUser();

    await page.goto("/register");
    await page.getByPlaceholder("Username").fill(testUser.username);
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.locator(".error-messages li")).toHaveText(
      "username has already been taken",
    );
    await expect(page).toHaveURL(/\/register$/);
    expect(
      await page.evaluate(() => localStorage.getItem("jwtToken")),
    ).toBeNull();
  });

  test("@registration @negative rejects a malformed email", async ({
    page,
  }) => {
    const user = buildUser({ email: invalidInput.malformedEmail });

    await page.goto("/register");
    await page.getByPlaceholder("Username").fill(user.username);
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.locator(".error-messages li")).toHaveText(
      "email is invalid",
    );
    await expect(page).toHaveURL(/\/register$/);
  });

  test("@registration @negative rejects a password shorter than 8 characters", async ({
    page,
  }) => {
    const user = buildUser({ password: invalidInput.shortPassword });

    await page.goto("/register");
    await page.getByPlaceholder("Username").fill(user.username);
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.locator(".error-messages li")).toHaveText(
      "password is too short (minimum is 8 characters)",
    );
    await expect(page).toHaveURL(/\/register$/);
  });

  test("@registration @negative lists every validation error on its own line", async ({
    page,
  }) => {
    const user = buildUser({
      email: invalidInput.malformedEmail,
      password: invalidInput.shortPassword,
    });

    await page.goto("/register");
    await page.getByPlaceholder("Username").fill(user.username);
    await page.getByPlaceholder("Email").fill(user.email);
    await page.getByPlaceholder("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.locator(".error-messages li")).toHaveText([
      "email is invalid",
      "password is too short (minimum is 8 characters)",
    ]);
  });
});

test.describe("login", () => {
  test("@auth signs in with valid credentials", async ({ page, testUser }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(testUser.email);
    await page.getByPlaceholder("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: testUser.username }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeHidden();
    expect(
      await page.evaluate(() => localStorage.getItem("jwtToken")),
    ).toBeTruthy();
  });

  test("@auth @negative rejects a wrong password", async ({
    page,
    testUser,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(testUser.email);
    await page.getByPlaceholder("Password").fill("wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator(".error-messages li")).toHaveText(
      "email or password is invalid",
    );
    await expect(page).toHaveURL(/\/login$/);
    expect(
      await page.evaluate(() => localStorage.getItem("jwtToken")),
    ).toBeNull();
  });

  test("@auth @negative rejects an unknown email", async ({ page }) => {
    await page.goto("/login");
    await page
      .getByPlaceholder("Email")
      .fill(`nobody_${uniqueId()}@example.com`);
    await page.getByPlaceholder("Password").fill("Passw0rd!123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator(".error-messages li")).toHaveText(
      "email or password is invalid",
    );
    await expect(page).toHaveURL(/\/login$/);
  });

  test("@auth @negative Sign in stays disabled until email and password are filled", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();

    await page.getByPlaceholder("Email").fill("someone@example.com");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();

    await page.getByPlaceholder("Email").clear();
    await page.getByPlaceholder("Password").fill("Passw0rd!123");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();

    await page.getByPlaceholder("Email").fill("someone@example.com");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  test("@auth the error disappears after a successful retry", async ({
    page,
    testUser,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(testUser.email);
    await page.getByPlaceholder("Password").fill("wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator(".error-messages li")).toBeVisible();

    await page.getByPlaceholder("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.locator(".error-messages")).toBeHidden();
  });

  test("@auth masks the password field", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByPlaceholder("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });
});

test.describe("session and route protection", () => {
  test("@auth keeps the user signed in after a reload", async ({
    page,
    testUser,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(testUser.email);
    await page.getByPlaceholder("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");

    await page.reload();

    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: testUser.username }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeHidden();
  });

  test("@auth logging out clears the session, also after a reload", async ({
    page,
    testUser,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(testUser.email);
    await page.getByPlaceholder("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("link", { name: "Settings" }).click();
    await page
      .getByRole("button", { name: "Or click here to logout." })
      .click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("jwtToken")),
    ).toBeNull();

    await page.reload();

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeHidden();
  });

  test("@auth @negative a signed-out user cannot open the settings page", async ({
    page,
  }) => {
    await page.goto("/settings");

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page).not.toHaveURL(/\/settings/);
    await expect(
      page.getByRole("heading", { name: "Your Settings" }),
    ).toBeHidden();
  });

  test("@auth @negative a signed-out user cannot open the article editor", async ({
    page,
  }) => {
    await page.goto("/editor");

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page).not.toHaveURL(/\/editor/);
    await expect(page.getByPlaceholder("Article Title")).toBeHidden();
  });

  test("@auth @negative a signed-in user cannot open the sign in or sign up forms", async ({
    page,
    testUser,
    signInAs,
  }) => {
    await signInAs(testUser);

    await page.goto("/login");
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: testUser.username }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeHidden();
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/register");
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: testUser.username }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign up" })).toBeHidden();
    await expect(page).not.toHaveURL(/\/register/);
  });

  test("@auth @negative an invalid token is discarded and the next load is signed out", async ({
    page,
  }) => {
    // Known issue: GET /user answers 401 during app start-up, which aborts the
    // bootstrap, so the first load after a bad token is a blank page.
    test.info().annotations.push({
      type: "known-issue",
      description: "A rejected token leaves a blank page on the first load",
    });
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("jwtToken", "abc.def.ghi"));

    const userResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/user") &&
        response.request().method() === "GET",
    );
    await page.reload();
    expect((await userResponse).status()).toBe(401);

    await expect(page.locator("app-root")).toBeEmpty();
    expect(
      await page.evaluate(() => localStorage.getItem("jwtToken")),
    ).toBeNull();

    await page.reload();

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("settings and profile", () => {
  test("@settings opens the settings page from the header", async ({
    page,
    freshUser,
    signInAs,
  }) => {
    await signInAs(freshUser);
    await page.goto("/");

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL(/\/settings$/);
    await expect(
      page.getByRole("heading", { name: "Your Settings" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("URL of profile picture")).toBeVisible();
    await expect(page.getByPlaceholder("Username")).toBeVisible();
    await expect(page.getByPlaceholder("Short bio about you")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("New Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Update Settings" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Or click here to logout." }),
    ).toBeVisible();
  });

  test("@settings updates the bio and shows it on the profile", async ({
    page,
    freshUser,
    signInAs,
  }) => {
    const bio = `Bio ${uniqueId()}`;
    await signInAs(freshUser);

    await page.goto("/settings");
    await page.getByPlaceholder("Short bio about you").fill(bio);
    await page.getByRole("button", { name: "Update Settings" }).click();

    await expect(page).toHaveURL(`/profile/${freshUser.username}`);
    await expect(page.getByText(bio)).toBeVisible();
  });

  test("@settings changes the username", async ({
    page,
    freshUser,
    signInAs,
  }) => {
    const newUsername = `pw_${uniqueId()}`;
    await signInAs(freshUser);

    await page.goto("/settings");
    await page.getByPlaceholder("Username").fill(newUsername);
    await page.getByRole("button", { name: "Update Settings" }).click();

    await expect(page).toHaveURL(`/profile/${newUsername}`);
    await expect(
      page.getByRole("heading", { name: newUsername, level: 4 }),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole("navigation").getByRole("link", { name: newUsername }),
    ).toBeVisible();
  });

  test("@settings the header links disappear after a settings update until the page is reloaded", async ({
    page,
    freshUser,
    signInAs,
  }) => {
    // Known issue: the ifAuthenticated directive clears its view when the
    // user subject emits again while already authenticated.
    test.info().annotations.push({
      type: "known-issue",
      description: "Header navigation is removed after a successful update",
    });
    await signInAs(freshUser);

    await page.goto("/settings");
    await page.getByPlaceholder("Short bio about you").fill("new bio");
    await page.getByRole("button", { name: "Update Settings" }).click();
    await expect(page).toHaveURL(`/profile/${freshUser.username}`);

    const navigation = page.getByRole("navigation");
    await expect(
      navigation.getByRole("link", { name: "Settings" }),
    ).toBeHidden();
    await expect(
      navigation.getByRole("link", { name: "New Article" }),
    ).toBeHidden();

    await page.reload();

    await expect(
      navigation.getByRole("link", { name: "Settings" }),
    ).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: "New Article" }),
    ).toBeVisible();
  });

  test("@settings changes the password: the new one works, the old one is rejected", async ({
    page,
    freshUser,
    signInAs,
    anonApi,
  }) => {
    const newPassword = "NewPassw0rd!456";
    await signInAs(freshUser);

    await page.goto("/settings");
    await page.getByPlaceholder("New Password").fill(newPassword);
    await page.getByRole("button", { name: "Update Settings" }).click();
    await expect(page).toHaveURL(`/profile/${freshUser.username}`);

    const oldLogin = await anonApi.send("POST", "/users/login", {
      user: { email: freshUser.email, password: freshUser.password },
    });
    expect(oldLogin.status()).toBe(403);
    const newLogin = await anonApi.send("POST", "/users/login", {
      user: { email: freshUser.email, password: newPassword },
    });
    expect(newLogin.status()).toBe(200);
  });

  test("@settings changes the email and signs in with the new one", async ({
    page,
    freshUser,
    signInAs,
  }) => {
    const newEmail = `pw_${uniqueId()}@example.com`;
    await signInAs(freshUser);

    await page.goto("/settings");
    await page.getByPlaceholder("Email").fill(newEmail);
    await page.getByRole("button", { name: "Update Settings" }).click();
    await expect(page).toHaveURL(`/profile/${freshUser.username}`);

    await page.goto("/settings");
    await page
      .getByRole("button", { name: "Or click here to logout." })
      .click();
    await page.getByRole("link", { name: "Sign in" }).click();
    await page.getByPlaceholder("Email").fill(newEmail);
    await page.getByPlaceholder("Password").fill(freshUser.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: freshUser.username }),
    ).toBeVisible();
  });

  test("@settings @negative stays on settings when the email is already taken", async ({
    page,
    freshUser,
    testUser,
    signInAs,
  }) => {
    // Known issue: the API answers 500 (raw database error) instead of a 422
    // with an errors object, so the UI shows no message at all.
    test.info().annotations.push({
      type: "known-issue",
      description: "No error message is shown for a duplicate email on update",
    });
    await signInAs(freshUser);

    await page.goto("/settings");
    await page.getByPlaceholder("Email").fill(testUser.email);
    await page.getByRole("button", { name: "Update Settings" }).click();

    await expect(
      page.getByRole("button", { name: "Update Settings" }),
    ).toBeEnabled();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.locator(".error-messages")).toBeHidden();
  });

  test("@settings @negative stays on settings when the username is already taken", async ({
    page,
    freshUser,
    testUser,
    signInAs,
  }) => {
    test.info().annotations.push({
      type: "known-issue",
      description:
        "No error message is shown for a duplicate username on update",
    });
    await signInAs(freshUser);

    await page.goto("/settings");
    await page.getByPlaceholder("Username").fill(testUser.username);
    await page.getByRole("button", { name: "Update Settings" }).click();

    await expect(
      page.getByRole("button", { name: "Update Settings" }),
    ).toBeEnabled();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.locator(".error-messages")).toBeHidden();
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: freshUser.username }),
    ).toBeVisible();
  });

  test("@settings the settings form is not pre-filled with the current values", async ({
    page,
    freshUser,
    signInAs,
  }) => {
    test.info().annotations.push({
      type: "known-issue",
      description:
        "SettingsComponent patches the form with an Observable, so fields stay empty",
    });
    await signInAs(freshUser);

    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Your Settings" }),
    ).toBeVisible();

    await expect(page.getByPlaceholder("Username")).toHaveValue("");
    await expect(page.getByPlaceholder("Email")).toHaveValue("");
  });

  test("@settings shows the edit link on the own profile and a follow button on another", async ({
    page,
    freshUser,
    testUser,
    signInAs,
  }) => {
    await signInAs(freshUser);

    await page.goto(`/profile/${freshUser.username}`);
    await expect(
      page.getByRole("link", { name: "Edit Profile Settings" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Edit Profile Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);

    await page.goto(`/profile/${testUser.username}`);
    await expect(
      page.getByRole("button", { name: `Follow ${testUser.username}` }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Edit Profile Settings" }),
    ).toBeHidden();
  });
});
