import { test, expect } from "../../framework/fixtures";
import { buildArticle } from "../../framework/data/factory";

test.describe("articles API", () => {
  test("creates, reads, updates and deletes an article", async ({
    api,
    testUser,
  }) => {
    const data = buildArticle({ tagList: ["api", "crud"] });

    const created = await api.createArticle(data);
    try {
      expect(created.title).toBe(data.title);
      // The API normalises tag case (it returned "API" for "api").
      expect(created.tagList.map((t) => t.toLowerCase())).toEqual(data.tagList);
      expect(created.author.username).toBe(testUser.username);

      const fetched = await api.getArticle(created.slug);
      expect(fetched.body).toBe(data.body);

      const updated = await api.updateArticle(created.slug, {
        description: "Updated description",
      });
      expect(updated.description).toBe("Updated description");
    } finally {
      await api.deleteArticle(created.slug);
    }

    const gone = await api.send("GET", `/articles/${created.slug}`);
    expect(gone.status()).toBe(404);
  });

  test("lists articles with pagination", async ({ anonApi }) => {
    const page = await anonApi.listArticles("?limit=2&offset=0");

    expect(page.articles.length).toBeLessThanOrEqual(2);
    expect(page.articlesCount).toBeGreaterThanOrEqual(page.articles.length);
  });

  test("filters articles by author", async ({ api, article, testUser }) => {
    const result = await api.listArticles(`?author=${testUser.username}`);

    expect(result.articles.map((a) => a.slug)).toContain(article.slug);
    for (const a of result.articles) {
      expect(a.author.username).toBe(testUser.username);
    }
  });

  test("rejects article creation without a token", async ({ anonApi }) => {
    const response = await anonApi.send("POST", "/articles", {
      article: buildArticle(),
    });

    expect(response.status()).toBe(401);
  });

  test("favorites and unfavorites an article", async ({ api, article }) => {
    const favorited = await api.favorite(article.slug);
    expect(favorited.favorited).toBe(true);
    expect(favorited.favoritesCount).toBe(1);

    await api.unfavorite(article.slug);
    const after = await api.getArticle(article.slug);
    expect(after.favorited).toBe(false);
    expect(after.favoritesCount).toBe(0);
  });
});

test.describe("comments API", () => {
  test("adds, lists and deletes a comment", async ({ api, article }) => {
    const comment = await api.addComment(article.slug, "First!");
    expect(comment.body).toBe("First!");

    expect((await api.listComments(article.slug)).map((c) => c.id)).toContain(
      comment.id,
    );

    await api.deleteComment(article.slug, comment.id);
    expect(
      (await api.listComments(article.slug)).map((c) => c.id),
    ).not.toContain(comment.id);
  });
});

test.describe("users and tags API", () => {
  test("returns the current user for a valid token", async ({
    api,
    testUser,
  }) => {
    const user = await api.currentUser();

    expect(user.username).toBe(testUser.username);
    expect(user.email).toBe(testUser.email);
  });

  test("rejects a login with a wrong password", async ({
    anonApi,
    testUser,
  }) => {
    const response = await anonApi.send("POST", "/users/login", {
      user: { email: testUser.email, password: "wrong-password" },
    });

    expect(response.status()).toBe(403);
  });

  test("returns the tag list", async ({ anonApi }) => {
    const tags = await anonApi.tags();

    expect(Array.isArray(tags)).toBe(true);
  });
});
