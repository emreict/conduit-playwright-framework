---
description: Playwright architecture for Conduit - directory layout, fixtures, flat vs page-object specs, setup and cleanup, configuration
paths: [e2e/**, framework/**, playwright.config.ts]
---

# Playwright architecture rules

## Directory layout

```
e2e/
├── ui/        browser tests (chromium project)
└── api/       API tests (api project, no browser)
framework/
├── config/    env.ts: BASE_URL, API_URL, optional TEST_USER_EMAIL / TEST_USER_PASSWORD
├── api/       api-client.ts: typed REST client
├── data/      factory.ts: unique users and articles, invalid-input constants
├── pages/     page objects used by the older specs (articles, comments, smoke)
└── fixtures/  index.ts: the extended `test`
```

Test root is `e2e/` (`testDir` in `playwright.config.ts`). Specs in `e2e/ui` and `e2e/api` import with `../../framework/...`. `e2e/` holds only specs; everything else executable support code lives in `framework/`.

## When to use what

| Pattern      | When                                                                   | Location                        |
| ------------ | ---------------------------------------------------------------------- | ------------------------------- |
| Flat spec    | Default for new specs; locators and steps inline                       | `e2e/ui/*.spec.ts`, `e2e/api/*` |
| Page object  | Older page-object specs (articles, comments); multi-step flows reused  | `framework/pages/`              |
| Fixture      | Anything needing setup and guaranteed teardown (users, articles, auth) | `framework/fixtures/index.ts`   |
| API client   | Setup, teardown and raw status/body checks                             | `framework/api/api-client.ts`   |
| Data factory | Unique users, articles, ids, invalid-input constants                   | `framework/data/factory.ts`     |

## Two styles live side by side

- **Flat specs** (`e2e/ui/user-management.spec.ts`, `e2e/api/*.spec.ts`): all locators and steps are inline in the spec. No page objects. Locators are duplicated across tests on purpose. For these files the page-object rules of the audit skill do **not** apply, even though the spec imports `test` from `framework/fixtures`: it does so only to receive data fixtures, never page objects.
- **Page-object specs** (`articles`, `comments`): use the page objects in `framework/pages/` through fixtures. Page objects hold locators and actions; assertions stay in the spec.

New specs default to the flat style unless the user says otherwise.

## Page object conventions (page-object specs only)

- One class per page or major component, in `framework/pages/`, file name kebab-case (`article-page.ts`), class name PascalCase (`ArticlePage`, `NavBar`).
- Constructor takes `Page`; locators are `readonly` properties built in the constructor. Comment any non-obvious locator (for example one that renders twice).
- Methods are user tasks (`addComment`, `deleteComment`), named with camelCase verb phrases and no abbreviations. Do not wrap a single `click` or `fill` just to name it.
- A method only touches its own page; navigation ends one method and the next page's methods continue.
- Assertions stay in the spec. Page objects may end an action with a stabilizing wait (`toHaveURL`), but the test's goal assertion belongs to the spec.
- Reuse first: scan the class before adding a method; parametrize instead of writing two methods that differ by a hard-coded value.
- Add only what specs use. Register new page objects in the fixture that exposes them.

## Fixtures (`framework/fixtures/index.ts`)

Import `test` and `expect` from here, never from `@playwright/test` (the old `smoke.spec.ts` is the one exception because it needs no fixtures).

| Fixture                        | Scope  | Use                                                                                                                                                                        |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testUser`                     | worker | One account per worker (or the `.env` account). Read-only: never change its email, username or password.                                                                   |
| `freshUser`, `freshApi`        | test   | New account for tests that change credentials or must not share state; `freshApi` is an API client for it.                                                                 |
| `api`, `anonApi`               | test   | API client as `testUser` / without a token. Use `send()` for raw status and body checks.                                                                                   |
| `authedPage`, `signInAs(user)` | test   | Skip the login form by seeding `jwtToken`. The seed re-runs on every navigation, so do not use it for reload, logout or invalid-token tests: sign in through the UI there. |
| `article`, `cleanup`           | test   | Article created via API and deleted afterwards; `cleanup.article(slug)` for UI-created ones.                                                                               |

Fixtures guarantee teardown even when a test fails; do not replace them with `beforeAll` / `afterAll` state or module-level variables.

## Authentication

The app keeps its session in `localStorage["jwtToken"]`. Tests authenticate by seeding that token through `authedPage` / `signInAs`, not with `storageState` files or a setup project. Only tests whose behaviour is the login, logout, reload or invalid-token flow go through the real form.

## Setup and cleanup

- Prefer the API for setup and teardown, the UI for the behaviour under test.
- The API has no delete-user endpoint: every registration and every `freshUser` leaves an account behind. Request `freshUser` only when a test needs it; use `testUser` for read-only scenarios.
- Articles and comments created by a test must be deleted by that test (fixtures do it).
- Each test is independent: no shared mutable state between tests and no ordering assumptions.

## Configuration

- `playwright.config.ts` defines projects `chromium` (ignores `**/api/**`) and `api` (matches `**/api/**/*.spec.ts`), starts or reuses the dev server on port 4200 (`reuseExistingServer: !CI`), and records traces and screenshots on failure (`trace: "retain-on-failure"`, `screenshot: "only-on-failure"`, video off). Default timeouts: 30 s test, 7 s expect.
- Environment overrides come from `.env` (git-ignored; copy `.env.example`), read through `framework/config/env.ts`.
- Auth setup files and the config are not edited as part of writing a new spec unless the task says so.

## Anti-patterns

- Importing `test` from `@playwright/test` in a spec that uses fixtures.
- Page objects in flat specs, or assertions inside page objects' goal flows.
- Creating test data inline instead of with `framework/data/factory.ts`, or hard-coding unique values.
- Leaving articles or comments behind; relying on data another test created.
- Using `freshUser` where `testUser` is enough, or changing `testUser`'s credentials.
- `authedPage` for reload, logout or invalid-token tests (the seed re-runs on each navigation).
- Fat page objects with methods no spec uses.
