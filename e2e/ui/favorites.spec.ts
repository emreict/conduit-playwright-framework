import { test, expect } from "../../framework/fixtures";

test.describe("favorites", () => {
  test("@favorites user can favorite an article from the home feed", async ({
    authedPage,
    api,
    article,
  }) => {
    await authedPage.goto("/");
    await authedPage.getByText("Global Feed").click();

    const articleCard = authedPage.locator("app-article-preview").filter({
      has: authedPage.getByRole("heading", {
        name: article.title,
        exact: true,
      }),
    });
    await expect(articleCard.getByRole("button")).toHaveText("0");

    await articleCard.getByRole("button").click();

    await expect(articleCard.getByRole("button")).toHaveText("1");
    const favorited = await api.getArticle(article.slug);
    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(1);
  });
});
