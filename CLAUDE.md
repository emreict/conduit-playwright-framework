# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Conduit — a Medium-style blogging SPA (Angular 22, standalone components). Used as the practice app for Bondar Academy test automation courses, so the main work here is writing automated tests against the running app.

## Commands

Requires Node.js `^22.22.3 || ^24.15.0` (Node 24 LTS installed locally).

- `npm install` — install dependencies
- `npm start` — dev server at http://localhost:4200/
- `npm run build` — production build into `dist/`
- `npm test` — Karma/Jasmine unit tests (no spec files exist in `src/` yet)
- `npm run e2e` — all Playwright tests (`chromium` project for `e2e/ui/`, `api` project for `e2e/api/`); starts the dev server itself or reuses one on port 4200
- `npm run e2e:api` — API tests only (no browser)
- `npm run e2e:ui` — Playwright UI mode
- `npm run e2e:report` — open the last HTML report
- `npm run e2e:users` — user-management specs (UI and API)
- `npx playwright test e2e/ui/user-management.spec.ts -g "name"` — run a single file or test

Prettier runs on staged files through a husky pre-commit hook.

## Architecture

- `src/app/app.config.ts` — providers: router, HTTP client with three interceptors, and an `APP_INITIALIZER` that loads the current user when a JWT is stored.
- `src/app/app.routes.ts` — all routes are lazy loaded; page components are `export default` classes.
- `src/app/core/` — auth (login/register page, `UserService`, `JwtService`), interceptors, header/footer layout.
- `src/app/features/` — `article` (home feed, article page, editor), `profile`, `settings`. Each has `pages/`, `components/`, `services/`, `models/`.
- `src/app/shared/` — error list component, `ifAuthenticated` directive, markdown pipe.

## Test framework

- `framework/` holds the Playwright building blocks: `config/env.ts` (env + `.env`), `api/api-client.ts` (typed REST client), `data/factory.ts` (unique test data), `pages/` (page objects), `fixtures/index.ts` (extended `test`).
- Specs import `test` and `expect` from `framework/fixtures`, never from `@playwright/test` directly. Use fixtures (`authedPage`, `api`, `article`, `cleanup`) for setup and cleanup instead of repeating it in tests.
- Prefer API calls for setup and teardown, UI for the behaviour under test. Older specs (articles, comments) keep locators in page objects and assertions in specs; `e2e/ui/user-management.spec.ts` and the API specs are deliberately flat, with all locators and steps inline.
- Detailed Playwright rules are in `.claude/rules/` (`playwright-scripting.md`, `playwright-architecture.md`). Specs live in `e2e/`.
- Tests marked `known-issue` assert current, known-wrong app behaviour (see the README); update them when the defect is fixed.
- The API has no delete-user endpoint; one throwaway user is registered per worker. Clean up articles and comments (the `article` and `cleanup` fixtures do).

## Backend

There is no local backend. `core/interceptors/api.interceptor.ts` prefixes every request with `https://conduit-api.bondaracademy.com/api`, so services use relative paths such as `/articles`. The API is shared and live: data created by tests persists, so tests should create their own data and clean it up.

## Routes

| Path                       | Page                       | Auth            |
| -------------------------- | -------------------------- | --------------- |
| `/`                        | Home feed                  | public          |
| `/login`, `/register`      | Auth form                  | signed-out only |
| `/settings`                | User settings              | required        |
| `/editor`, `/editor/:slug` | New / edit article         | required        |
| `/article/:slug`           | Article with comments      | public          |
| `/profile/...`             | User profile and favorites | public          |

## Conventions

- Standalone components with explicit `imports`; no NgModules.
- Double quotes, Prettier formatting.
- Subscriptions are torn down with `takeUntilDestroyed(this.destroyRef)`.
