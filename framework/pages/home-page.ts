import { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly banner: Locator;
  readonly globalFeedTab: Locator;
  readonly yourFeedTab: Locator;
  readonly popularTags: Locator;
  readonly articlePreviews: Locator;

  constructor(private readonly page: Page) {
    this.banner = page.locator(".banner");
    this.globalFeedTab = page.getByText("Global Feed");
    this.yourFeedTab = page.getByText("Your Feed");
    this.popularTags = page.locator(".sidebar");
    this.articlePreviews = page.locator("app-article-preview");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /** Preview card of one article, found by its exact title. */
  articleByTitle(title: string): Locator {
    return this.articlePreviews.filter({
      has: this.page.getByRole("heading", { name: title, exact: true }),
    });
  }

  tag(name: string): Locator {
    return this.popularTags.locator(".tag-pill", { hasText: name });
  }
}
