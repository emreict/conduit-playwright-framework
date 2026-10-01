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
- `npm run e2e` — Playwright tests in `tests/` (Chromium only); starts the dev server itself or reuses one on port 4200
- `npm run e2e:ui` — Playwright UI mode
- `npm run e2e:report` — open the last HTML report
- `npx playwright test tests/smoke.spec.ts -g "name"` — run a single file or test

Prettier runs on staged files through a husky pre-commit hook.

## Architecture

- `src/app/app.config.ts` — providers: router, HTTP client with three interceptors, and an `APP_INITIALIZER` that loads the current user when a JWT is stored.
- `src/app/app.routes.ts` — all routes are lazy loaded; page components are `export default` classes.
- `src/app/core/` — auth (login/register page, `UserService`, `JwtService`), interceptors, header/footer layout.
- `src/app/features/` — `article` (home feed, article page, editor), `profile`, `settings`. Each has `pages/`, `components/`, `services/`, `models/`.
- `src/app/shared/` — error list component, `ifAuthenticated` directive, markdown pipe.

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
