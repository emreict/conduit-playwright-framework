import { test, expect } from "../../framework/fixtures";
import {
  buildUser,
  invalidInput,
  uniqueId,
} from "../../framework/data/factory";

// Flat API spec against the real backend. testUser is shared per worker and is
// only read; anything that changes credentials uses freshUser / freshApi.

test.describe("registration API", () => {
  test("registers a user and returns a token without echoing the password", async ({
    anonApi,
  }) => {
    const data = buildUser();

    const user = await anonApi.register(data);

    expect(user.username).toBe(data.username);
    expect(user.email).toBe(data.email);
    expect(user.token).toBeTruthy();
    expect(JSON.stringify(user)).not.toContain(data.password);
  });

  test("rejects a duplicate email with 422", async ({ anonApi, testUser }) => {
    const data = buildUser({ email: testUser.email });

    const response = await anonApi.send("POST", "/users", { user: data });

    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({
      errors: { email: ["has already been taken"] },
    });
  });

  test("rejects a duplicate username with 422", async ({
    anonApi,
    testUser,
  }) => {
    const data = buildUser({ username: testUser.username });

    const response = await anonApi.send("POST", "/users", { user: data });

    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({
      errors: { username: ["has already been taken"] },
    });
  });

  test("rejects a malformed email with 422", async ({ anonApi }) => {
    const data = buildUser({ email: invalidInput.malformedEmail });

    const response = await anonApi.send("POST", "/users", { user: data });

    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({
      errors: { email: ["is invalid"] },
    });
  });

  test("rejects a password shorter than 8 characters with 422", async ({
    anonApi,
  }) => {
    const data = buildUser({ password: invalidInput.shortPassword });

    const response = await anonApi.send("POST", "/users", { user: data });

    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({
      errors: { password: ["is too short (minimum is 8 characters)"] },
    });
  });

  test("reports every blank field when the body is empty", async ({
    anonApi,
  }) => {
    const response = await anonApi.send("POST", "/users", {});

    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({
      errors: {
        email: ["can't be blank"],
        username: ["can't be blank"],
        password: ["can't be blank"],
      },
    });
  });
});

test.describe("login API", () => {
  test("returns the user and a token for valid credentials", async ({
    anonApi,
    testUser,
  }) => {
    const user = await anonApi.login(testUser.email, testUser.password);

    expect(user.email).toBe(testUser.email);
    expect(user.username).toBe(testUser.username);
    expect(user.token).toBeTruthy();
  });

  test("rejects a wrong password with 403", async ({ anonApi, testUser }) => {
    const response = await anonApi.send("POST", "/users/login", {
      user: { email: testUser.email, password: "wrong-password-1" },
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({
      errors: { "email or password": ["is invalid"] },
    });
  });

  test("rejects an unknown email with the same 403", async ({ anonApi }) => {
    const response = await anonApi.send("POST", "/users/login", {
      user: {
        email: `nobody_${uniqueId()}@example.com`,
        password: "Passw0rd!123",
      },
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({
      errors: { "email or password": ["is invalid"] },
    });
  });

  test("rejects a missing password with 422", async ({ anonApi, testUser }) => {
    const response = await anonApi.send("POST", "/users/login", {
      user: { email: testUser.email },
    });

    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({
      errors: { password: ["can't be blank"] },
    });
  });
});

test.describe("current user API", () => {
  test("returns the current user for a valid token", async ({
    api,
    testUser,
  }) => {
    const user = await api.currentUser();

    expect(user.username).toBe(testUser.username);
    expect(user.email).toBe(testUser.email);
  });

  test("rejects a request without a token with 401", async ({ anonApi }) => {
    const response = await anonApi.send("GET", "/user");

    expect(response.status()).toBe(401);
  });

  test("rejects a malformed token with 401", async ({ anonApi }) => {
    const response = await anonApi.send("GET", "/user", undefined, {
      Authorization: "Token abc.def.ghi",
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("update user API", () => {
  test("updates the bio and image", async ({ freshApi }) => {
    const bio = `Bio ${uniqueId()}`;
    const image = "https://example.com/avatar.png";

    const updated = await freshApi.updateUser({ bio, image });

    expect(updated.bio).toBe(bio);
    expect(updated.image).toBe(image);
    expect((await freshApi.currentUser()).bio).toBe(bio);
  });

  test("changes the email and the new one can log in", async ({
    freshApi,
    freshUser,
    anonApi,
  }) => {
    const newEmail = `pw_${uniqueId()}@example.com`;

    await freshApi.updateUser({ email: newEmail });

    const user = await anonApi.login(newEmail, freshUser.password);
    expect(user.username).toBe(freshUser.username);
  });

  test("changes the password: the new one works, the old one gets 403", async ({
    freshApi,
    freshUser,
    anonApi,
  }) => {
    const newPassword = "NewPassw0rd!456";

    await freshApi.updateUser({ password: newPassword });

    const oldLogin = await anonApi.send("POST", "/users/login", {
      user: { email: freshUser.email, password: freshUser.password },
    });
    expect(oldLogin.status()).toBe(403);
    const user = await anonApi.login(freshUser.email, newPassword);
    expect(user.token).toBeTruthy();
  });

  test("ignores a blank username and a blank password", async ({
    freshApi,
    freshUser,
    anonApi,
  }) => {
    const updated = await freshApi.updateUser({ username: "", password: "" });

    expect(updated.username).toBe(freshUser.username);
    const user = await anonApi.login(freshUser.email, freshUser.password);
    expect(user.username).toBe(freshUser.username);
  });

  test("rejects an update without a token with 401", async ({ anonApi }) => {
    const response = await anonApi.send("PUT", "/user", {
      user: { bio: "no token" },
    });

    expect(response.status()).toBe(401);
  });

  test("known issue: a duplicate email on update returns 500 instead of 422", async ({
    freshApi,
    testUser,
  }) => {
    test.info().annotations.push({
      type: "known-issue",
      description: "Unique constraint surfaces as a raw 500 database error",
    });

    const response = await freshApi.send("PUT", "/user", {
      user: { email: testUser.email },
    });

    expect(response.status()).toBe(500);
    expect(await response.text()).toContain("Unique constraint failed");
  });

  test("known issue: a duplicate username on update returns 500 instead of 422", async ({
    freshApi,
    testUser,
  }) => {
    test.info().annotations.push({
      type: "known-issue",
      description: "Unique constraint surfaces as a raw 500 database error",
    });

    const response = await freshApi.send("PUT", "/user", {
      user: { username: testUser.username },
    });

    expect(response.status()).toBe(500);
    expect(await response.text()).toContain("Unique constraint failed");
  });

  test("known issue: update accepts a malformed email and a short password", async ({
    freshApi,
    anonApi,
  }) => {
    test.info().annotations.push({
      type: "known-issue",
      description: "Update skips the validation that registration enforces",
    });

    // Emails are unique even when malformed, so make this one unique too.
    const malformedEmail = `${invalidInput.malformedEmail}-${uniqueId()}`;

    const updated = await freshApi.updateUser({
      email: malformedEmail,
      password: invalidInput.shortPassword,
    });

    expect(updated.email).toBe(malformedEmail);
    const login = await anonApi.send("POST", "/users/login", {
      user: { email: malformedEmail, password: invalidInput.shortPassword },
    });
    expect(login.status()).toBe(200);
  });
});
