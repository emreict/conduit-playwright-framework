---
description: Playwright E2E test authoring conventions for Conduit - locators, assertions, waiting, test structure, naming, code style, actions, and form interactions
paths: [e2e/**, framework/**]
---

# Playwright scripting rules

Applies to every spec under `e2e/`. The audit skill (`/pw-test-audit`) checks changes against this file.

## Locators

- Priority: `getByRole` > `getByLabel` > `getByText` > `getByPlaceholder` > CSS. The app has no `data-testid` attributes, so do not add `getByTestId` calls and do not add `data-testid` to the app source.
- CSS is allowed only where the app offers nothing semantic. Current cases: the error list `.error-messages li`, the article page `.article-content` / `.tag-list li`, comment cards `app-article-comment`, the trash icon `.ion-trash-a`. Never use style or layout classes (`.btn`, `.col-md-6`) or structural paths (`div > form > input:first-child`).
- A locator used with an action (`click`, `fill`) must resolve to exactly one element. Scope to a container when a name repeats: the profile page has both a header "Settings" link and an "Edit Profile Settings" link, so scope header links with `page.getByRole("navigation")`.
- Placeholder text and button names must match the source exactly (`Username`, `Email`, `Password`, `New Password`, `Short bio about you`, `Update Settings`, `Or click here to logout.`). Read the component template; never paraphrase.
- Locators that intentionally return many elements (`all()`, `count()`, `nth()`) do not need to be unique.

### Roles that exist on the page

Only use roles the DOM actually exposes. `<header>` and `<footer>` get `banner` / `contentinfo` only as direct children of `<body>`, which is not the case in this app, so scope with `getByRole("navigation")` instead. `<section>` is a `region` only with an accessible name.

### Scoping to containers

Feed items, comment cards and tag lists repeat. Scope interactions and assertions to the specific container instead of using `.first()` on an unscoped locator, so a missing element cannot be satisfied by a match elsewhere on the page.

```typescript
// BAD: any "Delete" in the page
page.getByRole("button", { name: /Delete/ }).first();

// GOOD: the card for the comment this test created
page.locator("app-article-comment").filter({ hasText: commentText }).locator(".ion-trash-a");
```

Ask: "if this value moved to another section, would that be a bug?" If yes, scope the assertion to that section (for example the article's tag list, not the whole page).

`.first()` is accepted only where the app renders the same control twice by design (the article header and footer action bars) and a comment says so.

### Cross-page content linking

When an action opens a related page, capture a value before navigating and assert it afterwards (for example the article title from the feed, then the heading on the article page). A bare "an h1 is visible" passes for the wrong article.

### Chaining and filtering

Prefer the `name` / `hasText` option on the constructor. Use `.filter()` only for a second level of filtering on an existing locator.

## Assertions

- Use web-first (auto-retrying) assertions: `toBeVisible`, `toHaveText`, `toContainText`, `toHaveURL`, `toHaveValue`, `toBeEnabled`, `toHaveCount`. Avoid `expect(await locator.textContent())` and `expect(await locator.isVisible())`.
- Prefer `toHaveText` / `toContainText` on a unique locator over `getByText(...).toBeVisible()`.
- No `expect.soft`.
- Assert absence only after the state change is complete (for example after the URL changed or an error appeared). `toBeHidden` / `not.toBeVisible` right after a click can pass before the DOM updates.
- Reading browser state with `page.evaluate` (for example `localStorage["jwtToken"]`) is fine for the token, because there is no UI for it; do it after a UI assertion that proves the action finished.

## Waiting

- Actions (`click`, `fill`, `check`, `selectOption`) auto-wait and auto-scroll. Do not add `waitFor()` or `scrollIntoViewIfNeeded()` before them.
- No `page.waitForTimeout`. No `waitForURL` before an action or an auto-waiting assertion.
- Methods that do not auto-wait (`all()`, `count()`, `allTextContents()`, `textContent()`, `inputValue()`) need a web-first assertion first that proves the data is rendered. When a specific request must finish, register `page.waitForResponse` before the click and await it afterwards.
- No custom timeouts (`{ timeout }`, `test.setTimeout`) in a first draft. Add one only as a documented debugging fix.

## Test structure and naming

- One logical user flow per test. The title says what the user can or cannot do, not how it is implemented ("User can publish an article", not "POST /articles returns 200").
- Tag titles with the area: `@auth`, `@registration`, `@settings`, plus `@negative` for failure paths.
- Known application defects are written as tests that assert the **current** behaviour, carry `test.info().annotations.push({ type: "known-issue", ... })` and a comment saying what the correct behaviour should be. When the defect is fixed, the test fails on purpose and is updated.
- Start UI tests from a real entry point (`page.goto("/")` or the page under test); do not depend on state left by another test. Authenticated tests use `authedPage` / `signInAs` rather than the login form, unless the login flow is the behaviour under test.
- Group related tests with `test.describe`; move steps shared by every test in the block into `test.beforeEach`.

## Code style

- One statement per line. Prettier formatting (double quotes).
- Inline a locator unless the same one is used three or more times in one test. An opaque CSS locator used twice may be extracted.
- Do not extract a constant that only builds the next locator; inline the chain.
- Reuse a locator constant across the whole test (before and after navigation or reload). Do not re-declare it as `fooAfterUpdate`.
- Variables holding text values end in `Text` or `Value` (`Texts` / `Values` for arrays); do not name a text variable like a locator. No abbreviations.
- Repeated clicks on the exact same element with nothing in between use `click({ clickCount: n })`. Keep separate clicks if the element can change between them.

## Forms

- `fill()` clears existing content; do not call `clear()` first.
- Use `pressSequentially` only for inputs that react to keystrokes.
- Text inputs: `getByPlaceholder` (Conduit's inputs are placeholder-labelled). Checkboxes: `check()`. Selects: `selectOption()`.

## Test data

- Never hard-code emails, usernames or titles that must be unique. Use `buildUser()`, `buildArticle()` and `uniqueId()` from `framework/data/factory.ts`. This also applies to deliberately invalid values that the API still stores (a malformed email is unique too).
- Do not assert on data your test did not create. The API is shared and live.
