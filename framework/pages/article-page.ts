import { Locator, Page } from "@playwright/test";

export class ArticlePage {
  readonly title: Locator;
  readonly body: Locator;
  readonly tags: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly commentInput: Locator;
  readonly postComment: Locator;
  readonly comments: Locator;

  constructor(private readonly page: Page) {
    // The header and footer action bars render twice, so scope to the first.
    this.title = page.locator(".article-page .banner h1");
    this.body = page.locator(".article-content");
    this.tags = page.locator(".article-content .tag-list li");
    this.editButton = page.getByRole("link", { name: /Edit Article/ }).first();
    this.deleteButton = page
      .getByRole("button", { name: /Delete Article/ })
      .first();
    this.commentInput = page.getByPlaceholder("Write a comment...");
    this.postComment = page.getByRole("button", { name: "Post Comment" });
    this.comments = page.locator("app-article-comment");
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/article/${slug}`);
  }

  async addComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
    await this.postComment.click();
  }

  comment(text: string): Locator {
    return this.comments.filter({ hasText: text });
  }

  async deleteComment(text: string): Promise<void> {
    await this.comment(text).locator(".ion-trash-a").click();
  }
}
