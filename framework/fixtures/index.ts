import { test as base, expect, Page } from "@playwright/test";
import { ApiArticle, ApiClient } from "../api/api-client";
import { config } from "../config/env";
import { buildArticle, buildUser } from "../data/factory";
import { ArticlePage } from "../pages/article-page";
import { AuthPage } from "../pages/auth-page";
import { EditorPage } from "../pages/editor-page";
import { HomePage } from "../pages/home-page";
import { NavBar } from "../pages/nav-bar";

export interface TestUser {
  username: string;
  email: string;
  password: string;
  token: string;
}

interface TestFixtures {
  // page objects
  authPage: AuthPage;
  homePage: HomePage;
  editorPage: EditorPage;
  articlePage: ArticlePage;
  navBar: NavBar;
  // API helpers
  anonApi: ApiClient;
  api: ApiClient;
  // data
  article: ApiArticle;
  cleanup: { article: (slug: string) => void };
  // browser already signed in as `testUser`
  authedPage: Page;
}

interface WorkerFixtures {
  testUser: TestUser;
}

/**
 * Extended `test`. Import this instead of "@playwright/test" in specs:
 *
 *   import { test, expect } from "../framework/fixtures";
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // --- worker scope: one account per worker ---------------------------------
  testUser: [
    async ({}, use) => {
      const client = await ApiClient.create();
      let user: TestUser;
      const { email, password } = config.user;
      if (email && password) {
        const logged = await client.login(email, password);
        user = {
          username: logged.username,
          email,
          password,
          token: logged.token,
        };
      } else {
        // The API has no "delete user" endpoint, so keep this to one per worker.
        const data = buildUser();
        const created = await client.register(data);
        user = { ...data, token: created.token };
      }
      await client.dispose();
      await use(user);
    },
    { scope: "worker" },
  ],

  // --- page objects ---------------------------------------------------------
  authPage: async ({ page }, use) => use(new AuthPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  editorPage: async ({ page }, use) => use(new EditorPage(page)),
  articlePage: async ({ page }, use) => use(new ArticlePage(page)),
  navBar: async ({ page }, use) => use(new NavBar(page)),

  // --- API ------------------------------------------------------------------
  anonApi: async ({}, use) => {
    const client = await ApiClient.create();
    await use(client);
    await client.dispose();
  },

  api: async ({ testUser }, use) => {
    const client = await ApiClient.create(testUser.token);
    await use(client);
    await client.dispose();
  },

  // --- data -----------------------------------------------------------------
  /** Registers a slug for deletion after the test (for UI-created data). */
  cleanup: async ({ api }, use) => {
    const slugs: string[] = [];
    await use({ article: (slug) => slugs.push(slug) });
    for (const slug of slugs) {
      await api.deleteArticle(slug);
    }
  },

  /** An article created through the API, deleted automatically afterwards. */
  article: async ({ api, cleanup }, use) => {
    const created = await api.createArticle(buildArticle());
    cleanup.article(created.slug);
    await use(created);
  },

  // --- authentication -------------------------------------------------------
  /** Skips the login form by seeding the JWT the app reads from localStorage. */
  authedPage: async ({ page, testUser }, use) => {
    await page.addInitScript(
      (token) => window.localStorage.setItem("jwtToken", token),
      testUser.token,
    );
    await use(page);
  },
});

export { expect };
