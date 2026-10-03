import { test, expect } from "../../framework/fixtures";
import { buildArticle, uniqueId } from "../../framework/data/factory";

test.describe("articles", () => {
  test("creates an article through the editor", async ({
    authedPage,
    editorPage,
    articlePage,
    cleanup,
  }) => {
    const data = buildArticle({ tagList: ["playwright", "e2e"] });

    await editorPage.goto();
    await editorPage.publishArticle(data);

    await expect(authedPage).toHaveURL(/\/article\/.+/);
    cleanup.article(authedPage.url().split("/article/")[1]);

    await expect(articlePage.title).toHaveText(data.title);
    await expect(articlePage.body).toContainText(data.body);
    // Tag case is normalised by the API, so compare case-insensitively.
    await expect(articlePage.tags).toHaveText(
      data.tagList.map((t) => new RegExp(`^\\s*${t}\\s*$`, "i")),
    );
  });

  test("edits an article", async ({
    authedPage,
    article,
    editorPage,
    articlePage,
    cleanup,
  }) => {
    const newTitle = `Edited ${uniqueId()}`;

    await articlePage.goto(article.slug);
    await articlePage.editButton.click();
    await expect(authedPage).toHaveURL(`/editor/${article.slug}`);
    // The editor fills the form after loading the article; typing earlier is overwritten.
    await expect(editorPage.title).toHaveValue(article.title);

    await editorPage.title.fill(newTitle);
    await editorPage.publish.click();

    await expect(articlePage.title).toHaveText(newTitle);
    // The slug may change with the title; make sure the new one is cleaned up.
    cleanup.article(authedPage.url().split("/article/")[1]);
  });

  test("deletes an article", async ({
    authedPage,
    article,
    articlePage,
    api,
  }) => {
    await articlePage.goto(article.slug);
    await articlePage.deleteButton.click();

    await expect(authedPage).toHaveURL("/");
    const response = await api.send("GET", `/articles/${article.slug}`);
    expect(response.status()).toBe(404);
  });

  test("shows a new article in the global feed", async ({
    authedPage,
    article,
    homePage,
  }) => {
    await homePage.goto();
    await authedPage.getByText("Global Feed").click();

    await expect(homePage.articleByTitle(article.title)).toBeVisible();
  });

  test("anonymous visitors can read an article but not comment", async ({
    article,
    articlePage,
    page,
  }) => {
    await articlePage.goto(article.slug);

    await expect(articlePage.title).toHaveText(article.title);
    await expect(articlePage.commentInput).toBeHidden();
    await expect(
      page.getByText("to add comments on this article"),
    ).toBeVisible();
  });
});
