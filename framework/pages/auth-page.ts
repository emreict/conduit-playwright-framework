import { Locator, Page } from "@playwright/test";

/** Covers both /login and /register, which share one component. */
export class AuthPage {
  readonly heading: Locator;
  readonly username: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly errors: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { level: 1 });
    this.username = page.getByPlaceholder("Username");
    this.email = page.getByPlaceholder("Email");
    this.password = page.getByPlaceholder("Password");
    this.submit = page.locator("form").getByRole("button");
    this.errors = page.locator(".error-messages li");
  }

  async gotoLogin(): Promise<void> {
    await this.page.goto("/login");
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto("/register");
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    await this.username.fill(username);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
