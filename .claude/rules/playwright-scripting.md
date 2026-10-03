# Playwright scripting rules

Applies to every spec under `e2e/`. The audit skill (`/pw-test-audit`) checks changes against this file.

## Locators

- Priority: `getByRole` > `getByLabel` > `getByText` > `getByPlaceholder` > CSS. The app has no `data-testid` attributes, so do not add `getByTestId` calls.
- CSS is allowed only where the app offers nothing semantic. Current cases: the error list `.error-messages li`, the article page `.article-content` / `.tag-list li`, comment cards `app-article-comment`, the trash icon `.ion-trash-a`. Never use style or layout classes (`.btn`, `.col-md-6`).
- A locator used with an action (`click`, `fill`) must resolve to exactly one element. Scope to a container when a name repeats: the profile page has both a header "Settings" link and an "Edit Profile Settings" link, so scope header links with `page.getByRole("navigation")`.
- Placeholder text and button names must match the source exactly (`Username`, `Email`, `Password`, `New Password`, `Short bio about you`, `Update Settings`, `Or click here to logout.`).

## Assertions

- Use web-first (auto-retrying) assertions: `toBeVisible`, `toHaveText`, `toHaveURL`, `toHaveValue`, `toBeEnabled`. Avoid `expect(await locator.textContent())`.
- No `expect.soft`.
- Assert absence only after the state change is complete (for example after the URL changed or an error appeared).
- Reading browser state with `page.evaluate` (for example `localStorage["jwtToken"]`) is fine for the token, because there is no UI for it; do it after a UI assertion that proves the action finished.

## Waiting

- No `page.waitForTimeout`. No `waitForURL` before an action or an auto-waiting assertion.
- No custom timeouts (`{ timeout }`, `test.setTimeout`) in a first draft. Add one only as a documented debugging fix.

## Test structure and naming

- One logical user flow per test. The title says what the user can or cannot do, not how it is implemented.
- Tag titles with the area: `@auth`, `@registration`, `@settings`, plus `@negative` for failure paths.
- Known application defects are written as tests that assert the **current** behaviour, carry `test.info().annotations.push({ type: "known-issue", ... })` and a comment saying what the correct behaviour should be. When the defect is fixed, the test fails on purpose and is updated.
- Start UI tests from a real entry point (`page.goto("/")` or the page under test); do not depend on state left by another test.

## Code style

- One statement per line. Prettier formatting (double quotes).
- Inline a locator unless the same one is used three or more times in one test.
- Variables holding text values end in `Text` or `Value`; do not name a text variable like a locator.

## Test data

- Never hard-code emails, usernames or titles that must be unique. Use `buildUser()`, `buildArticle()` and `uniqueId()` from `framework/data/factory.ts`. This also applies to deliberately invalid values that the API still stores (a malformed email is unique too).
- Do not assert on data your test did not create. The API is shared and live.
