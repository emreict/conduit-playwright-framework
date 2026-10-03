import { Locator, Page } from "@playwright/test";

export class NavBar {
  readonly root: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator("nav.navbar");
  }

  link(name: string | RegExp): Locator {
    return this.root.getByRole("link", { name });
  }

  get signIn(): Locator {
    return this.link("Sign in");
  }

  get signUp(): Locator {
    return this.link("Sign up");
  }

  get newArticle(): Locator {
    return this.link(/New Article/);
  }

  get settings(): Locator {
    return this.link(/Settings/);
  }

  /** The profile link shows the signed-in username. */
  profile(username: string): Locator {
    return this.link(username);
  }
}
