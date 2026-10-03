import { test, expect } from "../../framework/fixtures";
import { uniqueId } from "../../framework/data/factory";

test.describe("comments", () => {
  test("adds and deletes a comment", async ({
    authedPage,
    article,
    articlePage,
  }) => {
    const text = `Comment ${uniqueId()}`;
    await articlePage.goto(article.slug);

    await articlePage.addComment(text);
    await expect(articlePage.comment(text)).toBeVisible();
    await expect(articlePage.commentInput).toHaveValue("");

    await articlePage.deleteComment(text);
    await expect(articlePage.comment(text)).toBeHidden();
  });

  test("shows a comment created through the API", async ({
    authedPage,
    article,
    articlePage,
    api,
  }) => {
    const text = `API comment ${uniqueId()}`;
    await api.addComment(article.slug, text);

    await articlePage.goto(article.slug);

    await expect(articlePage.comment(text)).toBeVisible();
  });
});
