# Coverage Plan: Article favoriting

**Actor:** signed-in user (plus anonymous visitor for the negative case)
**Feature area:** Favorite button on feed previews (`app-article-preview`), article page (header and footer action bars) and the profile "Favorited Posts" tab
**Primary goal:** A signed-in user can favorite and unfavorite an article, and the button state, the count and the profile favorites list stay correct, including after reload.
**Suggested file:** `e2e/ui/favorites.spec.ts` (new, flat style per `playwright-architecture.md`; no page objects)
**Existing related tests:** none in the UI suite. API only: `e2e/api/articles.api.spec.ts` "favorites and unfavorites an article", `e2e/api/social.api.spec.ts` "filters by tag and by favorited user".

## Assumptions

- Own articles can be favorited from feed previews and the profile tab (the preview has no ownership check), but NOT on the article page, where the author sees Edit/Delete instead of the favorite button. So article-page tests need an article written by a different user: create it with `freshApi` (author) and sign in as `testUser` (reader), then delete it with `freshApi.deleteArticle`.
- Feed previews show the heart button with only the count as text (`3`), so scope the button to the article card, found by exact title.
- The article page renders the button twice (header and footer). They share one article object, so both must update together; assertions should check both or scope deliberately.
- Setup and cleanup go through the API (`api.favorite`, `api.unfavorite`). The UI is used only for the behaviour under test.
- Tests are tagged `@favorites`, plus `@negative` for failure paths.

## Test cases

### Happy path

1. **User can favorite an article from the home feed** _(P0)_
   - Pre: `authedPage` (testUser); article by `freshApi` visible in Global Feed
   - Steps: open `/`, Global Feed, click the heart on that article's card
   - Expect: card button shows count 1 and the filled (primary) state; `api.getArticle` returns `favorited: true`, `favoritesCount: 1`
2. **User can unfavorite an article from the home feed** _(P0)_
   - Pre: same, article already favorited through the API
   - Steps: open Global Feed, click the heart on the card
   - Expect: count back to 0, outline state; API shows `favorited: false`
3. **User can favorite and unfavorite from the article page** _(P0)_
   - Pre: article by `freshApi`, reader is `testUser`
   - Steps: open the article, click "Favorite Article (0)", then "Unfavorite Article (1)"
   - Expect: both bars switch label and count together after each click; ends at "Favorite Article (0)"
4. **A favorited article appears in the user's Favorited Posts tab** _(P0)_
   - Pre: `testUser` favorites the article through the API
   - Steps: open `/profile/<testUser>/favorites` (via the profile page's Favorited Posts link)
   - Expect: the article card is listed with count 1 and a filled heart
5. **Unfavoriting removes the article from Favorited Posts after reload** _(P1)_
   - Steps: favorite via API, unfavorite from the profile tab card, reload the tab
   - Expect: the card is gone after reload (the list does not remove it live, so assert state after reload)

### Edge cases

6. **Favorite state persists after reload** _(P1)_
   - Steps: favorite from the article page, reload (sign in through the seeded token: use `authedPage`, which re-seeds on navigation, so reload is fine here because the token is valid)
   - Expect: button still reads "Unfavorite Article (1)"
7. **Favorite count includes other users' favorites** _(P1)_
   - Pre: `freshApi` favorites its own article too? (cannot on the page, but possible via API); `testUser` then favorites from the UI
   - Expect: count increments from 1 to 2, and back to 1 on unfavorite
8. **User can favorite their own article from the feed or profile but not on the article page** _(P1)_
   - Steps: with `article` fixture (authored by testUser): favorite from the feed card; open the article page
   - Expect: the card shows count 1; the article page has Edit/Delete and no favorite button
9. **Rapid double-click does not leave the button in a wrong state** _(P2, ?)_
   - The button only gets a `disabled` CSS class while submitting; clicks are not blocked, so two requests may be sent. Confirm intended behaviour before writing: it may be a known-issue test.
10. **Favorited state is visible in a different feed tab** _(P2)_

- Steps: favorite from Global Feed, switch to Your Feed (needs a follow) or to the tag filter
- Expect: the same article shows as favorited in both lists (state comes from the API on each load)

### Negative cases

11. **Anonymous visitor is sent to registration when clicking the heart** _(P0)_

- Pre: no token
- Steps: open Global Feed, click the heart on an article
- Expect: URL becomes `/register`; the article's count is unchanged (check via API)

12. **Anonymous visitor on the article page is sent to registration** _(P1)_

- Steps: open `/article/<slug>` as anonymous, click "Favorite Article"
- Expect: URL `/register`; no favorite recorded

13. **Favoriting stays unchanged when the request fails** _(P2, ?)_

- Needs a way to make the API fail without mocking (e.g. article deleted by another session before the click). If the UI shows nothing and the state does not change, record it as a `known-issue` test; otherwise drop.

14. **Favoriting a deleted article** _(P2, ?)_

- Steps: open the feed, delete the article through the API, click the heart
- Expect: current behaviour (button resets, no message) captured as a `known-issue` if confirmed

## Out of scope

- Server-side rules for the favorite endpoint (idempotency, 401, 404): already covered by `e2e/api/*`.
- Favorite count formatting for large numbers: no way to set up realistic data on the shared API.
- Multi-tab concurrency: not reliably testable on a live, shared API.
- Keyboard-only operation of the heart: the control is a plain `<button>`, covered by the click tests.

## Open questions

- Case 9: should rapid double-clicks be guarded (the code only toggles a CSS class)? Test it as current behaviour or skip?
- Cases 13 and 14: are the failure modes worth capturing as `known-issue` tests, or skip them?
- Case 7 needs a second author's favorite; confirm using `freshUser` for it is acceptable (it leaves one more account on the shared API, per the repo rules).

## After approval

1. Save this plan to `.claude/pw-plans/article-favoriting.md` (create the folder).
2. Ask: generate the first test (P0 case 1 via `pw-new-test`, which is not installed in this project) or stop.
3. The skill was already copied to `.claude/skills/pw-coverage-planner/SKILL.md` before plan mode started.

## Verification

- Plan file exists at `.claude/pw-plans/article-favoriting.md`.
- No spec files are written by this skill; once tests are generated, run `npx playwright test e2e/ui/favorites.spec.ts` and check that created articles are deleted (via `freshApi.deleteArticle`).
