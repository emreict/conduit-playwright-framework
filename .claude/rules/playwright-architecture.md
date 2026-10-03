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

Test root is `e2e/` (`testDir` in `playwright.config.ts`). Specs in `e2e/ui` and `e2e/api` import with `../../framework/...`.

## Two styles live side by side

- **Flat specs** (`e2e/ui/user-management.spec.ts`, `e2e/api/*.spec.ts`): all locators and steps are inline in the spec. No page objects. Locators are duplicated across tests on purpose. For these files the page-object rules of the audit skill do **not** apply, even though the spec imports `test` from `framework/fixtures`: it does so only to receive data fixtures, never page objects.
- **Page-object specs** (`articles`, `comments`): use the page objects in `framework/pages/` through fixtures. Page objects hold locators and actions; assertions stay in the spec.

New specs default to the flat style unless the user says otherwise.

## Fixtures (`framework/fixtures/index.ts`)

Import `test` and `expect` from here, never from `@playwright/test` (the old `smoke.spec.ts` is the one exception because it needs no fixtures).

| Fixture                        | Scope  | Use                                                                                                                                                                        |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testUser`                     | worker | One account per worker (or the `.env` account). Read-only: never change its email, username or password.                                                                   |
| `freshUser`, `freshApi`        | test   | New account for tests that change credentials or must not share state; `freshApi` is an API client for it.                                                                 |
| `api`, `anonApi`               | test   | API client as `testUser` / without a token. Use `send()` for raw status and body checks.                                                                                   |
| `authedPage`, `signInAs(user)` | test   | Skip the login form by seeding `jwtToken`. The seed re-runs on every navigation, so do not use it for reload, logout or invalid-token tests: sign in through the UI there. |
| `article`, `cleanup`           | test   | Article created via API and deleted afterwards; `cleanup.article(slug)` for UI-created ones.                                                                               |

## Setup and cleanup

- Prefer the API for setup and teardown, the UI for the behaviour under test.
- The API has no delete-user endpoint: every registration and every `freshUser` leaves an account behind. Request `freshUser` only when a test needs it; use `testUser` for read-only scenarios.
- Articles and comments created by a test must be deleted by that test (fixtures do it).

## Configuration

- `playwright.config.ts` defines projects `chromium` (ignores `**/api/**`) and `api` (matches `**/api/**/*.spec.ts`), starts or reuses the dev server on port 4200, and records traces and screenshots on failure.
- Environment overrides come from `.env` (git-ignored; copy `.env.example`).
- Auth setup files and the config are not edited as part of writing a new spec unless the task says so.
