# Conduit — Test Automation Practice App

**Conduit** is a Medium-style blogging application built with Angular 22. This version has been modified and adapted by [Bondar Academy](https://www.bondaracademy.com/) as a hands-on practice target for **test automation** students.

It works against a dedicated backend hosted by Bondar Academy, so it is ready to use for:

- **UI testing:** real user flows such as sign-up, login, writing articles, commenting, following authors and favoriting.
- **API testing:** a REST API with full CRUD operations, token-based authentication, query filters and pagination.
- **Hybrid testing:** prepare data through the API, verify it in the UI, and mock or intercept network calls.

Explore the training programs at **https://www.bondaracademy.com/**.

## Backend API

The app talks to the Bondar Academy API:

```
https://conduit-api.bondaracademy.com/api
```

The base URL is set in `src/app/core/interceptors/api.interceptor.ts`. The app's services call relative paths such as `/articles`, and the interceptor adds the base URL to every request.

> **The API is shared and live.** Everything you create through the app or your tests persists and is visible to other students. Create your own test data and delete it when the test finishes.

### Authentication

1. Register (`POST /users`) or log in (`POST /users/login`). The response contains `user.token`.
2. Send the token on every protected request as the header:

   ```
   Authorization: Token <jwt>
   ```

The UI stores the same token in `localStorage` under the key `jwtToken`. Setting that key before the page loads signs the browser in without going through the login form, which is a useful shortcut for UI tests.

Example login request body:

```json
{ "user": { "email": "student@example.com", "password": "secret" } }
```

### Endpoints

🔒 = requires the `Authorization` header.

**Users and authentication**

| Method | Endpoint       | Purpose                 | Request body                                                                   |
| ------ | -------------- | ----------------------- | ------------------------------------------------------------------------------ |
| POST   | `/users`       | Register                | `{ "user": { "username", "email", "password" } }`                              |
| POST   | `/users/login` | Log in                  | `{ "user": { "email", "password" } }`                                          |
| GET    | `/user` 🔒     | Get the current user    | —                                                                              |
| PUT    | `/user` 🔒     | Update the current user | `{ "user": { "email", "username", "password", "bio", "image" } }` (any subset) |

**Articles (full CRUD)**

| Method | Endpoint             | Purpose                        | Request body                                                       |
| ------ | -------------------- | ------------------------------ | ------------------------------------------------------------------ |
| GET    | `/articles`          | List articles                  | —                                                                  |
| GET    | `/articles/feed` 🔒  | Articles from followed authors | —                                                                  |
| GET    | `/articles/:slug`    | Get one article                | —                                                                  |
| POST   | `/articles` 🔒       | Create an article              | `{ "article": { "title", "description", "body", "tagList": [] } }` |
| PUT    | `/articles/:slug` 🔒 | Update an article              | `{ "article": { ...fields to change } }`                           |
| DELETE | `/articles/:slug` 🔒 | Delete an article              | —                                                                  |

Query parameters for `/articles` and `/articles/feed`: `tag`, `author`, `favorited`, `limit`, `offset`.

**Comments**

| Method | Endpoint                          | Purpose          | Request body                |
| ------ | --------------------------------- | ---------------- | --------------------------- |
| GET    | `/articles/:slug/comments`        | List comments    | —                           |
| POST   | `/articles/:slug/comments` 🔒     | Add a comment    | `{ "comment": { "body" } }` |
| DELETE | `/articles/:slug/comments/:id` 🔒 | Delete a comment | —                           |

**Favorites, profiles and tags**

| Method | Endpoint                        | Purpose               |
| ------ | ------------------------------- | --------------------- |
| POST   | `/articles/:slug/favorite` 🔒   | Favorite an article   |
| DELETE | `/articles/:slug/favorite` 🔒   | Unfavorite an article |
| GET    | `/profiles/:username`           | Get a profile         |
| POST   | `/profiles/:username/follow` 🔒 | Follow a user         |
| DELETE | `/profiles/:username/follow` 🔒 | Unfollow a user       |
| GET    | `/tags`                         | List popular tags     |

### Article object

```json
{
  "slug": "my-article-123",
  "title": "My article",
  "description": "Short summary",
  "body": "Markdown content",
  "tagList": ["testing"],
  "createdAt": "...",
  "updatedAt": "...",
  "favorited": false,
  "favoritesCount": 0,
  "author": { "username": "...", "bio": "...", "image": "...", "following": false }
}
```

## Test automation guidelines

- **Isolate test data.** Each test creates the users, articles and comments it needs, using unique values such as a timestamp in the title.
- **Clean up.** Delete what the test created, for example in an `afterEach` hook, even when the test fails.
- **Set up through the API, assert through the UI.** Creating data with an API call is faster and more reliable than clicking through forms.
- **Reuse authentication.** Log in once through the API and reuse the token, either as a request header or by setting `jwtToken` in `localStorage`.
- **Mock when you need control.** All traffic goes to one origin, so `page.route("**/api/**", ...)` can stub responses to test empty states, errors and edge cases.
- **Don't depend on existing data.** Other students change the shared data all the time, so never assert on articles or users your test didn't create.

## App pages

| Path                                                 | Page                                       | Access                |
| ---------------------------------------------------- | ------------------------------------------ | --------------------- |
| `/`                                                  | Home: global feed, your feed, popular tags | Everyone              |
| `/login`, `/register`                                | Sign in / sign up                          | Signed-out users only |
| `/settings`                                          | User settings, logout                      | Signed-in users only  |
| `/editor`, `/editor/:slug`                           | New / edit article                         | Signed-in users only  |
| `/article/:slug`                                     | Article with comments                      | Everyone              |
| `/profile/:username`, `/profile/:username/favorites` | Profile, authored and favorited articles   | Everyone              |

## Getting started

Requires Node.js `^22.22.3 || ^24.15.0` (Node 24 LTS recommended).

```bash
npm install
npm start
```

Open http://localhost:4200/. The app reloads automatically when you change source files.

## Running the tests

The project includes a [Playwright](https://playwright.dev/) framework with two projects: **`chromium`** for UI tests in `tests/ui/`, and **`api`** for API tests in `tests/api/` (no browser needed).

| Command                                               | What it does                           |
| ----------------------------------------------------- | -------------------------------------- |
| `npm run e2e`                                         | Run all tests (UI and API)             |
| `npm run e2e:api`                                     | Run only the API tests                 |
| `npm run e2e:ui`                                      | Open Playwright UI mode                |
| `npm run e2e:headed`                                  | Run with a visible browser             |
| `npm run e2e:debug`                                   | Step through tests in the inspector    |
| `npm run e2e:report`                                  | Open the HTML report from the last run |
| `npx playwright test tests/ui/auth.spec.ts -g "name"` | Run a single file or test              |

You don't need to start the app first: Playwright starts the dev server itself, or reuses one already running on port 4200. Configuration is in `playwright.config.ts`.

### Framework layout

```
framework/
├── config/env.ts        BASE_URL, API_URL and optional test account from env / .env
├── api/api-client.ts    typed wrapper over the REST API (users, articles, comments, tags)
├── data/factory.ts      unique users and articles (uniqueId, buildUser, buildArticle)
├── pages/               page objects: AuthPage, HomePage, EditorPage, ArticlePage, NavBar
└── fixtures/index.ts    the extended `test` with all fixtures below
tests/
├── ui/                  browser tests (smoke, auth, articles, comments)
└── api/                 API tests (CRUD, auth, pagination, favorites, comments)
```

Import `test` and `expect` from the framework, not from `@playwright/test`:

```ts
import { test, expect } from "../../framework/fixtures";

test("deletes an article", async ({ authedPage, article, articlePage, api }) => {
  await articlePage.goto(article.slug);
  await articlePage.deleteButton.click();
  await expect(authedPage).toHaveURL("/");
});
```

| Fixture                                                       | What you get                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `testUser`                                                    | One account per worker (registered via the API, or from `.env`)         |
| `authedPage`                                                  | A page already signed in as `testUser` (JWT seeded into `localStorage`) |
| `api` / `anonApi`                                             | API client with / without the `testUser` token                          |
| `article`                                                     | An article created through the API and deleted after the test           |
| `cleanup`                                                     | `cleanup.article(slug)` deletes UI-created articles after the test      |
| `authPage`, `homePage`, `editorPage`, `articlePage`, `navBar` | Page objects                                                            |

### Configuration

Defaults work out of the box. To override, copy `.env.example` to `.env` (it is git-ignored) and set `BASE_URL`, `API_URL`, or `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` to sign in with an existing account instead of registering a throwaway one.

> The API has no delete-user endpoint, so each run leaves behind one registered user per worker. Articles and comments are cleaned up automatically.

## Project structure

```
src/app/
├── app.config.ts    providers: router, HTTP interceptors, session restore on startup
├── app.routes.ts    lazy-loaded routes and auth guards
├── core/            auth (login/register, UserService, JwtService), interceptors, header/footer
├── features/
│   ├── article/     home feed, article page with comments, editor
│   ├── profile/     user profiles, follow button, favorites
│   └── settings/    account settings
└── shared/          error list component, ifAuthenticated directive, markdown pipe
framework/           Playwright framework: page objects, API client, fixtures
tests/               Playwright specs (ui/ and api/)
```

## Other commands

- `npm run build` — production build into `dist/`.
- `npm test` — Karma/Jasmine unit tests (no unit test files yet).
- Prettier formats staged files through a husky pre-commit hook.
