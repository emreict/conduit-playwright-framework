import { test, expect } from "../../framework/fixtures";
import { buildArticle, uniqueId } from "../../framework/data/factory";

// Flat API spec against the real backend. Scenarios that need a second
// account use freshApi; testUser and its article are only read.

test.describe("article authorization API", () => {
  test("a different user cannot edit or delete someone else's article", async ({
    freshApi,
    api,
    article,
  }) => {
    const update = await freshApi.send("PUT", `/articles/${article.slug}`, {
      article: { title: "Hijacked title" },
    });
    expect(update.status()).toBe(403);

    const remove = await freshApi.send("DELETE", `/articles/${article.slug}`);
    expect(remove.status()).toBe(403);

    const unchanged = await api.getArticle(article.slug);
    expect(unchanged.title).toBe(article.title);
  });
});

test.describe("follow and feed API", () => {
  test("following an author adds their articles to the feed, unfollowing removes them", async ({
    freshApi,
    article,
    testUser,
  }) => {
    const emptyFeed = await freshApi.send("GET", "/articles/feed");
    expect((await emptyFeed.json()).articles).toEqual([]);

    const follow = await freshApi.send(
      "POST",
      `/profiles/${testUser.username}/follow`,
    );
    expect(follow.status()).toBe(200);
    expect((await follow.json()).profile.following).toBe(true);

    const feed = await freshApi.send("GET", "/articles/feed?limit=100");
    const feedSlugs = (await feed.json()).articles.map(
      (a: { slug: string }) => a.slug,
    );
    expect(feedSlugs).toContain(article.slug);

    const unfollow = await freshApi.send(
      "DELETE",
      `/profiles/${testUser.username}/follow`,
    );
    expect((await unfollow.json()).profile.following).toBe(false);

    const feedAfter = await freshApi.send("GET", "/articles/feed?limit=100");
    expect((await feedAfter.json()).articles).toEqual([]);
  });
});

test.describe("article filters API", () => {
  test("filters by tag and by favorited user", async ({
    api,
    freshApi,
    freshUser,
  }) => {
    const tag = `tag${uniqueId()}`;
    const created = await api.createArticle(buildArticle({ tagList: [tag] }));
    try {
      const byTag = await api.listArticles(`?tag=${tag}`);
      expect(byTag.articlesCount).toBe(1);
      expect(byTag.articles[0].slug).toBe(created.slug);

      const beforeFavorite = await api.listArticles(
        `?favorited=${freshUser.username}`,
      );
      expect(beforeFavorite.articles).toEqual([]);

      await freshApi.favorite(created.slug);

      const afterFavorite = await api.listArticles(
        `?favorited=${freshUser.username}`,
      );
      expect(afterFavorite.articles.map((a) => a.slug)).toEqual([created.slug]);
    } finally {
      await api.deleteArticle(created.slug);
    }
  });
});
